
import { Event, WorkspaceFoldersChangeEvent } from "vscode";

export interface ITeFileWatcher
{
    readonly isBusy: boolean;
    readonly onReady: Event<void>;
    init(logPad: string): void;
    onWsFoldersChange(e: WorkspaceFoldersChangeEvent): Promise<void>;
    registerFileWatcher(taskType: string, firstRun: boolean, enabled: boolean, logPad: string): Promise<void>;
}
