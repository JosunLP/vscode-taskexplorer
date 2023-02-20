
/**
 * @class TeWebviewBase
 *
 * Credits to the author of the Gitlens extension for the webview/webpanel encapsulation
 * concepts that got my praise and thus used in Task Explorer as a starting point.
 */

import { TextDecoder } from "util";
import { ITeWebview, TeSessionChangeEvent } from "../interface";
// import { getNonce } from "@env/crypto";
import { BaseState } from "./common/state";
import { TeWrapper } from "../lib/wrapper";
import { getNonce } from "../lib/env/node/crypto";
import { fontawesome } from "./common/fontawesome";
import { Commands, executeCommand } from "../lib/command/command";
import { Disposable, EventEmitter, Uri, Webview, WebviewPanel, WebviewView, workspace } from "vscode";
import {
	ExecuteCommandType, IpcMessage, IpcMessageParams, IpcNotificationType, onIpc, LogWriteCommandType,
	/* WebviewFocusChangedCommandType, */ WebviewFocusChangedParams, WebviewReadyCommandType, DidChangeStateType
} from "./common/ipc";


export interface FontAwesomeClass
{
	icons: string[];
	brands?: boolean;
	duotone?: boolean;
	light?: boolean;
	regular?: boolean;
	sharp?: boolean;
	solid?: boolean;
	thin?: boolean;
}


export abstract class TeWebviewBase<State> implements ITeWebview, Disposable
{
	protected readonly disposables: Disposable[] = [];

    abstract show(options?: any, ..._args: unknown[]): Promise<TeWebviewBase<any>>;

	protected includeBody?(...args: unknown[]): string | Promise<string>;
	protected includeBootstrap?(...args: unknown[]): any;
	protected includeEndOfBody?(...args: unknown[]): string | Promise<string>;
	protected includeFontAwesome?(): FontAwesomeClass;
	protected includeHead?(...args: unknown[]): string | Promise<string>;
	protected onActiveChanged?(active: boolean): void;
	protected onInitializing?(): Disposable[] | undefined;
	protected onFocusChanged?(focused: boolean): void;
	protected onMessageReceived?(e: IpcMessage): void;
	protected onReady?(): void;
    protected onViewFocusChanged?(e: WebviewFocusChangedParams): void;
	protected onVisibilityChanged?(visible: boolean): void;
	protected onWindowFocusChanged?(focused: boolean): void;
	protected registerCommands?(): Disposable[];

	protected _isReady = false;
	protected _view: WebviewView | WebviewPanel | undefined;

	private readonly _cspNonce: string;
	private readonly _originalTitle: string | undefined;
    private readonly _maxSmallIntegerV8 = 2 ** 30;

    private _ipcSequence: number;
	private _isFirstLoadComplete: boolean;
	private _title: string;

	private _onContentLoaded: EventEmitter<string> = new EventEmitter<string>();
	private _onReadyReceived: EventEmitter<void> = new EventEmitter<void>();


    constructor(protected readonly wrapper: TeWrapper, title: string, protected readonly fileName: string)
    {
		this._cspNonce = getNonce();
		this._title = title;
		this._originalTitle = title;
		this._ipcSequence = 0;
		this._isFirstLoadComplete = false;
		this.disposables.push(
			this._onContentLoaded,
			wrapper.licenseManager.onDidSessionChange(this.onSessionChanged)
		);
    }

	dispose()
	{
		this.disposables.forEach(d => void d.dispose());
	}


	get isFirstLoadComplete(): boolean {
		return this._isFirstLoadComplete;
	}

	get onContentLoaded() {
		return this._onContentLoaded.event;
	}

	get onReadyReceived() {
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
		if (incFa && this.wrapper.utils.isArray(incFa.icons))
		{
			const _addCls = (icons: string[]) => {
				for (const icon of icons) {
					const cls = `.fa-${icon}::before`;
					html += ` ${cls} { content: \"${fontawesome.icons[icon]}\"; }`;
				}
			};
			html += ` <style nonce="${this._cspNonce}">`;
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
			// if (incFa.solid)
			// {
			// 	html += ` ${fontawesome.fontFace("solid-900", webRoot, this.wrapper.cacheBuster)}`;
			// }
			// if (incFa.thin)
			// {
			// 	html += ` ${fontawesome.fontFace("thin-200", webRoot, this.wrapper.cacheBuster)}`;
			// }
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


	protected async getState(): Promise<BaseState>
	{
		return {
			enabled: this.wrapper.views.taskExplorer.enabled || this.wrapper.views.taskExplorerSideBar.enabled,
			nonce: this._cspNonce,
			pinned: false,
			webroot: this.getWebRoot(),
			isLicensed: this.wrapper.licenseManager.isLicensed(),
			session: await this.wrapper.licenseManager.getSession(),
			license: await this.wrapper.licenseManager.getLicenseToken()
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


	notify<T extends IpcNotificationType<any>>(type: T, params: IpcMessageParams<T>, completionId?: string): Promise<boolean>
	{
		return this.postMessage(
		{
			id: this.nextIpcId(),
			method: type.method,
			params,
			completionId
		});
	}


	protected onHtmlPreview = async(html: string, ...args: unknown[]): Promise<string> => html;


	protected onHtmlFinalize = async(html: string, ...args: unknown[]): Promise<string> => html;


	protected onHtmlPreviewBase = async(html: string, ...args: unknown[]): Promise<string> => this.onHtmlPreview(html, ...args);


	protected onHtmlFinalizeBase = async(html: string, ...args: unknown[]): Promise<string> => this.onHtmlFinalize(html, ...args);


	protected onMessageReceivedBase(e: IpcMessage): void
	{
		switch (e.method)
		{
			case WebviewReadyCommandType.method:
				onIpc(WebviewReadyCommandType, e, () => { this._isReady = true; this.onReady?.(); this._onReadyReceived.fire(); });
				break;

			// case WebviewFocusChangedCommandType.method:
			// 	onIpc(WebviewFocusChangedCommandType, e, params => this.onViewFocusChanged(params));
			// 	break;

			case ExecuteCommandType.method:
				onIpc(ExecuteCommandType, e, params =>
				{
					if (params.args) {
						void executeCommand(params.command as Commands, ...params.args);
					}
					else { void executeCommand(params.command as Commands); }
				});
				break;

			case LogWriteCommandType.method:
				onIpc(LogWriteCommandType, e, params => this.wrapper.log.write("[WEBVIEW]: " + params.message, 1));
				break;

			default:
				this.onMessageReceived?.(e);
				break;
		}
	}


	protected onSessionChanged = async (e: TeSessionChangeEvent): Promise<boolean> =>
	{
		const state = await this.getState();
		return this.notify(DidChangeStateType, Object.assign(state, {
			license: e.token
		}));
	};


	private postMessage(message: IpcMessage): Promise<boolean>
	{
		if (!this._view || !this._isReady || !this.visible) {
			return Promise.resolve(false);
		}
		//
		// From GitLens:
		//     It looks like there is a bug where `postMessage` can sometimes just hang infinitely.
		//     Not sure why, but ensure we don't hang
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
		this._isReady = false;
		const html = await this.getHtml(this._view.webview, ...args);
		if (force) {
			this._view.webview.html = "";
		}
		if (this._view.webview.html === html) {
			this._isReady = true;
			return;
		}
		this._view.webview.html = html;
		setTimeout(() => this._onContentLoaded.fire(html), 1);
	}

}
