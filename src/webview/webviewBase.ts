
/**
 * @class TeWebviewBase
 *
 * @since 3.0.0
 *
 * Credits to the author of the Gitlens vscode extension for the webview / webpanel encapsulation
 * concepts that got my super-praise (4th time ever) and thus used in Task Explorer as a starting point.
 */

import { getNonce } from ":env/crypto";
import { TeViewBase } from "./viewBase";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { TeWebviewView } from "./webviewView";
import { TeWebviewPanel } from "./webviewPanel";
import { fontawesome } from "./common/fontawesome";
import { executeCommand } from "../lib/command/command";
import { Commands, ITeWebview, WebviewIds, WebviewViewIds } from "../interface";
import {
	ConfigurationChangeEvent, Disposable, Event, EventEmitter, Uri, Webview, WebviewPanel, WebviewView, window
} from "vscode";
import {
	BaseState, IpcExecCommand, IIpcMessage, IpcMessageParams, IpcNotification, onIpc, IpcFocusChangedParams,
	IpcReadyCommand, IpcUpdateConfigCommand, IpcEnabledChangedMsg, IpcShowMessageCommand
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


export abstract class TeWebviewBase<State, SerializedState> extends TeViewBase implements ITeWebview, Disposable
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
    protected onViewFocusChanged?(e: IpcFocusChangedParams): void;
	protected onVisibilityChanged?(visible: boolean): void;
	protected onWindowFocusChanged?(focused: boolean): void;
	protected registerCommands?(): Disposable[];

	protected override _view: WebviewView | WebviewPanel | undefined;
    protected declare viewId: WebviewIds | WebviewViewIds;

	protected _skippedChangeEvent = false;
	protected _ignoreTeBusy = false;
	protected _teEnabled: boolean;
	protected readonly fileName: string;

    private _ipcSequence: number;

	private readonly _cspNonce: string;
    private readonly _maxSmallIntegerV8 = Math.pow(2, 30);
	private readonly _onMessageReceived: EventEmitter<string>;
	// private readonly htmlCache: { [id in `taskexplorer.view.${WebviewViewIds|WebviewIds}`]?: string; } = {};


    constructor(wrapper: TeWrapper, title: string, fileName: string, viewId: WebviewIds | WebviewViewIds)
    {
        super(wrapper, title, viewId);
		this.fileName = fileName;
		this._ipcSequence = 0;
		this._view = undefined;
		this._cspNonce = getNonce();
		this._teEnabled = wrapper.utils.isTeEnabled();
		this._onMessageReceived = new EventEmitter<string>();
		this.disposables.push(
			wrapper.config.onDidChange(this.onConfigChanged, this)
		);
    }

	get onDidReceiveMessage(): Event<string> {
		return this._onMessageReceived.event;
	}

	get view(): WebviewView | WebviewPanel | undefined {
		return this._view;
	}


	protected async getHtml(webview: Webview, ...args: unknown[]): Promise<string>
	{
		const webRootUri = Uri.joinPath(this.wrapper.context.extensionUri, "res"),
			  changelogPath = Uri.joinPath(webRootUri, "page", this.fileName).fsPath,
			  content = await this.wrapper.fs.readFileAsync(changelogPath),
			  cspSource = webview.cspSource,
			  webRoot = this.getWebRoot();

		const [ bootstrap, head, body, endOfBody ] = await Promise.all(
		[
			this.includeBootstrap?.(...args),
			this.includeHead?.(...args),
			this.includeBody?.(...args),
			this.includeEndOfBody?.(...args),
		]);

		let html = content;
		html = await this.onHtmlPreviewBase(content, ...args);

		//
		// Replacement of main tags, i.e. #{head}, #{body}, etc
		//
		const repl = (h: string) =>
		{
			h = h.replace(/#{(head|body|endOfBody|cspSource|cspNonce|title|version|webroot|extensionName)}/g, (_s: string, token: string) =>
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
					case "extensionName":
						return this.wrapper.extensionTitle;
					case "version":
						return this.wrapper.version;
					default: // case "webroot":
						return webRoot;
				}
			});
			return h;
		};

		html = repl(html);

		//
		// Replacement of language strings defined in Constants, i.e. #{Strings.GetLicense}.
		// TODO - Strings to be processed with language processor in TeWrapper
		//
		let rgx: RegExpExecArray | null;
		const regex = /#{Strings\.([A-Za-z]+)}/g;
        while ((rgx = regex.exec(html)) !== null) { html = html.replace(rgx[0], Strings[rgx[1]]); }

		// this.htmlCache[this.id] = await this.onHtmlFinalizeBase(html, ...args);
		// return this.htmlCache[this.id] as string;
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


	protected getState(): BaseState
	{
		return {
			account: this.wrapper.licenseManager.account,
			isEnabled: this._teEnabled,
			isLicensed: this.wrapper.licenseManager.isLicensed,
			isRegistered: this.wrapper.licenseManager.isRegistered,
			isTrial: this.wrapper.licenseManager.isTrial,
			isTrialExtended: this.wrapper.licenseManager.isTrialExtended,
			nonce: this._cspNonce,
			webroot: this.getWebRoot()
		};
	}


	private getWebRoot(): string
	{
		const webRootUri = Uri.joinPath(this.wrapper.context.extensionUri, "res");
		return (this._view as WebviewView | WebviewPanel).webview.asWebviewUri(webRootUri).toString();
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


	protected onConfigChanged(e: ConfigurationChangeEvent): void
	{
		if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.EnableExplorerTree, this.wrapper.keys.Config.EnableSideBar))
		{
			const enabled = this.wrapper.utils.isTeEnabled();
			if (enabled !== this._teEnabled)
			{
				this._teEnabled = enabled;
				void this.postMessage(IpcEnabledChangedMsg, { enabled });
			}
		}
	}


	protected onHtmlPreview = async(html: string, ..._args: unknown[]): Promise<string> => html;


	protected onHtmlFinalize = async(html: string, ..._args: unknown[]): Promise<string> => html;


	protected onHtmlPreviewBase = async(html: string, ...args: unknown[]): Promise<string> => this.onHtmlPreview(html, ...args);


	protected onHtmlFinalizeBase = async(html: string, ...args: unknown[]): Promise<string> => this.onHtmlFinalize(html, ...args);


	protected onMessageReceivedBase(e: IIpcMessage): void
	{
		switch (e.method)
		{
			case IpcReadyCommand.method:
				onIpc(IpcReadyCommand, e, () => this.setReady());
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

			case IpcShowMessageCommand.method:
				onIpc(IpcShowMessageCommand, e, params => window.showInformationMessage(params.message, { detail: params.detail, modal: !!params.modal }));
				break;

			// case IpcLogWriteCommand.method:
			// 	onIpc(IpcLogWriteCommand, e, params => void this.wrapper.log.write("[WEBVIEW]: " + params.message, 1));
			// 	break;

			default:
				this.onMessageReceived?.(e);
				break;
		}

		this._onMessageReceived.fire(e.method);
	}


	postMessage = <T extends IpcNotification<any>>(type: T, params: IpcMessageParams<T>, completionId?: string): Promise<boolean> =>
	{
		const message = { id: this.nextIpcId(), method: type.method, params, completionId };
		if (!this._view || !this._isReady || !this.visible) {
			return Promise.resolve(false);
		}
		this._skippedChangeEvent = false;
		return Promise.race<boolean>(
		[
			this._view.webview.postMessage(message),
			new Promise<boolean>(resolve => setTimeout(resolve, 5000, false)),
		]);
	};


	protected async refresh(force: boolean, visibilityChanged: boolean, ...args: unknown[]): Promise<void>
    {
		if (!this._view || (!force && !visibilityChanged && (!this._isReady || !this.visible))) {
			this._skippedChangeEvent = !!this._view && this._isReady && !this.visible;
			return;
		}
		this.wrapper.log.methodStart(`${this.id}:refresh`, 2);
		const skippedChangeEvent = this._skippedChangeEvent;
		this._isReady = this._skippedChangeEvent = false;
		if (visibilityChanged && !skippedChangeEvent)
		{
			this.setReady();
		}
		else
		{
			const html = await this.getHtml(this._view.webview, ...args);
			// const html = !skippedChangeEvent && this.htmlCache[this.id] ? this.htmlCache[this.id] as string :
			// 															  await this.getHtml(this._view.webview, ...args);
			if (force && this._view.webview.html) {
				this._view.webview.html = "";
			}
			if (this._view.webview.html === html)
			{
				this.setReady();
			}
			else {
				this._view.webview.html = html;
			}
		}
		this.wrapper.log.methodDone(`${this.id}:refresh`, 2);
	}

}
