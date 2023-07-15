
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";

export abstract class TaskTreeNode extends TreeItem
{
    declare id: string;
    declare label: string;
    declare resourceUri: Uri;

    private _stamp: number;

    constructor(label: string, stamp: number, state: TreeItemCollapsibleState)
    {
        super(label, state);
        this._stamp = stamp;
    }

    get stamp() { return this._stamp; }
    set stamp(v) { this._stamp = v; }
}
