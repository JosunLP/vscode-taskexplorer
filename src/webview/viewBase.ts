// export default {};

import { TeWrapper } from "../lib/wrapper";
import { TeTreeItem } from "./treeItem";
import { Disposable, Event, EventEmitter, TreeView, WebviewPanel, WebviewView } from "vscode";
import { TreeviewId, TreeviewIds, WebviewId, WebviewIds, WebviewPrefix, WebviewViewIds } from "../interface";


/**
 * @class TeViewBase
 * @since 3.0.0
 *
 * Abstract extension class for WebviewBase and TreeviewBase
 */
export abstract class TeViewBase implements Disposable
{
	readonly isView = true;

	protected _isReady = false;
	protected _view: TreeView<TeTreeItem> | WebviewView | WebviewPanel | undefined;

    protected readonly id: WebviewId | TreeviewId;
	protected readonly disposables: Disposable[];
	protected readonly _onReadyReceived: EventEmitter<void>;
    protected readonly viewId: TreeviewIds | WebviewIds | WebviewViewIds;

	private _title: string;
	private readonly _originalTitle: string;


    constructor(protected readonly wrapper: TeWrapper, title: string, viewId: TreeviewIds | WebviewIds | WebviewViewIds)
    {
        this.viewId = viewId;
        this.id = `${WebviewPrefix.View}${viewId}`;
		this._title = title;
		this._originalTitle = title;
		this._onReadyReceived = new EventEmitter<void>();
		this.disposables = [
			this._onReadyReceived
		];
    }

	dispose()
	{
		this.disposables.splice(0).forEach(d => void d.dispose());
	}

	get isBusy(): boolean {
		return !!this._view && this.visible && !this._isReady;
	}

	get onDidReceiveReady(): Event<void> {
		return this._onReadyReceived.event;
	}

	get title(): string {
		return this._view?.title ?? this._title;
	}

	set title(title: string)
	{
		this._title = title;
		if (this._view) {
			this._view.title = title;
		}
	}

	get originalTitle(): string {
		return this._originalTitle;
	}

	// get view(): TreeView<TeTreeItem> | WebviewView | WebviewPanel | undefined {
	// 	return this._view;
	// }

	get visible(): boolean {
		return this._view?.visible ?? false;
	}


	protected setReady = () => { this._isReady = true; this._onReadyReceived.fire(); };

}
