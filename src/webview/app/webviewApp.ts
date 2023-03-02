
import "./common/css/te.css";
import "./common/scss/te.scss";

import { Disposable, DOM } from "./common/dom";
import {
	IpcCommandType, IpcMessage, IpcMessageParams, WebviewFocusChangedParams, WebviewFocusChangedCommandType,
	WebviewReadyCommandType, ExecuteCommandType, onIpc, EchoCommandRequestType, EchoCustomCommandRequestType,
	ExecuteCustomCommandType,
	debounce
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

		this.log("Base.constructor");

		this._vscode = acquireVsCodeApi();

		DOM.on(window, "load", () =>
		{
			this.log(`${this.appName}.initializing`);
			this.onInitialize?.();
			this.initialize();
			if (this.onMessageReceived) {
				disposables.push(DOM.on(window, "message", this.onMessageReceived.bind(this)));
			}
			disposables.push(DOM.on(window, "message", this._onMessageReceived.bind(this)));
			this.sendCommand(WebviewReadyCommandType, undefined);
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
			const isLicensed = (this.state as any).isLicensed as boolean;
			(btn.parentNode as HTMLElement).hidden = isLicensed;
			(btn.parentNode as HTMLElement).style.display = isLicensed ? "none" : "-webkit-inline-flex";
			btn = document.getElementById("btnGetLicense");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = isLicensed;
				(btn.parentNode as HTMLElement).style.display = isLicensed ? "none" : "-webkit-inline-flex";
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
					debounce(p => this.sendCommand(WebviewFocusChangedCommandType, p), 150, { focused: true, inputFocused });
				}
			}),
			DOM.on(document, "focusout", () =>
			{
				if (this._focused !== false || this._inputFocused !== false)
				{
					this._focused = this._inputFocused = false;
					debounce(p => this.sendCommand(WebviewFocusChangedCommandType, p), 150, { focused: false, inputFocused: false });
				}
			})
		);

		this.applyLicenseContent();
	}


	protected log = (message: string, ...optionalParams: any[]): void =>
	{
		const timeTags = (new Date(Date.now() - this._tzOffset)).toISOString().slice(0, -1).split("T");
		message = `${this.appName}.${message}`;
		// setTimeout(() => {
		// 	this.postMessage({ id: this.nextIpcId(), method: LogWriteCommandType.method, params: { message, value: undefined }});
		// },  1);
		// console.log(`${timeTags.join(" ")} > [WEBVIEW]:${message}`, ...optionalParams);
		console.log(`${timeTags[1]} > [WEBVIEW]: ${message}`, ...optionalParams);
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
		const msg = e.data as IpcMessage;
        switch (msg.method)
        {
			case EchoCommandRequestType.method:       // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`);
                onIpc(EchoCommandRequestType, msg, params => this.sendCommand(ExecuteCommandType, params));
                break;
			case EchoCustomCommandRequestType.method: // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`);
				onIpc(EchoCustomCommandRequestType, msg, params => this.sendCommand(ExecuteCustomCommandType, params));
                break;
			default:
                break;
		}
	};


	private postMessage = (e: IpcMessage): void => this._vscode.postMessage(e);


	protected sendCommand<T extends IpcCommandType<any>>(command: T, params: IpcMessageParams<T>)
	{
		const id = this.nextIpcId();
		this.log(`sendCommand(${id}): name=${command.method}`);
		this.postMessage({ id, method: command.method, params });
	}


	protected setState(state: State): void
	{
		this.state = state;
		if (state) {
			this._vscode.setState(state);
		}
	}

}
