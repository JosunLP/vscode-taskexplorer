
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { ConfigKeys, Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./treeManager";
import { sortTasks } from "../lib/utils/sortTasks";
import { IDictionary, ILog, ITeTaskChangeEvent, StorageTarget, TeTaskListType } from "../interface";
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

    protected abstract maxItems: number;
    protected abstract listType: TeTaskListType;
    protected abstract saveTask(taskItem: TaskItem, logPad: string): Promise<void>;

    protected store: string[];
    protected storeWs: string[];
    protected readonly log: ILog;
    protected readonly disposables: Disposable[];

    private enabled: boolean;
    private settingNameEnabled: string;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;

    override taskFiles: TaskItem[];


    constructor(protected readonly wrapper: TeWrapper, protected readonly treeManager: TaskTreeManager, protected readonly storeName: string, label: string, state: TreeItemCollapsibleState)
    {
        super(label, state);
        this.log = this.wrapper.log;
        this.taskFiles = [];
        this.disposables = [];
        this.iconPath = ThemeIcon.Folder;
        this.contextValue = label.toLowerCase().replace(/[\W \_\-]/g, "");
        this.store = this.wrapper.storage.get<string[]>(this.storeName, []);
        this.storeWs = this.wrapper.storage.get<string[]>(this.storeName, [], StorageTarget.Workspace);
        this.tooltip = `A tree folder to store '${label}' tasks`;
        this.settingNameEnabled = "specialFolders.show" + label.replace(/ /g, "");
        this.enabled = this.wrapper.config.get<boolean>(this.settingNameEnabled);
        this._onDidTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this.disposables.push(
            this._onDidTasksChange,
            workspace.onDidChangeConfiguration(this.onConfigChanged, this)
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
        if (this.store.includes(taskItem.id) || this.storeWs.includes(taskItem.id))
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
              treeIdx = this.listType !== "favorites" ? 0 : favIdx;

        this.log.values(2, logPad + "   ", [[ "tree index", treeIdx ], [ "showLastTasks setting", showLastTasks ]]);

        if (tree[treeIdx].label === this.label) {
            this.log.write("   folder is already built", 1);
            return false;
        }

        this.clearTaskItems();

        const added: string[] = [];
        const allItems = [ ...this.storeWs, ...this.store ];
        for (const tId of allItems)
        {
            if (this.taskFiles.length >= this.maxItems || added.includes(tId)) {
                break;
            }
            const taskItem2 = this.treeManager.getTaskMap()[tId];
            /* istanbul ignore else */
            if (taskItem2 && taskItem2 instanceof TaskItem && taskItem2.task)
            {
                const taskItem3 = new TaskItem(taskItem2.taskFile, taskItem2.task, logPad + "   ");
                taskItem3.id = this.label + ":" + taskItem3.id;
                taskItem3.label = this.getRenamedTaskName(taskItem3);
                taskItem3.folder = this;
                this.insertTaskFile(taskItem3, 0);
                added.push(tId);
            }
        }

        this.sort();

        tree.splice(treeIdx, 0, this);

        this.log.methodDone("create special tasks folder", 3, logPad);
        return true;
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
        const choice = await window.showInformationMessage(`Clear all tasks from the \`${this.label}\` folder?`, "Global", "Workspace", "Cancel");
        if (choice === "Global" || choice === "Workspace")
        {
            this.storeWs = [];
            await this.wrapper.storage.update(this.storeName, this.storeWs, StorageTarget.Workspace);
            if (choice === "Global")
            {
                this.store = [];
                await this.wrapper.storage.update(this.storeName, this.store, StorageTarget.Global);
            }
            this.taskFiles = [];
            this.refresh(true);
        }
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


    protected fireChangeEvent = (taskItem: TaskItem) =>
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
        [ ... this.store, ...this.storeWs ].includes(this.getTaskItemId(taskItem.id)));


    protected async onConfigChanged(e: ConfigurationChangeEvent)
    {
        if (this.wrapper.config.affectsConfiguration(e, this.settingNameEnabled))
        {
            this.store = this.wrapper.storage.get<string[]>(this.storeName, [], StorageTarget.Global);
            this.storeWs = this.wrapper.storage.get<string[]>(this.storeName, [], StorageTarget.Workspace);
            this.enabled = this.wrapper.config.get<boolean>(this.settingNameEnabled);
            this.refresh(this.enabled);
        }
    }


    private refresh(show: boolean, logPad = "")
    {
        let changed = false;
        const tree = this.treeManager.getTaskTree();
        const empty = !tree || tree.length === 0 || (tree[0].contextValue === "noscripts" || tree[0].contextValue === "initscripts" || tree[0].contextValue === "loadscripts");
        this.log.methodStart("show special tasks", 1, logPad, false, [[ "folder name", this.label ], [ "show", show ]]);

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
                const storeTaskItemId = this.getTaskItemId(id);
                this.store.slice().reverse().forEach((id: string, idx: number, o: string[]) =>
                {
                    if (storeTaskItemId === id) {
                        this.store.splice(o.length - 1 - idx, 1);
                    }
                });
                this.storeWs.slice().reverse().forEach((id: string, idx: number, o: string[]) =>
                {
                    if (storeTaskItemId === id) {
                        this.storeWs.splice(o.length - 1 - idx, 1);
                    }
                });
                await this.wrapper.storage.update(this.storeName, this.store);
                await this.wrapper.storage.update(this.storeName, this.storeWs, StorageTarget.Workspace);
                this.fireChangeEvent(taskItem);
                this.treeManager.fireTreeRefreshEvent(logPad, 1, this);
            }
        }
    }


    protected sort = () => sortTasks(this.taskFiles, this.listType);

}
