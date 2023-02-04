
import { TreeDataProvider, TreeItem } from "vscode";

export default interface ITaskTree extends TreeDataProvider<TreeItem>
{
    getName(): string;
    isBusy(): boolean;
    isVisible(): boolean;
}