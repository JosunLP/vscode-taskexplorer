
import { TaskFile } from "./node/file";
import { TaskItem } from "./node/item";
import { TaskFolder } from "./node/folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./manager";
import { ITaskTreeEvent, ITeTaskTree, TreeviewIds } from "../interface";
import { Event, EventEmitter, Task, TreeItem, TreeDataProvider, Disposable } from "vscode";


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
    private visible = false;
    private wasVisible = false;
    private currentRefreshEvent: string | undefined;
    private readonly _treeManager: TaskTreeManager;
    private readonly _disposables: Disposable[] = [];
    private readonly _eventQueue: ITaskTreeEvent[] = [];
    private readonly _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void>;
    private readonly _onDidLoadTreeData: EventEmitter<void>;


    constructor(private readonly wrapper: TeWrapper, public readonly name: TreeviewIds, treeManager: TaskTreeManager)
    {
        this._treeManager = treeManager;
        this._onDidLoadTreeData = new EventEmitter<void>();
        this._onDidChangeTreeData = new EventEmitter<TreeItem | undefined | null | void>();
        this._disposables.push(
            this._onDidLoadTreeData ,
            this._onDidChangeTreeData
        );
    }

	dispose = () => this._disposables.forEach(d => d.dispose());


    get onDidChangeTreeData(): Event<TreeItem | undefined | null | void> {
        return this._onDidChangeTreeData.event;
    }

    get onDidLoadTreeData(): Event<void> {
        return this._onDidLoadTreeData.event;
    }


    fireTreeRefreshEvent = (treeItem: TreeItem | null, logPad: string, fromQueue?: boolean) =>
    {
        const w = this.wrapper,
              id = "pendingFireTreeRefreshEvent-" + (treeItem ? treeItem.id : "g");
        logPad = !fromQueue ? logPad : w.log.control.lastLogPad;

        w.log.methodStart("fire tree refresh event", 1, logPad, false, [
            [ "tree", this.name ], [ "is global refresh", !treeItem ], [ "item id", id ], [ "from queue", !!fromQueue ],
            [ "is visible", this.visible ], [ "was visible", this.wasVisible ]
        ]);

        if (this.visible)
        {
            w.log.write("   fire tree refresh event", 1, logPad);
            this._onDidChangeTreeData.fire(treeItem);
        }
        else if (this.wasVisible)
        {
            if (id !== this.currentRefreshEvent && !this._eventQueue.find((e => e.type === "refresh" && e.id === id)))
            {
                if (!treeItem)
                {   //
                    // If this is a global refresh, remove all other refresh events from the q
                    //
                    this._eventQueue.splice(0);
                }
                this._eventQueue.push(
                {
                    id,
                    delay: 1,
                    fn: this.fireTreeRefreshEvent,
                    args: [ treeItem, logPad, true ],
                    scope: this,
                    type: "refresh"
                });
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


    /**
     * The main method VSCode TaskTreeProvider calls into
     *
     * @param element The tree item requested
     * @param logPad Log padding
     * @param logLevel Log level
     */
    getChildren = (element?: TreeItem): TreeItem[] =>
    {
        const w = this.wrapper,
              logPad = w.log.control.lastLogPad,
              tasks = this._treeManager.tasks;
        let items: TreeItem[] = this._treeManager.taskFolders;
        this.logGetChildrenStart(element, tasks, logPad, 1);
        if (TaskFolder.is(element) || TaskFile.is(element))
        {
            items = element.treeNodes;
        }
        this.processEventQueue(logPad + "   ");
        w.log.methodDone("get tree children", 1, logPad, [
            [ "# of tasks total", tasks.length ], [ "# of tree task items returned", items.length ]
        ]);
        return items;
    };


    getName = () => this.name;


    getParent(element: TreeItem): TaskFile | TaskFolder |null
    {
        const e = (<any>element);
        if (e.taskFile) // (element instanceof TaskItem)
        {
            return e.taskFile as TaskFile;
        }
        else if (e.folder) // (element instanceof TaskFile)
        {
            return e.folder as TaskFolder;
        }
        // if (TaskItem.is(element))
        // {
        //     return !element.folder.isSpecial ? element.taskFile : element.folder;
        // }
        // else if (TaskFile.is(element))
        // {
        //     return element.folder;
        // }
        return null;
    }


    getTreeItem = (element: TaskItem | TaskFile | TaskFolder) =>
    {
        const w = this.wrapper;
        w.log.methodStart("get tree item", 4, "", true, [[ "label", element.label ], [ "id", element.id ]]);
        if (element instanceof TaskItem)
        {
            w.log.write("   refresh task item state", 4);
            element.refreshState();
        }
        else {
            w.log.write("   get tree file/folder", 4);
        }
        w.log.methodDone("get tree item", 4);
        return element;
    };


    isVisible = () => this.visible;


    private logGetChildrenStart = (element: TreeItem | undefined, tasks: Task[], logPad: string, logLevel: number) =>
    {
        const w = this.wrapper;
        w.log.methodStart("get tree children", logLevel, logPad, false, [
            [ "task folder", element?.label ], [ "all tasks need to be retrieved", !tasks ],
            [ "needs rebuild", !this._treeManager.taskFolders ], [ "instance name", this.name ]
        ]);
        if (element instanceof TaskFile)
        {
            w.log.values(logLevel + 1, logPad + "   ", [
                [ "tree item type", "task file" ], [ "label", element.label ], [ "id", element.id ],
                [ "description", element.description ], [ "file name", element.fileName ], [ "is user", element.isUser ],
                [ "resource path", element.resourceUri?./* istanbul ignore next */fsPath ]
            ]);
        }
        else if (element instanceof TaskFolder)
        {
            w.log.values(logLevel + 1, logPad + "   ", [
                [ "tree item type", "task folder" ], [ "label", element.label ], [ "id", element.id ],
                [ "description", element.description ], [ "resource path", element.resourceUri?./* istanbul ignore next */fsPath ]
            ]);
        }
        else
        {
            w.log.value("tree item type", "asking for all (null)", logLevel + 1, logPad + "   ");
        }
    };


    onVisibilityChanged = (visible: boolean, dataChanged: boolean) =>
    {
        const w = this.wrapper;
        w.log.methodStart("visibility event received", 1, "", true, [[ "tree", this.name ], [ "is visible", visible ], [ "data changed", dataChanged ]]);
        this.visible = visible;
        if (dataChanged && this.visible)
        {
            if (this.wasVisible){
                this.processEventQueue("   ");
            }
            else {
                this._onDidChangeTreeData.fire();
            }
        }
        this.wasVisible = true;
        w.log.methodDone("visibility event received", 1);
        w.log.blank(1);
    };


    private processEventQueue = (logPad: string) =>
    {
        const w = this.wrapper;
        w.log.methodStart("process task explorer event queue", 1, logPad, true, [[ "# of queued events", this._eventQueue.length ]]);
        if (this._eventQueue.length > 0)
        {
            const next = this._eventQueue.shift() as ITaskTreeEvent; // get the next event
            w.log.write("   loaded next queued event", 2, logPad);
            w.log.value("      id", next.id, 1, logPad);
            w.log.value("      type", next.type, 1, logPad);
            w.log.write(`   firing queued event with ${next.args.length} args and ${next.delay}ms delay`, 2, logPad);
            w.log.value("   # of queued events remaining", this._eventQueue.length, 1, logPad);
            this.currentRefreshEvent = next.id;
            setTimeout((n) => n.fn.call(n.scope, ...n.args), next.delay, next);
        }
        else {
            this.currentRefreshEvent = undefined;
            this._onDidLoadTreeData.fire();
        }
        w.log.methodDone("process task explorer main event queue", 1, logPad);
    };

}
