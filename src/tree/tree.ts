
import { TaskFile } from "./node/file";
import { TaskItem } from "./node/item";
import { TaskFolder } from "./node/folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./manager";
import { ITeTaskTree, TreeviewIds } from "../interface";
import { Event, EventEmitter, Task, TreeItem, TreeDataProvider, Disposable } from "vscode";

interface ITaskTreeEvent
{
    id: string;
    treeItem: TreeItem | null;
}

/**
 * @class TaskTree
 *
 * Implements the VSCode TreeDataProvider API to build a tree of tasks to display within a view.
 *
 * The typical chain of events are:
 *
 *     1. A task starts and the TaskWatcher reacts too the event.  Or, the 'refresh' command was
 *        received i.e. the refresh button was clicked on the tree ui.
 *
 *     2. The refresh() method is called
 *
 *     3. The refresh() method invalidates task caches as needed, then calls 'fireTreeRefreshEvent'
 *        to fire the change event in VSCode.
 *
 *     4. The 'fireTreeRefreshEvent' fires the tree data event to VSCode if the UI/view is visible.
 *        If not visible, the event is queued in 'eventQueue'.  The queue is processed when a
 *       'visibility' event is processed in 'onVisibilityChanged', and is processed until empty
 *        in the 'processEventQueue' function.
 *
 *     5. When a tree data change event is fired, VSCode engine will call 'getTreeChildren' to
 *        refresh the tree ui, with the TreeItem that needs to be provided (or undefined/null if
 *        asking to provide the entire tree).
 */
export class TaskTree implements TreeDataProvider<TreeItem>, ITeTaskTree, Disposable
{
    private _visible = false;
    private _wasVisible = false;
    private _currentRefreshEvent: ITaskTreeEvent | undefined;

    private readonly _disposables: Disposable[];
    private readonly _eventQueue: ITaskTreeEvent[];
    private readonly _treeManager: TaskTreeManager;
    private readonly _onDidLoadTreeData: EventEmitter<void>;
    private readonly _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void>;


    constructor(private readonly wrapper: TeWrapper, public readonly name: TreeviewIds, treeManager: TaskTreeManager)
    {
        this._eventQueue = [];
        this._treeManager = treeManager;
        this._onDidLoadTreeData = new EventEmitter<void>();
        this._onDidChangeTreeData = new EventEmitter<TreeItem | undefined | null | void>();
        this._disposables = [
            this._onDidLoadTreeData ,
            this._onDidChangeTreeData
        ];
    }

	dispose = () => this._disposables.forEach(d => d.dispose());


    get onDidChangeTreeData(): Event<TreeItem | undefined | null | void> { return this._onDidChangeTreeData.event; }
    get onDidLoadTreeData(): Event<void> { return this._onDidLoadTreeData.event; }


    fireTreeRefreshEvent = (treeItem: TreeItem | null, logPad: string, fromQueue?: boolean) =>
    {
        const w = this.wrapper,
              id = "refresh-" + (treeItem ? treeItem.id : "g");

        logPad = !fromQueue ? logPad : w.log.control.lastLogPad;
        w.log.methodStart("fire tree refresh event", 1, logPad, false, [
            [ "tree", this.name ], [ "is global refresh", !treeItem ], [ "item id", id ], [ "from queue", !!fromQueue ],
            [ "is visible", this._visible ], [ "was visible", this._wasVisible ]
        ]);
        //
        // Request tree refresh if the tree is currently visible.  If not visible, add the
        // treeItem to the event queue to be processed when the tree is next shown and becomes
        // visible.  Note that if the treeItem node has not yet been revealed, the event is
        // just ignored by the vsc engine, this is possible when tasks are started from a
        // special folder (e.g. Favorites), while the base task node is still collapsed
        // within the tree.
        //
        if (this._visible)
        {
            w.log.write("   fire tree refresh event", 1, logPad);
            this._onDidChangeTreeData.fire(treeItem);
        }
        else if (this._wasVisible)
        {
            if ((!this._currentRefreshEvent || id !== this._currentRefreshEvent.id) && !this._eventQueue.find(e => e.id === id))
            {
                if (!treeItem) {// If this is a global refresh, remove all other refresh events
                    this._eventQueue.splice(0);
                }
                this._eventQueue.push({ id, treeItem });
                w.log.write("   refresh event has been queued", 1, logPad);
            }
            else {
                w.log.write("   a refresh event for this item is already running or queued, skip", 1, logPad);
            }
        }
        else {
            w.log.write("   a refresh event will be skipped as the view has not yet been shown", 1, logPad);
        }
        w.log.methodDone("fire tree refresh event", 1, logPad);
    };


    getChildren = (element?: TreeItem): TreeItem[] =>
    {
        this.logGetChildren(element);
        return TaskFolder.is(element) || TaskFile.is(element) ? element.treeNodes : this._treeManager.taskFolders;
    };


    getParent(element: TreeItem): TaskFile | TaskFolder |null
    {
        if (TaskItem.is(element))
        {
            return !element.folder.isSpecial ? element.taskFile : element.folder;
        }
        else if (TaskFile.is(element))
        {
            return element.folder;
        }
        return null;
    }


    getTreeItem = (element: TaskItem | TaskFile | TaskFolder) =>
    {
        if (TaskItem.is(element)) { element.refreshState(); }
        return element;
    };


    private logGetChildren = (element: TreeItem | undefined) =>
    {
        const w = this.wrapper,
              logPad = w.log.control.lastLogPad,
              tasks = this._treeManager.tasks;
        w.log.write2("tree", "get tree children", 1, logPad, [
            [ "task folder", element?.label ], [ "all tasks need to be retrieved", !tasks ],
            [ "needs rebuild", !this._treeManager.taskFolders ], [ "instance name", this.name ]
        ]);
        if (element instanceof TaskFile)
        {
            w.log.values(2, logPad + "   ", [
                [ "tree item type", "task file" ], [ "label", element.label ], [ "id", element.id ],
                [ "description", element.description ], [ "file name", element.fileName ], [ "is user", element.isUser ],
                [ "resource path", element.uri?./* istanbul ignore next */fsPath ]
            ]);
        }
        else if (element instanceof TaskFolder)
        {
            w.log.values(2, logPad + "   ", [
                [ "tree item type", "task folder" ], [ "label", element.label ], [ "id", element.id ],
                [ "description", element.description ], [ "resource path", element.uri?./* istanbul ignore next */fsPath ]
            ]);
        }
        else
        {
            w.log.value("tree item type", "asking for all (null)", 2, logPad + "   ");
        }
    };


    onVisibilityChanged = (visible: boolean, dataChanged: boolean) =>
    {
        const w = this.wrapper;
        w.log.methodStart("visibility event received", 1, "", true, [[ "tree", this.name ], [ "is visible", visible ], [ "data changed", dataChanged ]]);
        this._visible = visible;
        if (dataChanged && this._visible)
        {
            if (this._wasVisible)
            {
                this.wrapper.log.write2("tree", "process event queue", 1, "   ", [[ "# of queued events", this._eventQueue.length ]]);
                //
                // Process all queued events / refresh requests.  Note that if the treeItem node has
                // not yet been revealed, the event is just ignored by the vsc engine, this is possible
                // when tasks are started from a special folder (e.g. Favorites), while the base task
                // node is still collapsed within the tree.
                //
                this._eventQueue.splice(0).forEach(e => this._onDidChangeTreeData.fire(e.treeItem));
            }
            else {
                this.wrapper.log.write2("tree", "fire full refresh event", 1, "   ");
                this._onDidChangeTreeData.fire();
            }
        }
        this._wasVisible = true;
        w.log.methodDone("visibility event received", 1);
    };

}
