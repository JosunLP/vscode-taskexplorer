/**
 * @class TeStatusBar
 * @since 3.0.0
 */

import { TeWrapper } from "./wrapper";
import { IStatusBarInfo, ITeStatusBar } from "../interface";
import { Command, Disposable, Progress, ProgressLocation, StatusBarAlignment, StatusBarItem, window } from "vscode";

type ProgressTask = (...args: any[]) => Thenable<any>;

interface IProgressParam { message?: string; increment?: number };

const STATUS_BAR_SIZE = 55;


export class TeStatusBar implements ITeStatusBar, Disposable
{
    private _currentStatusText = "";
    private _currentStatusTooltip: string | undefined;
    private _currentStatusCommand: string | Command | undefined;
    private _currentStatusIncrement: number | undefined;
    private _timedStatusTimer: NodeJS.Timeout | undefined;
    private _progress: Progress<IProgressParam> | undefined;
    private readonly _title: string;
    private readonly _statusBarItem: StatusBarItem;
    private readonly _disposables: Disposable[] = [];


    constructor(private readonly wrapper: TeWrapper)
    {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
        this._title = this.wrapper.extensionTitleShort;
        this.reset();
        this._disposables.push(
            this._statusBarItem
        );
    }

    dispose = () => { this.clearTimeout(); this._disposables.splice(0).forEach(d => d.dispose()); };


    get info(): IStatusBarInfo {
        return {
            text: this._currentStatusText,
            toolTip: this._currentStatusTooltip,
            command: this._currentStatusCommand,
            increment: this._currentStatusIncrement
        };
    }

    get text() {
        return this._currentStatusText;
    }


    private clearTimeout = () => { const t = this._timedStatusTimer; if (t) clearTimeout(t); this._timedStatusTimer = undefined; };


    hide = () => { this.reset(); this._statusBarItem.hide(); };


    private padStatusMessage = (msg: string): string =>
        (msg.length <= STATUS_BAR_SIZE ? msg.padEnd(STATUS_BAR_SIZE, " ") : msg.substring(0, STATUS_BAR_SIZE - 3) + "...");


    private reset = () =>
    {
        this._statusBarItem.text = "";
        this._statusBarItem.command = this._currentStatusCommand = undefined;
        this._statusBarItem.tooltip = this._currentStatusTooltip = undefined;
        if (!this._progress) {
            this._currentStatusText = "";
            this._currentStatusIncrement = undefined;
        }
    };


    runWithProgress = <T>(task: ProgressTask, ...args: any[]) =>
    {
        return window.withProgress<T>(
        {
            location: ProgressLocation.Window,
            cancellable: false,
            title: this._title
        },
        async (progress) =>  // token)
        {   // const d = token.onCancellationRequested(() => void this.wrapper.langManager.stopIndexer());
            this._progress = progress;
            const result = await task(...args);
            this._progress = undefined;
            this._currentStatusText = "";
            this._currentStatusIncrement = undefined;
            // d.dispose();
            // if (this._showPending) {
            //     this.show(this._showPending.text, this._showPending.toolTip, this._showPending.command);
            //     this._showPending = undefined;
            // }
            return result;
        });
    };


    show = (info: IStatusBarInfo) =>
    {
        this.clearTimeout();
        this._currentStatusText = info.text;
        this._show(info);
    };


    showTimed = (info: IStatusBarInfo, resetInfo?: IStatusBarInfo, delayMs = 1500) =>
    {
        const curInfo = resetInfo || this.info;
        this._show(info);
        this._timedStatusTimer = setTimeout(ci =>
        {
            this._timedStatusTimer = undefined;
            if (curInfo.text) {
                this._show(ci);
            }
            else { this.hide(); }
        },
        delayMs, curInfo);
    };


    private _show = (info: IStatusBarInfo) =>
    {
        this._statusBarItem.show();
        this._statusBarItem.text = info.text;
        this._statusBarItem.tooltip = this._currentStatusTooltip = info.toolTip;
        this._statusBarItem.command = this._currentStatusCommand = info.command;
    };


    // tooltip = (msg: string) => this.statusBarItem.tooltip = msg;

    /**
     * Updates a progress status.  StatusBarItem is displated with loading icon or the
     * _progress instance if a task was started with runWithProgress()
     */
    update = (text: string, increment?: number) =>
    {
        if (text !== this._currentStatusText || increment !== this._currentStatusIncrement)
        {
            if (this._progress)
            {
                this._progress.report({ message: text, increment });
            }
            else if (text)
            {
                this._show({
                    text: `$(loading~spin) ${this._title}: ${this.padStatusMessage(text)}`,
                    toolTip: this._currentStatusTooltip,
                    command: this._currentStatusCommand
                });
            }
            else {
                this.hide();
            }
            this._currentStatusText = text;
            this._currentStatusIncrement = increment;
        }
    };


    updateRunProgress = (task: string, project: string, pct: number): number =>
    {
        const rPct = Math.round(pct);
        this.update(`${task} ${project} ${rPct}%`, rPct);
        return pct;
    };

}
