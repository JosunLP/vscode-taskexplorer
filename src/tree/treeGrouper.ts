
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TaskMap } from "../interface";
import { TeWrapper } from "../lib/wrapper";
import { SpecialTaskFolder } from "./specialFolder";


export class TaskTreeGrouper
{
    private _groupSeparator = "-";
    private _groupWithSeparator = true;

    constructor(private readonly wrapper: TeWrapper) {}


    buildGroupings = async(folders: TaskMap<TaskFolder|SpecialTaskFolder>, taskFileMap: TaskMap<TaskFile>, logPad: string) =>
    {
        const w = this.wrapper;
        this._groupSeparator = w.config.get<string>(w.keys.Config.GroupSeparator);
        this._groupWithSeparator = w.config.get<boolean>(w.keys.Config.GroupWithSeperator);
        w.log.methodStart("build tree node groupings", 3, logPad, false, [[ "group withseparator", this._groupWithSeparator ]]);
        //
        // Sort nodes.  By default the project folders are sorted in the same order as that
        // of the Explorer.  Sort TaskFile nodes and TaskItems nodes alphabetically, by default
        // its entirely random as to when the individual providers report tasks to the engine
        //
        // After the initial sort, create any task groupings based on the task group separator.
        // 'folders' are the project/workspace folders.
        //
        for (const folder of Object.values(folders).filter(f => !(f instanceof SpecialTaskFolder)))
        {
            w.sorters.sortTaskFolder(folder, "all");
            //
            // Create groupings by task type
            //
            await w.utils.execIf2(this._groupWithSeparator, this.createTaskGroups, this, null, folder, taskFileMap, logPad + "   ");
        }

        w.log.methodDone("build tree node groupings", 3, logPad);
    };


    /**
     * @method createTaskGroupings
     * @since 1.28.0
     */
    private createTaskGroups = async(folder: TaskFolder, hash: TaskMap<TaskFile>, logPad: string) =>
    {
        let prevTaskFile: TaskItem | TaskFile | undefined;
        // const taskFiles = folder.taskFiles.splice(0).filter((t): t is TaskFile => this.isTaskFile(t))
        // const taskFiles = folder.taskFiles.filter((t): t is TaskFile => this.isTaskFile(t));
        const taskFiles = folder.taskFiles.filter((t): t is TaskFile => this.isTaskFile(t));
        this.wrapper.log.methodStart("create tree node folder grouping", 3, logPad, true, [[ "project folder", folder.label ]]);
        //
        // Clear all items in this folder from the taskfile hash map
        //
        // hash = {};
        Object.keys(hash).filter(k => k.startsWith(`${folder.id}:`)).forEach(k => delete hash[k]);
        //
        // Guaranteed to be TaskFile, only SpecialFolder can have TaskItems, TaskFolder cannot
        //
        for (const taskFile of taskFiles)
        {   //
            // Check if current taskfile source is equal to previous (i.e. ant, npm, vscode, etc)
            //
            if (prevTaskFile && prevTaskFile.taskSource === taskFile.taskSource)
            {
                const id = folder.label + taskFile.taskSource;
                // const id = TaskFile.createId(folder, taskFile, 0);
                if (!hash[id])
                {
                    this.wrapper.log.values(3, logPad, [
                        [ "add source file sub-container", taskFile.relativePath ], [ "id", id ]
                    ]);
                    const node = taskFile.treeNodes[0];
                    this.wrapper.utils.execIf2(this.isTaskItem(node), (n, p) =>
                    {
                        hash[id] = folder.addChild(new TaskFile(folder, n.task, taskFile.relativePath, 0, id, n.task.source, "   "));
                        //
                        // Since we add the grouping when we find two or more equal group names, we are iterating
                        // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                        // new group just created
                        //
                        hash[id].addChild(p); // will reset the group level on the TaskItem
                    },
                    this, null, <TaskItem>node, prevTaskFile);
                }
                hash[id].addChild(taskFile);
            }
            prevTaskFile = hash[taskFile.id] = taskFile;
            //
            // Continue sub-grouping by breaking down any taskitems containing `groupSeparator`
            //
            await this.groupByBySep(folder, taskFile, hash, 0, logPad + "   ");
        }
        //
        // For groupings with separator, when building the task tree, when tasks are grouped new task definitions
        // are created but the old task remains in the parent folder.  Remove all tasks that have been moved down
        // into the tree hierarchy due to groupings
        //
        this.removeGroupedTasks(folder, hash, logPad + "   ");
        //
        // For groupings with separator, now go through and rename the labels within each group minus the
        // first part of the name split by the separator character (the name of the new grouped-with-separator node)
        //
        this.wrapper.log.write(logPad + "   rename grouped tasks", 3);
        for (const t of folder.taskFiles.filter((t): t is TaskFile => this.isTaskFile(t)))
        {
            await this.renameGroupedTasks(t);
        }
        //
        // Resort after making adds/removes
        //
        this.wrapper.sorters.sortTaskFolder(folder, "all");
        this.wrapper.log.methodDone("create tree node folder grouping", 3, logPad);
    };


    /**
     * @method createTaskGroupingsBySep
     * @since 1.29.0
     *
     *  Build groupings by separator
     *
     *  For example, consider the set of task names/labels:
     *
     *     build-prod
     *     build-dev
     *     build-server-dev
     *     build-server-prod
     *     build-sass
     *
     * If the option 'groupWithSeparator' is ON and 'groupSeparator' is set, then group this set of tasks.
     * By default the hierarchy would look like:
     *
     *     build
     *       rod
     *       dev
     *       server-dev
     *       server-prod
     *       sass
     *
     * If 'groupMaxLevel' is > 1 (default), then the hierarchy continues to be broken down until the max
     * nesting level is reached.  The example above, with 'groupMaxLevel' set > 1, would look like:
     *
     *     build
     *       prod
     *       dev
     *       server
     *         dev
     *         prod
     *       sass
     */
    private groupByBySep = async(folder: TaskFolder, taskFile: TaskFile, hash: TaskMap<TaskFile>, treeLevel: number, logPad: string) =>
    {
        const w = this.wrapper,
              newNodes: TaskFile[] = [],
              atMaxLevel: boolean = w.config.get<number>(w.keys.Config.GroupMaxLevel) <= treeLevel + 1;
        let prevName: string[] | undefined,
            prevTaskItem: TaskItem | undefined;
        //
        w.log.methodStart("create task groupings by separator", 3, logPad, true, [
            [ "folder", folder.label ], [ "label (node name)", taskFile.label ], [ "grouping level", treeLevel ],
            [ "is group", taskFile.isGroup ], [ "file name", taskFile.fileName ], [ "folder", folder.label ],
            [ "path", taskFile.relativePath ], [ "tree level", treeLevel ], [ "sep", this._groupSeparator ]
        ]);
        //
        // Loop through all items of type `TaskItem` and break down into taskfile groups if
        // the taskitem label contains the `groupSeparator` character
        //
        for (const taskItem of taskFile.treeNodes.filter((n): n is TaskItem => this.isTaskItem(n)))
        {
            const thisName = this.splitLabel(taskItem.label, this._groupSeparator, taskItem),
                  prevNameOk = prevName && prevName.length > treeLevel && prevName[treeLevel];
            //
            w.log.write("   process taskitem grouping by separator", 5, logPad);
            w.log.values(5, logPad + "      ", [
                [ "id", taskItem.id ], [ "label", taskItem.label ], [ "sep", this._groupSeparator ],
                [ "command", taskItem.command.command ], [ "this name", thisName ],
                [ "previous name [tree level]", prevName && prevNameOk ? prevName[treeLevel] : "undefined" ]
            ]);
            //
            // If 'prevName' length > 1, then this task was grouped using the group separator
            //
            let foundGroup = true;
            if (prevName && prevNameOk && thisName && thisName.length > treeLevel)
            {
                for (let i = 0; i <= treeLevel && foundGroup; i++) {
                    foundGroup = prevName[i] === thisName[i];
                }
            }
            //
            // Group with previous taskfile if necessary
            //
            if (prevTaskItem && foundGroup && prevName)
            {   //
                // We found a pair of tasks that need to be grouped.  i.e. the first part of the label
                // when split by the separator character is the same...
                //
                const id = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskItem.taskSource, taskItem.label, treeLevel);
                // const id = TaskFile.createId(folder, taskFile, treeLevel);
                if (!hash[id])
                {   //
                    // Create the new node, add it to the list of nodes to add to the tree.  We must
                    // add them after we loop since we are looping on the array that they need to be
                    // added to
                    //
                    w.log.value("   add grouped taskfile node", prevName[treeLevel], 4, logPad);
                    hash[id] = new TaskFile(folder, taskItem.task, taskItem.taskFile.relativePath, treeLevel, id, prevName[treeLevel], logPad);
                    //
                    // Since we add the grouping when we find two or more equal group names, we are iterating
                    // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                    // new group just created
                    //
                    hash[id].addChild(prevTaskItem); // will set the group level on the TaskItem
                    newNodes.push(hash[id]);
                }
                hash[id].addChild(taskItem); // will set the group level on the TaskItem
            }
            if (taskItem.label.includes(this._groupSeparator)) {
                prevName = taskItem.label.split(this._groupSeparator);
            }
            prevTaskItem = taskItem;
        }
        //
        // If there are new grouped by separator nodes to add to the tree...
        //
        if (newNodes.length > 0)
        {
            let numGrouped = 0;
            for (const n of newNodes)
            {
                taskFile.addChild(n, numGrouped++);
                await w.utils.execIf2(!atMaxLevel, this.groupByBySep, this, null, folder, n, hash, treeLevel + 1, logPad + "   ");
            }
        }
        w.log.methodDone("create task groupings by separator", 4, logPad);
    };


    private isTaskFile = (t: any): t is TaskFile => t instanceof TaskFile;


    private isTaskItem = (t: any): t is TaskItem  => t instanceof TaskItem ;


    private removeGroupedTasks = (folder: TaskFolder, hash: TaskMap<TaskFile>, logPad: string) =>
    {
        const taskTypesRmv: TaskFile[] = [];
        this.wrapper.log.methodStart("remove grouped tasks", 4, logPad);
        //
        // Loop through all items of type`TaskFile` and remove leftover nodes that re-grouped
        //
        for (const taskFile of folder.taskFiles.filter((t): t is TaskFile => this.isTaskFile(t)))
        {
            const id = TaskFile.createId(folder, taskFile, 0),                    // Base group nodes created in createTaskGroups()
                  id0 = folder.label + taskFile.taskSource,
                  // id2 = TaskFile.createId(folder, taskFile, taskFile.groupLevel), // Nodes created in groupByBySep()
                  id3 = TaskFile.id(folder, taskFile.task, undefined, 0);
            const id2 = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskFile.taskSource, taskFile.label, taskFile.groupLevel); // Base nodes created in TreeBuilder
            if (!taskFile.isGroup && (hash[id0] || hash[id] || hash[id2]))
            {
                taskTypesRmv.push(taskFile);
            }
            else if (taskFile.isGroup)
            {
                for (const taskFile2 of taskFile.treeNodes.filter((n): n is TaskFile => this.isTaskFile(n)))
                {
                    this.removeTreeNodes(taskFile2, folder, hash, 0, logPad, 5);
                    /* ist  anbul ignore next */
                    if (this.isTaskFile(taskFile2) && taskFile2.isGroup && taskFile2.groupLevel > 0)
                    {
                        for (const taskFile3 of taskFile2.treeNodes.filter((n): n is TaskFile => this.isTaskFile(n)))
                        {
                            this.removeTreeNodes(taskFile3, folder, hash, 0, logPad, 5);
                        }
                    }
                }
            }
            else {
                this.removeTreeNodes(taskFile, folder, hash, 0, logPad, 5);
            }
        }
        taskTypesRmv.forEach((t) => { delete hash[t.id]; folder.removeChild(t, logPad + "   "); });
        this.wrapper.log.methodDone("remove grouped tasks", 4, logPad);
    };


    private removeTreeNodes = (taskFile: TaskFile, folder: TaskFolder, hash: TaskMap<TaskFile>, level: number, logPad: string, logLevel: number) =>
    {
        const me = this,
              taskTypesRmv: (TaskFile | TaskItem)[] = [];

        this.wrapper.log.methodStart("remove tree nodes", logLevel, logPad, false);

        for (const item of taskFile.treeNodes)
        {
            if (this.isTaskItem(item))
            {
                const labelParts = item.label.split(this._groupSeparator),
                      labelPart = labelParts[level],
                      // id = TaskFile.createId(folder, taskFile, level);
                      id = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskFile.taskSource, item.label, level);
                if (labelParts.length > 1 && labelPart && hash[id]) {
                    taskTypesRmv.push(item);
                }
            }
            else
            {
                let allTasks = false;
                for (const item2 of item.treeNodes)
                {
                    allTasks = this.isTaskItem(item2);
                    if (this.isTaskFile(item2)) { break; }
                }
                if (!allTasks) {
                    me.removeTreeNodes(item, folder, hash, level + 1, logPad, logLevel + 1);
                }
            }
        }
        taskTypesRmv.forEach(t => taskFile.removeChild(t));
        this.wrapper.log.methodDone("remove tree nodes", logLevel, logPad);
    };


    private renameGroupedTasks = async(taskFile: TaskFile) =>
    {
        const groupStripTaskLabel = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.GroupStripTaskLabel, true);
        if (!groupStripTaskLabel || !taskFile.label) {
            return;
        }

        let rmvLbl = taskFile.label;
        const groupSeparator = this.wrapper.utils.getGroupSeparator();
        rmvLbl = rmvLbl.replace(/\(/gi, "\\(").replace(/\[/gi, "\\[").replace(/\)/gi, "\\)").replace(/\]/gi, "\\]");

        for (const item of taskFile.treeNodes.filter(n => !!n.label))
        {
            if (this.isTaskItem(item))
            {
                const rgx = new RegExp(rmvLbl + groupSeparator, "i");
                item.label = item.label.replace(rgx, "");
                if (item.groupLevel > 0)
                {
                    let label = "";
                    const labelParts = item.label.split(groupSeparator);
                    for (let i = item.groupLevel; i < labelParts.length; i++)
                    {
                        label += (label ? groupSeparator : "") + labelParts[i];
                    }
                    item.label = label || /* istanbul ignore next */item.label;
                }
            }
            else {
                await this.renameGroupedTasks(item);
            }
        }
    };


    private splitLabel = (lbl: string, groupSeparator: string, item: TaskItem) =>
    {
        const lblParts = lbl.split(groupSeparator);
        if (lblParts.length >= 2 && item.taskSource === "tsc" && (/ \- tsconfig\.[a-z\.\-_]+json$/i).test(lbl))
        {
            const lastPart = <string>lblParts.pop();
            lblParts[lblParts.length - 1] = `${lblParts[lblParts.length - 1].trimEnd()} (${lastPart.trimStart()})`;
        }
        return lblParts;
    };

}
