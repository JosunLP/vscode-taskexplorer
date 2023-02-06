
import { ProviderResult, Task, Uri, WorkspaceFolder } from "vscode";
import { executeTeCommand } from "../lib/command";
import { TeCommands } from "../lib/constants";
import { ITaskExplorerApi } from "./ITaskExplorerApi";
import { ITaskExplorerProvider } from "./ITaskProvider";


export abstract class IExternalProvider implements ITaskExplorerProvider
{
    abstract getTasks(): ProviderResult<Task[]>;
    abstract invalidate(uri?: Uri, logPad?: string): Promise<void>;
    abstract createTask(target: string, cmd: string | undefined, folder: WorkspaceFolder, uri: Uri, xArgs?: string[], logPad?: string): Task | undefined;
    abstract getDocumentPosition(taskName: string | undefined, documentText: string | undefined): number;
    abstract getGlobPattern(): string;

    public providerName = "external";
    public readonly isExternal = true;

    async provideTasks()
    {
        const teApi = await executeTeCommand<ITaskExplorerApi>(TeCommands.GetApi);
        if (teApi.providers[this.providerName])
        {
            return this.getTasks();
        }
    }

    resolveTask(task: Task): ProviderResult<Task>
    {
        return undefined;
    }

}
