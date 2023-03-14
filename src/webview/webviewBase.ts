
/**
 * @class TeWebviewBase
 *
 * @since 3.0.0
 *
 * Credits to the author of the Gitlens vscode extension for the webview / webpanel encapsulation
 * concepts that got my super-praise (4th time ever) and thus used in Task Explorer as a starting point.
 */

import { TextDecoder } from "util";
import { getNonce } from "@env/crypto";
import { TeWrapper } from "../lib/wrapper";
import { TeWebviewView } from "./webviewView";
import { TeWebviewPanel } from "./webviewPanel";
import { fontawesome } from "./common/fontawesome";
import { ITeAccount, ITeWebview, TeSessionChangeEvent } from "../interface";
import { Commands, executeCommand } from "../lib/command/command";
import { Disposable, Event, EventEmitter, Uri, Webview, WebviewPanel, WebviewView, workspace } from "vscode";
import {
	BaseState, IpcExecCommand, IIpcMessage, IpcMessageParams, IpcNotification, IpcLogWriteCommand,
	onIpc, IpcFocusChangedParams, IpcReadyCommand, IpcUpdateConfigCommand, IpcLicenseChangedMsg
} from "./common/ipc";


export interface FontAwesomeClass
{
	icons: string[];
	animations?: boolean;
	brands?: boolean;
	duotone?: boolean;
	light?: boolean;
	regular?: boolean;
	sharp?: boolean;
	solid?: boolean;
	thin?: boolean;
}


export abstract class TeWebviewBase<State, SerializedState> implements ITeWebview, Disposable
{
    abstract show(options?: any, ..._args: unknown[]): Promise<TeWebviewPanel<State> | TeWebviewView<State, SerializedState>>;

	protected includeBody?(...args: unknown[]): string | Promise<string>;
	protected includeBootstrap?(...args: unknown[]): any;
	protected includeEndOfBody?(...args: unknown[]): string | Promise<string>;
	protected includeFontAwesome?(): FontAwesomeClass;
	protected includeHead?(...args: unknown[]): string | Promise<string>;
	protected onActiveChanged?(active: boolean): void;
	protected onInitializing?(): Disposable[] | undefined;
	protected onFocusChanged?(focused: boolean): void;
	protected onMessageReceived?(e: IIpcMessage): void;
	protected onReady?(): void;
    protected onViewFocusChanged?(e: IpcFocusChangedParams): void;
	protected onVisibilityChanged?(visible: boolean): void;
	protected onWindowFocusChanged?(focused: boolean): void;
	protected registerCommands?(): Disposable[];

	protected _isReady = false;
	protected skippedNotify = false;
	protected _view: WebviewView | WebviewPanel | undefined;
	protected readonly disposables: Disposable[] = [];

	private _title: string;
    private _ipcSequence: number;
	private _isFirstLoadComplete: boolean;

	private readonly _cspNonce: string;
    private readonly _maxSmallIntegerV8 = 2 ** 30;
	private readonly _originalTitle: string | undefined;
	private readonly _onReadyReceived: EventEmitter<void>;


    constructor(protected readonly wrapper: TeWrapper, title: string, protected readonly fileName: string)
    {
		this._title = title;
		this._ipcSequence = 0;
		this._originalTitle = title;
		this._cspNonce = getNonce();
		this._isFirstLoadComplete = false;
		this._onReadyReceived = new EventEmitter<void>();
		this.disposables.push(
			this._onReadyReceived,
			wrapper.licenseManager.onDidSessionChange(this.onSessionChanged, this)
		);
    }

	dispose()
	{
		this.disposables.forEach(d => void d.dispose());
		this.disposables.splice(0);
	}


	get isFirstLoadComplete(): boolean {
		return this._isFirstLoadComplete;
	}

	get onReadyReceived(): Event<void> {
		return this._onReadyReceived.event;
	}

	get title(): string {
		return this._view?.title ?? this._title;
	}

	set title(title: string)
	{
		this._title = title;
		if (this._view) {
			this._view.title = title;
		}
	}

	get originalTitle(): string | undefined {
		return this._originalTitle;
	}

	get view(): WebviewView | WebviewPanel | undefined {
		return this._view;
	}

	get visible(): boolean {
		return this._view?.visible ?? false;
	}


	protected async getHtml(webview: Webview, ...args: unknown[]): Promise<string>
	{
		const webRootUri = Uri.joinPath(this.wrapper.context.extensionUri, "res"),
			  uri = Uri.joinPath(webRootUri, "page", this.fileName),
			  content = new TextDecoder("utf8").decode(await workspace.fs.readFile(uri)),
			  cspSource = webview.cspSource,
			  webRoot = this.getWebRoot() as string;

		const [ bootstrap, head, body, endOfBody ] = await Promise.all(
		[
			this.includeBootstrap?.(...args),
			this.includeHead?.(...args),
			this.includeBody?.(...args),
			this.includeEndOfBody?.(...args),
		]);

		let html = content;
		html = await this.onHtmlPreviewBase(content, ...args);

		const repl = (h: string) =>
		{
			h = h.replace(/#{(head|body|endOfBody|cspSource|cspNonce|title|version|webroot)}/g, (_s: string, token: string) =>
			{
				switch (token)
				{
					case "head":
						return repl(head ?? "");
					case "body":
						return repl(body ?? "");
					case "endOfBody":
						return this.getHtmlEndOfBody(webRoot, bootstrap, endOfBody);
					case "cspSource":
						return cspSource;
					case "cspNonce":
						return this._cspNonce;
					case "title":
						return this.title;
					case "version":
						return this.wrapper.version;
					default: // case "webroot":
						return webRoot;
				}
			});
			return h;
		};

		html = repl(html);

		this._isFirstLoadComplete = true;
		return this.onHtmlFinalizeBase(html, ...args);
	}


	private getHtmlEndOfBody = (webRoot: string, bootstrap: string | undefined, endOfBody: string | undefined): string =>
	{
		let html = "";

		const incFa = this.includeFontAwesome?.();
		if (incFa && this.wrapper.typeUtils.isArray(incFa.icons))
		{
			const _addCls = (icons: string[]) => {
				for (const icon of icons) {
					const cls = `.fa-${icon}::before`;
					html += ` ${cls} { content: \"${fontawesome.icons[icon]}\"; }`;
				}
			};
			html += ` <style nonce="${this._cspNonce}">`;
			if (incFa.brands)
			{
				html += ` ${fontawesome.fontFace("brands-400", webRoot, this.wrapper.cacheBuster)}`;
			}
			if (incFa.duotone)
			{
				html += ` ${fontawesome.fontFace("duotone-900", webRoot, this.wrapper.cacheBuster)}`;
			}
			if (incFa.light)
			{
				html += ` ${fontawesome.fontFace("light-300", webRoot, this.wrapper.cacheBuster)}`;
			}
			if (incFa.regular)
			{
				html += ` ${fontawesome.fontFace("regular-400", webRoot, this.wrapper.cacheBuster)}`;
			}
			// if (incFa.sharp)
			// {
			// 	html += ` ${fontawesome.fontFace("sharp-????", webRoot, this.wrapper.cacheBuster)}`;
			// }
			if (incFa.solid)
			{
				html += ` ${fontawesome.fontFace("solid-900", webRoot, this.wrapper.cacheBuster)}`;
			}
			// if (incFa.thin)
			// {
			// 	html += ` ${fontawesome.fontFace("thin-200", webRoot, this.wrapper.cacheBuster)}`;
			// }
			if (incFa.animations)
			{
				html += ` ${fontawesome.animations}`;
			}
			html += ` ${fontawesome.selector}`;
			// Object.keys(incFa).forEach(k =>
			// {
			// 	_addCls();
			// });
			_addCls(incFa.icons);
			html += " </style>";
		}

		if (bootstrap) {
			html += ` <script type="text/javascript" nonce="${this._cspNonce}">
						window.bootstrap=${JSON.stringify(bootstrap)};
					</script>`;
		}

		if (endOfBody) {
			html += endOfBody;
		}

		return html.trim().replace(/\s{2,}/g, " ");
	};


	/**
	 * @method getState
	 * To initiate state on a webview, implement a includeBootstrap() override in the top
	 * level webviewView / webviewPanel.
	 */
	protected async getState(): Promise<BaseState>
	{
		return {
			account: this.wrapper.licenseManager.account,
			isEnabled: this.wrapper.views.taskExplorer.enabled || this.wrapper.views.taskExplorerSideBar.enabled,
			isLicensed: this.wrapper.licenseManager.isLicensed,
			isRegistered: this.wrapper.licenseManager.isRegistered,
			isTrial: this.wrapper.licenseManager.isTrial,
			nonce: this._cspNonce,
			webroot: this.getWebRoot() as string
		};
	}


	protected getWebRoot(): string | undefined
	{
		if (this._view) {
			const webRootUri = Uri.joinPath(this.wrapper.context.extensionUri, "res");
			return this._view.webview.asWebviewUri(webRootUri).toString();
		}
	}


    private nextIpcId = (): string =>
    {
		/* istanbul ignore if */
        if (this._ipcSequence === this._maxSmallIntegerV8)
        {
            this._ipcSequence = 1;
        }
        else {
            this._ipcSequence++;
        }
	    return `host:${this._ipcSequence}`;
    };


	notify = <T extends IpcNotification<any>>(type: T, params: IpcMessageParams<T>, completionId?: string): Promise<boolean> =>
		this.postMessage({ id: this.nextIpcId(), method: type.method, params, completionId });


	protected onHtmlPreview = async(html: string, ...args: unknown[]): Promise<string> => html;


	protected onHtmlFinalize = async(html: string, ...args: unknown[]): Promise<string> => html;


	protected onHtmlPreviewBase = async(html: string, ...args: unknown[]): Promise<string> => this.onHtmlPreview(html, ...args);


	protected onHtmlFinalizeBase = async(html: string, ...args: unknown[]): Promise<string> => this.onHtmlFinalize(html, ...args);


	protected onMessageReceivedBase(e: IIpcMessage): void
	{
		switch (e.method)
		{
			case IpcReadyCommand.method:
				onIpc(IpcReadyCommand, e, () => { this._isReady = true; this.onReady?.(); this._onReadyReceived.fire(); });
				break;

			// case IpcFocusChangedCommand.method:
			// 	onIpc(IpcFocusChangedCommand, e, params => this.onViewFocusChanged(params));
			// 	break;

			case IpcExecCommand.method:
				onIpc(IpcExecCommand, e, params =>
				{
					if (params.args) {
						void executeCommand(params.command as Commands, ...params.args);
					}
					else {
						void executeCommand(params.command as Commands);
					}
				});
				break;

			case IpcUpdateConfigCommand.method:
				onIpc(IpcUpdateConfigCommand, e, params => void this.wrapper.config.update(params.key, params.value));
				break;

			// case IpcLogWriteCommand.method:
			// 	onIpc(IpcLogWriteCommand, e, params => void this.wrapper.log.write("[WEBVIEW]: " + params.message, 1));
			// 	break;

			default:
				this.onMessageReceived?.(e);
				break;
		}
	}


	private onSessionChanged = (e: TeSessionChangeEvent): Promise<boolean> =>
		this.notify(IpcLicenseChangedMsg, this.wrapper.utils.cloneJsonObject<TeSessionChangeEvent>(e));


	private postMessage(message: IIpcMessage): Promise<boolean>
	{
		if (!this._view || !this._isReady || !this.visible) {
			this.skippedNotify = !!this._view && !!this._isReady;
			return Promise.resolve(false);
		}
		this.skippedNotify = false;
		//
		// From GitLens extension, noticed this note:
		//     It looks like there is a bug where `postMessage` can sometimes just hang infinitely.
		//     Not sure why, but ensure we don't hang
		// Note sure if it's still valid, but use a promise race just in case
		//
		return Promise.race<boolean>(
		[
			this._view.webview.postMessage(message),
			new Promise<boolean>(resolve => setTimeout(resolve, 5000, false)),
		]);
	}


	protected async refresh(force?: boolean, ...args: unknown[]): Promise<void>
    {
		if (!this._view) return;
		this.wrapper.log.methodStart("WebviewBase: refresh", 2, this.wrapper.log.getLogPad());
		this._isReady = false;
		this.skippedNotify = false;
		const html = await this.getHtml(this._view.webview, ...args);
		if (force) {
			this._view.webview.html = "";
		}
		if (this._view.webview.html === html) {
			this._isReady = true;
			queueMicrotask(() => this._onReadyReceived.fire());
		}
		else {
			this._view.webview.html = html;
		}
		this.wrapper.log.methodStart("WebviewBase: refresh", 2, this.wrapper.log.getLogPad());
	}

}
