
import { TaskTree } from "./tree";
import { TeWrapper } from "../lib/wrapper";
import { ITaskTreeView } from "../interface";
import { TaskTreeManager } from "./treeManager";
import { ContextKeys, TreeViewIds } from "../lib/context";
import {
    Disposable, TreeItem, TreeView, /* TreeViewExpansionEvent, TreeViewSelectionChangeEvent, */
    TreeViewVisibilityChangeEvent, window
} from "vscode";



export class TeTreeView implements ITaskTreeView, Disposable
{
    private _visible = false;
	private readonly disposables: Disposable[] = [];
	private readonly _tree: TaskTree;
    private readonly _view: TreeView<TreeItem>;


	constructor(
		private readonly wrapper: TeWrapper,
        treeManager: TaskTreeManager,
		title: string,
		description: string,
		private readonly id: TreeViewIds,
		private readonly contextKeyPrefix: `${ContextKeys.TreeViewPrefix}${TreeViewIds}`,
		private readonly trackingFeature: string)
	{
        this._tree = new TaskTree(id, treeManager);
        this._view = window.createTreeView("taskexplorer.view." + id, { treeDataProvider: this._tree, showCollapseAll: true });
        this._view.title = title;
        this._view.description = description;
		this.disposables.push(
            this._view,
            this._view.onDidChangeVisibility(this.onVisibilityChanged, this),
            // this._view.onDidCollapseElement(this.onElementCollapsed, this),
            // this._view.onDidExpandElement(this.onElementExpanded, this),
            // this._view.onDidChangeSelection(this.onElementSelectionChanged, this)
        );
		void this.wrapper.contextTe.setContext(`${ContextKeys.KeyPrefix}:isTreeView`, true);
	}


	dispose()
	{
		this.disposables.forEach((d) => {
            d.dispose();
        });
        this.disposables.splice(0);
	}


    get tree(): TaskTree {
        return this._tree;
    }

    get view(): TreeView<TreeItem> {
        return this._view;
    }

    get enabled(): boolean {
        return this.wrapper.config.get<boolean>(this.id === "taskTreeExplorer" ? "enableExplorerView" : "enableSideBar");
    }

    get visible(): boolean {
        return this._visible;
    }

    // onElementCollapsed(e: TreeViewExpansionEvent<TreeItem>)
    // {
    // }

    // onElementExpanded(e: TreeViewExpansionEvent<TreeItem>)
    // {
    // }

    // onElementSelectionChanged(e: TreeViewSelectionChangeEvent<TreeItem>)
    // {
    // }

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
    }


	private resetContextKeys()
	{
		void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:active`, false);
	}


	private setContextKeys(active: boolean | undefined)
	{
        void this.wrapper.contextTe.setContext(`${this.contextKeyPrefix}:active`, !!active);
	}

}
