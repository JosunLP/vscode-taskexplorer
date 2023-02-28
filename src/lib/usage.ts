
import { TeWrapper } from "./wrapper";
import { ConfigProps, StorageProps } from "./constants";
import { Disposable, Event, EventEmitter } from "vscode";
import { IDictionary, ITeUsage, ITeTrackedUsage, ITeUsageChangeEvent, ITeTask, ITeTaskChangeEvent, ITeTaskStatusChangeEvent, ILog } from "../interface";
import { pickBy } from "./utils/commonUtils";
import { getDateDifference } from "./utils/utils";

type UsageStore = IDictionary<ITeTrackedUsage>;

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

export class Usage implements ITeUsage, Disposable
{
    private readonly log: ILog;
    private readonly _taskUsageKey = "task:";
    private readonly _disposables: Disposable[] = [];
    private readonly _runStartTimes: IDictionary<number> = {};
    private readonly _onDidFamousTasksChange: EventEmitter<ITeTaskChangeEvent>;
	private readonly _onDidChange: EventEmitter<ITeUsageChangeEvent | undefined>;


	constructor(private readonly wrapper: TeWrapper)
	{
        this.log = wrapper.log;
        this._onDidFamousTasksChange = new EventEmitter<ITeTaskChangeEvent>();
		this._onDidChange = new EventEmitter<ITeUsageChangeEvent | undefined>();
		this._disposables.push(
			this._onDidChange,
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
        return this.getTaskUsageStore().famous;
    }

    get mostUsedTask(): ITeTask {
        return this.getTaskUsageStore().taskMostUsed;
    }

	get onDidChange(): Event<ITeUsageChangeEvent | undefined> {
		return this._onDidChange.event;
	}

	get onDidFamousTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidFamousTasksChange.event;
	}


	get = (key: string): ITeTrackedUsage | undefined => this.wrapper.storage.get<UsageStore>(StorageProps.Usage, {})[key];


	getAll = (key?: string): UsageStore =>
	{
		const storeAll = this.wrapper.storage.get<UsageStore>(StorageProps.Usage, {}),
			  store: UsageStore = {};
		if (!key)
		{
			Object.assign(store, storeAll);
		}
		else
		{
			Object.keys(storeAll).forEach(k =>
			{
				if (k.startsWith(key)) {
					store[k] = { ...storeAll[k] };
				}
			});
		}
		return store;
	};


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


    private getTaskUsageStore = (): ITaskUsageStats =>
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
        const taskStats = this.wrapper.usage.getAll(this._taskUsageKey);
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


    getRuntimeInfo = (treeId: string): { average: 0; fastest: 0;  first: 0;  last: 0;  slowest: 0 } =>
    {
        const stats = this.getTaskUsageStore();
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
        Object.keys(taskStats).filter(k => k.startsWith(this._taskUsageKey)).forEach(k =>
        {
            count += taskStats[k].count.today;
        });
        this.log.methodDone("get today run count", 2, logPad, [[ "today run count", count ]]);
        return count;
    };


    getLastRanTaskTime = (): string =>
    {
        const  tm = this.getTaskUsageStore().timeLastRan;
        if (tm) {
            const dt = new Date(tm);
            return dt.toLocaleDateString() + " " + dt.toLocaleTimeString();
        }
        return "N/A";
    };


    private onFavoriteTasksChanged = async(e: ITeTaskChangeEvent) =>
    {
        const stats = this.getTaskUsageStore();
        stats.favorites = [ ...e.tasks ];
        await this.saveTaskUsageStore(stats);
    };


    private onLastTasksChanged = async(e: ITeTaskChangeEvent) =>
    {
        const stats = this.getTaskUsageStore();
        stats.last = [ ...e.tasks ];
        await this.saveTaskUsageStore(stats);
    };


    private onTaskStatusChanged = async(e: ITeTaskStatusChangeEvent) =>
    {
        const taskName = `${e.task.name} (${e.task.source})`;
        this.log.methodStart("task usage tracker: on running task changed", 2, "", false, [
            [ "task name", taskName ], [ "tree id", e.task.treeId ], [ "is running", e.isRunning ]
        ]);
        if (e.isRunning)
        {
            this._runStartTimes[e.treeId] = Date.now();
            await this.trackTask(e.task, "   ");
        }
        else {
            await this.trackTaskRuntime(e, "   ");
        }
        this.log.methodDone("task usage tracker: on running task changed", 2, "");
    };


	async reset(key?: string): Promise<void>
	{
		const usages =  this.wrapper.storage.get<UsageStore>(StorageProps.Usage);
		if (!usages) return;
		if (!key) {
			await  this.wrapper.storage.delete(StorageProps.Usage);
			this._onDidChange.fire(undefined);
		}
		else {
			await  this.wrapper.storage.delete(`${StorageProps.Usage}.${key}`);
			this._onDidChange.fire({ key, usage: undefined });
		}
	}


    private saveTaskUsageStore = (store: ITaskUsageStats) => this.wrapper.storage.update(StorageProps.TaskUsage, store);



	async track(key: string): Promise<ITeTrackedUsage>
	{
		const timestamp = Date.now(),
			  usages =  this.wrapper.storage.get<UsageStore>(StorageProps.Usage, {});

		let usage = usages[key];
		if (!usage)
		{
			usage = {
				first: timestamp,
				timestamp,
				timestamps: [ timestamp ],
				count: {
					total: 1,
					today: 1,
					last7Days: 1,
					last14Days: 1,
					last30Days: 1,
					last60Days: 1,
					last90Days: 1,
					yesterday: 0
				}
			};
			usages[key] = usage;
		}
		else
		{
			const dayToMsMultiplier = 24 * 60 * 60 * 1000;
			usage.timestamp = timestamp;
			usage.timestamps.push(timestamp); // TODO - add setting for # of days to keep tracked tasks
			usage.count = {
				total: usage.timestamps.length,
				today: usage.timestamps.filter(t => t >= timestamp - (1 * dayToMsMultiplier)).length,
				last7Days: usage.timestamps.filter(t => t >= timestamp - (7 * dayToMsMultiplier)).length,
				last14Days: usage.timestamps.filter(t => t >= timestamp - (14 * dayToMsMultiplier)).length,
				last30Days: usage.timestamps.filter(t => t >= timestamp - (30 * dayToMsMultiplier)).length,
				last60Days: usage.timestamps.filter(t => t >= timestamp - (60 * dayToMsMultiplier)).length,
				last90Days: usage.timestamps.filter(t => t >= timestamp - (90 * dayToMsMultiplier)).length,
				yesterday: usage.timestamps.filter(t => t >= timestamp - (2 * dayToMsMultiplier) && t < timestamp - (1 * dayToMsMultiplier)).length,
			};
		}

		await this.wrapper.storage.update(StorageProps.Usage, usages);
		//
		// TODO - Telemetry
		//
		//  this.wrapper.telemetry.sendEvent("usage/track", { "usage.key": key, "usage.count": usage.count });
		this._onDidChange.fire({ key, usage });
		return usage;
	}


    private trackFamousTasks = (iTask: ITeTask, stats: ITaskUsageStats, usage: ITeTrackedUsage) =>
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
                stats.famous.splice(f, 0, { ...iTask, ...{ listType: "famous", running: false }});
                if (stats.famous.length > specTaskListLength) {
                    stats.famous.pop();
                }
                if (f === 0) { // There's a new most famous/used task
                    stats.taskMostUsed = { ...iTask, ...{ listType: "famous", running: false }};
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
            stats.famous.push({ ...iTask, ...{ listType: "famous", running: false }});
            if (stats.famous.length === 1) {
                stats.taskMostUsed = { ...iTask, ...{ listType: "famous", running: false }};
            }
        }
        return changed;
    };


    private trackTask = async(iTask: ITeTask, logPad: string) =>
    {
        const stats = this.getTaskUsageStore();
        this.log.methodStart("track task usage details", 2, logPad);
        //
        // Process with Usage Tracker and copy usage stats to task usage tracking state
        //
        const usage = await this.wrapper.usage.track(`${this._taskUsageKey}${iTask.treeId}`);
        Object.assign(iTask.runCount, usage.count);
        //
        // Add  to 'famous tasks' list, maybe
        //
        const famousChanged = this.trackFamousTasks(iTask, stats, usage);
        //
        // Record this task as the last task ran and the time it was ran
        //
        stats.timeLastRan = Date.now();
        stats.taskLastRan = { ...iTask };
        //
        // Persist / save stats
        //
        await this.saveTaskUsageStore(stats);
        //
        // Maybe notify any listeners that the `famous tasks` list has changed
        //
        if (famousChanged) {
            this._onDidFamousTasksChange.fire({ task: { ...iTask, ...{ listType: "famous" }}, tasks: [ ...stats.famous ], type: "famous" });
        }
        this.log.methodDone("track task usage details", 2, logPad);
    };


    private trackTaskRuntime = async(e: ITeTaskStatusChangeEvent, logPad: string) =>
    {
        let avg = 0;
        const now = Date.now(),
              stats = this.getTaskUsageStore();
        this.log.methodStart("track task runtime details", 2, logPad);
        //
        // Create runtime stats and add to stats store
        //
        const newRtStats = {
            start: this._runStartTimes[e.treeId],
            end: now,
            time: now - this._runStartTimes[e.treeId]
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
        //
        // Check fastest runtimes, see if this time was the fastest
        //
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
        //
        // Record last and avg runtime
        //
        taskRtStats.last = newRtStats.time;
        taskRtStats.average = parseFloat((avg / taskRtStats.runtimes.length).toFixed(3));
        delete this._runStartTimes[e.treeId];
        //
        // Persist / save stats
        //
        await this.saveTaskUsageStore(stats);
        this.log.methodDone("track task runtime details", 2, logPad);
    };

}
