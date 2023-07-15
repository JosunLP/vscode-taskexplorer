export class TeTreeItem {};
//
// import { ITeWrapper, TreeviewIds } from "../interface";
// import { TreeItem, TreeItemCollapsibleState, WorkspaceFolder, Uri, workspace } from "vscode";
//
// /**
//  * @class TeTreeItem
//  * @since 3.0.0
//  */
// export abstract class TeTreeItem extends TreeItem
// {
//     abstract override id: string;
//     protected abstract setIcon(isExpanded?: boolean): void;
//     protected abstract setTooltip(): void;
//
//     override label: string;
//     override resourceUri: Uri;
//
//     private readonly _viewId: TreeviewIds;
//     private readonly _wsFolder: WorkspaceFolder;
//     private readonly _parent: TeTreeItem | undefined;
//
//
//     constructor(protected readonly wrapper: ITeWrapper, viewId: TreeviewIds, label: string, fsPath: string, parent?: TeTreeItem, state?: TreeItemCollapsibleState)
//     {
//         super(label, state);
//         const uri = Uri.file(fsPath);
//         this.label = label;
//         this.resourceUri = uri;
//         this._viewId = viewId;
//         this._parent = parent;
//         this._wsFolder = (this._parent?.wsFolder || workspace.getWorkspaceFolder(uri)) as WorkspaceFolder;
//         this.refreshState();
//     }
//
//     get parentFolder(): TeTreeItem | undefined {
//         return this._parent;
//     }
//
//     get wsFolder(): WorkspaceFolder {
//         return this._wsFolder;
//     }
//
//
//     refreshState(stateChange?: "collapse" | "expand")
//     {
//         this.setIcon(stateChange === "expand");
//         this.setTooltip();
//         this.setContextKeys();
//     }
//
//
//     private setContextKeys(): void
//     {
//         const w = this.wrapper;
//         if (!this.collapsibleState) {
//             this.contextValue = `${w.keys.Context.TreeviewPrefix}${this._viewId}`;
//         }
//         else {
//             const state = w.utils.lowerCaseFirstChar(TreeItemCollapsibleState[this.collapsibleState], false);
//             this.contextValue = `${w.keys.Context.TreeviewPrefix}${this._viewId}:${state}`;
//         }
//     }
//
// }
//