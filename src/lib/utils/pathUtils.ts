
import { homedir } from "os";
import { execIf, wrap } from "./utils";
import { isWorkspaceFolder } from "./typeUtils";
import { pathExists, pathExistsSync } from "./fs";
import { Task, Uri, WorkspaceFolder } from "vscode";
import { ILog, ITaskDefinition, ITaskFolder } from ":types";
import { basename, dirname, join, resolve, sep } from "path";


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


export const getPortableDataPath = (): string | undefined | void =>
{
    return execIf(process.env.VSCODE_PORTABLE, (portablePath) =>
    {
        const uri = Uri.parse(portablePath);
        if (pathExistsSync(uri.fsPath))
        {
            return wrap(() => {
                const fullPath = join(uri.fsPath, "user-data", "User");
                return fullPath;
            }, [ () => {} ], this);
        }
    }, this);
};


export const getRelativePath = (folder: WorkspaceFolder, uri: Uri): string =>
{
    const rootUri = folder.uri;
    const absolutePath = uri.path.substring(0, uri.path.lastIndexOf("/") + 1);
    return absolutePath.substring(rootUri.path.length + 1);
};


export const getTaskAbsolutePath = (task: Task, includeFileName = false): string =>
{
    let path: string;
    const isWs = isWorkspaceFolder(task.scope);
    if (isWs) {
        path = join(task.scope.uri.fsPath, getTaskRelativePath(task));
    }
    else {
        path = join(getUserDataPath(), getTaskRelativePath(task));
    }
    if (includeFileName) {
        path = join(path, getTaskFileName(task.source, isWs ? task.scope.uri : undefined, task.definition));
    }
    return path;
};


export const getTaskFileName = (source: string, resourceUri: Uri | undefined, taskDef: ITaskDefinition) =>
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
        execIf(resourceUri, () => { fileName = ".vscode/tasks.json"; }, this, [ () => { fileName = "tasks.json"; } ]);
    }
    else if (source === "tsc")
    {   //
        // TypeScript task provider will set property `tsconfg` on the task definition, which
        // includes the relative path to the tsonfig file, filename included.
        //
        fileName = basename(taskDef.tsconfig);
    }
    return fileName;
};


export const getTaskRelativePath = (task: Task): string =>
{
    let relativePath = <string>task.definition.path ?? "";
    if (task.source === "tsc" && isWorkspaceFolder(task.scope) && (/ \- [a-z0-9_\- ]+\/tsconfig\.[a-z\.\-_]*json$/i).test(task.name))
    {
        relativePath = dirname(task.name.substring(task.name.indexOf(" - ") + 3));
        // relativePath = dirname(task.definition.tsconfig);
    }
    return relativePath;
};


export const getUserDataPath = (platform?: string, logPad = ""): string =>
{
    let userPath: string | undefined | void = "";
    //
    // Check if data path was passed on the command line
    //
    let argvIdx = process.argv.indexOf("--user-data-dir");
    if (argvIdx !== -1) {
        userPath = resolve(process.argv[++argvIdx]);
        return userPath;
    }
    //
    // If this is a portable install (zip install), then VSCODE_PORTABLE will be defined in the
    // environment this process is running in
    //
    userPath = getPortableDataPath();
    if (!userPath)
    {   //
        // Use system user data path
        //
        userPath = getDefaultUserDataPath(platform);
    }
    userPath = resolve(userPath);
    return userPath;
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
