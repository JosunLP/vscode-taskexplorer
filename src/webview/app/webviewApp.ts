
import "./common/css/te.css";
import "./common/scss/te.scss";

import { Disposable, DOM } from "./common/dom";
import {
	IpcCommand, IIpcMessage, IpcMessageParams, IpcFocusChangedCommand, IpcReadyCommand, IDictionary, IpcExecCommand
} from "../common/ipc";

interface VsCodeApi {
	postMessage(msg: unknown): void;
	setState(state: unknown): void;
	getState(): unknown;
}

interface IDebounceParams { fn: (...args: any[]) => any; start: number; args: any[] }


declare function acquireVsCodeApi(): VsCodeApi;


export abstract class TeWebviewApp<State = undefined>
{
	protected onInitialize?(): void;
	protected onBind?(): Disposable[];
	protected onInitialized?(): void;
	protected onFocusChanged?(focused: boolean): void;
	protected onMessageReceived?(e: MessageEvent): void;
	protected state: State;

	private _ipcSequence = 0;
	private _focused?: boolean;
	private _inputFocused?: boolean;
	private _bindDisposables: Disposable[] | undefined;
	private readonly _tzOffset: number;
	private readonly _maxSmallIntegerV8 = 2 ** 30; // Max # that can be stored in V8's smis (small int)
	private readonly _vscode: VsCodeApi;
	private _debounceDict: IDictionary<IDebounceParams> = {};


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
		let btn = document.getElementById("btnPurchaseLicense");
		if (btn)
		{
			const isTrial = (this.state as any).isTrial,
				  isTrialExt = (this.state as any).isTrialExtended,
				  isLicensed = (this.state as any).isLicensed,
				  isRegistered = (this.state as any).isRegistered;
			(btn.parentNode as HTMLElement).hidden = isLicensed && !isTrial;
			(btn.parentNode as HTMLElement).style.display = isLicensed && !isTrial ? "none" : "-webkit-inline-flex";
			btn = document.getElementById("btnExtendTrial");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = !isTrial || isTrialExt || !isRegistered;
				(btn.parentNode as HTMLElement).style.display = !isTrial || isTrialExt || !isRegistered ? "none" : "-webkit-inline-flex";
			}
			btn = document.getElementById("btnRegister");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = isRegistered;
				(btn.parentNode as HTMLElement).style.display = isRegistered ? "none" : "-webkit-inline-flex";
			}
			btn = document.getElementById("btnTaskMonitor");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = !isLicensed || isTrial;
				(btn.parentNode as HTMLElement).style.display = !isLicensed || isTrial ? "none" : "-webkit-inline-flex";
			}
			// btn = document.getElementById("btnViewLicense");
			// if (btn) {
			// 	(btn.parentNode as HTMLElement).hidden = isLicensed && !isTrial ;
			// 	(btn.parentNode as HTMLElement).style.display = !isLicensed || isTrial  ? "none" : "-webkit-inline-flex";
			// }
			// btn = document.getElementById("btnViewReport");
			// if (btn) {
			// 	(btn.parentNode as HTMLElement).hidden = isLicensed && !isTrial ;
			// 	(btn.parentNode as HTMLElement).style.display = !isLicensed || isTrial  ? "none" : "-webkit-inline-flex";
			// }
			btn = document.getElementById("btnViewReleaseNotes");
			if (btn) {
				(btn.parentNode as HTMLElement).hidden = !isLicensed || isTrial ;
				(btn.parentNode as HTMLElement).style.display = !isLicensed || isTrial  ? "none" : "-webkit-inline-flex";
			}
		}
	}


	private onDataActionClicked(_e: MouseEvent, target: HTMLElement)
    {
		const action = target.dataset.action;
		if (action) {
			this.sendCommand(IpcExecCommand, { command: action.slice(8) });
		}
	}


	private debounce = <T>(fn: (...args: any[]) => T, wait: number, ...args: any[]) => new Promise<T|void>(async(resolve) =>
	{
		if (!this._debounceDict[fn.name])
		{
			this._debounceDict[fn.name] = { fn, start: Date.now(), args };
			setTimeout((p: IDebounceParams) =>
			{
				resolve(p.fn.call(this, ...p.args));
				delete this._debounceDict[fn.name];
			},
			wait, this._debounceDict[fn.name]);
		}
		else {
			Object.assign(this._debounceDict[fn.name], { args });
			setTimeout(() => resolve(), Date.now() - this._debounceDict[fn.name].start);
		}
	});


	protected getState = <T>(): T => this._vscode.getState() as T;


	private initialize(): void
	{
		this._bindDisposables?.forEach(d => d.dispose());
		this._bindDisposables = this.onBind?.() || [];

		this._bindDisposables.push(
			DOM.on("[data-action]", "click", this.onDataActionClicked.bind(this)),
			DOM.on(document, "focusin", (e) =>
			{
				const inputFocused = e.composedPath().some(el => (el as HTMLElement).tagName === "INPUT");
				if (this._focused !== true || this._inputFocused !== inputFocused)
				{
					this._focused = true;
					this._inputFocused = inputFocused;
					this.debounce(p => {
						this.onFocusChanged?.(true);
						this.sendCommand(IpcFocusChangedCommand, p);
					}, 150, { focused: true, inputFocused });
				}
			}),
			DOM.on(document, "focusout", () =>
			{
				if (this._focused !== false || this._inputFocused !== false)
				{
					this._focused = this._inputFocused = false;
					this.debounce(p => {
						this.onFocusChanged?.(false);
						this.sendCommand(IpcFocusChangedCommand, p);
					}, 150, { focused: false, inputFocused: false });
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
			case "echo/command/execute":       // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`, 1);
                this.sendCommand({ method: "command/execute", overwriteable: false }, msg.params);
                break;
			case "echo/fake": // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`, 1);
				this.sendCommand({ method: "fake", overwriteable: false }, msg.params);
                break;
			case "echo/config/update": // Standard echo service for testing web->host commands in mocha tests
				this.log(`Base.onMessageReceived(${msg.id}): method=${msg.method}`, 1);
				this.sendCommand({ method: "config/update", overwriteable: false }, msg.params);
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
		this.log(`                       : message=${JSON.stringify(params)}`, 2);
		this.postMessage({ id, method: command.method, params });
	}


	protected setState(state: State): void
	{
		this.state = state;
		this._vscode.setState(state);
	}

}
