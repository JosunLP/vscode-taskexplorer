
import { TaskTree } from "./tree";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./manager";
import { ITaskTreeView, TreeviewContextKey, TreeviewIds, TreeviewUsageKey, WebviewPrefix } from "../interface";
import {
    Disposable, TreeItem, TreeView, TreeViewExpansionEvent, TreeViewSelectionChangeEvent,
    TreeViewVisibilityChangeEvent, window
} from "vscode";



export class TeTreeView implements ITaskTreeView, Disposable
{
    protected id: string;
    private _visible = false;
	private readonly _disposables: Disposable[];
	private readonly _tree: TaskTree;
    private readonly _view: TreeView<TreeItem>;
	private _usageKey: TreeviewUsageKey;
	private _contextKeyPrefix: TreeviewContextKey;


	constructor(private readonly wrapper: TeWrapper, treeManager: TaskTreeManager, title: string, description: string, viewId: TreeviewIds)
	{

        this.id = `${WebviewPrefix.View}${viewId}`;
        this._tree = new TaskTree(wrapper, viewId, treeManager);
        this._view = window.createTreeView(this.id, { treeDataProvider: this._tree, showCollapseAll: true });
        this._view.title = title;
        this._view.description = description;
		this._usageKey = `${wrapper.keys.Usage.TreeviewPrefix}${viewId}View`;
		this._contextKeyPrefix = `${wrapper.keys.Context.TreeviewPrefix}${viewId}`;
		this._disposables = [
            this._view.onDidChangeVisibility(this.onVisibilityChanged, this),
            // this._view.onDidCollapseElement(this.onElementCollapsed, this),
            this._view.onDidExpandElement(this.onElementExpanded, this),
            this._view.onDidChangeSelection(this.onElementSelectionChanged, this),
            this._tree,
            this._view
        ];
	}

	dispose = () => this._disposables.splice(0).forEach((d) => d.dispose());


    get tree(): TaskTree { return this._tree; }
    get view(): TreeView<TreeItem> { return this._view; }
    get enabled(): boolean {
        return this.wrapper.config.get<boolean>(this.id === `${WebviewPrefix.View}taskTreeExplorer` ? "enableExplorerView" : "enableSideBar", false);
    }
    get visible(): boolean { return this._visible; }

    // onElementCollapsed = (e: TreeViewExpansionEvent<TreeItem>) =>
    //     this.wrapper.log.methodOnce("tree view", "element collapsed", 2, "", [[ "label", e.element.label ], [ "id", e.element.id ]]);


    onElementExpanded = (e: TreeViewExpansionEvent<TreeItem>) => {
        this.wrapper.log.methodEvent("tree view", "element expanded", 5, [[ "label", e.element.label ], [ "id", e.element.id ]]);
    };


    onElementSelectionChanged = (e: TreeViewSelectionChangeEvent<TreeItem>) => {
        this.wrapper.log.methodEvent("tree view", "selection changed", 5, [[ "selections", e.selection.map(i => i.label).join(", ") ]]);
    };


    onVisibilityChanged(e: TreeViewVisibilityChangeEvent)
    {
        this._visible = e.visible;
        if (this._visible)
		{
			this.setContextKeys(this._visible);
		}
		else {
			this.resetContextKeys();
		}
        this._tree.onVisibilityChanged(e.visible, true);
        this.wrapper.usage.track(`${this.id}:shown`);
    }


	private resetContextKeys()
	{
		void this.wrapper.contextTe.setContext(`${this._contextKeyPrefix}:active`, false);
	}


	private setContextKeys(active: boolean | undefined)
	{
        void this.wrapper.contextTe.setContext(`${this._contextKeyPrefix}:active`, !!active);
	}

}
