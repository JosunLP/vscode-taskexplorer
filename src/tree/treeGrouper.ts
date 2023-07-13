
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
    private _groupScripts = true;
    private _groupMaxLevel = 5;

    constructor(private readonly wrapper: TeWrapper) {}


    buildGroupings = async(source: string | undefined, folders: TaskMap<TaskFolder|SpecialTaskFolder>, fileMap: TaskMap<TaskFile>, logPad: string) =>
    {
        const w = this.wrapper;
        this._groupSep = w.config.get<string>(w.keys.Config.GroupSeparator, "-");
        this._groupMaxLevel = w.config.get<number>(w.keys.Config.GroupMaxLevel, 5);
        this._group = w.config.get<boolean>(w.keys.Config.GroupWithSeperator, true);
        this._groupScripts = w.config.get<boolean>(w.keys.Config.GroupScripts, true);
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
                                            .filter((t): t is TaskFile => TaskFile.is(t));
        this.wrapper.log.methodStart("create tree node folder grouping", 3, logPad, true, [[ "project folder", folder.label ]]);
        //
        // Clear all items in this folder from the taskfile hash map
        //
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
                    const gid = TaskFile.groupId(folder, folder.resourceUri.fsPath, prevTaskFile.taskSource, prevTaskFile.taskSource, 0);
                    if (!groupHash[gid])
                    {
                        this.wrapper.log.values(3, logPad, [
                            [ "add taskfile grouped child container", taskFile.relativePath ], [ "group id", gid ]
                        ]);
                        const taskItem = taskFile.treeNodes[0];
                        this.wrapper.utils.execIf2(TaskItem.is(taskItem), (ti, ptf) =>
                        {
                            groupHash[gid] = folder.addChild(new TaskFile(this.wrapper, folder, ti.task, 0, gid, ti.task.source, "   "));
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
            // Continue sub-grouping by breaking down any taskitems containing `groupSeparator`.
            // User may optionally turn off parsing of script file groupings (by sepoarators in filename)
            //
            if (this._groupScripts || !this.wrapper.taskUtils.isScriptType(taskFile.taskSource))
            {
                await this.groupBySep(folder, taskFile, hash, groupHash, 0, logPad + "   ");
            }
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
        for (const t of folder.taskFiles.filter((t): t is TaskFile => TaskFile.is(t)))
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
    private groupBySep = async(folder: TaskFolder, taskFile: TaskFile, hash: TaskMap<TaskFile>, groupHash: TaskMap<TaskFile>, groupLevel: number, logPad: string) =>
    {
        const w = this.wrapper,
              newNodes: TaskFile[] = [],
              atMaxLevel: boolean = this._groupMaxLevel <= groupLevel + 1,
              taskItems = taskFile.treeNodes.splice(0).filter((n): n is TaskItem => TaskItem.is(n));
        let didGroupLast = false,
            prevLblParts: string[] | undefined,
            prevTaskItem: TaskItem | undefined;
        //
        w.log.methodStart("create task groupings by separator", 3, logPad, true, [
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
            const thisName = this.splitLabel(taskItem.label, taskItem),
                  prevNameOk = prevLblParts && prevLblParts.length > groupLevel && prevLblParts[groupLevel];
            //
            w.log.write("   process taskitem grouping by separator", 5, logPad);
            w.log.values(5, logPad + "      ", [
                [ "id", taskItem.id ], [ "label", taskItem.label ], [ "sep", this._groupSep ],
                [ "command", taskItem.command.command ], [ "this name", thisName ],
                [ "previous name [tree level]", prevLblParts && prevNameOk ? prevLblParts[groupLevel] : "undefined" ]
            ]);
            //
            // If 'prevLblParts' length > 1, then this task was grouped using the group separator
            //
            let foundGroup = false;
            if (prevLblParts && prevNameOk && thisName && thisName.length > groupLevel)
            {
                for (let i = 0; i <= groupLevel && (foundGroup || i === 0); i++) {
                    foundGroup = prevLblParts[i] === thisName[i];
                }
            }
            //
            // Group with previous taskfile if necessary
            //
            if (prevTaskItem)
            {
                if (foundGroup && prevLblParts)
                {   //
                    // We found a pair of tasks that need to be grouped.  i.e. the first part of the label
                    // when split by the separator character is the same...
                    //
                    const gid = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskItem.taskSource, taskItem.task.name, groupLevel);
                    if (!groupHash[gid])
                    {   //
                        // Create the new node, add it to the list of nodes to add to the tree.  We must
                        // add them after we loop since we are looping on the array that they need to be
                        // added to
                        //
                        w.log.value("   add grouped taskfile node", prevLblParts[groupLevel], 4, logPad);
                        groupHash[gid] = new TaskFile(w, folder, taskItem.task, groupLevel, gid, prevLblParts[groupLevel], logPad);
                        //
                        // Since we add the grouping when we find two or more equal group names, we are iterating
                        // over the 2nd one at this point, and need to add the previous iteration's TaskItem to the
                        // new group just created
                        //
                        groupHash[gid].addChild(prevTaskItem); // will set the group level on the TaskItem
                        hash[groupHash[gid].id] = groupHash[gid];
                        newNodes.push(groupHash[gid]);
                    }
                    groupHash[gid].addChild(taskItem); // will set the group level on the TaskItem
                }
                else if (!didGroupLast)
                {
                    this.processSingle(folder, taskFile, prevTaskItem, hash, groupHash, groupLevel);
                }
                didGroupLast = !!foundGroup && !!prevLblParts;
            }
            prevLblParts = undefined;
            prevTaskItem = taskItem;
            if (taskItem.label.includes(this._groupSep)) {
                prevLblParts = taskItem.label.split(this._groupSep);
            }
        }
        if (!didGroupLast && prevTaskItem)
        {
            this.processSingle(folder, taskFile, prevTaskItem, hash, groupHash, groupLevel);
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
                await w.utils.execIf2(!atMaxLevel, this.groupBySep, this, null, folder, n, hash, groupHash, groupLevel + 1, logPad + "   ");
            }
        }

        w.log.methodDone("create task groupings by separator", 4, logPad);
    };


    private processSingle = (folder: TaskFolder, taskFile: TaskFile, taskItem: TaskItem, hash: TaskMap<TaskFile>, groupHash: TaskMap<TaskFile>, groupLevel: number) =>
    {
        taskFile.groupLevel = groupLevel;
        taskFile.groupId = TaskFile.groupId(folder, taskFile.resourceUri.fsPath, taskItem.taskSource, taskItem.task.name, groupLevel);
        taskFile.id = TaskFile.id(folder, taskItem.task, groupLevel, taskFile.groupId);
        taskFile.addChild(taskItem);
        groupHash[taskFile.groupId] = taskFile;
        hash[taskFile.id] = taskFile;
    };


    private renameGroupedTasks = async(taskFile: TaskFile) =>
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
        // if (item.taskSource === "tsc" && this.wrapper.keys.Regex.TsConfigTaskLabel.test(lbl))
        // {
        //     const tscLblParts = lbl.split(" - ");
        //     const lastPart = <string>lblParts.pop();
        //     lblParts[lblParts.length - 1] = `${lblParts[lblParts.length - 1].trimEnd()} (${lastPart.trimStart()})`;
        // }
        return lblParts;
    };

}
