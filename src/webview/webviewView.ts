
import log from "../lib/log/log";
import { TeWebviewBase } from "./base";
import { setContext } from "../lib/context";
import { ContextKeys } from "../lib/constants";
import { TeContainer } from "../lib/container";
import { TrackedUsageFeatures } from "../lib/watcher/usageWatcher";
import {
	CancellationToken, WebviewView, WebviewViewProvider, WebviewViewResolveContext,
	WindowState, Disposable, window, commands
} from "vscode";


export type WebviewViewIds = "home" | "parsingReport";


export abstract class TeWebviewView<State, SerializedState = State> extends TeWebviewBase<State> implements WebviewViewProvider, Disposable
{
	protected readonly disposables: Disposable[] = [];
	private _disposableView: Disposable | undefined;
	protected override _view: WebviewView | undefined;


	constructor(
		container: TeContainer,
		title: string,
		fileName: string,
		public readonly id: `taskExplorer.views.${WebviewViewIds}`,
		private readonly contextKeyPrefix: `${ContextKeys.WebviewViewPrefix}${WebviewViewIds}`,
		private readonly trackingFeature: TrackedUsageFeatures)
	{
		super(container, title, fileName);
		this.disposables.push(window.registerWebviewViewProvider(id, this));
	}


	dispose()
	{
		this.disposables.forEach(d => void d.dispose());
		this._disposableView?.dispose();
	}


	get description(): string | undefined
	{
		return this._view?.description;
	}


	set description(description: string | undefined)
	{
		if (!this._view) return;
		this._view.description = description;
	}


	async show(options?: { preserveFocus?: boolean })
	{
		void this.container.usage.track(`${this.trackingFeature}:shown`);
		try {
			void (await commands.executeCommand(`${this.id}.focus`, options));
		}
		catch (ex) {
			log.error(ex);
		}
	}


	async resolveWebviewView(webviewView: WebviewView, _context: WebviewViewResolveContext, _token: CancellationToken): Promise<void>
	{
		this._view = webviewView;

		webviewView.webview.options = {
			enableCommandUris: true,
			enableScripts: true,
		};

		webviewView.title = this.title;

		this._disposableView = Disposable.from(
			this._view.onDidDispose(this.onViewDisposed, this),
			this._view.onDidChangeVisibility(() => this.onViewVisibilityChanged(this.visible), this),
			this._view.webview.onDidReceiveMessage(this.onMessageReceivedCore, this),
			window.onDidChangeWindowState(this.onWindowStateChanged, this),
			...(this.onInitializing?.() ?? []),
			...(this.registerCommands?.() ?? []),
		);

		await this.refresh();
		this.onVisibilityChanged?.(true);
	}


	private resetContextKeys()
	{
		void setContext(`${this.contextKeyPrefix}:inputFocus`, false);
		void setContext(`${this.contextKeyPrefix}:focus`, false);
	}


	private setContextKeys(focus: boolean, inputFocus: boolean)
	{
		void setContext(`${this.contextKeyPrefix}:focus`, focus);
		void setContext(`${this.contextKeyPrefix}:inputFocus`, inputFocus);
	}


	private onViewDisposed()
	{
		this.resetContextKeys();
		this.onFocusChanged?.(false);
		this.onVisibilityChanged?.(false);
		this.isReady = false;
		this._disposableView?.dispose();
		this._disposableView = undefined;
		this._view = undefined;
	}


	protected onViewFocusChanged(e: any): void
	{
		this.setContextKeys(e.focused, e.inputFocused);
		this.onFocusChanged?.(e.focused);
	}


	private async onViewVisibilityChanged(visible: boolean)
	{
		if (visible)
		{
			await this.refresh();
		}
		else {
			this.onFocusChanged?.(false);
		}
		this.onVisibilityChanged?.(visible);
	}


	private onWindowStateChanged(e: WindowState)
	{
		if (this.visible) {
			this.onWindowFocusChanged?.(e.focused);
		}
	}

}