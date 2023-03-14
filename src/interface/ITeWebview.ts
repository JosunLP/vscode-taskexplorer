import { Event, WebviewPanel, WebviewPanelSerializer, WebviewView } from "vscode";

export interface ITeWebview
{
    description?: string;
    title: string;
    originalTitle?: string;
    onReadyReceived: Event<void>;
    serializer?: WebviewPanelSerializer;
    view: WebviewView | WebviewPanel | undefined;
    readonly visible: boolean;
    notify(type: any, params: any, completionId?: string): Promise<boolean>;
    show(options?: any, ...args: any[]): Promise<any>;
}
