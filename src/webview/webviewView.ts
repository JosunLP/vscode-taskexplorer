
/**
 * @class TeWebviewView
 *
 * @since 3.0.0
 *
 * Credits to the author of the Gitlens vscode extension for the webview / webpanel encapsulation
 * concepts that got my super-praise (4th time ever) and thus used in Task Explorer as a starting point.
 */

import { TeWrapper } from "../lib/wrapper";
import { TeWebviewBase } from "./webviewBase";
import { executeCommand } from "../lib/command/command";
import { ContextKeys, WebviewViewIds } from "../lib/context";
import {
	CancellationToken, WebviewView, WebviewViewProvider, WebviewViewResolveContext,
	WindowState, Disposable, window, commands, Uri
} from "vscode";


export abstract class TeWebviewView<State, SerializedState = State> extends TeWebviewBase<State, SerializedState> implements WebviewViewProvider, Disposable
{
	private _description: string | undefined;
	private _disposableView: Disposable | undefined;
	protected override _view: WebviewView | undefined = undefined;
	protected abstract override onInitializing(): Disposable[];


	constructor(
		wrapper: TeWrapper,
		title: string,
		description: string,
		fileName: string,
		public readonly id: `taskexplorer.view.${WebviewViewIds}`,
		private readonly contextKeyPrefix: `${ContextKeys.WebviewViewPrefix}${WebviewViewIds}`,
		private readonly trackingFeature: string)
	{
		super(wrapper, title, fileName);
		this.description = description;
		this.disposables.push(window.registerWebviewViewProvider(id, this));
	}


	override dispose()
	{
		this._disposableView?.dispose();
		super.dispose();
	}


	get description(): string | undefined {
		return this._description;
	}

	set description(description: string | undefined)
	{
		this._description = description;
		if (this._view) {
			this._view.description = description;
		}
	}


	protected override includeBootstrap?(): SerializedState | Promise<SerializedState>;


	private onViewDisposed()
	{
		this.resetContextKeys();
		this.onFocusChanged?.(false);
		this.onVisibilityChanged?.(false);
		this._isReady = false;
		this._disposableView?.dispose();
		this._disposableView = undefined;
		this._view = undefined;
		this._skippedChangeEvent = false;
	}


	// protected onViewFocusChanged(e: IpcFocusChangedParams): void
	// {
	// 	this.setContextKeys(e.focused, e.inputFocused);
	// 	this.onFocusChanged?.(e.focused);
	// }


	private async onViewVisibilityChanged(visible: boolean)
	{
		if (visible)
		{
			await this.refresh(false, true);
		}
		else {
			this.onFocusChanged?.(false);
		}
		this.onVisibilityChanged?.(visible);
	}


	/* istanbul ignore next */
	private onWindowStateChanged(e: WindowState)
	{
		if (this.visible) {
			this.onWindowFocusChanged?.(e.focused);
		}
	}


	private resetContextKeys()
	{
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:inputFocus`, false);
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:focus`, false);
	}


	async resolveWebviewView(webviewView: WebviewView, _context: WebviewViewResolveContext, _token: CancellationToken): Promise<void>
	{
		this._view = webviewView;

		webviewView.webview.options = {
			enableCommandUris: true,
			enableScripts: true,
			localResourceRoots: [ Uri.joinPath(this.wrapper.context.extensionUri, "res") ]
		};

		webviewView.title = this.title;
		webviewView.description = this._description;

		this._disposableView = Disposable.from(
			this._view.onDidDispose(this.onViewDisposed, this),
			this._view.onDidChangeVisibility(() => this.onViewVisibilityChanged(this.visible), this),
			this._view.webview.onDidReceiveMessage(this.onMessageReceivedBase, this),
			window.onDidChangeWindowState(this.onWindowStateChanged, this),
			...this.onInitializing(),
			...(this.registerCommands?.() ?? [])
		);

		await this.refresh(true, false);
		this.onVisibilityChanged?.(true);
	}


	private setContextKeys(focus: boolean, inputFocus: boolean)
	{
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:focus`, focus);
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:inputFocus`, inputFocus);
	}


	async show(options?: { preserveFocus?: boolean })
	{
		await this.wrapper.usage.track(`${this.trackingFeature}:shown`);
		await executeCommand(`${this.id}.focus`, options);
		this.setContextKeys(true, false);
		return this;
	}

}
