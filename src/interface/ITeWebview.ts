/* eslint-disable @typescript-eslint/naming-convention */

import { Event, WebviewPanel, WebviewPanelSerializer, WebviewView } from "vscode";

export type WebviewViewIds = "home" | "taskCount" | "taskUsage";
export type TreeviewIds = "taskTreeExplorer" | "taskTreeSideBar";
export type WebviewIds = "parsingReport" | "licensePage" | "releaseNotes" | "taskDetails" | "taskMonitor" | "welcome";

export const enum WebviewPrefix
{
	Base = "taskexplorer.",
	View = "taskexplorer.view."
}

export interface ITeWebview
{
    busy: boolean;
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
