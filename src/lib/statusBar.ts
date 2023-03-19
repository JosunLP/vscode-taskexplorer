
/**
 * @class TeStatusBar
 * @since 3.0.0
 */

import { sleep } from "./utils/utils";
import { TeWrapper } from "./wrapper";
import { ITeStatusBar } from "../interface";
import {
    CancellationToken, Disposable, Progress, ProgressLocation, StatusBarAlignment, StatusBarItem, window
} from "vscode";

type TeProgressCallback = Progress<{ message?: string; increment?: number }>;


export class TeStatusBar implements ITeStatusBar, Disposable
{
    private _hidden = true;
    private _extName: string;
    private _statusBarNumChars = 65;
    private _statusBarItem: StatusBarItem;
    private _progress: Progress<{ message?: string; increment?: number }> | undefined;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._extName = this.wrapper.extensionName;
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -10000);
        this._statusBarItem.tooltip = this._extName + " Status";
    }


    dispose = () => this._statusBarItem.dispose();


    get = () => this._statusBarItem.text;


    private hide = () => { if (!this._hidden) { this._statusBarItem.text = ""; this._statusBarItem.hide(); this._hidden = true; }};


    // private onCancel = () => void this.wrapper.filecache.cancelBuildCache();


    private run = async <T>(progress: TeProgressCallback, token: CancellationToken, task: (progress: TeProgressCallback, token: CancellationToken) => Thenable<T>) =>
    {
        // const d = token.onCancellationRequested(() => this.onCancel());
        this._progress = progress;
        const t = await task(progress, token);
        this._progress = undefined;
        // d.dispose();
        return t;
    };


    runWithProgress = <T>(task: () => Thenable<T>) =>
    {
        return window.withProgress<T>(
        {
            location: ProgressLocation.Notification,
            cancellable: false,
            title: this._extName
        },
        (progress, token) => this.run<T>(progress, token, task));
    };


    private show = async () =>
    {
        if (this._hidden)
        {
            this._statusBarItem.show();
            this._hidden = false;
        }
    };


    // tooltip = (msg: string) => this.statusBarItem.tooltip = msg;


    update = async (msg: string, increment?: number) =>
    {
        if (!msg)
        {
            this.hide();
            if (this._progress) {
                this._progress.report({});
                await sleep(1);
            }
        }
        else
        {
            const message = this.getStatusString(msg);
            this.show();
            this._statusBarItem.text = this.getStatusString(`$(loading~spin) ${this._extName}: ${message}`);
            if (this._progress) {
                this._progress.report({ message, increment });
                await sleep(1);
            }
        }
    };


    private getStatusString = (msg: string) =>
    {
        if (msg.length < this._statusBarNumChars)
        {
            for (let i = msg.length; i < this._statusBarNumChars; i++) {
                msg += " ";
            }
        }
        else {
            msg = msg.substring(0, this._statusBarNumChars - 3) + "...";
        }
        return msg;
    };

}
