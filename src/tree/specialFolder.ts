
import { TaskItem } from "./item";
import { log } from "../lib/log/log";
import { TaskFolder } from "./folder";
import { Strings } from "../lib/constants";
import { sortTasks } from "../lib/sortTasks";
import { storage } from "../lib/utils/storage";
import { TaskTreeManager } from "./treeManager";
import { configuration } from "../lib/utils/configuration";
import { isString, removeFromArray } from "../lib/utils/utils";
import { IDictionary, ITeTaskChangeEvent } from "../interface";
import {
    ConfigurationChangeEvent, Disposable, Event, EventEmitter, InputBoxOptions, ThemeIcon,
    TreeItem, TreeItemCollapsibleState, window, workspace
} from "vscode";


/**
 * @class SpecialTaskFolder
 *
 * A tree node that represents a special folder i.e. the `Favorites` or `Last Tasks` folder
 */
export abstract class SpecialTaskFolder extends TaskFolder implements Disposable
{
    protected abstract onTaskSave(taskItem: TaskItem, logPad: string): void;


    public treeManager: TaskTreeManager;
    public override taskFiles: TaskItem[];

    protected store: string[];
    protected readonly disposables: Disposable[];

    private enabled: boolean;
    private storeName: string;
    private isFavorites: boolean;
    private settingNameEnabled: string;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;


    constructor(treeManager: TaskTreeManager, label: string, state: TreeItemCollapsibleState)
    {
        super(label, state);
        this.taskFiles = [];
        this.disposables = [];
        this.treeManager = treeManager;
        this.iconPath = ThemeIcon.Folder;
        this.isFavorites = label === Strings.FAV_TASKS_LABEL;
        this.contextValue = label.toLowerCase().replace(/[\W \_\-]/g, "");
        this.storeName = this.isFavorites ? Strings.FAV_TASKS_STORE : Strings.LAST_TASKS_STORE;
        this.store = storage.get<string[]>(this.storeName, []);
        this.tooltip = `A tree folder to store '${label}' tasks`;
        this.settingNameEnabled = "specialFolders.show" + label.replace(/ /g, "");
        this.enabled = configuration.get<boolean>(this.settingNameEnabled);
        this._onDidTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this.disposables.push(
            this._onDidTasksChange,
            workspace.onDidChangeConfiguration(async e => { await this.processConfigChanges(e); }, this)
        );
    }


    dispose()
    {
        this.disposables.forEach((d) => {
            d.dispose();
        });
        this.disposables.splice(0);
        this.taskFiles = [];
    }


	get onDidTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTasksChange.event;
	}


    override async addTaskFile(taskItem: TaskItem, logPad?: string)
    {
        if (this.store.includes(taskItem.id))
        {
            log.methodStart(`add tree taskitem to ${this.label}`, 3, logPad);

            const taskItem2 = new TaskItem(taskItem.taskFile, taskItem.task, logPad + "   ");
            taskItem2.id = this.label + ":" + taskItem2.id; // note 'label:' + taskItem2.id === id
            taskItem2.label = this.getRenamedTaskName(taskItem2);
            taskItem2.folder = this;
            this.insertTaskFile(taskItem2, 0);
            this.sort(logPad + "   ");

            log.methodDone(`add tree taskitem to ${this.label}`, 3, logPad);
        }
    }


    async addRemoveRenamedLabel(taskItem: TaskItem)
    {
        const renames = storage.get<string[][]>(Strings.TASKS_RENAME_STORE, []),
              id = this.getTaskItemId(taskItem.id);

        log.methodStart("add/remove rename special", 1, "", false, [[ "id", id ], [ "current # of items in store", renames.length ]]);

        //
        // Removing an item?
        //
        const rmvIdx = renames.findIndex(r => r[0] === id);
        if (rmvIdx !== -1)
        {
            renames.splice(rmvIdx, 1);
            log.write("   removing item from 'rename' store", 1);
            log.value("      index", 3);
        }     //
        else // Adding an item...
        {   //
            const opts: InputBoxOptions = { prompt: "Enter favorites label" };
            const str = await window.showInputBox(opts);
            if (str !== undefined)
            {
                renames.push([ id, str ]);
                log.value("   adding item to 'rename' store", str, 1);
            }
            else {
                log.write("   user cancelled adding item to 'rename' store", 1);
            }
        }

        //
        // Persist to storage and refresh this tree node
        //
        await storage.update(Strings.TASKS_RENAME_STORE, renames);
        this.treeManager.fireTreeRefreshEvent("   ", 1, this);

        log.methodDone("add/remove rename special", 1, "", [[ "new # of items in store", renames.length ]]);
        return rmvIdx !== -1;
    }


    /**
     * @method build
     *
     * Create and add a special folder the the tree.  As of v2.0 these are the "Last Tasks" and
     * "Favorites" folders.
     *
     * @param treeIndex The tree index to insert the created folder at.
     * @param sort Whether or not to sort any existing items in the folder.
     * @param logPad Padding to prepend to log entries.  Should be a string of any # of space characters.
     */
    private build(logPad: string)
    {
        log.methodStart("create special tasks folder", 1, logPad, false, [[ "name", this.label ]]);

        const tree = this.treeManager.getTaskTree() as TreeItem[], // Guaranted not to be undefined - checked in .refresh
              showLastTasks = configuration.get<boolean>("specialFolders.showLastTasks"),
              favIdx = showLastTasks ? 1 : 0,
              treeIdx = !this.isFavorites ? 0 : favIdx;

        log.values(2, logPad + "   ", [[ "tree index", treeIdx ], [ "showLastTasks setting", showLastTasks ]]);

        if (tree[treeIdx].label === this.label) {
            log.write("   folder is already built", 1);
            return false;
        }

        this.clearTaskItems();
        for (const tId of this.store)
        {
            const taskItem2 = this.treeManager.getTaskMap()[tId];
            /* istanbul ignore else */
            if (taskItem2 && taskItem2 instanceof TaskItem && taskItem2.task)
            {
                const taskItem3 = new TaskItem(taskItem2.taskFile, taskItem2.task, logPad + "   ");
                taskItem3.id = this.label + ":" + taskItem3.id;
                taskItem3.label = this.getRenamedTaskName(taskItem3);
                taskItem3.folder = this;
                this.insertTaskFile(taskItem3, 0);
            }
        }

        this.sort(logPad + "   ");

        tree.splice(treeIdx, 0, this);

        log.methodDone("create special tasks folder", 3, logPad);
        return true;
    }


    clearTaskItems()
    {
        const nodeExpandedeMap = configuration.get<IDictionary<"Collapsed"|"Expanded">>("specialFolders.folderState");
        this.taskFiles = [];
        //
        // The 'Last Tasks' folder will be 1st in the tree
        //
        if (configuration.get<boolean>("specialFolders.showLastTasks") === true)
        {
            this.collapsibleState =  TreeItemCollapsibleState[nodeExpandedeMap.lastTasks];
        }
        //
        // The 'Favorites' folder will be 2nd in the tree (or 1st if configured to hide
        // the 'Last Tasks' folder)
        //
        if (configuration.get<boolean>("specialFolders.showFavorites"))
        {
            this.collapsibleState =  TreeItemCollapsibleState[nodeExpandedeMap.favorites];
        }
    }


    /**
     * @method clearSpecialFolder
     *
     * @param folder The TaskFolder representing either the "Last Tasks" or the "Favorites" folders.
     *
     * @since 2.0.0
     */
    protected async clearSavedTasks()
    {
        const choice = await window.showInformationMessage(`Clear all tasks from the \`${this.label}\` folder?`, "Yes", "No");
        if (choice === "Yes")
        {
            this.store = [];
            this.taskFiles = [];
            await storage.update(this.storeName, this.store);
            this.refresh(true);
        }
    }


    getLastRanId = () =>
    {
        let lastTaskId: string | undefined;
        if (this.store.length > 0)
        {
            lastTaskId = this.store[this.store.length - 1];
        }
        if (!lastTaskId)
        {
            window.showInformationMessage("No saved tasks!");
        }
        return lastTaskId;
    };


    protected getRenamedTaskName(taskItem: TaskItem)
    {
        let label = taskItem.taskFile.folder.label + " - " + taskItem.taskSource;
        const renames = storage.get<string[][]>(Strings.TASKS_RENAME_STORE, []),
              id = this.getTaskItemId(taskItem.id);
        for (const i in renames)
        {
            if (id === renames[i][0])
            {
                label = renames[i][1];
                break;
            }
        }
        return taskItem.label + " (" + label + ")";
    }


    getStore = () => this.store; // for 'tasks' tests


    protected getTaskItemId(taskItemId: string)
    {
        return taskItemId.replace(Strings.LAST_TASKS_LABEL + ":", "")
                         .replace(Strings.FAV_TASKS_LABEL + ":", "")
                         .replace(Strings.USER_TASKS_LABEL + ":", "");
    }


    hasTask = (taskItem: TaskItem) => !!(this.enabled && this.taskFiles.find(t =>  this.getTaskItemId(t.id) === taskItem.id) && this.store.includes(this.getTaskItemId(taskItem.id)));


    isEnabled = () => this.enabled;


    async processConfigChanges(e: ConfigurationChangeEvent)
    {
        if (e.affectsConfiguration("taskexplorer." + this.settingNameEnabled))
        {
            this.store = storage.get<string[]>(this.storeName, []);
            this.enabled = configuration.get<boolean>(this.settingNameEnabled);
            this.refresh(this.enabled);
        }
    }


    private refresh(show: boolean, logPad = "")
    {
        let changed = false;
        const tree = this.treeManager.getTaskTree();
        const empty = !tree || tree.length === 0 || (tree[0].contextValue === "noscripts" || tree[0].contextValue === "initscripts" || tree[0].contextValue === "loadscripts");
        log.methodStart("show special tasks", 1, logPad, false, [[ "is favorite", this.isFavorites ], [ "show", show ]]);

        /* istanbul ignore if */
        if (empty)
        {
            log.write("   there are no tasks in tree to sort", 1, logPad);
            log.methodDone("show special tasks", 1, logPad);
            return;
        }

        if (show)
        {
            changed = this.build("   ");
        }
        else {
            if (tree[0].label === this.label) {
                tree.splice(0, 1);
                changed = true;
            }
            else { // if (tree[1].label === this.label) {
                tree.splice(1, 1);
                changed = true;
            }
        }

        if (changed) {
            this.treeManager.fireTreeRefreshEvent(logPad + "   ", 1);
        }

        log.methodDone("show special tasks", 1, logPad);
    }


    override async removeTaskFile(taskFile: TaskItem|string, logPad: string, persist?: boolean)
    {
        const id = isString(taskFile) ? taskFile : taskFile.id, // getTaskItemId(taskFile);
              idx = this.taskFiles.findIndex(f => f.id === id);
        if (idx !== -1)
        {
            taskFile = this.taskFiles.splice(idx, 1)[0];
            if (persist)
            {
                const idx = this.store.findIndex(f => f === this.getTaskItemId(id));
                this.store.splice(idx, 1);
                await storage.update(this.storeName, this.store);
                this._onDidTasksChange.fire({ tasks: this.taskFiles.map(f => f.task), type: this.isFavorites ? "favorites" : "last" });
                this.treeManager.fireTreeRefreshEvent(logPad, 1, this);
            }
        }
    }


    async saveTask(taskItem: TaskItem, logPad: string)
    {
        const taskId =  this.getTaskItemId(taskItem.id);
        const maxTasks = configuration.get<number>("specialFolders.numLastTasks");

        log.methodStart("save task", 1, logPad, false, [
            [ "treenode label", this.label ], [ "max tasks", maxTasks ], [ "is favorite", this.isFavorites ],
            [ "task id", taskId ], [ "current # of saved tasks", this.store.length ]
        ]);
        log.value("current saved task ids", this.store.toString() , 3, logPad + "   ");

        //
        // Moving it to the top of the list it if it already exists
        //
        removeFromArray(this.store, taskId);

        while (this.store.length >= maxTasks)
        {
            this.store.shift();
        }

        this.store.push(taskId);
        await storage.update(this.storeName, this.store);

        this.onTaskSave(taskItem, logPad);

        this._onDidTasksChange.fire({ tasks: this.taskFiles.map(f => f.task), type: this.isFavorites ? "favorites" : "last" });

        log.methodDone("save task", 1, logPad, [[ "new # of saved tasks", this.store.length ]]);
    }


    protected sort = (logPad: string) => sortTasks(this.taskFiles, logPad, 4);

}
