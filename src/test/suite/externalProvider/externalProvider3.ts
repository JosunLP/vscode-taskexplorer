/* eslint-disable import/no-extraneous-dependencies */

import * as path from "path";
import { getDevPath, getRelativePath } from "../../utils/sharedUtils";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace, commands } from "vscode";
import { IExternalProvider,  ITaskDefinition, ITaskExplorerApi } from ":types";


/**
 * Test class for external task providers
 */
export class ExternalTaskProvider3 implements IExternalProvider
{
    isExternal: true = true;
    cachedTasks: Task[] | undefined;
    public providerName = "external3";


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def: ITaskDefinition = {
            type: this.providerName,
            script: target,
            target,
            icon: getDevPath("res/img/sources/missing_icon.svg"),
            path: path.dirname(getRelativePath(folder, uri)),
            fileName: path.basename(uri.fsPath),
            uri
        };

        const execution = new ShellExecution("cmd", [ "/c", "test.bat" ]);
        return new Task(def, folder, target, this.providerName, execution, "$msCompile");
    }


    public getDocumentPosition(taskName: string | undefined, documentText: string | undefined): number
    {
        return 0;
    }


    public getGlobPattern(): string
    {
        return "**/tasks.test3";
    }


    public async getTasks()
    {
        const result: Task[] = [],
              folder = (workspace.workspaceFolders as WorkspaceFolder[])[0],
              uri = Uri.file(path.join(folder.uri.fsPath, "/dummy_path/tasks.test3"));

        const task = this.createTask("ext3_1_task_name", "ext3_1_task_name", folder, uri);
        task.group = TaskGroup.Build;
        result.push(task);

        const task2 = this.createTask("ext3_2_task_name", "ext3_2_task_name", folder, uri);
        task.group = TaskGroup.Build;
        result.push(task2);

        return result;
    }

    async invalidate(uri?: Uri, logPad?: string): Promise<void>
    {
        return;
    }

    async provideTasks()
    {
        const teApi = await commands.executeCommand<ITaskExplorerApi>("taskexplorer.getApi");
        if (teApi.providers[this.providerName])
        {
            return this.getTasks();
        }
    }

    resolveTask(task: Task)
    {
        return undefined;
    }

}
