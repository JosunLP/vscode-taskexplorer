
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TaskMap } from "../interface";
import { TeWrapper } from "../lib/wrapper";
import { SpecialTaskFolder } from "./specialFolder";


export class TaskTreeGrouper
{
    private _group = true;
    private _groupSep = "-";

    constructor(private readonly wrapper: TeWrapper) {}


    buildGroupings = async(source: string | undefined, folders: TaskMap<TaskFolder|SpecialTaskFolder>, fileMap: TaskMap<TaskFile>, logPad: string) =>
    {
        const w = this.wrapper;
        this._groupSep = w.config.get<string>(w.keys.Config.GroupSeparator);
        this._group = w.config.get<boolean>(w.keys.Config.GroupWithSeperator);
        w.log.methodStart("build tree node groupings", 3, logPad, false, [[ "group with separator", this._group ]]);
        //
        // Sort nodes.  By default the project folders are sorted in the same order as that
        // of the Explorer.  Sort TaskFile nodes and TaskItems nodes alphabetically, by default
        // its entirely random as to when the individual providers report tasks to the engine
        //
        // After the initial sort, create any task groupings based on the task group separator.
        // 'folders' are the project/workspace folders.
        //
        for (const f of Object.values(folders).filter(f => !(f instanceof SpecialTaskFolder)))
        {
            w.sorters.sortTaskFolder(f, "all");
            //
            // Create groupings by task type
            //
            await w.utils.execIf2(this._group, this.createBaseGroups, this, null, source, f, fileMap, logPad + "   ");
        }

        w.log.methodDone("build tree node groupings", 3, logPad);
    };


    /**
     * @method createBaseGroups
     * @since 1.28.0
     */
    private createBaseGroups = async (source: string | undefined, folder: TaskFolder, hash: TaskMap<TaskFile>, logPad: string) =>
    {
        let didGroupLast = false,
            prevTaskFile: TaskFile | undefined;
        const groupHash: TaskMap<TaskFile> = {};
        const taskFiles = this.wrapper.utils.popIfExistsBy(folder.taskFiles, t => !source || t.taskSource === source, this)
                                            .filter((t): t is TaskFile => this.isTaskFile(t));
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
            if (prevTaskFile)
            {
                const doGrouping = prevTaskFile.taskSource === taskFile.taskSource;
                if (doGrouping)
                {
                    const gid = folder.label + taskFile.taskSource;
                    // const gid = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskFile.taskSource, taskFile.label, 0);
                    if (!groupHash[gid])
                    {
                        this.wrapper.log.values(3, logPad, [
                            [ "add source file sub-container", taskFile.relativePath ], [ "group id", gid ]
                        ]);
                        const taskItem = taskFile.treeNodes[0];
                        this.wrapper.utils.execIf2(this.isTaskItem(taskItem), (ti, ptf) =>
                        {
                            groupHash[gid] = folder.addChild(new TaskFile(folder, ti.task, taskFile.relativePath, 0, gid, ti.task.source, "   "));
                            //
                            // Since we add the grouping when we find two or more equal group names, we are iterating
                            // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                            // new group just created
                            //
                            groupHash[gid].addChild(ptf); // will reset the group level on the TaskItem
                            hash[groupHash[gid].id] = groupHash[gid];
                        },
                        this, null, <TaskItem>taskItem, prevTaskFile);
                    }
                    groupHash[gid].addChild(taskFile);
                }
                else if (!didGroupLast)
                {
                    const gid = folder.label + prevTaskFile.taskSource;
                    groupHash[gid] = folder.addChild(prevTaskFile);
                    hash[groupHash[gid].id] = groupHash[gid];
                }
                didGroupLast = doGrouping;
            }
            prevTaskFile = taskFile;
            //
            // Continue sub-grouping by breaking down any taskitems containing `groupSeparator`
            //
            await this.groupByBySep(folder, taskFile, hash, groupHash, 0, logPad + "   ");
        }
        if (!didGroupLast && prevTaskFile)
        {
            const gid = folder.label + prevTaskFile.taskSource;
            groupHash[gid] = folder.addChild(prevTaskFile);
            hash[groupHash[gid].id] = groupHash[gid];
        }
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
    private groupByBySep = async(folder: TaskFolder, taskFile: TaskFile, hash: TaskMap<TaskFile>, groupHash: TaskMap<TaskFile>, treeLevel: number, logPad: string) =>
    {
        const w = this.wrapper,
              newNodes: TaskFile[] = [],
              atMaxLevel: boolean = w.config.get<number>(w.keys.Config.GroupMaxLevel) <= treeLevel + 1,
              taskItems = taskFile.treeNodes.splice(0).filter((n): n is TaskItem => this.isTaskItem(n));
        let didGroupLast = false,
            prevName: string[] | undefined,
            prevTaskItem: TaskItem | undefined;
        //
        w.log.methodStart("create task groupings by separator", 3, logPad, true, [
            [ "folder", folder.label ], [ "label (node name)", taskFile.label ], [ "grouping level", treeLevel ],
            [ "is group", taskFile.isGroup ], [ "file name", taskFile.fileName ], [ "folder", folder.label ],
            [ "path", taskFile.relativePath ], [ "tree level", treeLevel ], [ "sep", this._groupSep ]
        ]);
        //
        // Loop through all items of type `TaskItem` and break down into taskfile groups if
        // the taskitem label contains the `groupSeparator` character
        //
        for (const taskItem of taskItems)
        {
            const thisName = this.splitLabel(taskItem.label, taskItem),
                  prevNameOk = prevName && prevName.length > treeLevel && prevName[treeLevel];
            //
            w.log.write("   process taskitem grouping by separator", 5, logPad);
            w.log.values(5, logPad + "      ", [
                [ "id", taskItem.id ], [ "label", taskItem.label ], [ "sep", this._groupSep ],
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
            if (prevTaskItem)
            {
                if (foundGroup && prevName)
                {   //
                    // We found a pair of tasks that need to be grouped.  i.e. the first part of the label
                    // when split by the separator character is the same...
                    //
                    const gid = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskItem.taskSource, taskItem.label, treeLevel);
                    if (!groupHash[gid])
                    {   //
                        // Create the new node, add it to the list of nodes to add to the tree.  We must
                        // add them after we loop since we are looping on the array that they need to be
                        // added to
                        //
                        w.log.value("   add grouped taskfile node", prevName[treeLevel], 4, logPad);
                        groupHash[gid] = new TaskFile(folder, taskItem.task, taskItem.taskFile.relativePath, treeLevel, gid, prevName[treeLevel], logPad);
                        //
                        // Since we add the grouping when we find two or more equal group names, we are iterating
                        // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                        // new group just created
                        //
                        groupHash[gid].addChild(prevTaskItem); // will set the group level on the TaskItem
                        // groupHash[gid].treeNodes.push();
                        newNodes.push(groupHash[gid]);
                    }
                    groupHash[gid].addChild(taskItem); // will set the group level on the TaskItem
                }
                else if (!didGroupLast)
                {
                    const gid = <string>taskFile.groupId;
                    taskFile.groupLevel = treeLevel;
                    taskFile.addChild(prevTaskItem);
                    groupHash[gid] = taskFile;
                    hash[taskFile.id] = taskFile;
                }
                didGroupLast = !!foundGroup && !!prevName;
            }
            if (taskItem.label.includes(this._groupSep)) {
                prevName = taskItem.label.split(this._groupSep);
            }
            prevTaskItem = taskItem;
        }
        if (!didGroupLast && prevTaskItem)
        {
            taskFile.addChild(prevTaskItem);
            groupHash[<string>taskFile.groupId] = taskFile;
            hash[taskFile.id] = taskFile;
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
                await w.utils.execIf2(!atMaxLevel, this.groupByBySep, this, null, folder, n, hash, groupHash, treeLevel + 1, logPad + "   ");
            }
        }
        w.log.methodDone("create task groupings by separator", 4, logPad);
    };


    private isTaskFile = (t: any): t is TaskFile => t instanceof TaskFile;


    private isTaskItem = (t: any): t is TaskItem  => t instanceof TaskItem ;


    private renameGroupedTasks = async(taskFile: TaskFile) =>
    {
        const groupStripTaskLabel = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.GroupStripTaskLabel, true);
        if (!groupStripTaskLabel || !taskFile.label) {
            return;
        }

        let rmvLbl = taskFile.label;
        rmvLbl = rmvLbl.replace(/\(/gi, "\\(").replace(/\[/gi, "\\[").replace(/\)/gi, "\\)").replace(/\]/gi, "\\]");

        for (const item of taskFile.treeNodes)
        {
            if (this.isTaskItem(item))
            {
                const rgx = new RegExp(`^[^]*${rmvLbl}\\${this._groupSep}`, "i");
                item.label = item.label.replace(rgx, "");
                if (item.groupLevel > 0)
                {
                    let label = "";
                    const labelParts = item.label.split(this._groupSep);
                    for (let i = item.groupLevel; i < labelParts.length; i++)
                    {
                        label += (label ? this._groupSep : "") + labelParts[i];
                    }
                    item.label = label || /* istanbul ignore next */item.label;
                }
            }
            else {
                await this.renameGroupedTasks(item);
            }
        }
    };


    private splitLabel = (lbl: string, item: TaskItem) =>
    {
        const lblParts = lbl.split(this._groupSep);
        if (lblParts.length >= 2 && item.taskSource === "tsc" && (/ \- tsconfig\.[a-z\.\-_]+json$/i).test(lbl))
        {
            const lastPart = <string>lblParts.pop();
            lblParts[lblParts.length - 1] = `${lblParts[lblParts.length - 1].trimEnd()} (${lastPart.trimStart()})`;
        }
        return lblParts;
    };

}
