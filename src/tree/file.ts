
import { TaskItem } from "./item";
import { log } from "../lib/log/log";
import { TaskFolder }  from "./folder";
import { encodeUtf8Hex } from ":env/hex";
import { Strings } from "../lib/constants";
import { basename, extname, join } from "path";
import { pathExistsSync } from "../lib/utils/fs";
import { properCase } from "../lib/utils/commonUtils";
import { ITaskDefinition, ITaskFile } from "../interface";
import { isWorkspaceFolder } from "../lib/utils/typeUtils";
import { getTaskTypeFriendlyName } from "../lib/utils/taskUtils";
import { Task, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { getInstallPathSync, getTaskRelativePath, getUserDataPath } from "../lib/utils/pathUtils";
import { execIf, getGroupSeparator, getPackageManager } from "../lib/utils/utils";


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
    /**
     * The owner TaskFolder representing a workspace or special (Last Tasks / Favorites)
     * folder.
     */
    folder: TaskFolder;
    /**
     * Child TaskItem or TaskFile nodes in the tree.  A TaskFile can own another TaskFile
     * if "Grouping" is turned on in settings.
     */
    path: string;
    treeNodes: (TaskItem|TaskFile)[] = [];
    fileName: string;
    groupLevel: number;
    readonly task: Task;
    readonly taskSource: string;
    readonly taskType: string;
    readonly isGroup: boolean;
    readonly isUser: boolean;

    override id: string;
    override resourceUri: Uri;


    /**
     * @constructor
     *
     * @param context The VSCode extension context.
     * @param folder The owner TaskFolder, a TaskFolder represents a workspace or special (Last Tasks / Favorites) folder.
     * @param taskDef The task definition.
     * @param source The task source that the TaskFile will be associated with, e.g. `npm`, `ant`, `gulp`, etc.
     * @param relativePath The relative path of the task file, relative to the workspace folder it was found in.
     * @param groupLevel The grouping level in the tree.
     * @param group Flag indicating if the TaskFile is being added in grouped mode.
     * @param label The display label.
     * @param logPad Padding to prepend to log entries.  Should be a string of any # of space characters.
     */
    constructor(folder: TaskFolder, task: Task, relativePath: string,
                groupLevel: number, groupId: string | undefined, label: string, logPad: string)
    {
        super(TaskFile.getLabel(task.definition, label, relativePath, groupId), TreeItemCollapsibleState.Collapsed);

        const taskDef = task.definition;
        log.methodStart("construct tree file", 4, logPad, false, [
            [ "label", label ], [ "source", task.source ], [ "relativePath", relativePath ], [ "task folder", folder.label ],
            [ "groupLevel", groupLevel ], [ "group id", groupId ], [ "taskDef cmd line", taskDef.cmdLine ],
            [ "taskDef file name", taskDef.fileName ], [ "taskDef icon light", taskDef.icon ], [ "taskDef icon dark", taskDef.iconDark ],
            [ "taskDef script", taskDef.script ], [ "taskDef target", taskDef.target ], [ "taskDef path", taskDef.path ]
        ]);

        this.task = task; // for id building when grouping
        this.folder = folder;
        this.taskSource = task.source;
        this.taskType = task.definition.type;
        this.isGroup = !!groupId;
        this.isUser = false;
        this.groupLevel = 0;
        //
        // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
        // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
        // you can set the path variable inside a vscode task changes the relativePath for the task,
        // causing an endless loop when putting the tasks into groups (see taskTree.createTaskGroupings).
        // All other task types will have a relative path of it's location on the filesystem (with
        // exception of TSC, which is handled elsewhere).
        //
        this.path = this.label !== "vscode" ? relativePath : ".vscode";
        this.fileName = this.getFileNameFromSource(task.source, folder, taskDef);

        if (folder.resourceUri) // special folders i.e. 'user tasks', 'favorites, etc will not have resourceUri set
        {
            if (relativePath && task.source !== "Workspace") {
                this.resourceUri = Uri.file(join(folder.resourceUri.fsPath, relativePath, this.fileName));
            }
            else {
                this.resourceUri = Uri.file(join(folder.resourceUri.fsPath, this.fileName));
            }
        } //
         // No resource uri means this file is 'user tasks', and not associated to a workspace folder
        //
        else {
            this.fileName = this.getFileNameFromSource(task.source, folder, taskDef);
            this.resourceUri = Uri.file(join(getUserDataPath(undefined, logPad), this.fileName));
            this.isUser = true;
        }

        if (!groupId)
        {
            this.contextValue = "taskFile" + properCase(this.taskSource);
        }       //
        else { // When a grouped node is created, the definition for the first task is passed
              // to this function. Remove the filename part of tha path for this resource.
             //
            this.fileName = "group"; // change to name of directory
            // Use a custom toolip (default is to display resource uri)
            const taskName = getTaskTypeFriendlyName(task.source, true);
            this.tooltip = `${taskName} task file grouping`;
            this.contextValue = "taskGroup" + properCase(this.taskSource);
            this.groupLevel = groupLevel;
        }

        //
        // Set unique id
        //
        this.id = TaskFile.getId(folder, task, <any>this.label, this.groupLevel, groupId);

        //
        // If npm TaskFile, check package manager set in vscode settings, (npm, pnpm, or yarn) to determine
        // which icon to display
        //
        let src = this.taskSource;
        if (src === "npm") { src = getPackageManager(); }

        //
        // Set context icons
        //
        this.iconPath = ThemeIcon.File;
        if (!taskDef.icon)
        {
            const installPath = getInstallPathSync(),
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

        const iconPath = this.iconPath as { light: string | Uri; dark: string | Uri };
        log.methodDone("construct tree file", 4, logPad, [
            [ "id", this.id ], [ "label", this.label ], [ "is usertask", this.isUser ], [ "context value", this.contextValue ],
            [ "is group", this.isGroup ], [ "groupLevel", this.groupLevel ], [ "filename", this.fileName ],
            [ "resource uri path", this.resourceUri.fsPath ], [ "path", this.path  ], [ "icon light", iconPath.light ],
            [ "icon dark", iconPath.dark ]
        ]);
    }


    addTreeNode(treeNode: (TaskFile | TaskItem | undefined))
    {
        execIf(treeNode, (t) => { t.groupLevel = this.groupLevel; this.treeNodes.push(t); }, this);
    }


    static getId(folder: TaskFolder, task: Task, label: string | undefined, groupLevel: number, groupId?: string)
    {
        let pathKey: string;
        const relativePath = getTaskRelativePath(task),
              relPathAdj = task.source !== "Workspace" ? relativePath : ".vscode";
        if (task.definition.uri)
        {
            pathKey = task.definition.uri.fsPath;
        }
        else if (task.definition.tsconfig)
        {
            pathKey = task.definition.tsconfig;
        }
        else if (isWorkspaceFolder(task.scope)) {
            pathKey = join(task.scope.uri.fsPath, relPathAdj);
        }
        else {
            pathKey = Strings.USER_TASKS_LABEL;
        }
        const lblKey = label || this.getLabel(task.definition, task.source, relativePath, groupId);
        return folder.id + ":" + encodeUtf8Hex(`${pathKey}:${groupLevel}:${groupId || ""}:${lblKey}:${task.source}`);
    }


    static getGroupedId = (folder: TaskFolder, file: TaskFile, label: string, treeLevel: number) =>
    {
        const groupSeparator = getGroupSeparator();
        const labelSplit = label.split(groupSeparator);
        let id = "";
        for (let i = 0; i <= treeLevel; i++)
        {
            id += labelSplit[i];
        }
        id += file.resourceUri.fsPath.replace(/\W/gi, "");
        return folder.label + file.taskSource + id + treeLevel.toString();
    };


    private static getLabel(taskDef: ITaskDefinition, source: string, relativePath: string, groupId: string | undefined): string
    {
        let label = source;
        if (source === "Workspace")
        {
            label = "vscode";
        }

        if (!groupId)
        {
            if (source === "ant")
            {   //
                // For ant files not named build.xml, display the file name too
                //
                if (taskDef.fileName && !taskDef.fileName.match(/build.xml/i))
                {
                    if (relativePath.length > 0 && relativePath !== ".vscode" && taskDef.type)
                    {
                        return label + " (" + relativePath.substring(0, relativePath.length - 1).toLowerCase() + "/" + taskDef.fileName.toLowerCase() + ")";
                    }
                    return (label + " (" + taskDef.fileName.toLowerCase() + ")");
                }
            }
            else if (source === "apppublisher")
            {   //
                // For ap files in the same dir, nsamed with a tag, e.g.:
                //    .publishrc.spm.json
                //
                label = label.replace("ppp", "pp-p"); // `ppp -> pp-p` my app-publisher;
                const match = (taskDef.fileName as string).match(/\.publishrc\.(.+)\.(?:js(?:on)?|ya?ml)$/i);
                if (match && match.length > 1 && match[1])
                {
                    return (label + " (" + match[1].toLowerCase() + ")");
                }
            }
            else if (source === "webpack")
            {   //
                // For ap files in the same dir, nsamed with a tag, e.g.:
                //    webpack.config.dev.json
                //
                const match = (taskDef.fileName as string).match(/webpack\.config\.(.+)\.(?:js(?:on)?)$/i);
                if (match && match.length > 1 && match[1])
                {
                    return (label + " (" + match[1].toLowerCase() + ")");
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
                    return label + " (" + relativePath.substring(0, relativePath.length - 1).toLowerCase() + ")";
                }
                else {
                    return label + " (" + relativePath.toLowerCase() + ")";
                }
            }
        }

        return label.toLowerCase();
    }


    private getFileNameFromSource(source: string, folder: TaskFolder, taskDef: ITaskDefinition)
    {   //
        // Any tasks provided by this extension will have a "fileName" definition. External tasks
        // registered throughthe API also define fileName
        //
        if (taskDef.fileName) {
            return taskDef.fileName;
        }
        //
        // Since tasks are returned from VSCode API without a filename that they were found in we
        // must deduce the filename from the task source.  This includes npm, tsc, and vscode
        // (workspace) tasks
        //
        let fileName = "package.json";
        if (source === "Workspace")
        {   //
            // Note that user task do not have a resourceUri property set
            //
            execIf(folder.resourceUri, () => { fileName = ".vscode/tasks.json"; }, this, [ () => { fileName = "tasks.json"; } ]);
        }
        else if (source === "tsc")
        {   //
            // TypeScript task provider will set property `tsconfg` on the task definition, which
            // includes the relative path to the tsonfig file, filename included.
            //
            fileName = basename(taskDef.tsconfig);
        }
        return fileName;
    }


    insertTreeNode(treeItem: (TaskFile | TaskItem), index: number)
    {
        this.treeNodes.splice(index, 0, treeItem);
    }


    removeTreeNode(treeItem: (TaskFile | TaskItem))
    {
        const idx = this.treeNodes.findIndex(tn => tn.id === treeItem.id);
        execIf(idx !== -1, () => { this.treeNodes.splice(idx, 1); }, this);
    }

}
