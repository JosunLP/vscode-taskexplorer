import { TreeItem, TreeView, Event } from "vscode";

export interface ITaskTreeView
{
    view: TreeView<TreeItem>;
    tree: ITeTaskTree;
    readonly enabled: boolean;
    readonly visible: boolean;
}

export interface ITeTaskTree
{
    isVisible(): boolean;
    getChildren(element?: TreeItem): TreeItem[];
    getParent(element: TreeItem): TreeItem | null;
    onDidLoadTreeData: Event<void>;
}
