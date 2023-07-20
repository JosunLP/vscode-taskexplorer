
import { homedir } from "os";
import { execIf } from "./utils";
import { ITaskDefinition, ITaskFolder } from ":types";
import { isWorkspaceFolder } from "./typeUtils";
import { pathExists, pathExistsSync } from "./fs";
import { Task, Uri, WorkspaceFolder } from "vscode";
import { basename, dirname, join, resolve, sep } from "path";
import { Regex } from "../constants";


export const getCwd = (uri: Uri): string =>
{
    return uri.fsPath.substring(0, uri.fsPath.lastIndexOf(sep) + 1);
};


/**
 * Gets the base/root/install path of the extension
 */
export const getInstallPath = async(): Promise<string> =>
{
    let dir = __dirname;
    while (dir.length > 3 && !(await pathExists(join(dir, "package.json")))) {
        dir = dirname(dir);
    }
    return dir;
};


export const getInstallPathSync = (): string =>
{
    let dir = __dirname;
    while (dir.length > 3 && !(pathExistsSync(join(dir, "package.json")))) {
        dir = dirname(dir);
    }
    return dir;
};


const getPortableDataPath = (): string | undefined | void =>
{
    return execIf(process.env.VSCODE_PORTABLE, (portablePath) =>
    {
        const uri = Uri.parse(portablePath);
        if (pathExistsSync(uri.fsPath)) {
            return join(uri.fsPath, "user-data", "User");
        }
    }, this);
};


export const getRelativePath = (folder: WorkspaceFolder, uri: Uri): string =>
{
    const rootUri = folder.uri;
    const absolutePath = uri.path.substring(0, uri.path.lastIndexOf("/") + 1);
    return absolutePath.substring(rootUri.path.length + 1);
};


export const getTaskAbsoluteUri = (task: Task, fileName?: string | boolean, relativePath?: string) =>
{
    let uri: Uri;
    const isWs = isWorkspaceFolder(task.scope);
    relativePath = relativePath || getTaskRelativePath(task);
    if (isWs)
    {
        if (task.source === "Workspace") {
            uri = Uri.file(join(task.scope.uri.fsPath, ".vscode"));
        }
        else if (task.definition.uri)
        {
            uri = Uri.file(dirname(task.definition.uri.fsPath));
        }
        else {
            uri = Uri.file(join(task.scope.uri.fsPath, relativePath));
        }
    } //
     // No resource uri means this file is 'user tasks', and not associated to a workspace folder
    //
    else {
        uri = Uri.file(join(getUserDataPath(), relativePath));
    }
    if (fileName) {
        uri = Uri.joinPath(uri, fileName === true ? getTaskFileName(task) : fileName);
    }
    return uri;
};


export const getTaskFileName = (task: Task): string =>
{   //
    // Any tasks provided by this extension will have a "fileName" definition. External tasks
    // registered throughthe API also define fileName
    //
    if (task.definition.fileName) {
        return task.definition.fileName;
    }
    //
    // Since tasks are returned from VSCode API without a filename that they were found in we
    // must deduce the filename from the task source.  This includes npm, tsc, and vscode
    // (workspace) tasks
    //
    let fileName = "package.json";
    if (task.source === "Workspace")
    {
        fileName = "tasks.json";
    }
    else if (task.source === "tsc")
    {   //
        // TypeScript task provider will set property `tsconfg` on the task definition, which
        // is the relative path to the tsonfig file, filename included.
        //
        fileName = basename(task.definition.tsconfig);
    }
    return fileName;
};


export const getTaskRelativePath = (task: Task): string =>
{
    let relativePath = <string>task.definition.path ?? "";
    if (isWorkspaceFolder(task.scope))
    {
        if (task.source === "tsc")
        {   //
            // TypeScript task provider will set property `tsconfg` on the task definition, which
            // includes the relative path to the tsonfig file, filename included.
            //
            if (task.definition.tsconfig.includes("/")) {
                relativePath = task.definition.tsconfig.substring(0, task.definition.tsconfig.indexOf("/"));
            }
        }
        else if (task.source === "Workspace")
        {   //
            // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
            // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
            // you can set the path variable inside a vscode task changes the relativePath for the task,
            // causing an endless loop when putting the tasks into groups (see _taskTree.createTaskGroupings).
            // All other task types will have a relative path of it's location on the filesystem (with
            // exception of TSC, which is handled elsewhere).
            //
            relativePath = ".vscode";
        }
    }
    return relativePath;
};


export const getUserDataPath = (test?: boolean, platform?: string): string =>
{
    for (let i = 0; i < process.argv.length; i++)
    {
        const arg = process.argv[i];
        if (arg === "--user-data-dir") {
            return resolve(process.argv[++i]);
        }
        else if (!test && arg.includes(".vscode-test") && arg.includes("Code.exe")) {
            return resolve(arg.substring(0, arg.lastIndexOf(sep)), "..", "user-data", "User");
        }
    }
    return resolve(getPortableDataPath() || getDefaultUserDataPath(platform));
};


const getDefaultUserDataPath = (platform?: string): string =>
{   //
    // Support global VSCODE_APPDATA environment variable
    //
    let appDataPath = process.env.VSCODE_APPDATA;
    //
    // Otherwise check per platform
    //
    if (!appDataPath)
    {
        switch (platform || process.platform)
        {
            case "win32":
                appDataPath = process.env.APPDATA;
                if (!appDataPath) {
                    const userProfile = process.env.USERPROFILE || "";
                    appDataPath = join(userProfile, "AppData", "Roaming");
                }
                break;
            case "darwin":
                appDataPath = join(homedir(), "Library", "Application Support");
                break;
            case "linux":
                appDataPath = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
                break;
            default:
                return ".";
        }
    }
    return join(appDataPath, "vscode");
};
