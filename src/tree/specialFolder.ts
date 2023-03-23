
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { SpecialFolderStorageKey } from "../lib/constants";
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

/**
 * @class SpecialTaskFolder
 *
 * A tree node that represents a special folder i.e. the `Favorites` or `Last Tasks` folder
 */
export abstract class SpecialTaskFolder extends TaskFolder implements Disposable
{

    protected abstract order: number;
    protected abstract maxItems: number;
    protected abstract saveTask(taskItem: TaskItem, logPad: string): Promise<void>;

    protected store: ITeSpecialTask[];
    protected storeWs: ITeSpecialTask[];
    protected readonly log: ILog;
    protected readonly labelLwr: string;
    protected readonly disposables: Disposable[];

    private _enabled: boolean;
    private readonly _settingNameEnabled: string;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;

    override taskFiles: TaskItem[];


    constructor(protected readonly wrapper: TeWrapper, protected readonly listType: TeTaskListType, label: string, settingName: string, state: TreeItemCollapsibleState)
    {
        super(label, state, true);
        this.taskFiles = [];
        this.disposables = [];
        this.log = this.wrapper.log;
        this.iconPath = ThemeIcon.Folder;
        this.labelLwr = this.label.toLowerCase();
        this.contextValue = this.labelLwr.replace(/[\W \_\-]/g, "");
        [ this.store, this.storeWs ] = this.loadStores();
        this.tooltip = `A tree folder to store '${label}' tasks`;
        this._settingNameEnabled = settingName;
        this._enabled = this.wrapper.config.get<boolean>(settingName);
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

    private get storeName(): SpecialFolderStorageKey {
        return `taskexplorer.specialFolder.${this.listType}`;
        // return `${this.wrapper.keys.Config.SpecialFolders.FolderState}.${this.listType}`;
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
    build(logPad: string): void
    {
        this.log.methodStart(`build ${this.labelLwr} folder`, 1, logPad);

        const added: string[] = [],
              taskMap = this.wrapper.treeManager.getTaskMap(),
              allStoreItems = this.getCombinedStore(),
              expandStateId = this.wrapper.utils.lowerCaseFirstChar(this.label, true),
              folderStateCfgKey = this.wrapper.keys.Config.SpecialFolders.FolderState,
              tree = this.wrapper.treeManager.getTaskTree() as TaskFolder[], // Guaranted not to be undefined
              nodeExpandedeMap = this.wrapper.config.get<IDictionary<"Collapsed"|"Expanded">>(folderStateCfgKey);

        this.taskFiles = [];
        this.collapsibleState = TreeItemCollapsibleState[nodeExpandedeMap[expandStateId]];

        for (const t of allStoreItems)
        {
            if (this.taskFiles.length >= this.maxItems) {
                break;
            }
            if (added.includes(t.id)) {
                continue;
            }
            const taskItem = taskMap[t.id];
            if (taskItem instanceof TaskItem && taskItem.task)
            {
                const taskItem2 = new TaskItem(taskItem.taskFile, taskItem.task, logPad + "   ");
                taskItem2.id = this.getTaskSpecialId(taskItem2.id);
                taskItem2.label = this.getRenamedTaskName(taskItem2);
                taskItem2.folder = this;
                this.insertTaskFile(taskItem2, 0);
                added.push(t.id);
            }
        }

        this.sort();

        if (this._enabled)
        {
            const sFolders = tree.filter(i => i.isSpecial) as SpecialTaskFolder[];
            if (!sFolders.find(i => i.id === this.id))
            {
                const idx = sFolders.findIndex(i => i.order > this.order);
                tree.splice(idx !== -1 ? idx : sFolders.length, 0, this);
            }
        }

        this.log.methodDone(`build ${this.labelLwr} folder`, 1, logPad);
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
        if (choice === "Workspace" || choice === "Global")
        {
            this.storeWs = [];
            if (choice === "Global") {
                this.store = [];
            }
            await this.saveStores();
            this.taskFiles = [];
            this.refresh();
        }
    }

    protected fireChangeEvent = (taskItem: TaskItem | undefined, logPad: string): void =>
    {
        const iTasks = this._enabled ? this.wrapper.taskUtils.toITask(this.wrapper, this.taskFiles.map(f => f.task), this.listType) : [],
              iTask = taskItem ? iTasks.find(t => t.treeId === taskItem.id) : taskItem;
        this._onDidTasksChange.fire({ tasks: iTasks, task: iTask, type: this.listType });
        this.wrapper.treeManager.fireTreeRefreshEvent(this, null, logPad);
    };


    protected getCombinedStore = () => [ ...this.storeWs, ...this.store ].sort((a, b) => a.timestamp < b.timestamp ? 1 : -1);


    protected getRenamedTaskName(taskItem: TaskItem): string
    {
        let label = `${taskItem.taskFile.folder.label} - ${taskItem.taskSource}`;
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
        return `${taskItem.label} (${label})`;
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


    protected getTaskItemId = (id: string): string => (id.includes("::") ? id.replace(id.substring(0, id.indexOf("::") + 2), "") : id);


    protected getTaskSpecialId = (id: string): string => `${this.label}::${this.getTaskItemId(id)}`;


    hasTask = (item: TaskItem): boolean => !!(this._enabled && this.taskFiles.find(t => this.getTaskItemId(t.id) === this.getTaskItemId(item.id)));


    protected onConfigChanged(e: ConfigurationChangeEvent): void
    {
        if (this.wrapper.config.affectsConfiguration(e, this._settingNameEnabled) && this.wrapper.treeManager.getTaskTree())
        {
            this.loadStores();
            this._enabled = this.wrapper.config.get<boolean>(this._settingNameEnabled);
            this.refresh();
        }
    }


    private refresh(): void
    {
        const tree = this.wrapper.treeManager.getTaskTree() as TaskFolder[];
        this.log.methodStart(`refresh ${this.labelLwr} folder`, 1, "", false, [[ "show / enabled", this._enabled ]]);
        if (this._enabled) {
            this.build("   ");
        }
        else {
            tree.splice(tree.findIndex(i => i.id === this.id), 1);
        }
        this.fireChangeEvent(undefined, "   ");
        this.log.methodDone(`refresh ${this.labelLwr} folder`, 1, "");
    }


    protected removeFromStore = (taskItem: TaskItem): void =>
    {
        const taskId = this.getTaskItemId(taskItem.id);
        let idx = this.store.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            this.store.splice(idx, 1);
        }
        else if (this.store.length >= this.maxItems) {
            this.store.splice(this.maxItems);
        }
        idx = this.storeWs.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            this.storeWs.splice(idx, 1);
        }
        else if (this.storeWs.length >= this.maxItems) {
            this.storeWs.splice(this.maxItems);
        }
    };


    override async removeTaskFile(taskItem: TaskItem|string, logPad: string, persist?: boolean): Promise<void>
    {
        const id = this.wrapper.typeUtils.isString(taskItem) ? taskItem : taskItem.id, // getTaskItemId(taskFile);
              idx = this.taskFiles.findIndex(f => f.id === id);
        if (idx !== -1)
        {
            taskItem = this.taskFiles.splice(idx, 1)[0];
            if (persist)
            {
                this.removeFromStore(taskItem);
                await this.saveStores();
                this.fireChangeEvent(taskItem, logPad);
            }
        }
    }


    protected sort = (): void => this.wrapper.sorters.sortTasks(this.taskFiles, this.listType);

}
