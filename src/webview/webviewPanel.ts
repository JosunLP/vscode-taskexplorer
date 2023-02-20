
import { TeWrapper } from "../lib/wrapper";
import { ContextKeys } from "../lib/context";
import { TeWebviewBase } from "./webviewBase";
import { isObject, timeout } from "../lib/utils/utils";
import { Commands, registerCommand } from "../lib/command/command";
import {
    WebviewOptions, WebviewPanel, WebviewPanelOnDidChangeViewStateEvent, WebviewPanelOptions, WindowState,
    Disposable, Uri, ViewColumn, window, WebviewPanelSerializer
} from "vscode";
import { BaseState } from "./common/state";

export type WebviewIds = "parsingReport" | "licensePage" | "releaseNotes" | "taskMonitor";


export abstract class TeWebviewPanel<State> extends TeWebviewBase<State> implements Disposable
{
	private _disposablePanel: Disposable | undefined;
	protected override _view: WebviewPanel | undefined = undefined;


	constructor(wrapper: TeWrapper,
				fileName: string,
				title: string,
				private readonly iconPath: string,
				public readonly id: `taskexplorer.view.${WebviewIds}`,
				private readonly contextKeyPrefix: `${ContextKeys.WebviewPrefix}${WebviewIds}`,
				private readonly trackingFeature: string,
				showCommand: Commands)
	{
		super(wrapper, title, fileName);
		this.disposables.push(
			registerCommand(showCommand, this.onShowCommand, this),
			window.registerWebviewPanelSerializer(id, this._serializer)
		);
	}


	override dispose()
	{
		this._disposablePanel?.dispose();
		super.dispose();
	}


	private _serializer: WebviewPanelSerializer =
	{
		deserializeWebviewPanel: async(webviewPanel: WebviewPanel, state: State) =>
		{
			await this.show(undefined, webviewPanel, state);
		}
	};


	get serializer() {
		return this._serializer;
	}


	protected get options(): WebviewPanelOptions & WebviewOptions
	{
		return {
			retainContextWhenHidden: true,
			enableFindWidget: true,
			enableCommandUris: true,
			enableScripts: true,
			localResourceRoots: [ Uri.joinPath(this.wrapper.context.extensionUri, "res") ]
		};
	}


	async show(options?: { column?: ViewColumn; preserveFocus?: boolean }, ...args: any[])
	{
		while (this.wrapper.busy) {
			await timeout(100);
		}
		void this.wrapper.usage.track(`${this.trackingFeature}:shown`);

		const column = options?.column ?? ViewColumn.One; // ViewColumn.Beside;
		// Only try to open beside if there is an active tab
		// if (column === ViewColumn.Beside && !window.tabGroups.activeTabGroup.activeTab) {
		// 	column = ViewColumn.Active;
		// }

		if (!this._view)
		{
			if (args.length === 2 && isObject(args[0]) && args[0].webview)
			{
				this._view = args[0] as WebviewPanel;
				// State = args[1],.... still don't know wtf to do with 'State'.
				args.splice(0, 2);
			}
			else
			{
				this._view = window.createWebviewPanel(
					this.id,
					this.title,
					{
						viewColumn: column,
						preserveFocus: options?.preserveFocus ?? false
					},
					this.options
				);
			}

			this._view.iconPath = Uri.file(this.wrapper.context.asAbsolutePath(this.iconPath));
			this._disposablePanel = Disposable.from(
				this._view,
				this._view.onDidDispose(this.onPanelDisposed, this),
				this._view.onDidChangeViewState(this.onViewStateChanged, this),
				this._view.webview.onDidReceiveMessage(this.onMessageReceivedBase, this),
				...(this.onInitializing?.() ?? []),
				...(this.registerCommands?.() ?? []),
				window.onDidChangeWindowState(this.onWindowStateChanged, this),
			);

			await this.refresh(false, ...args);
		}
		else {
			await this.refresh(true, ...args);
			this._view.reveal(this._view.viewColumn, !!options?.preserveFocus);
		}

		return this;
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
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:active`, false);
	}


	private setContextKeys(active: boolean | undefined, focus?: boolean, inputFocus?: boolean)
	{
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:active`, !!active);
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:focus`, !!active && !!focus);
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:inputFocus`, !!active && !!inputFocus);
	}


	private onPanelDisposed()
    {
		this.resetContextKeys();
		this.onActiveChanged?.(false);
		this.onFocusChanged?.(false);
		this.onVisibilityChanged?.(false);
		this._isReady = false;
		this._disposablePanel?.dispose();
		this._disposablePanel = undefined;
		this._view = undefined;
	}


	protected onShowCommand(...args: unknown[])
    {
		return this.show(undefined, ...args);
	}


	// protected override onViewFocusChanged(e: WebviewFocusChangedParams)
	// {
	// 	this.setContextKeys(undefined, e.focused, e.inputFocused);
	// 	this.onFocusChanged?.(e.focused);
	// }


	protected onViewStateChanged(e: WebviewPanelOnDidChangeViewStateEvent)
	{
		const { active, visible } = e.webviewPanel;
		if (visible)
		{
			this.setContextKeys(active);
			this.onActiveChanged?.(active);
			this.onFocusChanged?.(active);
		}
		else {
			this.resetContextKeys();
			this.onActiveChanged?.(false);
			this.onFocusChanged?.(false);
		}
		this.onVisibilityChanged?.(visible);
	}


	protected override includeBootstrap = (): Promise<BaseState> => this.getState();


	protected override onHtmlPreviewBase = async(html: string, ...args: unknown[]) =>
	{
		return this.onHtmlPreview(html.replace(/\#\{title\}/g,
`<table><tr>
<td class="content-img">
	<img class="te-icon" src="#{webroot}/img/logo-bl.png" />
</td>
<td class="content-title"> &nbsp;#{title}</td>
</tr></table>`), ...args);
	};

}
