
import { TaskItem } from "./item";
import { extname, join } from "path";
import { TaskTreeNode } from "./base";
import { TaskFolder }  from "./folder";
import { encodeUtf8Hex } from ":env/hex";
import { TeWrapper } from "../../lib/wrapper";
import { MarkdownString, Task, ThemeIcon, TreeItemCollapsibleState, Uri } from "vscode";
import { ITaskDefinition, ITaskFile, MarkdownChars, OneOf, TeTaskSource } from "../../interface";


/**
 * @class TaskFile
 *
 * A tree node that represents a task type/source (e.g. `npm`, `gulp`, etc...).
 *
 * A TaskFile can be a direct child of TaskFolder, or, if `grouping` is turned in in
 * Settings, it can be a child of another TaskFile.
 *
 * The last TaskFile in a grouping will contain items of type TaskItem.  If not grouped,
 * the TaskFile node for each task type within each TaskFolder will contain items of type TaskItem.
 */
export class TaskFile extends TaskTreeNode implements ITaskFile
{
    private _isGroup: boolean;
    private _fileName: string;
    private _groupLevel: number;
    private _folder: TaskFolder;
    private _groupId: string | undefined;

    private readonly _uri: Uri;
    private readonly _task: Task;
    private readonly _isUser: boolean;
    private readonly _relativePath: string;
    private readonly _taskSource: TeTaskSource;
    private readonly _treeNodes: (TaskItem|TaskFile)[];


    constructor(private readonly wrapper: TeWrapper, folder: TaskFolder, task: Task,
                groupLevel: number, groupId: string | undefined, label: string, logPad: string)
    {
        super(label, TreeItemCollapsibleState.Collapsed);
        const taskDef = task.definition;
        wrapper.log.methodStart("create taskfile node", 4, logPad, false, [
            [ "label", label ], [ "source", task.source ], [ "task folder", folder.label ],
            [ "groupLevel", groupLevel ], [ "group id", groupId ], [ "taskDef cmd line", taskDef.cmdLine ],
            [ "taskDef file name", taskDef.fileName ], [ "taskDef icon light", taskDef.icon ], [ "taskDef icon dark", taskDef.iconDark ],
            [ "taskDef script", taskDef.script ], [ "taskDef target", taskDef.target ], [ "taskDef path", taskDef.path ]
        ]);
        //
        // Set private properties
        //
        this._task = task;
        this._treeNodes = [];
        this._folder = folder;
        this._taskSource = <TeTaskSource>task.source;
        this._isGroup = !!groupId;
        this._groupLevel = 0;
        this._isUser = !TeWrapper.instance.typeUtils.isWorkspaceFolder(task.scope);
        //
        // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
        // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
        // you can set the path variable inside a vscode task changes the relativePath for the task,
        // causing an endless loop when putting the tasks into groups (see taskTree.createTaskGroupings).
        // All other task types will have a relative path of it's location on the filesystem (with
        // exception of TSC, which is handled elsewhere).
        //
        this._relativePath = wrapper.pathUtils.getTaskRelativePath(task);
        this._fileName = wrapper.pathUtils.getTaskFileName(task);
        this._uri = wrapper.pathUtils.getTaskAbsoluteUri(task, this.fileName, this._relativePath);
        //
        // Set ID and reset/format node label dependent on task source, now that all properties have been set
        //
        // groupId = groupId || TaskFile.createGroupId(folder, this, this.label, groupLevel);
        this.id = TaskFile.id(folder, this._uri.fsPath, task.source, task.name, groupLevel, groupId);
        this.label = this.getLabel(task.definition, label, this._relativePath, groupId);
        //
        // Set context / context icons
        //
        if (!groupId)
        {
            this.setTooltip(groupLevel, this._taskSource);
            this.contextValue = "taskFile" + wrapper.utils.properCase(this._taskSource);
        }
        else {
            this.setGroupContext(groupId, groupLevel, task.source);
        }
        this.iconPath = ThemeIcon.File;
        if (!taskDef.icon)
        {
            const src = this._taskSource !== "npm" ? this._taskSource : this.wrapper.utils.getPackageManager(),
                  installPath = wrapper.pathUtils.getInstallPathSync(),
                  icon = join(installPath, "res", "img", "sources", src + ".svg");
            if (wrapper.fs.pathExistsSync(icon))
            {
                this.iconPath = { light: icon, dark: icon };
            }
            else
            {
                const iconDark = join(installPath, "res", "img", "sources", "light", src + ".svg");
                const iconLight = join(installPath, "res", "img", "sources", "light", src + ".svg");
                if (wrapper.fs.pathExistsSync(iconDark) && wrapper.fs.pathExistsSync(iconDark))
                {
                    this.iconPath = { light: iconLight, dark: iconDark };
                }
            }
        }
        else if (wrapper.fs.pathExistsSync(taskDef.icon) && extname(taskDef.icon) === ".svg")
        {
            const iconLight = taskDef.icon;
            const iconDark = taskDef.iconDark && wrapper.fs.pathExistsSync(taskDef.iconDark) && extname(taskDef.iconDark) === ".svg" ?
                             taskDef.iconDark : taskDef.icon;
            this.iconPath = { light: iconLight, dark: iconDark };
        }
        wrapper.log.methodDone("create taskfile node", 4, logPad, [
            [ "id", this.id ], [ "label", this.label ], [ "is usertask", this.isUser ], [ "context value", this.contextValue ],
            [ "is group", this.isGroup ], [ "groupLevel", this.groupLevel ], [ "filename", this._fileName ],
            [ "resource uri path", this.uri.fsPath ], [ "relative path", this.relativePath  ]
        ]);
    }


    get fileName() { return this._fileName; };
    get folder() { return this._folder; };
    set folder(v) { this._folder = v; }
    get groupId() { return this._groupId; };
    set groupId(v) { this._groupId = v; }
    get groupLevel() { return this._groupLevel; };
    set groupLevel(v) { this._groupLevel = v; }
    get isGroup() { return this._isGroup; };
    get isUser() { return this._isUser; };
    get relativePath() { return this._relativePath; };
    get task() { return this._task; };
    get taskSource() { return this._taskSource; };
    get treeNodes() { return this._treeNodes; };
    get uri() { return this._uri; };


    addChild<T extends (TaskFile | TaskItem)>(node: T, index?: number): OneOf<T, [ TaskFile, TaskItem ]>;
    addChild(node: TaskFile | TaskItem, idx = 0)
    {
        node.groupLevel = this._groupLevel;
        if (TaskFile.is(node) && idx > 0)
        {
            node.groupId = TaskFile.id(node.folder, node.uri.fsPath, node.taskSource, node.task.name, node.groupLevel);
            node.id = TaskFile.id(node.folder, node.uri.fsPath, node.taskSource, node.task.name, node.groupLevel, node.groupId);
        }
        this.treeNodes.splice(idx, 0, node);
        return node;
    }


    private getLabel(taskDef: ITaskDefinition, source: string, relativePath: string, groupId: string | undefined): string
    {
        let label = source !== "Workspace" ? source : "vscode";
        if (!groupId)
        {
            if (source === "ant")
            {   //
                // For ant files not named build.xml, display the file name too
                //
                if (!this._fileName.match(/build.xml/i))
                {
                    if (relativePath.length > 0 && relativePath !== ".vscode" && taskDef.type)
                    {
                        return `${label} (${relativePath.substring(0, relativePath.length - 1).toLowerCase()}/${this._fileName.toLowerCase()})`;
                    }
                    return `${label} (${this._fileName.toLowerCase()})`;
                }
            }
            // else if (source === "tsc")
            // {   //
            //     // Typescript task names are dumb.  Just don't know a great
            //     // way to handle them and set them up in groups that actually makes sense.
            //     //
            //     const match = this._fileName.match(this.wrapper.keys.Regex.TsConfigFileName);
            //     if (match && match.length > 1 && match[1])
            //     {
            //         return `${label} (${match[1].toLowerCase()})`;
            //     }
            // }
            else if (source === "apppublisher")
            {   //
                // For ap files in the same dir, nsamed with a tag, e.g.: .publishrc.spm.json
                //
                label = label.replace("ppp", "pp-p"); // `ppp -> pp-p` my app-publisher;
                const match = this._fileName.match(this.wrapper.keys.Regex.AppPublisherFileName);
                if (match && match.length > 1 && match[1])
                {
                    return `${label} (${match[1].toLowerCase()})`;
                }
            }
            else if (source === "webpack")
            {   //
                // For ap files in the same dir, nsamed with a tag, e.g.: webpack.config.dev.json
                //
                const match = this._fileName.match(this.wrapper.keys.Regex.WebpackFileName);
                if (match && match.length > 1 && match[1])
                {
                    return `${label} (${match[1].toLowerCase()})`;
                }
            }
            //
            // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
            // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
            // you can set the path variable inside a vscode task changes the relativePath for the task,
            // causing an endless loop when putting the tasks into groups (see taskTree.createTaskGroupings).
            // All other task types will have a relative path of it's location on the filesystem (with
            // exception of TSC, which is handled elsewhere).
            //
            if (relativePath.length > 0 && relativePath !== ".vscode" && source !== "Workspace" && relativePath !== ".")
            {
                if (relativePath.endsWith("\\") || relativePath.endsWith("/")) // trim slash chars
                {
                    return `${label} (${relativePath.substring(0, relativePath.length - 1).toLowerCase()})`;
                }
                else {
                    return `${label} (${relativePath.toLowerCase()})`;
                }
            }
        }
        return label.toLowerCase();
    }


    private static getUniqueKey(folder: TaskFolder, source: string, pathKey: string, labelKey: string, groupLevel: number)
    {
        const pKey = pathKey.replace(/\W/gi, "") + pathKey.padEnd(groupLevel + 1, "_")[groupLevel + 1] + groupLevel;
        // let labelKey = fsPath[groupLevel + 1] + groupLevel;
        const // pathKey = fsPath.replace(/\W/gi, ""),
            groupSeparator = TeWrapper.instance.utils.getGroupSeparator(),
            labelSplit = labelKey.split(groupSeparator);
        let lKey = "";
        for (let i = 0; i <= groupLevel && i < labelSplit.length; i++)
        {
            lKey += labelSplit[i];
        }
        return `${folder.label}:${source}${pKey}:${lKey}`;
    }


    static id(folder: TaskFolder, pathKey: string, source: string, labelKey: string, groupLevel: number, groupId?: string)
    {
        const gidKey = TeWrapper.instance.typeUtils.asString(groupId),
              nodeKey = encodeUtf8Hex(this.getUniqueKey(folder, source, pathKey, labelKey, groupLevel));
        return `${nodeKey}:${gidKey}`;
    }


    static is(item: any): item is TaskFile { return !!item && item instanceof TaskFile; }


    private setGroupContext(groupId: string, groupLevel: number, taskSource: string)
    {   //
        // When a grouped node is created, the definition for the first task is passed
        // to this function. Remove the filename part of tha path for this resource.
        //
        this._isGroup = true;
        this._groupId = groupId;
        this._groupLevel = groupLevel;
        this._fileName = "group"; // change to name of directory
        this.setTooltip(groupLevel, taskSource);
        this.contextValue = "taskGroup" + this.wrapper.utils.properCase(taskSource);
    }


    private setTooltip(groupLevel: number, taskSource: string)
    {
        const pkgManager = this.wrapper.utils.getPackageManager();
        let tooltip = `Task Grouping Level ${groupLevel}${MarkdownChars.NewLine}source: ` +
                      `${MarkdownChars.Block}${this.wrapper.taskUtils.getTaskTypeFriendlyName(taskSource, true)}${MarkdownChars.Block}`;
        if (!groupLevel && taskSource === "npm")
        {
            tooltip += `${MarkdownChars.NewLine}Run package management tasks from the context menu, e.g.:` +
                       `${MarkdownChars.NewLine}${MarkdownChars.Code}${pkgManager} install` +
                       `${MarkdownChars.NewLine}${MarkdownChars.Code}${pkgManager} update <pkgname>` ;
        }
        this.tooltip = new MarkdownString(tooltip);
    }

}
