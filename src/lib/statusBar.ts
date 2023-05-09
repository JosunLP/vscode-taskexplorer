
import { TeWrapper } from "./wrapper";
import { ITeStatusBar } from "../interface";
import { Disposable, Progress, ProgressLocation, StatusBarAlignment, StatusBarItem, window } from "vscode";

type ProgressTask = () => Thenable<any>;
interface IProgressParam { message?: string; increment?: number };


/**
 * @class TeStatusBar
 * @since 3.0.0
 */
export class TeStatusBar implements ITeStatusBar, Disposable
{
    private _currentStatusText = "";
    private _currentStatusTooltip = "";
    private _currentStatusIncrement: number | undefined;
    private _progress: Progress<IProgressParam> | undefined;

    private readonly _title: string;
    private readonly _statusBarNumChars = 65;
    private readonly _statusBarItem: StatusBarItem;
    private readonly _disposables: Disposable[] = [];


    constructor(private readonly wrapper: TeWrapper)
    {
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


    hide = (reset?: boolean) =>
    {
        this._statusBarItem.text = "";
        this._statusBarItem.hide();
        if (reset && !this._progress) {
            this.reset();
        }
    };


    private reset = () =>
    {
        this._statusBarItem.command = undefined;
        this._currentStatusIncrement = undefined;
        this._statusBarItem.tooltip = this._title + " Status";
        this._statusBarItem.text = this._currentStatusText = this._currentStatusTooltip = "";
    };


    runWithProgress = <T>(task: ProgressTask, location = ProgressLocation.Window) =>
    {
        return window.withProgress<T>(
        {
            location,
            cancellable: false,
            title: this._title
        },
        async (progress) => { // , token) => {
            // const d = token.onCancellationRequested(() => void this.wrapper.langManager.stopIndexer());
            this._progress = progress;
            const result = await task();
            this._progress = undefined;
            // d.dispose();
            return result;
        });
    };


    show = (text: string, toolTip: string, command?: string) =>
    {
        this._statusBarItem.show();
        this._statusBarItem.text = this._currentStatusText = text;
        this._statusBarItem.tooltip = this._currentStatusTooltip = toolTip;
        this._statusBarItem.command = command;
    };


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
                    this.show(`$(loading~spin) ${this._title}: ${statusText}`, this._currentStatusTooltip);
                }
            }
            this._currentStatusText = text;
            this._currentStatusIncrement = increment;
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
