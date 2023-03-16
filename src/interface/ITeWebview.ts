import { Event, WebviewPanel, WebviewPanelSerializer, WebviewView } from "vscode";

export interface ITeWebview
{
    busy: boolean;
    description?: string;
    title: string;
    originalTitle?: string;
    onReadyReceived: Event<void>;
    serializer?: WebviewPanelSerializer;
    view: WebviewView | WebviewPanel | undefined;
    readonly visible: boolean;
    postMessage(type: any, params: any, completionId?: string): Promise<boolean>;
    show(options?: any, ...args: any[]): Promise<any>;
}
