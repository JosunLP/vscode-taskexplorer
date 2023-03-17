
import { WorkspaceFoldersChangeEvent } from "vscode";

export interface ITeFileWatcher
{
    isBusy: boolean;
    init(logPad: string): void;
    onWsFoldersChange(e: WorkspaceFoldersChangeEvent): Promise<void>;
    registerFileWatcher(taskType: string, firstRun: boolean, enabled: boolean, logPad: string): Promise<void>;
}
