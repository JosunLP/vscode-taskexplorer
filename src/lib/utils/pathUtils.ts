
import { homedir } from "os";
import { log } from "../log/log";
import { isWorkspaceFolder } from "./typeUtils";
import { pathExists, pathExistsSync } from "./fs";
import { dirname, join, resolve, sep } from "path";
import { Task, Uri, WorkspaceFolder } from "vscode";
import { execIf, wrap } from "./utils";


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


export const getPortableDataPath = (logPad = ""): string | undefined =>
{
    execIf(process.env.VSCODE_PORTABLE, (portablePath) =>
    {
        const uri = Uri.parse(portablePath);
        if (pathExistsSync(uri.fsPath))
        {
            return wrap(() => {
                const fullPath = join(uri.fsPath, "user-data", "User");
                log.value(logPad + "found portable user data path", fullPath, 4);
                return fullPath;
            }, log.error, this);
        }
    }, this);
    return;
};


export const getRelativePath = (folder: WorkspaceFolder, uri: Uri): string =>
{
    const rootUri = folder.uri;
    const absolutePath = uri.path.substring(0, uri.path.lastIndexOf("/") + 1);
    return absolutePath.substring(rootUri.path.length + 1);
};


export const getTaskAbsolutePath = (task: Task): string => join((<WorkspaceFolder>task.scope).uri.fsPath, getTaskRelativePath(task));


export const getTaskRelativePath = (task: Task): string =>
{
    let relativePath = <string>task.definition.path ?? "";
    if (task.source === "tsc" && isWorkspaceFolder(task.scope))
    {
        if (task.name.includes(" - ")  && !task.name.includes(" - tsconfig.json")) // !(/ \- tsconfig\.[a-z\.\-_]+json$/i).test(task.name))
        {
            relativePath = dirname(task.name.substring(task.name.indexOf(" - ") + 3));
        }
    }
    return relativePath;
};


export const getUserDataPath = (platform?: string, logPad = ""): string =>
{
    let userPath: string | undefined = "";
    log.write(logPad + "get user data path", 4);
    logUserDataEnv(logPad + "   ");
    //
    // Check if data path was passed on the command line
    //
    let argvIdx = process.argv.indexOf("--user-data-dir");
    if (argvIdx !== -1) {
        userPath = resolve(process.argv[++argvIdx]);
        log.value(logPad + "user path is", userPath, 4);
        return userPath;
    }
    //
    // If this is a portable install (zip install), then VSCODE_PORTABLE will be defined in the
    // environment this process is running in
    //
    userPath = getPortableDataPath(logPad + "   ");
    if (!userPath)
    {   //
        // Use system user data path
        //
        userPath = getDefaultUserDataPath(platform);
    }
    userPath = resolve(userPath);
    log.value(logPad + "user path is", userPath, 4);
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


const logUserDataEnv = (padding: string): void =>
{
    if (log.isLoggingEnabled())
    {
        log.value(padding + "os", process.platform, 4);
        log.value(padding + "portable", process.env.VSCODE_PORTABLE, 4);
        log.value(padding + "env:VSCODE_APPDATA", process.env.VSCODE_APPDATA, 4);
        log.value(padding + "env:VSCODE_APPDATA", process.env.APPDATA, 4);
        log.value(padding + "env:VSCODE_APPDATA", process.env.USERPROFILE, 4);
        log.value("env:XDG_CONFIG_HOME", process.env.XDG_CONFIG_HOME, 4); // linux
    }
};
