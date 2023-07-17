
import { TaskItem } from "./item";
import { TaskFile } from "./file";
import { TaskTreeNode } from "./base";
import { encodeUtf8Hex } from ":env/hex";
import { isString } from "../../lib/utils/typeUtils";
import { ITaskFolder, MarkdownChars, OneOf } from "../../interface";
import { MarkdownString, ThemeIcon, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";


export class TaskFolder extends TaskTreeNode implements ITaskFolder
{
    readonly isSpecial: boolean;
    readonly treeNodes: (TaskFile|TaskItem)[];
    readonly workspaceFolder: WorkspaceFolder | undefined;

    private readonly _uri: Uri | undefined;


    constructor(folder: WorkspaceFolder | string, state: TreeItemCollapsibleState, isSpecial?: boolean)
    {
        super(isString(folder) ? folder : folder.name, state);
        this.treeNodes = [];
        this.id = encodeUtf8Hex(this.label);
        this.isSpecial = !!isSpecial;
        this.iconPath = ThemeIcon.Folder;
        this.treeNodes = [];
        if (!isString(folder))
        {
            this.workspaceFolder = folder;
            this._uri = folder.uri;
        }
        this.contextValue = "folder";
        this.tooltip = new MarkdownString(`Project ${MarkdownChars.Block}${this.label}${MarkdownChars.Block} tasks`);
    }


    get uri() { return this._uri; };


    addChild<T extends (TaskFile | TaskItem)>(node: T, idx?: number): OneOf<T, [ TaskFile, TaskItem ]>;
    addChild(node: TaskFile|TaskItem, idx = 0) { node.folder = this; this.treeNodes.splice(idx, 0, node); return node; }


    static is(item: any): item is TaskFolder { return item instanceof TaskFolder ; }

}
