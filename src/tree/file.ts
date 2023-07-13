
import { TaskItem } from "./item";
import { extname, join } from "path";
import { TaskFolder }  from "./folder";
import { encodeUtf8Hex } from ":env/hex";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { pathExistsSync } from "../lib/utils/fs";
import { properCase } from "../lib/utils/commonUtils";
import { getTaskTypeFriendlyName } from "../lib/utils/taskUtils";
import { ITaskDefinition, ITaskFile, OneOf, TeTaskSource } from "../interface";
import { asString, isWorkspaceFolder } from "../lib/utils/typeUtils";
import { execIf, getGroupSeparator, getPackageManager } from "../lib/utils/utils";
import { Task, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { getInstallPathSync, getTaskRelativePath, getUserDataPath, getTaskFileName } from "../lib/utils/pathUtils";


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
export class TaskFile extends TreeItem implements ITaskFile
{
    declare label: string;
    override id: string;
    override resourceUri: Uri;

    private static wrapperInst: TeWrapper;

    private _isGroup: boolean;
    private _fileName: string;
    private _groupLevel: number;
    private _folder: TaskFolder;
    private _groupId: string | undefined;

    private readonly _task: Task;
    private readonly _taskSource: TeTaskSource;
    // private readonly _taskType: string;
    private readonly _isUser: boolean;
    private readonly _relativePath: string;
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
        // groupId = groupId || TaskFile.createGroupId(folder, this, this.label, groupLevel);
        TaskFile.wrapperInst = wrapper;
        this.id = TaskFile.id(folder, task, groupLevel, groupId);
        this._task = task;
        this._treeNodes = [];
        this._folder = folder;
        this._taskSource = <TeTaskSource>task.source;
        // this._taskType = task.definition.type;  // If the source is `Workspace`, def.type can be of any provider type
        this._isGroup = !!groupId;
        this._isUser = false;
        this._groupLevel = 0;
        //
        // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
        // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
        // you can set the path variable inside a vscode task changes the relativePath for the task,
        // causing an endless loop when putting the tasks into groups (see taskTree.createTaskGroupings).
        // All other task types will have a relative path of it's location on the filesystem (with
        // exception of TSC, which is handled elsewhere).
        //
        this._relativePath = wrapper.pathUtils.getTaskRelativePath(task);
        this._fileName = getTaskFileName(task.source, folder.resourceUri, taskDef);
        if (folder.resourceUri) // special folders i.e. 'user tasks', 'favorites, etc will not have resourceUri set
        {
            if (this._relativePath && task.source !== "Workspace") {
                this.resourceUri = Uri.file(join(folder.resourceUri.fsPath, this._relativePath, this.fileName));
            }
            else {
                this.resourceUri = Uri.file(join(folder.resourceUri.fsPath, this.fileName));
            }
        } //
         // No resource uri means this file is 'user tasks', and not associated to a workspace folder
        //
        else {
            this.resourceUri = Uri.file(join(getUserDataPath(), this.fileName));
            this._isUser = true;
        }
        //
        // Reset / format node label dependent on task source, now that all properties have been set
        //
        this.label = this.getLabel(task.definition, label, this._relativePath, groupId);
        //
        // Set context / context icons
        //
        if (!groupId)
        {
            this.contextValue = "taskFile" + properCase(this._taskSource);
        }
        else {
            this.setGroupContext(groupId, groupLevel, task.source);
        }
        this.iconPath = ThemeIcon.File;
        if (!taskDef.icon)
        {
            const src = this._taskSource !== "npm" ? this._taskSource : getPackageManager(),
                  installPath = getInstallPathSync(),
                  icon = join(installPath, "res", "img", "sources", src + ".svg");
            if (pathExistsSync(icon))
            {
                this.iconPath = { light: icon, dark: icon };
            }
            else
            {
                const iconDark = join(installPath, "res", "img", "sources", "light", src + ".svg");
                const iconLight = join(installPath, "res", "img", "sources", "light", src + ".svg");
                if (pathExistsSync(iconDark) && pathExistsSync(iconDark))
                {
                    this.iconPath = { light: iconLight, dark: iconDark };
                }
            }
        }
        else if (pathExistsSync(taskDef.icon) && extname(taskDef.icon) === ".svg")
        {
            const iconLight = taskDef.icon;
            const iconDark = taskDef.iconDark && pathExistsSync(taskDef.iconDark) && extname(taskDef.iconDark) === ".svg" ?
                             taskDef.iconDark : taskDef.icon;
            this.iconPath = { light: iconLight, dark: iconDark };
        }
        wrapper.log.methodDone("create taskfile node", 4, logPad, [
            [ "id", this.id ], [ "label", this.label ], [ "is usertask", this.isUser ], [ "context value", this.contextValue ],
            [ "is group", this.isGroup ], [ "groupLevel", this.groupLevel ], [ "filename", this._fileName ],
            [ "resource uri path", this.resourceUri.fsPath ], [ "relative path", this.relativePath  ]
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
    // get task() { return this._task; };
    get taskSource() { return this._taskSource; };
    get treeNodes() { return this._treeNodes; };


    addChild<T extends (TaskFile | TaskItem)>(node: T, index?: number): OneOf<T, [ TaskFile, TaskItem ]>;
    addChild(node: TaskFile | TaskItem, idx = 0)
    {
        node.groupLevel = this._groupLevel;
        // if (node instanceof TaskFile)
        // {
        //     node.groupId = TaskFile.groupId(this._folder, node, node.label, node.groupLevel);
        //     node.id = TaskFile.id(this._folder, node.task, node.label, node.groupLevel, node.groupId);
        //     this.setGroupContext(node.groupId, node.groupLevel, node.taskSource);
        // }
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
            else if (source === "tsc")
            {   //
                // Typescript task names are dumb.  Just don't know a great
                // way to handle them and set them up in groups that actually makes sense.
                //
                const match = this._fileName.match(this.wrapper.keys.Regex.WebpackFileName);
                if (match && match.length > 1 && match[1])
                {
                    return `${label} (${match[1].toLowerCase()})`;
                }
            }
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


    private static getLabelKey(fsPath: string, groupKey: string, groupLevel: number)
    {
        let lblKey = fsPath[groupLevel + 1] + groupLevel;
        if (groupLevel > 0)
        {
            // let labelKey = fsPath[groupLevel + 1] + groupLevel;
            const // pathKey = fsPath.replace(/\W/gi, ""),
                groupSeparator = getGroupSeparator(),
                labelSplit = groupKey.split(groupSeparator);
            for (let i = 0; i <= groupLevel && i < labelSplit.length; i++)
            {
                lblKey += labelSplit[i];
            }
        }
        return lblKey;
    }


    static groupId(folder: TaskFolder, fsPath: string, source: string, taskName: string, groupLevel: number)
    {
        const labelKey = this.getLabelKey(fsPath, taskName, groupLevel),
              pathKey = fsPath.replace(/\W/gi, "");
        return encodeUtf8Hex(`${folder.label}:${source}:${labelKey}:${pathKey}:${groupLevel}`);
    }


    static id(folder: TaskFolder, task: Task, groupLevel: number, groupId?: string)
    {
        let pathKey: string;
        if (task.definition.uri)
        {
            pathKey = task.definition.uri.fsPath;
        }
        else if (task.definition.tsconfig)
        {
            pathKey = task.definition.tsconfig;
        }
        else if (isWorkspaceFolder(task.scope))
        {
            pathKey = join(task.scope.uri.fsPath, getTaskRelativePath(task));
        }
        else {
            pathKey = Strings.USER_TASKS_LABEL;
        }
        const lblKey = this.getLabelKey(pathKey, task.source, groupLevel);
        return `${folder.id}:${encodeUtf8Hex(`${pathKey}:${groupLevel}:${lblKey}:${task.source}`)}:${asString(groupId)}`;
    }


    static is(item: any): item is TaskFile { return item instanceof TaskFile ; }


    removeChild(node: (TaskFile | TaskItem))
    {
        const idx = this._treeNodes.findIndex(tn => tn.id === node.id);
        execIf(idx !== -1, () => { this._treeNodes.splice(idx, 1); }, this);
    }


    private setGroupContext(groupId: string, groupLevel: number, taskSource: string)
    {   //
        // When a grouped node is created, the definition for the first task is passed
        // to this function. Remove the filename part of tha path for this resource.
        //
        this._isGroup = true;
        this._groupId = groupId;
        this._groupLevel = groupLevel;
        this._fileName = "group"; // change to name of directory
        this.tooltip = `${getTaskTypeFriendlyName(taskSource, true)} task file grouping`;
        this.contextValue = "taskGroup" + properCase(taskSource);
    }

}
