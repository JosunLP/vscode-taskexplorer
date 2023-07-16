
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";

export abstract class TaskTreeNode extends TreeItem
{
    declare id: string;
    declare label: string;

    // private _stamp: number;

    constructor(label: string, state: TreeItemCollapsibleState)
    {
        super(label, state);
        // this._stamp = Date.now();
    }

    // get stamp() { return this._stamp; }
    // set stamp(v) { this._stamp = v; }
}
