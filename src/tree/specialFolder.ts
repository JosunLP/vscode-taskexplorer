
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { ConfigKeys, Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./treeManager";
import { sortTasks } from "../lib/utils/sortTasks";
import { IDictionary, ILog, ITeTaskChangeEvent, TeTaskListType } from "../interface";
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
    protected abstract listType: TeTaskListType;
    protected abstract onTaskSave(taskItem: TaskItem, logPad: string): void;

    public treeManager: TaskTreeManager;
    public override taskFiles: TaskItem[];

    protected store: string[];
    protected readonly disposables: Disposable[];

    private log: ILog;
    private enabled: boolean;
    private storeName: string;
    private isFavorites: boolean;
    private settingNameEnabled: string;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;


    constructor(protected readonly wrapper: TeWrapper, treeManager: TaskTreeManager, label: string, state: TreeItemCollapsibleState)
    {
        super(label, state);
        this.log = this.wrapper.log;
        this.taskFiles = [];
        this.disposables = [];
        this.treeManager = treeManager;
        this.iconPath = ThemeIcon.Folder;
        this.isFavorites = label === Strings.FAV_TASKS_LABEL;
        this.contextValue = label.toLowerCase().replace(/[\W \_\-]/g, "");
        this.storeName = this.isFavorites ? Strings.FAV_TASKS_STORE : Strings.LAST_TASKS_STORE;
        this.store = this.wrapper.storage.get<string[]>(this.storeName, []);
        this.tooltip = `A tree folder to store '${label}' tasks`;
        this.settingNameEnabled = "specialFolders.show" + label.replace(/ /g, "");
        this.enabled = this.wrapper.config.get<boolean>(this.settingNameEnabled);
        this._onDidTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this.disposables.push(
            this._onDidTasksChange,
            workspace.onDidChangeConfiguration(async e => { await this.processConfigChanges(e); }, this)
        );
    }


    dispose()
    {
        this.disposables.forEach((d) => d.dispose());
        this.disposables.splice(0);
        this.taskFiles = [];
    }


    get isEnabled() {
        return this.enabled;
    }

	get onDidTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTasksChange.event;
	}


    override async addTaskFile(taskItem: TaskItem, logPad?: string)
    {
        if (this.store.includes(taskItem.id))
        {
            this.log.methodStart(`add tree taskitem to ${this.label}`, 3, logPad);

            const taskItem2 = new TaskItem(taskItem.taskFile, taskItem.task, logPad + "   ");
            taskItem2.id = this.label + ":" + taskItem2.id; // note 'label:' + taskItem2.id === id
            taskItem2.label = this.getRenamedTaskName(taskItem2);
            taskItem2.folder = this;
            this.insertTaskFile(taskItem2, 0);
            this.sort();

            this.log.methodDone(`add tree taskitem to ${this.label}`, 3, logPad);
        }
    }


    async addRemoveRenamedLabel(taskItem: TaskItem)
    {
        const renames = this.wrapper.storage.get<string[][]>(Strings.TASKS_RENAME_STORE, []),
              id = this.getTaskItemId(taskItem.id);

        this.log.methodStart("add/remove rename special", 1, "", false, [[ "id", id ], [ "current # of items in store", renames.length ]]);

        //
        // Removing an item?
        //
        const rmvIdx = renames.findIndex(r => r[0] === id);
        if (rmvIdx !== -1)
        {
            renames.splice(rmvIdx, 1);
            this.log.write("   removing item from 'rename' store", 1);
            this.log.value("      index", 3);
        }     //
        else // Adding an item...
        {   //
            const opts: InputBoxOptions = { prompt: "Enter favorites label" };
            const str = await window.showInputBox(opts);
            if (str !== undefined)
            {
                renames.push([ id, str ]);
                this.log.value("   adding item to 'rename' store", str, 1);
            }
            else {
                this.log.write("   user cancelled adding item to 'rename' store", 1);
            }
        }

        //
        // Persist to storage and refresh this tree node
        //
        await this.wrapper.storage.update(Strings.TASKS_RENAME_STORE, renames);
        this.treeManager.fireTreeRefreshEvent("   ", 1, this);

        this.log.methodDone("add/remove rename special", 1, "", [[ "new # of items in store", renames.length ]]);
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
        this.log.methodStart("create special tasks folder", 1, logPad, false, [[ "name", this.label ]]);

        const tree = this.treeManager.getTaskTree() as TreeItem[], // Guaranted not to be undefined - checked in .refresh
              showLastTasks = this.wrapper.config.get<boolean>(ConfigKeys.SpecialFolders.ShowLastTasks),
              favIdx = showLastTasks ? 1 : 0,
              treeIdx = !this.isFavorites ? 0 : favIdx;

        this.log.values(2, logPad + "   ", [[ "tree index", treeIdx ], [ "showLastTasks setting", showLastTasks ]]);

        if (tree[treeIdx].label === this.label) {
            this.log.write("   folder is already built", 1);
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

        this.sort();

        tree.splice(treeIdx, 0, this);

        this.log.methodDone("create special tasks folder", 3, logPad);
        return true;
    }


    clearTaskItems()
    {
        const nodeExpandedeMap = this.wrapper.config.get<IDictionary<"Collapsed"|"Expanded">>("specialFolders.folderState");
        this.taskFiles = [];
        //
        // The 'Last Tasks' folder will be 1st in the tree
        //
        if (this.wrapper.config.get<boolean>(ConfigKeys.SpecialFolders.ShowLastTasks) === true)
        {
            this.collapsibleState =  TreeItemCollapsibleState[nodeExpandedeMap.lastTasks];
        }
        //
        // The 'Favorites' folder will be 2nd in the tree (or 1st if configured to hide
        // the 'Last Tasks' folder)
        //
        if (this.wrapper.config.get<boolean>(ConfigKeys.SpecialFolders.ShowFavorites))
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
            await this.wrapper.storage.update(this.storeName, this.store);
            this.refresh(true);
        }
    }


    private fireChangeEvent = (taskItem: TaskItem) =>
    {
        const iTask = this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], this.listType)[0],
              iTasks = this.wrapper.taskUtils.toITask(this.wrapper, this.taskFiles.map(f => f.task), this.listType);
        this._onDidTasksChange.fire({ tasks: iTasks, task: iTask, type: this.listType });
    };


    protected getRenamedTaskName(taskItem: TaskItem)
    {
        let label = taskItem.taskFile.folder.label + " - " + taskItem.taskSource;
        const renames = this.wrapper.storage.get<string[][]>(Strings.TASKS_RENAME_STORE, []),
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


    hasTask = (taskItem: TaskItem) =>
                !!(this.enabled && this.taskFiles.find(t =>  this.getTaskItemId(t.id) === taskItem.id) &&
                this.store.includes(this.getTaskItemId(taskItem.id)));


    async processConfigChanges(e: ConfigurationChangeEvent)
    {
        if (e.affectsConfiguration("taskexplorer." + this.settingNameEnabled))
        {
            this.store = this.wrapper.storage.get<string[]>(this.storeName, []);
            this.enabled = this.wrapper.config.get<boolean>(this.settingNameEnabled);
            this.refresh(this.enabled);
        }
    }


    private refresh(show: boolean, logPad = "")
    {
        let changed = false;
        const tree = this.treeManager.getTaskTree();
        const empty = !tree || tree.length === 0 || (tree[0].contextValue === "noscripts" || tree[0].contextValue === "initscripts" || tree[0].contextValue === "loadscripts");
        this.log.methodStart("show special tasks", 1, logPad, false, [[ "is favorite", this.isFavorites ], [ "show", show ]]);

        /* istanbul ignore if */
        if (empty)
        {
            this.log.write("   there are no tasks in tree to sort", 1, logPad);
            this.log.methodDone("show special tasks", 1, logPad);
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

        this.log.methodDone("show special tasks", 1, logPad);
    }


    override async removeTaskFile(taskItem: TaskItem|string, logPad: string, persist?: boolean)
    {
        const id = this.wrapper.typeUtils.isString(taskItem) ? taskItem : taskItem.id, // getTaskItemId(taskFile);
              idx = this.taskFiles.findIndex(f => f.id === id);
        if (idx !== -1)
        {
            taskItem = this.taskFiles.splice(idx, 1)[0];
            if (persist)
            {
                const idx = this.store.findIndex(f => f === this.getTaskItemId(id));
                this.store.splice(idx, 1);
                await this.wrapper.storage.update(this.storeName, this.store);
                this.fireChangeEvent(taskItem);
                this.treeManager.fireTreeRefreshEvent(logPad, 1, this);
            }
        }
    }


    async saveTask(taskItem: TaskItem, logPad: string)
    {
        const taskId = this.getTaskItemId(taskItem.id);
        const maxTasks = this.wrapper.config.get<number>("specialFolders.numLastTasks");
        this.log.methodStart("save task", 1, logPad, false, [
            [ "treenode label", this.label ], [ "max tasks", maxTasks ], [ "is favorite", this.isFavorites ],
            [ "task id", taskId ], [ "current # of saved tasks", this.store.length ]
        ]);
        this.log.value("current saved task ids", this.store.toString() , 3, logPad + "   ");
        this.wrapper.utils.removeFromArray(this.store, taskId); // Moving it to the top of the list it if it already exists
        while (this.store.length >= maxTasks) {
            this.store.shift();
        }
        this.store.push(taskId);
        await this.wrapper.storage.update(this.storeName, this.store);
        this.onTaskSave(taskItem, logPad);
        this.fireChangeEvent(taskItem);
        this.log.methodDone("save task", 1, logPad, [[ "new # of saved tasks", this.store.length ]]);
    }


    protected sort = () => sortTasks(this.taskFiles, this.listType);

}
