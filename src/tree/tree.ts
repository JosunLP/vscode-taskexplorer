
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { log } from "../lib/log/log";
import { TaskFolder } from "./folder";
import { TreeViewIds } from "../lib/context";
import { TaskTreeManager } from "./treeManager";
import { ITaskTreeEvent, ITeTaskTree } from "../interface";
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


    constructor(public readonly name: TreeViewIds, treeManager: TaskTreeManager)
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
        const id = "pendingFireTreeRefreshEvent-" + (treeItem ? treeItem.id : "g");
        logPad = !fromQueue ? logPad : log.getLogPad();

        log.methodStart("fire tree refresh event", 1, logPad, false, [
            [ "tree", this.name ], [ "is global refresh", !treeItem ], [ "item id", id ], [ "from queue", !!fromQueue ],
            [ "is visible", this.visible ], [ "was visible", this.wasVisible ]
        ]);

        if (this.visible)
        {
            log.write("   fire tree refresh event", 1, logPad);
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
                log.write("   refresh event has been queued", 1, logPad);
            }
            else {
                log.write("   a refresh event for this item is already running or queued, skip", 1, logPad);
            }
        }
        else {
            log.write("   a refresh event will be skipped as the view has not yet been shown", 1, logPad);
        }
        log.methodDone("fire tree refresh event", 1, logPad);
    };


    /**
     * The main method VSCode TaskTreeProvider calls into
     *
     * @param element The tree item requested
     * @param logPad Log padding
     * @param logLevel Log level
     */
    getChildren = async(element?: TreeItem): Promise<TreeItem[]> =>
    {
        let items: TreeItem[] = [];
        const logPad = log.getLogPad(),
              tasks = this._treeManager.getTasks(),
              taskItemTree = this._treeManager.getTaskTree();

        this.logGetChildrenStart(element, tasks, logPad, 1);

        if (taskItemTree)
        {
            if (element instanceof TaskFolder)
            {
                log.write("   Return task folder (task files)", 1, logPad);
                items = element.taskFiles;
            }
            else if (element instanceof TaskFile)
            {
                log.write("   Return taskfile (tasks/scripts)", 1, logPad);
                items = element.treeNodes;
            }
            else
            {
                log.write("   Return full task tree", 1, logPad);
                items = taskItemTree;
            }
        }

        this.processEventQueue(logPad + "   ");

        log.methodDone("get tree children", 1, logPad, [
            [ "# of tasks total", tasks.length ], [ "# of tree task items returned", items.length ]
        ]);

        return items;
    };


    getName = () => this.name;


    getParent(element: TreeItem): TreeItem | null
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
        return null;
    }


    getTreeItem = (element: TaskItem | TaskFile | TaskFolder) =>
    {
        log.methodStart("get tree item", 4, "", true, [[ "label", element.label ], [ "id", element.id ]]);
        if (element instanceof TaskItem)
        {
            log.write("   refresh task item state", 4);
            element.refreshState("   ", 4);
        }
        else {
            log.write("   get tree file/folder", 4);
        }
        log.methodDone("get tree item", 4);
        return element;
    };


    isVisible = () => this.visible;


    private logGetChildrenStart = (element: TreeItem | undefined, tasks: Task[], logPad: string, logLevel: number) =>
    {
        log.methodStart("get tree children", logLevel, logPad, false, [
            [ "task folder", element?.label ], [ "all tasks need to be retrieved", !tasks ],
            [ "needs rebuild", !this._treeManager.getTaskTree() ], [ "instance name", this.name ]
        ]);

        if (element instanceof TaskFile)
        {
            log.values(logLevel + 1, logPad + "   ", [
                [ "tree item type", "task file" ], [ "label", element.label ], [ "id", element.id ],
                [ "description", element.description ], [ "file name", element.fileName ], [ "is user", element.isUser ],
                [ "resource path", element.resourceUri?./* istanbul ignore next */fsPath ]
            ]);
        }
        else if (element instanceof TaskFolder)
        {
            log.values(logLevel + 1, logPad + "   ", [
                [ "tree item type", "task folder" ], [ "label", element.label ], [ "id", element.id ],
                [ "description", element.description ], [ "resource path", element.resourceUri?./* istanbul ignore next */fsPath ]
            ]);
        }
        else
        {
            log.value("tree item type", "asking for all (null)", logLevel + 1, logPad + "   ");
        }
    };


    onVisibilityChanged = (visible: boolean, dataChanged: boolean) =>
    {
        log.methodStart("visibility event received", 1, "", true, [[ "tree", this.name ], [ "is visible", visible ], [ "data changed", dataChanged ]]);
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
        log.methodDone("visibility event received", 1);
        log.blank(1);
    };


    private processEventQueue = (logPad: string) =>
    {
        log.methodStart("process task explorer event queue", 1, logPad, true, [[ "# of queued events", this._eventQueue.length ]]);
        if (this._eventQueue.length > 0)
        {
            const next = this._eventQueue.shift() as ITaskTreeEvent; // get the next event
            log.write("   loaded next queued event", 2, logPad);
            log.value("      id", next.id, 1, logPad);
            log.value("      type", next.type, 1, logPad);
            log.write(`   firing queued event with ${next.args.length} args and ${next.delay}ms delay`, 2, logPad);
            log.value("   # of queued events remaining", this._eventQueue.length, 1, logPad);
            this.currentRefreshEvent = next.id;
            setTimeout((n) => n.fn.call(n.scope, ...n.args), next.delay, next);
        }
        else {
            this.currentRefreshEvent = undefined;
            this._onDidLoadTreeData.fire();
        }
        log.methodDone("process task explorer main event queue", 1, logPad);
    };

}
