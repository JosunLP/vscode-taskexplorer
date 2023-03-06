
import "./common/css/te.css";
import "./common/scss/te.scss";

import { Disposable, DOM } from "./common/dom";
import {
	debounce, IpcCommand, IIpcMessage, IpcMessageParams, IpcFocusChangedCommand, IpcReadyCommand,
	IpcExecCommand, onIpc, IpcEchoCommandRequest, IpcEchoCustomCommandRequest, IpcExecCustomCommand
} from "../common/ipc";

interface VsCodeApi {
	postMessage(msg: unknown): void;
	setState(state: unknown): void;
	getState(): unknown;
}


declare function acquireVsCodeApi(): VsCodeApi;


export abstract class TeWebviewApp<State = undefined>
{
	protected onInitialize?(): void;
	protected onBind?(): Disposable[];
	protected onDataActionClicked?(e: MouseEvent, target: HTMLElement): void;
	protected onInitialized?(): void;
	protected onMessageReceived?(e: MessageEvent): void;
	protected state: State;

	private _ipcSequence = 0;
	private _focused?: boolean;
	private readonly _tzOffset: number;
	private _inputFocused?: boolean;
	private _bindDisposables: Disposable[] | undefined;
	private readonly _maxSmallIntegerV8 = 2 ** 30; // Max # that can be stored in V8's smis (small int)
	private readonly _vscode: VsCodeApi;


	constructor(protected readonly appName: string)
	{
		const domWindow = window as any;
		this.state = domWindow.bootstrap;
		delete domWindow.bootstrap;

		const disposables: Disposable[] = [];
		this._tzOffset = (new Date()).getTimezoneOffset() * 60000;

		this.log("Base.constructor", 1);

		this._vscode = acquireVsCodeApi();

		DOM.on(window, "load", () =>
		{
			this.log(`${this.appName}.initializing`, 1);
			this.onInitialize?.();
			this.initialize();
			if (this.onMessageReceived) {
				disposables.push(DOM.on(window, "message", this.onMessageReceived.bind(this)));
			}
			disposables.push(DOM.on(window, "message", this._onMessageReceived.bind(this)));
			this.sendCommand(IpcReadyCommand, undefined);
			this.onInitialized?.();
		});

		disposables.push(
			DOM.on(window, "pagehide", () =>
			{
				disposables?.forEach(d => d.dispose());
				this._bindDisposables?.forEach(d => d.dispose());
				this._bindDisposables = undefined;
			})
		);
	}


	protected get vscode(): VsCodeApi {
		return this._vscode;
	}


	private applyLicenseContent(): void
    {
		let btn = document.getElementById("btnEnterLicense");
		if (btn)
		{
			const isLicensed = (this.state as any).isLicensed;
			(btn.parentNode as HTMLElement).hidden = isLicensed;
			(btn.parentNode as HTMLElement).style.display = isLicensed ? "none" : "-webkit-inline-flex";
			btn = document.getElementById("btnExtendTrial");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = isLicensed;
				(btn.parentNode as HTMLElement).style.display = isLicensed ? "none" : "-webkit-inline-flex";
			}
			btn = document.getElementById("btnRegister");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = isLicensed;
				(btn.parentNode as HTMLElement).style.display = isLicensed ? "none" : "-webkit-inline-flex";
			}
			btn = document.getElementById("btnViewReleaseNotes");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = !isLicensed;
				(btn.parentNode as HTMLElement).style.display = isLicensed ? "-webkit-inline-flex" : "none";
			}
			btn = document.getElementById("btnTaskMonitor");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = !isLicensed;
				(btn.parentNode as HTMLElement).style.display = isLicensed ? "-webkit-inline-flex" : "none";
			}
			btn = document.getElementById("btnViewLicense");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = !isLicensed;
				(btn.parentNode as HTMLElement).style.display = isLicensed ? "-webkit-inline-flex" : "none";
			}
		}
	}


	protected getState = <T>(): T => this._vscode.getState() as T;


	private initialize(): void
	{
		this._bindDisposables?.forEach(d => d.dispose());
		this._bindDisposables = this.onBind?.() || [];

		if (this.onDataActionClicked) {
			this._bindDisposables.push(
				DOM.on("[data-action]", "click", this.onDataActionClicked.bind(this))
			);
		}

		this._bindDisposables.push(
			DOM.on(document, "focusin", (e) =>
			{
				const inputFocused = e.composedPath().some(el => (el as HTMLElement).tagName === "INPUT");
				if (this._focused !== true || this._inputFocused !== inputFocused)
				{
					this._focused = true;
					this._inputFocused = inputFocused;
					debounce(p => this.sendCommand(IpcFocusChangedCommand, p), 150, { focused: true, inputFocused });
				}
			}),
			DOM.on(document, "focusout", () =>
			{
				if (this._focused !== false || this._inputFocused !== false)
				{
					this._focused = this._inputFocused = false;
					debounce(p => this.sendCommand(IpcFocusChangedCommand, p), 150, { focused: false, inputFocused: false });
				}
			})
		);

		this.applyLicenseContent();
	}


	private logLevel = 2;
	protected log = (message: string, level: number, ...optionalParams: any[]): void =>
	{
		if (level <= this.logLevel)
		{
			const timeTags = (new Date(Date.now() - this._tzOffset)).toISOString().slice(0, -1).split("T");
			message = `${this.appName}.${message}`;
			// setTimeout(() => {
			// 	this.postMessage({ id: this.nextIpcId(), method: IpcLogWriteCommand.method, params: { message, value: undefined }});
			// },  1);
			// console.log(`${timeTags.join(" ")} > [WEBVIEW]:${message}`, ...optionalParams);
			console.log(`${timeTags[1]} > [WEBVIEW]: ${message}`, ...optionalParams);
		}
	};


	private nextIpcId = (): string =>
	{
		if (this._ipcSequence === this._maxSmallIntegerV8) {
			this._ipcSequence = 1;
		}
		else {
			this._ipcSequence++;
		}
		return `webview:${this._ipcSequence}`;
	};


	private _onMessageReceived(e: MessageEvent): void
    {
		const msg = e.data as IIpcMessage;
        switch (msg.method)
        {
			case IpcEchoCommandRequest.method:       // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`, 1);
                onIpc(IpcEchoCommandRequest, msg, params => this.sendCommand(IpcExecCommand, params));
                break;
			case IpcEchoCustomCommandRequest.method: // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`, 1);
				onIpc(IpcEchoCustomCommandRequest, msg, params => this.sendCommand(IpcExecCustomCommand, params));
                break;
			default:
                break;
		}
	};


	private postMessage = (e: IIpcMessage): void => this._vscode.postMessage(e);


	protected sendCommand<T extends IpcCommand<any>>(command: T, params: IpcMessageParams<T>)
	{
		const id = this.nextIpcId();
		this.log(`Base.sendCommand(${id}): command=${command.method}`, 1);
		this.postMessage({ id, method: command.method, params });
	}


	protected setState(state: State): void
	{
		this.state = state;
		this._vscode.setState(state);
	}

}
