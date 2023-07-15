/* eslint-disable @typescript-eslint/naming-convention */

import { CancellationToken, Event, ProviderResult, TreeItem, TreeView, WebviewPanel, WebviewPanelSerializer, WebviewView } from "vscode";

export type TreeviewIds = "taskTreeExplorer" | "taskTreeSideBar";
export type WebviewViewIds = "home" | "taskCount" | "taskUsage";
export type WebviewIds = "parsingReport" | "licensePage" | "releaseNotes" | "taskDetails" | "taskMonitor" | "welcome";
export type WebviewId = `${WebviewPrefix.View}${WebviewViewIds|WebviewIds}`;
export type TreeviewId = `${WebviewPrefix.View}${TreeviewIds}`;

export const enum WebviewPrefix
{
	Base = "taskexplorer.",
	View = "taskexplorer.view."
}

export interface ITeWebview
{
    isBusy: boolean;
    description?: string;
    title: string;
    originalTitle?: string;
    onDidReceiveMessage: Event<string>;
    onDidReceiveReady: Event<void>;
    serializer?: WebviewPanelSerializer;
    view: WebviewView | WebviewPanel | undefined;
    readonly visible: boolean;
    postMessage(type: any, params: any, completionId?: string): Promise<boolean>;
    show(options?: any, ...args: any[]): Promise<any>;
}

export interface ITreeview
{
    readonly isTreeview: boolean;
    readonly isBusy: boolean;
    readonly title: string;
    readonly view: TreeView<TreeItem>;
    readonly visible: boolean;
    onDidReceiveReady: Event<void>;
    getChildren(element?: TreeItem): TreeItem[];
    getParent(element: TreeItem): ProviderResult<TreeItem>;
    getTreeItem(element: TreeItem): TreeItem;
    resolveTreeItem(item: TreeItem, element: TreeItem, token: CancellationToken): ProviderResult<TreeItem>;
    show(...args: any[]): PromiseLike<any>;
}
