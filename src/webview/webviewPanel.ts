
/**
 * @class TeWebviewPanel
 *
 * @since 3.0.0
 *
 * Credits to the author of the Gitlens vscode extension for the webview / webpanel encapsulation
 * concepts that got my super-praise (4th time ever) and thus used in Task Explorer as a starting point.
 */

import { TeWrapper } from "../lib/wrapper";
import { TeWebviewBase } from "./webviewBase";
import { ContextKeys, WebviewIds } from "../lib/context";
import { Commands, registerCommand } from "../lib/command/command";
import {
    WebviewOptions, WebviewPanel, WebviewPanelOnDidChangeViewStateEvent, WebviewPanelOptions, WindowState,
    Disposable, Uri, ViewColumn, window, WebviewPanelSerializer
} from "vscode";


export abstract class TeWebviewPanel<State> extends TeWebviewBase<State, State> implements Disposable
{
	private _isMultiInstance: boolean;
	private _disposablePanel: Disposable | undefined;
	protected override _view: WebviewPanel | undefined = undefined;


	constructor(wrapper: TeWrapper,
		fileName: string,
		title: string,
		private readonly iconPath: string,
		id: `taskexplorer.view.${WebviewIds}`,
		private readonly contextKeyPrefix: `${ContextKeys.WebviewPrefix}${WebviewIds}`,
		private readonly trackingFeature: string,
		showCommand?: Commands)
	{
		super(wrapper, id, title, fileName);
		this._isMultiInstance = !showCommand;
		if (showCommand){
			this.disposables.push(
				registerCommand(showCommand, this.onShowCommand, this),
				window.registerWebviewPanelSerializer(id, this._serializer)
			);
		}
	}

	override dispose()
	{
		this._disposablePanel?.dispose();
		super.dispose();
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


	get serializer() {
		return this._serializer;
	}


	protected override includeBootstrap = () => this.getState();


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


	private onPanelDisposed()
    {
		if (this._isMultiInstance) {
			this.dispose();
		}
		else {
			this.resetContextKeys();
			this.onActiveChanged?.(false);
			this.onFocusChanged?.(false);
			this.onVisibilityChanged?.(false);
			this._isReady = false;
			this._disposablePanel?.dispose();
			this._disposablePanel = undefined;
			this._view = undefined;
			this._skippedChangeEvent = false;
		}
	}


	protected onShowCommand = (...args: unknown[]) => this.show(undefined, ...args);


	// protected override onViewFocusChanged(e: IpcWvFocusChangedParams)
	// {
	// 	this.setContextKeys(undefined, e.focused, e.inputFocused);
	// 	this.onFocusChanged?.(e.focused);
	// }


	protected async onViewStateChanged(e: WebviewPanelOnDidChangeViewStateEvent)
	{
		const { active, visible } = e.webviewPanel;
		if (visible)
		{
			await this.refresh(false, true);
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


	/* istanbul ignore next */
	private onWindowStateChanged(e: WindowState)
	{
		if (this.visible) {
			this.onWindowFocusChanged?.(e.focused);
		}
	}


	async show(options?: { column?: ViewColumn; preserveFocus?: boolean }, ...args: any[])
	{
		await this.wrapper.usage.track(`${this.trackingFeature}:shown`);

		const column = options?.column ?? ViewColumn.One;
		if (!this._view)
		{
			if (args.length === 2 && this.wrapper.typeUtils.isObject(args[0]) && args[0].webview)
			{
				this._view = args[0] as WebviewPanel;
				// State = args[1],.... Not using VSCode provided state... yet...
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
				this._view.onDidDispose(this.onPanelDisposed, this),
				this._view.onDidChangeViewState(this.onViewStateChanged, this),
				this._view.webview.onDidReceiveMessage(this.onMessageReceivedBase, this),
				...(this.onInitializing?.() ?? []),
				...(this.registerCommands?.() ?? []),
				window.onDidChangeWindowState(this.onWindowStateChanged, this),
				this._view
			);

			await this.refresh(true, false, ...args);
		}
		else {
			await this.refresh(true, false, ...args);
			this._view.reveal(this._view.viewColumn, !!options?.preserveFocus);
		}

		return this;
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


	private _serializer: WebviewPanelSerializer =
	{
		deserializeWebviewPanel: async(webviewPanel: WebviewPanel, state: State) =>
		{
			/* istanbul ignore if */
			if (!this._ignoreTeBusy && this.wrapper.busy)
			{
				this.wrapper.promiseUtils.oneTimeEvent(this.wrapper.onDidBusyComplete)(() =>
				{
					void this.show(undefined, webviewPanel, state);
				}, this);
			}
			else {
				void this.show(undefined, webviewPanel, state);
			}
		}
	};

}
