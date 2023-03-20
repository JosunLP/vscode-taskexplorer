
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { SpecialFolderStorageKey, StorageKeys } from "../lib/constants";
import { IDictionary, ILog, ITeTaskChangeEvent, StorageTarget, TeTaskListType } from "../interface";
import {
    ConfigurationChangeEvent, Disposable, Event, EventEmitter, InputBoxOptions, ThemeIcon,
    TreeItem, TreeItemCollapsibleState, window, workspace
} from "vscode";

interface ITeSpecialTask
{
    id: string;
    timestamp: number;
}

interface ITeSpecialFolderStore
{
    favorites: ITeSpecialTask[];
    last: ITeSpecialTask[];
}

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

    protected store: ITeSpecialTask[];
    protected storeWs: ITeSpecialTask[];
    protected readonly log: ILog;
    protected readonly disposables: Disposable[];

    private enabled: boolean;
    private settingNameEnabled: string;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;

    override taskFiles: TaskItem[];


    constructor(protected readonly wrapper: TeWrapper, label: string, state: TreeItemCollapsibleState)
    {
        super(label, state);
        this.log = this.wrapper.log;
        this.taskFiles = [];
        this.disposables = [];
        this.iconPath = ThemeIcon.Folder;
        this.contextValue = label.toLowerCase().replace(/[\W \_\-]/g, "");
        [ this.store, this.storeWs ] = this.loadStores();
        this.tooltip = `A tree folder to store '${label}' tasks`;
        this.settingNameEnabled = "specialFolders.show" + label.replace(/ /g, "");
        this.enabled = this.wrapper.config.get<boolean>(this.settingNameEnabled);
        this._onDidTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this.disposables.push(
            this._onDidTasksChange,
            workspace.onDidChangeConfiguration(this.onConfigChanged, this)
        );
    }

    dispose = () => this.disposables.forEach((d) => d.dispose());


	get onDidTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTasksChange.event;
	}

    get storeName(): SpecialFolderStorageKey {
        return `taskexplorer.specialFolder.${this.listType}`;
    }


    async addRemoveRenamedLabel(taskItem: TaskItem): Promise<boolean>
    {
        const renames = this.wrapper.storage.get<string[][]>(this.wrapper.keys.Storage.SpecialFolderRenames, []),
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
        await this.wrapper.storage.update(this.wrapper.keys.Storage.SpecialFolderRenames, renames);
        this.wrapper.treeManager.fireTreeRefreshEvent(this, null, "   ");

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
    build(logPad: string): boolean
    {
        this.log.methodStart(`build ${this.label.toLowerCase()} folder`, 1, logPad);

        const tree = this.wrapper.treeManager.getTaskTree() as TreeItem[], // Guaranted not to be undefined - checked in .refresh
              showLastTasks = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.SpecialFolders.ShowLastTasks),
              favIdx = showLastTasks ? 1 : 0,
              treeIdx = this.listType !== "favorites" ? 0 : favIdx;

        this.log.values(1, logPad + "   ", [[ "tree index", treeIdx ], [ "showLastTasks setting", showLastTasks ]]);
        this.log.values(2, logPad + "   ", [[ "fav index", favIdx ], [ "list type", this.listType ]]);

        if (tree[treeIdx].label === this.label || !this.enabled)
        {
            this.log.write("   folder is already built or not enabled", 1, logPad);
            this.log.methodDone(`build ${this.label.toLowerCase()} folder`, 1, logPad);
            return false;
        }

        this.clearTaskItems();

        const added: string[] = [];
        const allItems = [ ...this.storeWs, ...this.store ];
        for (const t of allItems)
        {
            if (added.includes(t.id)) {
                break;
            }
            const taskItem2 = this.wrapper.treeManager.getTaskMap()[t.id];
            if (taskItem2 instanceof TaskItem && taskItem2.task)
            {
                const taskItem3 = new TaskItem(taskItem2.taskFile, taskItem2.task, logPad + "   ");
                taskItem3.id = this.label + ":" + taskItem3.id;
                taskItem3.label = this.getRenamedTaskName(taskItem3);
                taskItem3.folder = this;
                this.insertTaskFile(taskItem3, 0);
                added.push(t.id);
            }
        }

        this.sort();

        if (this.taskFiles.length >= this.maxItems) {
            this.taskFiles.splice(this.maxItems);
        }

        tree.splice(treeIdx, 0, this);

        this.log.methodDone(`build ${this.label.toLowerCase()} folder`, 1, logPad);
        return true;
    }


    /**
     * @method clearSpecialFolder
     *
     * @param folder The TaskFolder representing either the "Last Tasks" or the "Favorites" folders.
     *
     * @since 2.0.0
     */
    protected async clearSavedTasks(): Promise<void>
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


    private clearTaskItems(): void
    {
        const nodeExpandedeMap = this.wrapper.config.get<IDictionary<"Collapsed"|"Expanded">>("specialFolders.folderState");
        this.taskFiles = [];
        //
        // The 'Last Tasks' folder will be 1st in the tree
        //
        if (this.wrapper.config.get<boolean>(this.wrapper.keys.Config.SpecialFolders.ShowLastTasks) === true)
        {
            this.collapsibleState =  TreeItemCollapsibleState[nodeExpandedeMap.lastTasks];
        }
        //
        // The 'Favorites' folder will be 2nd in the tree (or 1st if configured to hide
        // the 'Last Tasks' folder)
        //
        if (this.wrapper.config.get<boolean>(this.wrapper.keys.Config.SpecialFolders.ShowFavorites))
        {
            this.collapsibleState =  TreeItemCollapsibleState[nodeExpandedeMap.favorites];
        }
    }


    protected fireChangeEvent = (taskItem: TaskItem): void =>
    {
        const iTask = this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], this.listType)[0],
              iTasks = this.wrapper.taskUtils.toITask(this.wrapper, this.taskFiles.map(f => f.task), this.listType);
        this._onDidTasksChange.fire({ tasks: iTasks, task: iTask, type: this.listType });
    };


    protected getRenamedTaskName(taskItem: TaskItem): string
    {
        let label = taskItem.taskFile.folder.label + " - " + taskItem.taskSource;
        const renames = this.wrapper.storage.get<string[][]>(this.wrapper.keys.Storage.SpecialFolderRenames, []),
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


    private loadStores = (): ITeSpecialTask[][] =>
    {
        this.store = this.wrapper.storage.get<ITeSpecialTask[]>(this.storeName, [], StorageTarget.Global);
        this.storeWs = this.wrapper.storage.get<ITeSpecialTask[]>(this.storeName, [], StorageTarget.Workspace);
        return [ this.store, this.storeWs ];
    };


    protected saveStores = async(): Promise<void> =>
    {
        await this.wrapper.storage.update(this.storeName, this.store);
        await this.wrapper.storage.update(this.storeName, this.storeWs, StorageTarget.Workspace);
    };


    protected getTaskItemId = (id: string): string => id.replace(this.label + ":", "");


    hasTask = (item: TaskItem) => !!(this.enabled && this.taskFiles.find(t => this.getTaskItemId(t.id) === item.id));


    protected onConfigChanged(e: ConfigurationChangeEvent): void
    {
        if (this.wrapper.config.affectsConfiguration(e, this.settingNameEnabled))
        {
            this.loadStores();
            this.enabled = this.wrapper.config.get<boolean>(this.settingNameEnabled);
            this.refresh(this.enabled);
        }
    }


    private refresh(show: boolean): void
    {
        let changed = false;
        const tree = this.wrapper.treeManager.getTaskTree();
        this.log.methodStart(`refresh ${this.label.toLowerCase()} folder`, 1, "", false, [[ "show", show ]]);
        if (!tree || this.wrapper.treeManager.getTasks().length === 0) {
            this.log.write("   there are no tasks in tree to sort", 1, "");
        }
        else {
            changed = show ? this.build("   ") : !!tree.splice(tree.findIndex(i => i.id === this.id), 1);
            if (changed) {
                this.wrapper.treeManager.fireTreeRefreshEvent(this, null, "   ");
            }
        }
        this.log.methodDone(`refresh ${this.label.toLowerCase()} folder`, 1, "");
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
                this.store.slice().reverse().forEach((t: ITeSpecialTask, idx: number, o: ITeSpecialTask[]) =>
                {
                    if (storeTaskItemId === t.id) {
                        this.store.splice(o.length - 1 - idx, 1);
                    }
                });
                this.storeWs.slice().reverse().forEach((t: ITeSpecialTask, idx: number, o: ITeSpecialTask[]) =>
                {
                    if (storeTaskItemId === t.id) {
                        this.storeWs.splice(o.length - 1 - idx, 1);
                    }
                });
                await this.wrapper.storage.update(this.storeName, this.store);
                await this.wrapper.storage.update(this.storeName, this.storeWs, StorageTarget.Workspace);
                this.fireChangeEvent(taskItem);
                this.wrapper.treeManager.fireTreeRefreshEvent(this, null, logPad);
            }
        }
    }


    // protected sort = () => sortTasks(this.taskFiles, this.listType);
    protected sort = () =>
    {
        this.taskFiles.sort((a: TaskItem, b: TaskItem) =>
        {
            const aId = this.getTaskItemId(a.id),
                  bId = this.getTaskItemId(b.id),
                  aIdx = this.store.findIndex(t => t.id === aId),
                  bIdx = this.store.findIndex(t => t.id === bId),
                  aIsPinned = this.wrapper.taskUtils.isPinned(aId,  this.listType),
                  bIsPinned = this.wrapper.taskUtils.isPinned(bId, this.listType);
            if (aIsPinned && !bIsPinned) {
                return -1;
            }
            else if (!aIsPinned && bIsPinned) {
                return 1;
            }
            return aIdx < bIdx ? 1 : -1;
        });
    };

}
