export default {};

// import { TeViewBase } from "./viewBase";
// import { TeWrapper } from "../lib/wrapper";
// import { TeTreeItem } from "./treeItem";
// import { executeCommand } from "../lib/command/command";
// import { ITreeview, TreeviewContextKey, TreeviewIds, TreeviewUsageKey } from "../interface";
// import {
//     Disposable, Event, EventEmitter, TreeDataProvider, TreeItem, TreeView, TreeViewExpansionEvent, window,
//     TreeViewSelectionChangeEvent, TreeViewVisibilityChangeEvent, ProviderResult, CancellationToken
// } from "vscode";
//
//
// /**
//  * @class TeTreeViewBase
//  * @since 2.0.0
//  */
// export abstract class TeTreeViewBase<T extends TeTreeItem = TeTreeItem> extends TeViewBase implements TreeDataProvider<T>, ITreeview
// {
//     readonly isTreeview = true;
//
//     abstract getChildren(element?: T): T[];
//     abstract getParent(element: T): ProviderResult<T>;
//     abstract getTreeItem(element: T): TeTreeItem;
//     abstract resolveTreeItem(item: TreeItem, element: T, token: CancellationToken): ProviderResult<T>;
//
// 	protected onVisibilityChanged?(visible: boolean): void;
// 	protected onInitializing?(): Disposable[] | undefined;
// 	protected onFocusChanged?(focused: boolean): void;
// 	protected override _view: TreeView<T>;
//     protected declare viewId: TreeviewIds;
//
//     private _visible = false;
// 	private _usageKey: TreeviewUsageKey;
// 	private _ctxPrefix: TreeviewContextKey;
//
//     private readonly _onTreeDataChange: EventEmitter<T | undefined | null | void>;
//
//
// 	constructor(wrapper: TeWrapper, title: string, description: string, viewId: TreeviewIds)
// 	{
//         super(wrapper, title, viewId);
//
// 		this._usageKey = `${wrapper.keys.Usage.TreeviewPrefix}${viewId}Tree`;
// 		this._ctxPrefix = `${wrapper.keys.Context.TreeviewPrefix}${viewId}`;
//         this._onTreeDataChange = new EventEmitter<T | undefined | null | void>();
//
//         this._view = window.createTreeView<T>(this.id, { treeDataProvider: this, showCollapseAll: true });
//         this._view.title = title;
//         this._view.description = description;
//
// 		this.disposables.push(
//             this._onTreeDataChange,
//             this._view.onDidChangeVisibility(this.onViewVisibilityChanged, this),
//             this._view.onDidCollapseElement(this.onElementCollapsed, this),
//             this._view.onDidExpandElement(this.onElementExpanded, this),
//             this._view.onDidChangeSelection(this.onElementSelectionChanged, this),
//             this._view
//         );
// 	}
//
//     get onDidChangeTreeData(): Event<T | undefined | null | void> {
//         return this._onTreeDataChange.event;
//     }
//
//     override get view(): TreeView<T> {
//         return this._view;
//     }
//
//     override get visible(): boolean {
//         return this._visible;
//     }
//
//
//     /* istanbul ignore next */
//     private onElementCollapsed = (e: TreeViewExpansionEvent<T>): void => e.element.refreshState("collapse");
//
//
//     private onElementExpanded = (e: TreeViewExpansionEvent<T>): void => e.element.refreshState("expand");
//
//
//     private onElementSelectionChanged = (e: TreeViewSelectionChangeEvent<T>): void => e.selection[0].refreshState();
//
//
// 	private setContextKeys = (active?: boolean): Promise<void> => this.wrapper.contextTe.setContext(`${this._ctxPrefix}:active`, !!active);
//
//
//     private onViewVisibilityChanged(e: TreeViewVisibilityChangeEvent): void
// 	{
//         this._visible = e.visible;
// 		if (this._visible)
// 		{
// 			this.refresh();
// 			this.setContextKeys(this._visible);
// 		}
// 		else {
// 			this.setContextKeys();
// 			this.onFocusChanged?.(false);
// 		}
// 		this.onVisibilityChanged?.(this._visible);
//         this._isReady = this._visible;
// 	}
//
//
// 	protected refresh(treeItem?: T | null | undefined): void
// 	{
// 		this._onTreeDataChange.fire(treeItem);
//         queueMicrotask(() => this.setReady());
// 	}
//
//
// 	async show(...args: any[]): Promise<ITreeview>
// 	{
// 		await this.wrapper.usage.track(`${this._usageKey}:shown`);
// 		await executeCommand(`${this.id}.focus`, ...args);
// 		await this.setContextKeys(true);
// 		return this;
// 	}
//
// }
//