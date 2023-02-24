
import { Disposable, DOM } from "./common/dom";
import {
	IpcCommandType, IpcMessage, IpcMessageParams, WebviewFocusChangedParams, WebviewFocusChangedCommandType,
	WebviewReadyCommandType, ExecuteCommandType, onIpc, EchoCommandRequestType, LogWriteCommandType,
	EchoCustomCommandRequestType, ExecuteCustomCommandType
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

	private readonly _vscode: VsCodeApi;
	protected state: State;
	private _focused?: boolean;
	private _inputFocused?: boolean;
	private bindDisposables: Disposable[] | undefined;
	private ipcSequence = 0;
	private maxSmallIntegerV8 = 2 ** 30; // Max # that can be stored in V8's smis (small ints)


	constructor(protected readonly appName: string)
	{
		const domWindow = window as any;
		this.state = domWindow.bootstrap;
		delete domWindow.bootstrap;

		const disposables: Disposable[] = [];
		this.log(`${this.appName}.constructor()`);

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
				this.bindDisposables?.forEach(d => d.dispose());
				this.bindDisposables = undefined;
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


	protected initialize(): void
	{
		this.bindDisposables?.forEach(d => d.dispose());
		this.bindDisposables = this.onBind?.();
		if (!this.bindDisposables) {
			this.bindDisposables = [];
		}

		//
		// GitLens author uses this debounce method here for some reason...  i'm sure it'll
		// smack me in the fac one of these days and I'll find out why
		//
		// const sendWebviewFocusChangedCommand = debounce((params: WebviewFocusChangedParams) => {
		// 	this.sendCommand(WebviewFocusChangedCommandType, params);
		// }, 150);
		const sendWebviewFocusChangedCommand = (p: WebviewFocusChangedParams) => this.sendCommand(WebviewFocusChangedCommandType, p);

		if (this.onDataActionClicked) {
			this.bindDisposables.push(
				DOM.on("[data-action]", "click", this.onDataActionClicked.bind(this))
			);
		}

		this.bindDisposables.push(
			DOM.on(document, "focusin", (e) =>
			{
				const inputFocused = e.composedPath().some(el => (el as HTMLElement).tagName === "INPUT");
				if (this._focused !== true || this._inputFocused !== inputFocused)
				{
					this._focused = true;
					this._inputFocused = inputFocused;
					sendWebviewFocusChangedCommand({ focused: true, inputFocused });
				}
			}),
			DOM.on(document, "focusout", () =>
			{
				if (this._focused !== false || this._inputFocused !== false) {
					this._focused = false;
					this._inputFocused = false;
					sendWebviewFocusChangedCommand({ focused: false, inputFocused: false });
				}
			})
		);

		this.applyLicenseContent();
	}


	protected log = (message: string, ...optionalParams: any[]): void =>
	{
		setTimeout(() => {
			this.postMessage({ id: this.nextIpcId(), method: LogWriteCommandType.method, params: { message, value: undefined }});
		},  1);
		console.log("[WEBVIEW]: " + message, ...optionalParams);
	};


	private nextIpcId = (): string =>
	{
		if (this.ipcSequence === this.maxSmallIntegerV8) {
			this.ipcSequence = 1;
		}
		else {
			this.ipcSequence++;
		}
		return `webview:${this.ipcSequence}`;
	};


	private _onMessageReceived(e: MessageEvent): void
    {
		const msg = e.data as IpcMessage;
        this.log(`WebviewAppBase[${this.appName}].onMessageReceived(${msg.id}): method=${msg.method}`);
        switch (msg.method)
        {
			// case DidChangeLicenseType.method:
			// 	onIpc(DidChangeLicenseType, msg, params => {
			// 		(this.state as any).license = params.license;
			// 		(this.state as any).session = params.session;
			// 		this.updateState();
			// 	});
			// 	break;
			case EchoCommandRequestType.method:       // Standard echo service for testing web->host commands in mocha tests
                onIpc(EchoCommandRequestType, msg, params => this.sendCommand(ExecuteCommandType, params));
                break;
			case EchoCustomCommandRequestType.method: // Standard echo service for testing web->host commands in mocha tests
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
		this.log(`${this.appName}.sendCommand(${id}): name=${command.method}`);
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
