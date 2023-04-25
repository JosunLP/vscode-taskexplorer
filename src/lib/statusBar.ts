/**
 * @class TeStatusBar
 * @since 3.0.0
 */

import { TeWrapper } from "./wrapper";
import { ITeStatusBar } from "../interface";
import {
    CancellationToken, Disposable, Progress, ProgressLocation, StatusBarAlignment, StatusBarItem, window
} from "vscode";

type StatusProgressCallback = Progress<{ message?: string; increment?: number }>;


export class TeStatusBar implements ITeStatusBar, Disposable
{
    private _hidden = true;
    private _title: string;
    private _statusBarNumChars = 65;
    private _statusBarItem: StatusBarItem;
    private _progress: Progress<{ message?: string; increment?: number }> | undefined;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -10000);
        this._title = this.wrapper.extensionTitleShort;
        this.reset();
    }

    dispose = () => this._statusBarItem.dispose();


    get text() {
        return this._statusBarItem.text;
    }


    hide = (reset?: boolean) =>
    {
        if (!this._progress)
        {
            if (!this._hidden) {
                this._statusBarItem.text = "";
                this._statusBarItem.hide();
                this._hidden = true;
            }
            if (reset) {
                this.reset();
            }
        }
    };


    private reset = () =>
    {
        this._title = this.wrapper.extensionTitleShort;
        this._statusBarItem.tooltip = this._title + " Status";
        this._statusBarItem.text = "";
        this._statusBarItem.command = undefined;
    };


    // private onCancel = () => void this.wrapper.fileCache.cancelBuildCache();


    private run = async <T>(progress: StatusProgressCallback, token: CancellationToken, task: (progress: StatusProgressCallback, token: CancellationToken) => Thenable<T>) =>
    {
        // const d = token.onCancellationRequested(() => this.onCancel());
        this._progress = progress;
        const t = await task(progress, token);
        this._progress = undefined;
        // d.dispose();
        return t;
    };


    runWithProgress = <T>(task: () => Thenable<T>, location = ProgressLocation.Window) =>
    {
        return window.withProgress<T>(
        {
            location,
            cancellable: false,
            title: this._title
        },
        (progress, token) => this.run<T>(progress, token, task));
    };


    show = (text?: string, toolTip?: string, command?: string) =>
    {
        if (!this._progress)
        {
            if (this._hidden)
            {
                this._statusBarItem.show();
                this._hidden = false;
            }
            this._statusBarItem.text = text || this._statusBarItem.text;
            this._statusBarItem.tooltip = toolTip || this._statusBarItem.tooltip;
            this._statusBarItem.command = command || this._statusBarItem.command;
        }
    };


    // tooltip = (msg: string) => this.statusBarItem.tooltip = msg;


    update = async (text: string, increment?: number) =>
    {
        if (!text)
        {
            this.hide();
            if (this._progress)
            {
                this._progress.report({});
                await this.wrapper.utils.sleep(1);
            }
        }
        else
        {
            const statusText = this.getStatusString(text);
            if (this._progress)
            {
                this._progress.report({ message: statusText, increment });
                await this.wrapper.utils.sleep(1);
            }
            else {
                this.show(`$(loading~spin) ${this._title}: ${statusText}`);
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
