
import { Event, WorkspaceFoldersChangeEvent } from "vscode";

export type FileSystemEventType = "create" | "delete" | "change" | "all";

export interface IFileSystemEvent
{
    files: string[];
    type: FileSystemEventType;
}

export interface ITeFileWatcher
{
    readonly isBusy: boolean;
    readonly onEvent: Event<IFileSystemEvent>;
    readonly onReady: Event<void>;
    init(logPad: string): void;
    onWsFoldersChange(e: WorkspaceFoldersChangeEvent): Promise<void>;
    registerFileWatcher(taskType: string, firstRun: boolean, enabled: boolean, logPad: string): Promise<void>;
}
