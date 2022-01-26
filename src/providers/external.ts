
import * as log from "../common/log";
import * as path from "path";
import * as util from "../common/utils";
import { TaskExplorerProvider } from "./provider";
import { TaskExplorerDefinition } from "../interface/taskDefinition";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


/**
 * Test class for external task providers
 */
export class ExternalTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor() { super("external"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def: TaskExplorerDefinition = {
            type: "external",
            script: target,
            target,
            icon: undefined,
            path: util.getRelativePath(folder, uri),
            fileName: path.basename(uri.path),
            uri
        };

        const execution = new ShellExecution("cmd", [ "/c", "test.bat"]);
        return new Task(def, folder, target, "external", execution, "$msCompile");
    }


    public getDocumentPosition(taskName: string | undefined, documentText: string | undefined): number
    {
        return 0;
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        log.methodStart("read external tasks", 1, logPad, true, [["path", uri.fsPath], ["project folder", folder.name]]);

        const task = this.createTask("test_1_task_name", "test_1_task_name", folder, uri);
        task.group = TaskGroup.Build;
        result.push(task);

        const task2 = this.createTask("test_2_task_name", "test_2_task_name", folder, uri);
        task.group = TaskGroup.Build;
        result.push(task2);

        log.methodDone("read external tasks", 1, logPad, true);
        return result;
    }
}