
import { Event } from "vscode";

export interface ITeTreeConfigWatcher
{
    readonly isBusy: boolean;
    readonly onReady: Event<void>;
    enableConfigWatcher(enable: boolean): void;
}
