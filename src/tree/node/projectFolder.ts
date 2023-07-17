
import { TaskFolder } from "./folder";
import { TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";

export abstract class ProjectTaskFolder extends TaskFolder
{
    private readonly _wsFolderUri: Uri;
    declare readonly workspaceFolder: WorkspaceFolder;

    constructor(folder: WorkspaceFolder, state: TreeItemCollapsibleState)
    {
        super(folder, state, false);
        this._wsFolderUri = folder.uri;
    }

    override get uri() { return this._wsFolderUri; };
}
