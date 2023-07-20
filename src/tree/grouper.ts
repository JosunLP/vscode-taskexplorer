
import { TaskFile } from "./node/file";
import { TaskItem } from "./node/item";
import { TaskFolder } from "./node/folder";
import { TaskMap } from "../interface";
import { TeWrapper } from "../lib/wrapper";
import { SpecialTaskFolder } from "./node/specialFolder";
import { ProjectTaskFolder } from "./node/projectFolder";


export class TaskTreeGrouper
{
    private _group = true;
    private _groupSep = "-";
    private _groupScripts = true;
    private _groupMaxLevel = 5;

    constructor(private readonly wrapper: TeWrapper) {}


    buildGroupings = (source: string | undefined, folders: ProjectTaskFolder[], logPad: string) =>
    {
        this.setConfigProperties();
        if (this._group) {
            folders.forEach(f => this.createGroupings(source, f, logPad));
        }
    };


    /**
     * @method createGroupings
     * @since 1.28.0
     */
    private createGroupings = (source: string | undefined, folder: ProjectTaskFolder, logPad: string) =>
    {
        const w = this.wrapper,
              groupHash: TaskMap<TaskFile> = {};
        let didGroupLast = false,
            prevTaskFile: TaskFile | undefined;
        w.log.methodStart("create base grouping", 3, logPad, true, [[ "project folder", folder.label ]]);
        //
        // Loop through each TaskFile, creating a bse group node for each task source that has
        // two separate taskfile nodes.  Note that script type task files in the same directory
        // are under one node, different behavior than non-script type tasks where multiple tasks
        // can be defined in one task file.
        //
        const taskFiles = w.utils.popIfExistsBy(folder.treeNodes, t => TaskFile.is(t) && !t.isGroup && !!(!source || t.taskSource === source), this);
        for (const taskFile of <TaskFile[]>taskFiles)
        {   //
            // Check if current taskfile source is equal to previous (i.e. ant, npm, vscode, etc)
            //
            if (prevTaskFile)
            {
                const doGrouping = prevTaskFile.taskSource === taskFile.taskSource;
                if (doGrouping)
                {
                    const gid = TaskFile.id(folder, (<any>folder.uri).fsPath, prevTaskFile.taskSource, prevTaskFile.taskSource, 0);
                    if (!groupHash[gid])
                    {
                        w.log.values(3, logPad, [
                            [ "add taskfile grouped child container", taskFile.relativePath ], [ "group id", gid ]
                        ]);
                        const taskItem = taskFile.treeNodes[0];
                        w.utils.execIf2(TaskItem.is(taskItem), (ti, ptf) =>
                        {
                            groupHash[gid] = folder.addChild(new TaskFile(w, folder, ti.task, 0, gid, ti.task.source, "   "));
                            //
                            // Since we add the grouping when we find two or more equal group names, we are iterating
                            // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                            // new group just created
                            //
                            groupHash[gid].addChild(ptf); // will reset the id/grouplevel/id on the TaskItem
                        },
                        this, null, <TaskItem>taskItem, prevTaskFile);
                    }
                    groupHash[gid].addChild(taskFile);
                }
                else if (!didGroupLast)
                {
                    const gid = folder.label + prevTaskFile.taskSource;
                    groupHash[gid] = folder.addChild(prevTaskFile);
                }
                didGroupLast = doGrouping;
            }
            prevTaskFile = taskFile;
            //
            // Continue sub-grouping by breaking down any taskitems containing `groupSeparator`.
            // User may optionally turn off parsing of script file groupings (by sepoarators in filename)
            //
            if (this._groupScripts || !w.taskUtils.isScriptType(taskFile.taskSource))
            {
                this.groupBySep(folder, taskFile, groupHash, 0, logPad + "   ");
            }
        }
        if (!didGroupLast && prevTaskFile)
        {
            const gid = folder.label + prevTaskFile.taskSource;
            groupHash[gid] = folder.addChild(prevTaskFile);
        }
        //
        // For groupings with separator, now go through and rename the labels within each group.
        // Configurable to use task name as is, or breakdown and remove the grouped parts from the label
        //
        w.log.write(logPad + "   rename grouped tasks", 3);
        for (const t of folder.treeNodes.filter((t): t is TaskFile => TaskFile.is(t)))
        {
            this.renameGroupedTasks(t);
        }
        //
        // Resort after making adds/removes
        //
        w.treeManager.sorter.sortTaskFolder(folder, "all");
        w.log.methodDone("create base grouping", 3, logPad);
        return groupHash;
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
    private groupBySep = (folder: TaskFolder, taskFile: TaskFile, groupHash: TaskMap<TaskFile>, groupLevel: number, logPad: string) =>
    {
        const w = this.wrapper,
              newNodes: TaskFile[] = [],
              atMaxLevel: boolean = this._groupMaxLevel <= groupLevel + 1,
              taskItems = taskFile.treeNodes.splice(0).filter((n): n is TaskItem => TaskItem.is(n));
        let didGroupLast = false,
            prevTaskItem: TaskItem | undefined;
        //
        w.log.methodStart("create task groupings by separator", 4, logPad, true, [
            [ "folder", folder.label ], [ "label (node name)", taskFile.label ], [ "grouping level", groupLevel ],
            [ "is group", taskFile.isGroup ], [ "file name", taskFile.fileName ], [ "folder", folder.label ],
            [ "path", taskFile.relativePath ], [ "tree level", groupLevel ], [ "sep", this._groupSep ]
        ]);
        //
        // Loop through all items of type `TaskItem` and break down into taskfile groups if
        // the taskitem label contains the `groupSeparator` character
        //
        for (const taskItem of taskItems)
        {
            const curParts = taskItem.label.split(this._groupSep);
            let prevParts: string[] = [];
            if (prevTaskItem && prevTaskItem.label.includes(this._groupSep)) {
                prevParts = prevTaskItem.label.split(this._groupSep);
            }
            //
            w.log.write("   process taskitem grouping by separator", 5, logPad);
            w.log.values(5, logPad + "      ", [
                [ "id", taskItem.id ], [ "label", taskItem.label ], [ "level", groupLevel ],
                [ "prev lbl parts len", prevParts.length ], [ "cur lbl parts len", curParts.length ],
                [ "previous name [tree level]", prevParts[groupLevel] ]
            ]);
            //
            // Group with previous taskfile if necessary
            //
            if (prevTaskItem)
            {
                let foundGroup = false;
                if (prevParts.length > groupLevel && prevParts[groupLevel] && curParts.length > groupLevel)
                {
                    for (let i = 0; i <= groupLevel && (foundGroup || i === 0); i++) {
                        foundGroup = prevParts[i] === curParts[i];
                    }
                }
                if (foundGroup)
                {   //
                    // We found a pair of tasks that need to be grouped.  i.e. the first part of the label
                    // when split by the separator character is the same...
                    //
                    const pKey = w.pathUtils.getTaskAbsoluteUri(taskItem.task, true).fsPath,
                          gid = TaskFile.id(folder, pKey, taskItem.taskSource, taskItem.task.name, groupLevel);
                    if (!groupHash[gid])
                    {   //
                        // Create the new node, add it to the list of nodes to add to the tree.  We must
                        // add them after we loop since we are looping on the array that they need to be
                        // added to
                        //
                        w.log.value("   add grouped taskfile node", prevParts[groupLevel], 4, logPad);
                        groupHash[gid] = new TaskFile(w, folder, taskItem.task, groupLevel, gid, prevParts[groupLevel], logPad);
                        //
                        // Since we add the grouping when we find two or more equal group names, we are iterating
                        // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                        // new group just created
                        //
                        groupHash[gid].addChild(prevTaskItem); // will set the group level on the TaskItem
                        newNodes.push(groupHash[gid]);
                    }
                    groupHash[gid].addChild(taskItem); // will set the group level on the TaskItem
                }
                else if (!didGroupLast)
                {
                    this.processSingle(taskFile, prevTaskItem, groupHash, groupLevel);
                }
                didGroupLast = foundGroup;
            }
            prevTaskItem = taskItem;
        }
        if (!didGroupLast && prevTaskItem)
        {
            this.processSingle(taskFile, prevTaskItem, groupHash, groupLevel);
        }
        //
        // If there are new grouped by separator nodes to add to the tree...
        //
        if (newNodes.length > 0)
        {
            let numGrouped = 0;
            for (const node of newNodes)
            {
                taskFile.addChild(node, numGrouped++);
                w.utils.execIf2(!atMaxLevel, this.groupBySep, this, null, folder, node, groupHash, groupLevel + 1, logPad + "   ");
            }
        }

        w.log.methodDone("create task groupings by separator", 4, logPad);
    };


    private processSingle = (taskFile: TaskFile, taskItem: TaskItem, groupHash: TaskMap<TaskFile>, groupLevel: number) =>
    {
        taskFile.groupLevel = groupLevel - 1 >= 0 ? groupLevel - 1 : 0;
        taskFile.addChild(taskItem);
        groupHash[<string>taskFile.groupId] = taskFile;
    };


    private renameGroupedTasks = (taskFile: TaskFile) =>
    {
        const w = this.wrapper,
              cKeys = w.keys.Config,
              isScript = w.taskUtils.isScriptType(taskFile.taskSource),
              stripLabel = w.config.get<boolean>(!isScript ? cKeys.GroupStripTaskLabel : cKeys.GroupStripScriptLabel, !isScript);
        if (!stripLabel) {
            return;
        }
        const rmvLbl = taskFile.label.replace(/\(/gi, "\\(").replace(/\[/gi, "\\[").replace(/\)/gi, "\\)").replace(/\]/gi, "\\]");
        for (const item of taskFile.treeNodes)
        {
            if (TaskItem.is(item))
            {
                const rgx = new RegExp(`^[^]*${rmvLbl}\\${this._groupSep}`, "i");
                item.label = item.label.replace(rgx, "");
                // if (item.groupLevel > 0) {
                //     item.label = item.label.replace(" - Default", "").split(this._groupSep).slice(item.groupLevel).join(this._groupSep);
                // }
                if (item.groupLevel > 0)
                {
                    let label = "";
                    const labelParts = item.label.replace(" - Default", "").split(this._groupSep);
                    for (let i = item.groupLevel; i < labelParts.length; i++)
                    {
                        label += (label ? this._groupSep : "") + labelParts[i];
                    }
                    item.label = label || /* istanbul ignore next */item.label;
                }
            }
            else {
                this.renameGroupedTasks(item);
            }
        }
    };


    private setConfigProperties = () =>
    {
        const w = this.wrapper;
        this._groupSep = w.config.get<string>(w.keys.Config.GroupSeparator, w.keys.Defaults.Config.GroupSeparator);
        this._groupMaxLevel = w.config.get<number>(w.keys.Config.GroupMaxLevel, w.keys.Defaults.Config.GroupMaxLevel);
        this._group = w.config.get<boolean>(w.keys.Config.GroupWithSeparator, w.keys.Defaults.Config.GroupWithSeparator);
        this._groupScripts = w.config.get<boolean>(w.keys.Config.GroupScripts, w.keys.Defaults.Config.GroupScripts);
    };

}
