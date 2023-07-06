
import { join } from "path";
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { IDictionary, TaskMap } from "../interface";
import { SpecialTaskFolder } from "./specialFolder";


export class TaskTreeGrouper
{
    private _groupSeparator = "-";
    private _groupWithSeparator = true;

    constructor(private readonly wrapper: TeWrapper) {}


    buildGroupings = async(folders: TaskMap<TaskFolder|SpecialTaskFolder>, files: TaskMap<TaskFile>, logPad: string) =>
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
            await w.utils.execIf(this._groupWithSeparator, () => this.createTaskGroupings(folder, files, logPad + "   "), this);
        }

        w.log.methodDone("build tree node groupings", 3, logPad);
    };


    /**
     * @method createTaskGroupings
     * @since 1.28.0
     */
    private createTaskGroupings = async(folder: TaskFolder, files: TaskMap<TaskFile>, logPad: string) =>
    {
        let prevTaskFile: TaskItem | TaskFile | undefined;

        this.wrapper.log.methodStart("create tree node folder grouping", 3, logPad, true, [[ "project folder", folder.label ]]);
        //
        // The treeBuilder adds the base taskfile nodes to each taskfolder before calling in.
        // If we are here, user has grouped tasks enabled, remove these base nodes created
        // by treeBuilder, they will be re-mapped by the grouper
        //
        const taskFiles = folder.taskFiles.filter((t): t is TaskFile => this.isTaskFile(t)).splice(0);
        //
        // Guaranteed to be TaskFile, only SpecialFolder can have TaskItems, TaskFolder cannot
        //
        for (const taskFile of taskFiles)
        {   //
            // Check if current taskfile source is equal to previous (i.e. ant, npm, vscode, etc)
            //
            if (prevTaskFile && prevTaskFile.taskSource === taskFile.taskSource)
            {
// ************************************************************************************************
                const id = folder.label + taskFile.taskSource;
// ************************************************************************************************
                // const groupId = TaskFile.getGroupedId(folder, taskFile, 0),
                //       id = TaskFile.getId(folder, taskFile.task, undefined, 0, groupId);
// ************************************************************************************************
                let subfolder: TaskFile | undefined = files[id];
                if (!subfolder)
                {
                    this.wrapper.log.values(3, logPad, [
                        [ "add source file sub-container", taskFile.relativePath ], [ "id", id ]
                    ]);
                    const node = taskFile.treeNodes[0];
                    this.wrapper.utils.execIf(node instanceof TaskItem, (_v, n, p) =>
                    {
                        subfolder = new TaskFile(folder, n.task, taskFile.relativePath, 0, id, n.task.source, "   ");
                        files[id] = subfolder;
                        folder.addChild(subfolder);
                        //
                        // Since we add the grouping when we find two or more equal group names, we are iterating
                        // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                        // new group just created
                        //
                        subfolder.addChild(p); // will set the group level on the TaskItem
                    }, this, null, <TaskItem>node, prevTaskFile);
                }
                subfolder.addChild(taskFile);
            }
            prevTaskFile = taskFile;
            //
            // Create the grouping
            //
            await this.createTaskGroupingsBySep(folder, taskFile, files, 0, logPad + "   ");
        }

        //
        // For groupings with separator, when building the task tree, when tasks are grouped new task definitions
        // are created but the old task remains in the parent folder.  Remove all tasks that have been moved down
        // into the tree hierarchy due to groupings
        //
        this.removeGroupedTasks(folder, files, logPad + "   ");

        //
        // For groupings with separator, now go through and rename the labels within each group minus the
        // first part of the name split by the separator character (the name of the new grouped-with-separator node)
        //
        this.wrapper.log.write(logPad + "   rename grouped tasks", 3);
        for (const tf of folder.taskFiles.filter((t): t is TaskFile => t instanceof TaskFile))
        {
            await this.renameGroupedTasks(tf);
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
     *      build-prod
     *      build-dev
     *      build-server-dev
     *      build-server-prod
     *      build-sass
     *
     * If the option 'groupWithSeparator' is ON and 'groupSeparator' is set, then group this set of tasks.
     * By default the hierarchy would look like:
     *
     *      build
     *          prod
     *          dev
     *          server-dev
     *          server-prod
     *          sass
     *
     * If 'groupMaxLevel' is > 1 (default), then the hierarchy continues to be broken down until the max
     * nesting level is reached.  The example above, with 'groupMaxLevel' set > 1, would look like:
     *
     *      build
     *          prod
     *          dev
     *          server
     *             dev
     *             prod
     *          sass
     *
     * @param folder The base task folder
     * @param each  Task file to process
     * @param prevTaskFile Previous task file processed
     * @param subfolders Tree taskfile map
     * @param groupSeparator The group separator
     */
    private createTaskGroupingsBySep = async(folder: TaskFolder, taskFile: TaskFile, subfolders: IDictionary<TaskFile>, treeLevel: number, logPad: string) =>
    {
        const w = this.wrapper,
              newNodes: TaskFile[] = [],
              groupSeparator = w.utils.getGroupSeparator(),
              atMaxLevel: boolean = w.config.get<number>(w.keys.Config.GroupMaxLevel) <= treeLevel + 1;

        let prevName: string[] | undefined,
            prevTaskItem: TaskItem | undefined;

        w.log.methodStart("create task groupings by separator", 3, logPad, true, [
            [ "folder", folder.label ], [ "label (node name)", taskFile.label ], [ "grouping level", treeLevel ], [ "is group", taskFile.isGroup ],
            [ "file name", taskFile.fileName ], [ "folder", folder.label ], [ "path", taskFile.relativePath ], [ "tree level", treeLevel ]
        ]);

        for (const each of taskFile.treeNodes.filter((n): n is TaskItem => !!n && n instanceof TaskItem && !!n.task && !!n.label))
        {
            let subfolder: TaskFile | undefined;
            const prevNameThis = this.splitLabel(each.label, groupSeparator, each),
                  prevNameOk = prevName && prevName.length > treeLevel && prevName[treeLevel];

            w.log.write("   process task item", 4, logPad);
            w.log.values(5, logPad + "      ", [
                [ "id", each.id ], [ "label", each.label ], [ "command", each.command.command ], [ "this previous name", prevNameThis ],
                [ "previous name [tree level]", prevName && prevNameOk ? prevName[treeLevel] : "undefined" ]
            ]);
            //
            // If 'prevName' length > 1, then this task was grouped using the group separator
            //
            let foundGroup = false;
            if (prevName && prevNameOk && prevNameThis && prevNameThis.length > treeLevel)
            {
                for (let i = 0; i <= treeLevel; i++)
                {
                    if (prevName[i] === prevNameThis[i])
                    {
                        w.log.write("   found group", 5, logPad);
                        foundGroup = true;
                    }
                    else {
                        foundGroup = false;
                        break;
                    }
                }
            }

            if (prevTaskItem && foundGroup && prevName)
            {   //
                // We found a pair of tasks that need to be grouped.  i.e. the first part of the label
                // when split by the separator character is the same...
                //
// ************************************************************************************************
                // const groupId = TaskFile.getGroupedId(folder, taskFile, treeLevel),
                //      id = TaskFile.getId(folder, each.task, label, treeLevel, groupId);
// ************************************************************************************************
                // const id = TaskFile.getGroupedId(folder, taskFile, treeLevel);
                const id = TaskFile.getGroupedId(folder, taskFile, each.label, treeLevel);
// ************************************************************************************************
                subfolder = subfolders[id];
                if (!subfolder)
                {   //
                    // Create the new node, add it to the list of nodes to add to the tree.  We must
                    // add them after we loop since we are looping on the array that they need to be
                    // added to
                    //
                    w.log.value("   add grouped taskfile node", prevName[treeLevel], 4, logPad);
                    subfolder = new TaskFile(folder, each.task, each.taskFile.relativePath, treeLevel, id, prevName[treeLevel], logPad);
                    subfolders[id] = subfolder;
                    //
                    // Since we add the grouping when we find two or more equal group names, we are iterating
                    // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                    // new group just created
                    //
                    subfolder.addChild(prevTaskItem); // will set the group level on the TaskItem
                    newNodes.push(subfolder);
                }
                subfolder.addChild(each); // will set the group level on the TaskItem
            }

            if (each.label.includes(groupSeparator)) {
                prevName = each.label.split(groupSeparator);
            }
            prevTaskItem = each;
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
                await w.utils.execIf(!atMaxLevel,
                    () => this.createTaskGroupingsBySep(folder, n, subfolders, treeLevel + 1, logPad + "   "),
                this);
            }
        }

        w.log.methodDone("create task groupings by separator", 4, logPad);
    };


    private isTaskFile = (t: any): t is TaskFile => t instanceof TaskFile;


    private removeGroupedTasks = (folder: TaskFolder, files: TaskMap<TaskFile>, logPad: string) =>
    {
        const taskTypesRmv: TaskFile[] = [];

        this.wrapper.log.methodStart("remove grouped tasks", 4, logPad);

        for (const taskFile of folder.taskFiles.filter((t): t is TaskFile => this.isTaskFile(t) && !!t.label))
        {
// ************************************************************************************************
            // const id = folder.label + taskFile.taskSource,
            //       id2 = TaskFile.getGroupedId(folder, taskFile, taskFile.groupLevel);
            const taskFileLabel = taskFile.label,
                  id = folder.label + taskFile.taskSource,
                  id2 = TaskFile.getGroupedId(folder, taskFile, taskFileLabel, taskFile.groupLevel);

            if (!taskFile.isGroup && files[id])
            {
                taskTypesRmv.push(taskFile);
            }
            else /* istanbul ignore if */if (id2 && !taskFile.isGroup && files[id2])
            {
                taskTypesRmv.push(taskFile);
            }
// ************************************************************************************************
            // const gid = TaskFile.getGroupedId(folder, taskFile, 0),
            //       id2 = TaskFile.getId(folder, taskFile.task, undefined, 0, gid);
            // if (!taskFile.isGroup && files[id2])
            // {
            //     taskTypesRmv.push(taskFile);
            // }
            // else if (!taskFile.isGroup && files[taskFile.id])
            // {
            //     taskTypesRmv.push(taskFile);
            // }
// ************************************************************************************************
            else if (taskFile.isGroup)
            {
// ************************************************************************************************
                for (const each2 of taskFile.treeNodes)
// ************************************************************************************************
                // for (const each2 of taskFile.treeNodes.filter((t): t is TaskFile => this.isTaskFile(t)))
// ************************************************************************************************
                {
                    this.removeTreeNodes(each2 as TaskFile, folder, files, 0, logPad, 5);
                    /* istanbul ignore next */
                    if (this.isTaskFile(each2) && each2.isGroup && each2.groupLevel > 0)
                    {
                        for (const each3 of each2.treeNodes.filter(e => this.isTaskFile(e)))
                        {
                            this.removeTreeNodes(each3 as TaskFile, folder, files, 0, logPad, 5);
                        }
                    }
                }
            }
            else {
                this.removeTreeNodes(taskFile, folder, files, 0, logPad, 5);
            }
        }

        for (const each of taskTypesRmv)
        {
            folder.removeChild(each, logPad + "   ");
        }

        this.wrapper.log.methodDone("remove grouped tasks", 4, logPad);
    };


    /**
     * Perform some removal based on groupings with separator.  The nodes added within the new
     * group nodes need to be removed from the old parent node still...
     *
     * @param taskFile TaskFile instance to remove tasks from
     * @param folder Project task folder
     * @param subfolders Current tree subfolders map
     * @param level Current grouping level
     */
    private removeTreeNodes = (taskFile: TaskFile, folder: TaskFolder, files: TaskMap<TaskFile>, level: number, logPad: string, logLevel: number) =>
    {
        const me = this,
              taskTypesRmv: (TaskFile | TaskItem)[] = [],
              groupSeparator = this.wrapper.utils.getGroupSeparator();

        this.wrapper.log.methodStart("remove tree nodes", logLevel, logPad, false);

        for (const each of taskFile.treeNodes)
        {
            const labelParts = each.label.split(groupSeparator),
                  labelPart = labelParts[level];

            if (each instanceof TaskItem)
            {
// ************************************************************************************************
                // const id = TaskFile.getGroupedId(folder, taskFile, level);
                const id = TaskFile.getGroupedId(folder, taskFile, each.label, level);
// ************************************************************************************************
                // const groupId = TaskFile.getGroupedId(folder, taskFile, level),
                //       id = TaskFile.getId(folder, each.task, undefined, level, groupId);
// ************************************************************************************************
                // const groupId = TaskFile.getGroupedId(folder, taskFile, label, level),
                //       id = TaskFile.getId(folder, each.task, label, level, groupId);
                if (labelParts.length > 1 && labelPart && files[id]) {
                    taskTypesRmv.push(each);
                }
            }
            else
            {
                let allTasks = false;
                for (const each2 of each.treeNodes)
                {
                    allTasks = each2 instanceof TaskItem;
                    if (each2 instanceof TaskFile) { break; }
                }
                if (!allTasks) {
                    me.removeTreeNodes(each, folder, files, level + 1, logPad, logLevel + 1);
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

        for (const each2 of taskFile.treeNodes.filter(n => !!n.label))
        {
            if (each2 instanceof TaskItem)
            {
                const rgx = new RegExp(rmvLbl + groupSeparator, "i");
                each2.label = each2.label.replace(rgx, "");
                if (each2.groupLevel > 0)
                {
                    let label = "";
                    const labelParts = each2.label.split(groupSeparator);
                    for (let i = each2.groupLevel; i < labelParts.length; i++)
                    {
                        label += (label ? groupSeparator : "") + labelParts[i];
                    }
                    each2.label = label || /* istanbul ignore next */each2.label;
                }
            }
            else {
                await this.renameGroupedTasks(each2);
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
