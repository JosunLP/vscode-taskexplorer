import { TreeItem, TreeView, Event } from "vscode";

export interface ITaskTreeEvent
{
    id: string;
    fn: any;
    args: any[];
    type: string;
    delay: number;
    scope: any;
}

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
    getName(): string;
    getParent(element: TreeItem): TreeItem | null;
    onDidLoadTreeData: Event<void>;
}
