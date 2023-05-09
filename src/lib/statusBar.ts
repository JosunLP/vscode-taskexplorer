/**
 * @class TeStatusBar
 * @since 3.0.0
 */

import { TeWrapper } from "./wrapper";
import { ITeStatusBar } from "../interface";
import { Disposable, Progress, ProgressLocation, StatusBarAlignment, StatusBarItem, window } from "vscode";

type ProgressTask = () => Thenable<any>;
interface IProgressParam { message?: string; increment?: number };

const STATUS_BAR_SIZE = 65;


export class TeStatusBar implements ITeStatusBar, Disposable
{
    // private _focused: boolean;
    private _currentStatusText = "";
    private _currentStatusTooltip: string | undefined;
    private _currentStatusCommand: string | undefined;
    private _currentStatusIncrement: number | undefined;
    private _progress: Progress<IProgressParam> | undefined;

    private readonly _title: string;
    private readonly _statusBarItem: StatusBarItem;
    private readonly _disposables: Disposable[] = [];


    constructor(private readonly wrapper: TeWrapper)
    {
        // this._focused = window.state.focused;
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -10000);
        this._title = this.wrapper.extensionTitleShort;
        this.reset();
        this._disposables.push(
            this._statusBarItem // ,
            // window.onDidChangeWindowState(this.onnWindowStateChange, this)
        );
    }

    dispose = () => this._disposables.splice(0).forEach(d => d.dispose());


    get text() {
        return this._currentStatusText;
    }


    private getStatusString = (msg: string): string =>
        (msg.length <= STATUS_BAR_SIZE ? msg.padEnd(STATUS_BAR_SIZE, " ") : msg.substring(0, STATUS_BAR_SIZE - 3) + "...");


    hide = () => { this.reset(); this._statusBarItem.hide(); };


    // private onnWindowStateChange = (state: WindowState) =>
    // {
    //     this._focused = state.focused;
    //     if (this._focused && this._progress) {
    //         this.update(this._currentStatusText, this._currentStatusIncrement);
    //     }
    // };


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


    runWithProgress = <T>(task: ProgressTask, location = ProgressLocation.Window) =>
    {
        return window.withProgress<T>(
        {
            location,
            cancellable: false,
            title: this._title
        },
        async (progress) =>  // token)
        {   // const d = token.onCancellationRequested(() => void this.wrapper.langManager.stopIndexer());
            this._progress = progress;
            const result = await task();
            this._progress = undefined;
            this._currentStatusText = "";
            this._currentStatusIncrement = undefined;
            // d.dispose();
            return result;
        });
    };


    show = (text: string, toolTip?: string, command?: string) =>
    {
        this._currentStatusText = text;
        this._show(text, toolTip, command);
    };


    private _show = (text: string, toolTip?: string, command?: string) =>
    {
        this._statusBarItem.show();
        this._statusBarItem.text = text;
        this._statusBarItem.tooltip = this._currentStatusTooltip = toolTip;
        this._statusBarItem.command = this._currentStatusCommand = command;
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
            if (!text)
            {
                this.hide();
            }
            else
            {
                const statusText = this.getStatusString(text);
                if (this._progress)
                {
                    this._progress.report({ message: statusText, increment });
                }
                else {
                    this._show(`$(loading~spin) ${this._title}: ${statusText}`, this._currentStatusTooltip, this._currentStatusCommand);
                }
            }
            this._currentStatusText = text;
            this._currentStatusIncrement = increment;
        }
    };

}
