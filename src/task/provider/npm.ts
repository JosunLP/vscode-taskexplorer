
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { findJsonDocumentPosition } from "../../lib/utils/findDocumentPosition";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


export class NpmTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "npm"); }

    /* istanbul ignore next */
    createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def = this.getDefaultDefinition(target, folder, uri),
              cwd = dirname(uri.fsPath),
              args = [ "run", target ],
              options = { cwd },
              execution = new ShellExecution(cmd, args, options);
        return new Task(def, folder, target, this.providerName, execution);
    }


    /* istanbul ignore next */
    getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        if (!scriptName || !documentText) {
            return 0;
        }
        return findJsonDocumentPosition(documentText, scriptName, this.providerName);
    }


    /* istanbul ignore next */
    private getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: this.providerName,
            script: target,
            target,
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            fileName: basename(uri.path),
            uri
        };
        return def;
    }


    /* istanbul ignore next */
    async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const w = this.wrapper,
              result: Task[] = [];
        if (w.config.get<boolean>(w.keys.Config.UseNpmProvider, false) === true)
        {
            const folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder,
                  pkgMgr = this.wrapper.utils.getPackageManager();
            w.log.methodStart("read npm file uri tasks", 3, logPad, false, [[ "path", uri.fsPath ]], this.logQueueId);
            const pkgJso = await w.fs.readJsonAsync<any>(uri.fsPath);
            for (const s of Object.keys(pkgJso.scripts))
            {
                const task = this.createTask(s, pkgMgr, folder, uri);
                task.group = TaskGroup.Build;
                result.push(task);
            }
            w.log.methodDone("read npm file uri tasks", 3, logPad, [[ "#of tasks found", result.length ]], this.logQueueId);
        }
        return result;
    }

}
