
import { TeWrapper } from "../lib/wrapper";
import { pickBy } from "../lib/utils/commonUtils";
import { getDateDifference } from "../lib/utils/utils";
import { ConfigProps, StorageProps } from "../lib/constants";
import { Disposable, EventEmitter, tasks, Event, Task } from "vscode";
import { IDictionary, ILog, ITeTask, ITeTaskChangeEvent, ITeTaskStatusChangeEvent, ITeTrackedUsage } from "../interface";

interface ITaskRuntime
{
    end: number;
    start: number;
    time: number;
}

interface ITaskRuntimeInfo
{
    runtimes: ITaskRuntime[];
    average: number;
    fastest: number;
    first: number;
    last: number;
    slowest: number;
}

interface ITaskUsageStats
{
    all: ITeTask[];
    famous: ITeTask[];
    favorites: ITeTask[];
    last: ITeTask[];
    running: ITeTask[];
    runtimes: IDictionary<ITaskRuntimeInfo>;
    taskLastRan: ITeTask;
    taskMostUsed: ITeTask;
    timeLastRan: number;
}


export class TaskUsage implements Disposable
{
    private readonly log: ILog;
    private readonly _usageKey = "task:";
    private readonly _disposables: Disposable[] = [];
    private readonly _onDidFamousTasksChange: EventEmitter<ITeTaskChangeEvent>;


    constructor(private readonly wrapper: TeWrapper)
    {
        this.log = wrapper.log;
        this._onDidFamousTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this._disposables.push(
            this._onDidFamousTasksChange,
            wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this),
			wrapper.treeManager.onDidFavoriteTasksChange(this.onFavoriteTasksChanged, this),
			wrapper.treeManager.onDidLastTasksChange(this.onLastTasksChanged, this)
        );
    }


    dispose()
    {
        this._disposables.forEach(d => d.dispose());
        this._disposables.splice(0);
    }


    get famousTasks(): ITeTask[] {
        return this.getStore().famous;
    }

    get mostUsedTask(): ITeTask {
        return this.getStore().taskMostUsed;
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
        },
        runTime: {
            average: 0,
            fastest: 0,
            first: 0,
            last: 0,
            slowest: 0
        }
    });


    private getStore = (): ITaskUsageStats =>
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
                runtimes: {},
                timeLastRan: 0,
                taskLastRan: this.getEmptyITask(),
                taskMostUsed: this.getEmptyITask()
            };
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


    getRuntimeInfo = (treeId: string): { average: 0; fastest: 0;  first: 0;  last: 0;  slowest: 0 } =>
    {
        const stats = this.getStore();
        if (stats.runtimes[treeId]) {
            return pickBy<any>(stats.runtimes[treeId], k => k !== "runtimes");
        }
        return {
            average: 0,
            fastest: 0,
            first: 0,
            last: 0,
            slowest: 0
        };
    };


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


    getLastRanTaskTime = (): string =>
    {
        const  tm = this.getStore().timeLastRan;
        if (tm) {
            const dt = new Date(tm);
            return dt.toLocaleDateString() + " " + dt.toLocaleTimeString();
        }
        return "N/A";
    };


    private onFavoriteTasksChanged = async(e: ITeTaskChangeEvent) =>
    {
        const stats = this.getStore();
        stats.favorites = [ ...e.tasks ];
        await this.saveStore(stats);
    };


    private onLastTasksChanged = async(e: ITeTaskChangeEvent) =>
    {
        const stats = this.getStore();
        stats.last = [ ...e.tasks ];
        await this.saveStore(stats);
    };


    private onTaskStatusChanged = async(e: ITeTaskStatusChangeEvent) =>
    {
        this.log.methodStart("task usage tracker: on running task changed", 2, "", false, [[ "tree id", e.task.treeId ]]);
        if (e.isRunning)
        {
            e.task.definition.startTime  = Date.now();
            await this.track(e.task, "   ");
        }
        else
        {
            let avg = 0;
            const stats = this.getStore();
            const newRtStats = {
                start: e.task.definition.startTime,
                end: Date.now(),
                time: e.task.definition.endTime - e.task.definition.startTime
            };
            let taskRtStats = stats.runtimes[e.treeId];
            if (!taskRtStats)
            {
                taskRtStats = stats.runtimes[e.treeId] = {
                      runtimes: [],
                      average: newRtStats.time,
                      fastest: newRtStats.time,
                      first: newRtStats.time,
                      last: newRtStats.time,
                      slowest: newRtStats.time
                };
            }
            taskRtStats.runtimes.push(newRtStats);
            taskRtStats.runtimes.forEach(r =>
            {
                avg += r.time;
                if (r.time < taskRtStats.fastest) {
                    taskRtStats.fastest = r.time;
                }
                else if (r.time > taskRtStats.slowest) {
                    taskRtStats.slowest = r.time;
                }
            });
            taskRtStats.last = newRtStats.time;
            taskRtStats.average = parseFloat((avg / taskRtStats.runtimes.length).toFixed(3));
            delete e.task.definition.startTime;
            this.saveStore(stats);
        }
        this.log.methodDone("task usage tracker: on running task changed", 2, "");
    };


    private saveStore = (store: ITaskUsageStats) => this.wrapper.storage.update(StorageProps.TaskUsage, store);


    private track = async(iTask: ITeTask, logPad: string) =>
    {
        const stats = this.getStore(),
              taskName = `${iTask.name} (${iTask.source})`;

        this.log.methodStart("save task run details", 2, logPad, false, [[ "task name", taskName ]]);
        //
        // Process with Usage Tracker and copy usage stats to task usage tracking state
        //
        const usage = await this.wrapper.usage.track(`${this._usageKey}${iTask.treeId}`);
        Object.assign(iTask.runCount, usage.count);
        //
        // Add  to 'famous tasks' list, maybe
        //
        const famousChanged = this.trackFamous(iTask, stats, usage);
        //
        // Record this task as the last task ran and the time it was ran
        //
        stats.timeLastRan = Date.now();
        stats.taskLastRan = { ...iTask };
        //
        // Persist / save stats
        //
        await this.saveStore(stats);
        //
        // Maybe notify any listeners that the `famous tasks` list has changed
        //
        if (famousChanged) {
            this._onDidFamousTasksChange.fire({ task: { ...iTask, ...{ type: "famous" }}, tasks: [ ...stats.famous ], type: "famous" });
        }
        this.log.methodDone("save task run details", 2, logPad);
    };


    private trackFamous = (iTask: ITeTask, stats: ITaskUsageStats, usage: ITeTrackedUsage) =>
    {
        let added = false,
            changed = false;
        const specTaskListLength = this.wrapper.config.get<number>(ConfigProps.SpecialFolders_NumLastTasks);
        //
        // First remove this task from the list of it is present, it'll be put back
        // in the following steps
        //
        const nITaskIdx = stats.famous.findIndex(t => t.treeId === iTask.treeId);
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
