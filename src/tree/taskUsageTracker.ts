
import { TaskItem } from "./item";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./treeManager";
import { getDateDifference } from "../lib/utils/utils";
import { ConfigProps, StorageProps } from "../lib/constants";
import { ILog, ITeTask, ITeTaskChangeEvent, ITeTrackedUsage } from "../interface";
import { Disposable, EventEmitter, tasks, Event, Task } from "vscode";
import { UsageWatcher } from "src/lib/watcher/usageWatcher";

interface ITaskUsageStats
{
    all: ITeTask[];
    famous: ITeTask[];
    favorites: ITeTask[];
    last: ITeTask[];
    lastRuntime: number;
    running: ITeTask[];
    taskLastRan: ITeTask;
    taskMostUsed: ITeTask;
}


export class TaskUsageTracker implements Disposable
{
    private readonly log: ILog;
    private readonly _usageKey = "task:";
    private readonly _disposables: Disposable[] = [];
    private readonly _onDidFamousTasksChange: EventEmitter<ITeTaskChangeEvent>;


    constructor(private readonly wrapper: TeWrapper, treeManager: TaskTreeManager)
    {
        this.log = wrapper.log;
        this._onDidFamousTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this._disposables.push(
            this._onDidFamousTasksChange,
			treeManager.onDidFavoriteTasksChange(this.onFavoriteTasksChanged, this),
			treeManager.onDidLastTasksChange(this.onLastTasksChanged, this)
        );
    }


    dispose()
    {
        this._disposables.forEach(d => d.dispose());
        this._disposables.splice(0);
    }


	get onDidFamousTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidFamousTasksChange.event;
	}


    private getEmptyITask = (): ITeTask =>
    ({
        name: "N/A",
        listType: "none",
        pinned: false,
        running: false,
        source: "N/A",
        treeId: "N/A",
        definition: {
            type: "N/A"
        },
        runCount: {
            today: 0,
            yesterday: 0,
            last7Days: 0,
            last14Days: 0,
            last30Days: 0,
            last60Days: 0,
            last90Days: 0,
            total: 0
        }
    });


    private getStore = async(): Promise<ITaskUsageStats> =>
    {
        let store = this.wrapper.storage.get<ITaskUsageStats>(StorageProps.TaskUsage);
        if (!store)
        {
            store = {
                famous: [],
                favorites: [],
                last: [],
                all: [],
                running: [],
                lastRuntime: 0,
                taskLastRan: this.getEmptyITask(),
                taskMostUsed: this.getEmptyITask()
            };
            await this.wrapper.storage.update(StorageProps.TaskUsage, store);
        }
        return store;
    };


    getAvgRunCount = (period: "d" | "w", logPad: string): number =>
    {
        const now = Date.now();
        let avg = 0,
            lowestTime = now;
        this.log.methodStart("get average run count", 2, logPad, false, [[ "period", period ]]);
        const taskStats = this.wrapper.usage.getAll(this._usageKey);
        Object.keys(taskStats).forEach(k =>
        {
            if (taskStats[k].timestamp < lowestTime)  {
                lowestTime = taskStats[k].timestamp ;
            }
        });
        const daysSinceFirstRunTask = getDateDifference(lowestTime, now, "d")  || 1;
        avg = Math.floor(Object.keys(taskStats).length / daysSinceFirstRunTask / (period === "d" ? 1 : 7));
        this.log.methodDone("get average run count", 2, logPad, [[ "calculated average", avg ]]);
        return avg;
    };


    getRunningTasks = (): Task[] => tasks.taskExecutions.map(e => e.task);


    getTodayCount = (logPad: string) =>
    {
        let count = 0;
        this.log.methodStart("get today run count", 2, logPad);
        const taskStats = this.wrapper.usage.getAll();
        Object.keys(taskStats).filter(k => k.startsWith(this._usageKey)).forEach(k =>
        {
            count += taskStats[k].count.today;
        });
        this.log.methodDone("get today run count", 2, logPad, [[ "today run count", count ]]);
        return count;
    };


    getFamousTasks = (): ITeTask[] => this.wrapper.storage.get<ITeTask[]>(`${StorageProps.TaskUsage}.famous`, []);


    getLastRanTaskTime = async(): Promise<string> =>
    {
        const  tm = (await this.getStore()).lastRuntime;
        if (tm) {
            return new Date(tm).toLocaleDateString() + " " + new Date(tm).toLocaleTimeString();
        }
        return "N/A";
    };


    getMostUsedTask = async (): Promise<ITeTask> => (await this.getStore()).taskMostUsed;


    private onFavoriteTasksChanged = async (e: ITeTaskChangeEvent) =>
    {
        const stats = await this.getStore();
        stats.favorites = [ ...e.tasks ];
        await this.wrapper.storage.update(StorageProps.TaskUsage, stats);
    };


    private onLastTasksChanged = async (e: ITeTaskChangeEvent) =>
    {
        const stats = await this.getStore();
        stats.last = [ ...e.tasks ];
        await this.wrapper.storage.update(StorageProps.TaskUsage, stats);
    };


    track = async(taskItem: TaskItem, logPad: string) =>
    {
        const stats = await this.getStore(),
              taskName = `${taskItem.task.name} (${taskItem.task.source})`;

        this.log.methodStart("save task run details", 2, logPad, false, [[ "task name", taskName ]]);
        //
        // Process with Usage Tracker
        //
        const usage = await this.wrapper.usage.track(`${this._usageKey}${taskItem.id}`);
        //
        // Convert to IPC ready ITeTask
        //
        const iTask = this.wrapper.taskUtils.toITask(this.wrapper.usage, [ taskItem.task ], "all", false, usage)[0];
        //
        // Add  to 'famous tasks' list, maybe
        //
        const famousChanged = this.trackFamous(taskItem, iTask, stats, usage);
        //
        // Record this task as the last task ran and the time it was ran
        //
        stats.lastRuntime = Date.now();
        stats.taskLastRan = { ...iTask };
        //
        // Persist / save stats
        //
        await this.wrapper.storage.update(StorageProps.TaskUsage, stats);
        //
        // Maybe notify any listeners that the `famous tasks` list has changed
        //
        if (famousChanged) {
            this._onDidFamousTasksChange.fire({ task: { ...iTask, ...{ type: "famous" }}, tasks: [ ...stats.famous ], type: "famous" });
        }
        this.log.methodDone("save task run details", 2, logPad);
    };


    private trackFamous = (taskItem: TaskItem, iTask: ITeTask, stats: ITaskUsageStats, usage: ITeTrackedUsage) =>
    {
        let added = false,
            changed = false;
        const specTaskListLength = this.wrapper.config.get<number>(ConfigProps.SpecialFolders_NumLastTasks);
        //
        // First remove this task from the list of it is present, it'll be put back
        // in the following steps
        //
        const nITaskIdx = stats.famous.findIndex(t => t.treeId === taskItem.id);
        if (nITaskIdx !== -1) {
            stats.famous.splice(nITaskIdx, 1);
        }
        //
        // Scan the set of most used / famous tasks, and insert this task into the list
        // based on task run count, if it makes the cut
        //
        for (let f = 0; f < stats.famous.length; f++)
        {
            if (usage.count.total > stats.famous[f].runCount.total)
            {
                stats.famous.splice(f, 0, { ...iTask, ...{ type: "famous" }});
                if (stats.famous.length > specTaskListLength) {
                    stats.famous.pop();
                }
                if (f === 0) { // There's a new most famous/used task
                    stats.taskMostUsed = { ...iTask, ...{ type: "famous" }};
                }
                added = changed = true;
                break;
            }
        }
        //
        // If the task was not added to the list in the above loop, and there are less than
        // the max # oof famous tasks to store, then this task by default makes the cut, just
        // like a trophy for a 10th place finisher.
        //
        if (!added && stats.famous.length < specTaskListLength)
        {
            changed = true;
            stats.famous.push({ ...iTask, ...{ type: "famous" }});
            if (stats.famous.length === 1) {
                stats.taskMostUsed = { ...iTask, ...{ type: "famous" }};
            }
        }
        return changed;
    };

}
