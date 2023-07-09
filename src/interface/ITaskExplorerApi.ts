
import { IExternalProvider } from "./IExternalProvider";
import { ITaskExplorerProvider } from "./ITaskProvider";

export interface ITaskExplorerApi
{
    providers: Record<string, ITaskExplorerProvider>;
    refreshExternalProvider(taskSource: string, logPad: string): Promise<void>;
    register(taskSource: string, provider: IExternalProvider, logPad: string): Promise<void>;
    unregister(taskSource: string, logPad: string): Promise<void>;
}