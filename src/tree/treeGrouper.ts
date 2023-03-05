
import { join } from "path";
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { IDictionary } from "../interface";
import { ConfigKeys } from "../lib/constants";
import { SpecialTaskFolder } from "./specialFolder";


export class TaskTreeGrouper
{
    constructor(private readonly wrapper: TeWrapper) {}


    buildGroupings = async(folders: IDictionary<TaskFolder|SpecialTaskFolder>, logPad: string, logLevel: number) =>
    {
        const groupWithSep = this.wrapper.config.get<boolean>(ConfigKeys.GroupWithSeperator);
        this.wrapper.log.methodStart("build tree node groupings", logLevel, logPad, false, [[ "group withseparator", groupWithSep ]]);
        //
        // Sort nodes.  By default the project folders are sorted in the same order as that
        // of the Explorer.  Sort TaskFile nodes and TaskItems nodes alphabetically, by default
        // its entirely random as to when the individual providers report tasks to the engine
        //
        // After the initial sort, create any task groupings based on the task group separator.
        // 'folders' are the project/workspace folders.
        //
        for (const [ key, folder ] of Object.entries(folders))
        {
            if (folder instanceof SpecialTaskFolder) {
                this.wrapper.log.write(`   skipping ${folder.label} folder for grouping`, logLevel, logPad);
                continue;
            }
            this.wrapper.sorters.sortTaskFolder(folder);
            //
            // Create groupings by task type
            //
            /* istanbul ignore else */
            if (groupWithSep) // && key !== constants.USER_TASKS_LABEL)
            {
                await this.createTaskGroupings(folder, logPad + "   ", logLevel + 1);
            }
        }

        this.wrapper.log.methodDone("build tree node groupings", logLevel, logPad);
    };


    /**
     * @method createTaskGroupings
     * @since 1.28.0
     *
     * Creates main task groupings, i.e. 'npm', 'vscode', 'batch', etc, for a given {@link TaskFolder}
     *
     * @param folder The TaskFolder to process
     */
    private createTaskGroupings = async(folder: TaskFolder, logPad: string, logLevel: number) =>
    {
        let prevTaskFile: TaskItem | TaskFile | undefined;
        const subfolders: IDictionary<TaskFile> = {};

        this.wrapper.log.methodStart("create tree node folder grouping", logLevel, logPad, true, [[ "project folder", folder.label ]]);

        for (const each of folder.taskFiles)
        {   //
            const taskFile = each as TaskFile; // Guaranteed to be TaskFile, only SpecialFolder can have TaskItem
            //                                 // and SpecialFolder is skipped in caller .buildGroupings()
            // Check if current taskfile source is equal to previous (i.e. ant, npm, vscode, etc)
            //
            if (prevTaskFile && prevTaskFile.taskSource === taskFile.taskSource)
            {
                const id = folder.label + taskFile.taskSource;
                let subfolder: TaskFile | undefined = subfolders[id];
                if (!subfolder)
                {
                    this.wrapper.log.values(logLevel + 2, logPad, [
                        [ "   Add source file sub-container", taskFile.path ],
                        [ "      id", id ]
                    ]);
                    const node = taskFile.treeNodes[0];
                    /* istanbul ignore else */
                    if (node instanceof TaskItem)
                    {
                        subfolder = new TaskFile(folder, node.task.definition, taskFile.taskSource, taskFile.path, 0, id, undefined, "   ");
                        subfolders[id] = subfolder;
                        await folder.addTaskFile(subfolder);
                        //
                        // Since we add the grouping when we find two or more equal group names, we are iterating
                        // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                        // new group just created
                        //
                        subfolder.addTreeNode(prevTaskFile); // addScript will set the group level on the TaskItem
                    }
                }
                subfolder.addTreeNode(taskFile);
            }
            prevTaskFile = taskFile;
            //
            // Create the grouping
            //
            await this.createTaskGroupingsBySep(folder, taskFile, subfolders, 0, logPad + "   ", logLevel + 1);
        }

        //
        // For groupings with separator, when building the task tree, when tasks are grouped new task definitions
        // are created but the old task remains in the parent folder.  Remove all tasks that have been moved down
        // into the tree hierarchy due to groupings
        //
        this.removeGroupedTasks(folder, subfolders, logPad + "   ", logLevel + 1);

        //
        // For groupings with separator, now go through and rename the labels within each group minus the
        // first part of the name split by the separator character (the name of the new grouped-with-separator node)
        //
        this.wrapper.log.write(logPad + "   rename grouped tasks", logLevel);
        folder.taskFiles.filter(t => t instanceof TaskFile).forEach(async (tf) =>
        {
            await this.renameGroupedTasks(tf as TaskFile);
        });

        //
        // Resort after making adds/removes
        //
        this.wrapper.sorters.sortTaskFolder(folder);

        this.wrapper.log.methodDone("create tree node folder grouping", logLevel, logPad);
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
    private createTaskGroupingsBySep = async(folder: TaskFolder, taskFile: TaskFile, subfolders: IDictionary<TaskFile>, treeLevel: number, logPad: string, logLevel: number) =>
    {
        let prevName: string[] | undefined;
        let prevTaskItem: TaskItem | undefined;
        const newNodes: TaskFile[] = [];
        const groupSeparator = this.wrapper.utils.getGroupSeparator();
        const atMaxLevel: boolean = this.wrapper.config.get<number>(ConfigKeys.GroupMaxLevel) <= treeLevel + 1;

        this.wrapper.log.methodStart("create task groupings by separator", logLevel, logPad, true, [
            [ "folder", folder.label ], [ "label (node name)", taskFile.label ], [ "grouping level", treeLevel ], [ "is group", taskFile.isGroup ],
            [ "file name", taskFile.fileName ], [ "folder", folder.label ], [ "path", taskFile.path ], [ "tree level", treeLevel ]
        ]);

        const _setNodePath = (t: TaskItem | undefined, cPath: string) =>
        {
            /* istanbul ignore else */
            if (t && !atMaxLevel && prevName)
            {
                this.wrapper.log.write("   setting node path", logLevel + 2, logPad);
                this.wrapper.log.value("      current", t.nodePath, logLevel + 2, logPad);
                /* istanbul ignore if */
                if (!t.nodePath && taskFile.taskSource === "Workspace")
                {   //
                    // Reference Ticket #?. Fixes never ending loop with specific case VSCode tasks.
                    //
                    t.nodePath = join(".vscode", prevName[treeLevel]);
                }
                else if (!t.nodePath) {
                    t.nodePath = prevName[treeLevel];
                }
                else {
                    t.nodePath = join(cPath, prevName[treeLevel]);
                }
                this.wrapper.log.value("      new", t.nodePath, logLevel + 2, logPad);
            }
        };

        for (const each of taskFile.treeNodes)
        {
            if (!each || !(each instanceof TaskItem) || !each.task || !each.label) {
                continue;
            }
            const label = each.label.toString();
            let subfolder: TaskFile | undefined;
            const prevNameThis = label.split(groupSeparator);
            const prevNameOk = prevName && prevName.length > treeLevel && prevName[treeLevel];

            this.wrapper.log.write("   process task item", logLevel + 1, logPad);
            this.wrapper.log.values(logLevel + 2, logPad + "      ", [
                [ "id", each.id ], [ "label", label ], [ "node path", each.nodePath ], [ "command", each.command.command ],
                [ "previous name [tree level]", prevName && prevNameOk ? prevName[treeLevel] : "undefined" ],
                [ "this previous name", prevNameThis ]
            ]);

            //
            // Check if we're in a state to create a new group.
            // If 'prevName' length > 1, then this task was grouped using the group separator, for
            // example:
            //
            //     build-ui-dev
            //     build-ui-production
            //     build-svr-trace
            //     build-svr-debug
            //     build-svr-production
            //
            // There may be other tasks, if we are grouping at more than one level, that may match
            // another set of tasks in separate parts of the groupings, for example:
            //
            //     wp-build-ui-dev
            //     wp-build-ui-production
            //     wp-build-svr-trace
            //     wp-build-svr-debug
            //     wp-build-svr-production
            //
            let foundGroup = false;
            if (prevName && prevNameOk && prevNameThis && prevNameThis.length > treeLevel)
            {
                for (let i = 0; i <= treeLevel; i++)
                {
                    if (prevName[i] === prevNameThis[i]) {
                        this.wrapper.log.write("   found group", 4, logPad);
                        foundGroup = true;
                    }
                    else {
                        foundGroup = false;
                        break;
                    }
                }
            }

            if (foundGroup && prevName)
            {   //
                // We found a pair of tasks that need to be grouped.  i.e. the first part of the label
                // when split by the separator character is the same...
                //
                const id = TaskFile.getGroupedId(folder, taskFile, label, treeLevel);
                subfolder = subfolders[id];

                if (!subfolder)
                {   //
                    // Create the new node, add it to the list of nodes to add to the tree.  We must
                    // add them after we loop since we are looping on the array that they need to be
                    // added to
                    //
                    subfolder = new TaskFile(folder, each.task.definition, taskFile.taskSource,
                                             each.taskFile.path, treeLevel, id, prevName[treeLevel], logPad);
                    subfolders[id] = subfolder;
                    _setNodePath(prevTaskItem, each.nodePath);
                    //
                    // Since we add the grouping when we find two or more equal group names, we are iterating
                    // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                    // new group just created
                    //
                    subfolder.addTreeNode(prevTaskItem); // addScript will set the group level on the TaskItem
                    newNodes.push(subfolder);
                }

                _setNodePath(each, each.nodePath);
                subfolder.addTreeNode(each); // addScript will set the group level on the TaskItem
            }

            if (label.includes(groupSeparator)) {
                prevName = label.split(groupSeparator);
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
                taskFile.insertTreeNode(n, numGrouped++);
                /* istanbul ignore else */
                if (!atMaxLevel)
                {
                    await this.createTaskGroupingsBySep(folder, n, subfolders, treeLevel + 1, logPad + "   ", logLevel + 1);
                }
            }
        }

        this.wrapper.log.methodDone("create task groupings by separator", logLevel, logPad);
    };


    private isTaskFile = (t: any): t is TaskFile => t instanceof TaskFile;


    private removeGroupedTasks = (folder: TaskFolder, subfolders: IDictionary<TaskFile>, logPad: string, logLevel: number) =>
    {
        const taskTypesRmv: TaskFile[] = [];

        this.wrapper.log.methodStart("remove grouped tasks", logLevel, logPad);

        for (const each of folder.taskFiles.filter(t => this.isTaskFile(t) && !!t.label))
        {
            const taskFile = each as TaskFile,
                  taskFileLabel = taskFile.label as string,
                  id = folder.label + taskFile.taskSource,
                  id2 = TaskFile.getGroupedId(folder, taskFile, taskFileLabel, taskFile.groupLevel);

            if (!taskFile.isGroup && subfolders[id])
            {
                taskTypesRmv.push(taskFile);
            }
            else /* istanbul ignore if */if (id2 && !taskFile.isGroup && subfolders[id2])
            {
                taskTypesRmv.push(taskFile);
            }
            else if (taskFile.isGroup)
            {
                for (const each2 of taskFile.treeNodes)
                {
                    this.removeTreeNodes(each2 as TaskFile, folder, subfolders, 0, logPad, logLevel + 1);
                    /* istanbul ignore if */ /* istanbul ignore next */
                    if (this.isTaskFile(each2) && each2.isGroup && each2.groupLevel > 0)
                    {
                        for (const each3 of each2.treeNodes.filter(e => this.isTaskFile(e)))
                        {
                            this.removeTreeNodes(each3 as TaskFile, folder, subfolders, 0, logPad, logLevel + 1);
                        }
                    }
                }
            }
            else {
                this.removeTreeNodes(taskFile, folder, subfolders, 0, logPad, logLevel + 1);
            }
        }

        for (const each of taskTypesRmv)
        {
            folder.removeTaskFile(each, logPad + "   ");
        }

        this.wrapper.log.methodDone("remove grouped tasks", logLevel, logPad);
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
    private removeTreeNodes = (taskFile: TaskFile, folder: TaskFolder, subfolders: IDictionary<TaskFile>, level: number, logPad: string, logLevel: number) =>
    {
        const me = this;
        const taskTypesRmv: (TaskFile | TaskItem)[] = [];
        const groupSeparator = this.wrapper.utils.getGroupSeparator();

        this.wrapper.log.methodStart("remove tree nodes", logLevel, logPad, false);

        for (const each of taskFile.treeNodes)
        {   /* istanbul ignore if */
            if (!each.label) {
                continue;
            }
            const label = each.label.toString();

            const labelPart = label.split(groupSeparator)[level];
            const id = TaskFile.getGroupedId(folder, taskFile, label, level);

            if (each instanceof TaskItem)
            {
                if (label.split(groupSeparator).length > 1 && labelPart)
                {
                    if (subfolders[id])
                    {
                        taskTypesRmv.push(each);
                    }
                }
            }
            else
            {
                let allTasks = false;
                for (const each2 of each.treeNodes)
                {
                    if (each2 instanceof TaskItem)
                    {
                        allTasks = true;
                    }
                    else {
                        allTasks = false;
                        break;
                    }
                }

                if (!allTasks) {
                    me.removeTreeNodes(each, folder, subfolders, level + 1, logPad, logLevel + 1);
                }
            }
        }

        for (const each2 of taskTypesRmv)
        {
            taskFile.removeTreeNode(each2);
        }

        this.wrapper.log.methodDone("remove tree nodes", logLevel, logPad);
    };


    private renameGroupedTasks = async(taskFile: TaskFile) =>
    {
        const groupStripTaskLabel = this.wrapper.config.get<boolean>(ConfigKeys.GroupStripTaskLabel, true);
        if (!groupStripTaskLabel || !taskFile.label) {
            return;
        }

        const groupSeparator = this.wrapper.utils.getGroupSeparator();
        let rmvLbl = taskFile.label as string;
        rmvLbl = rmvLbl.replace(/\(/gi, "\\(").replace(/\[/gi, "\\[");
        rmvLbl = rmvLbl.replace(/\)/gi, "\\)").replace(/\]/gi, "\\]");

        for (const each2 of taskFile.treeNodes.filter(n => !!n.label))
        {
            if (each2 instanceof TaskItem)
            {
                const rgx = new RegExp(rmvLbl + groupSeparator, "i");
                each2.label = (each2.label as string).replace(rgx, "");

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

}
