// eslint-disable-next-line @typescript-eslint/naming-convention
export const NpmTaskProvider = {};
/*
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


export class NpmTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "npm"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def = this.getDefaultDefinition(target, folder, uri),
              cwd = dirname(uri.fsPath),
              args = [ "run", target ],
              options = { cwd },
              execution = new ShellExecution("npm", args, options);
        return new Task(def, folder, target, "npm", execution);
    }


    public getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        if (!scriptName || !documentText) {
            return 0;
        }

        let idx = -1;
        return idx;
    }


    private getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: "npm",
            script: target,
            target,
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            fileName: basename(uri.path),
            uri
        };
        return def;
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        this.wrapper.log.methodStart("read gulp file uri tasks", 3, logPad, false, [[ "path", uri.fsPath ], [ "project folder", folder.name ]], this.logQueueId);

        const pkgJso = await this.wrapper.fs.readJsonAsync<any>(uri.fsPath);
        for (const s of Object.keys(pkgJso.scripts))
        {
            const task = this.createTask(s, s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        this.wrapper.log.methodDone("read gulp file uri tasks", 3, logPad, [[ "#of tasks found", result.length ]], this.logQueueId);
        return result;
    }

}
*/
