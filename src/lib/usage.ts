
import { TeWrapper } from "./wrapper";
import { ConfigurationChangeEvent, Disposable, Event, EventEmitter } from "vscode";
import {
    ITeUsage, ITeTrackedUsage, ITeUsageChangeEvent, ITeTask, ITeTaskChangeEvent, ITeTaskStatusChangeEvent,
    ILog, ITaskRuntimeInfo, ITeTaskStats
} from "../interface";

type UsageStore = Record<string, ITeTrackedUsage>;


export class Usage implements ITeUsage, Disposable
{
    private _trackUsage: boolean;
    private _trackTaskStats: boolean;
    private _allowUsageReporting: boolean;
    private readonly log: ILog;
    private readonly _taskUsageKey = "task:";
    private readonly _disposables: Disposable[] = [];
    private readonly _runStartTimes: Record<string, number> = {};
    private readonly _onDidFamousTasksChange: EventEmitter<ITeTaskChangeEvent>;
	private readonly _onDidChange: EventEmitter<ITeUsageChangeEvent | undefined>;


	constructor(private readonly wrapper: TeWrapper)
	{
        this.log = wrapper.log;
        this._onDidFamousTasksChange = new EventEmitter<ITeTaskChangeEvent>();
		this._onDidChange = new EventEmitter<ITeUsageChangeEvent | undefined>();
        this._trackUsage = this.wrapper.config.get<boolean>(wrapper.keys.Config.TrackUsage, true);
        this._trackTaskStats = this.wrapper.config.get<boolean>(wrapper.keys.Config.TaskMonitorTrackStats, true);
        this._allowUsageReporting = this.wrapper.config.get<boolean>(wrapper.keys.Config.AllowUsageReporting, false);
		this._disposables.push(
			this._onDidChange,
			this._onDidFamousTasksChange,
            wrapper.config.onDidChange(this.onConfigChanged, this),
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


	get = (key: string): ITeTrackedUsage | undefined =>
    {
        const usage = this.wrapper.storage.get<UsageStore>(this.wrapper.keys.Storage.Usage, {})[key];
        if (usage){
            usage.taskStats = this.getTaskUsageStore().runtimes[key.replace(this._taskUsageKey, "")];
        }
        return usage;
    };


	getAll = (key?: string): UsageStore =>
	{
		const storeAll = this.wrapper.storage.get<UsageStore>(this.wrapper.keys.Storage.Usage, {}),
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


    getAvgRunCount = (period: "d" | "w", logPad: string): number =>
    {
        const now = Date.now();
        let avg = 0,
            lowestTime = now;
        this.log.methodStart("get average run count", 2, logPad, false, [[ "period", period ]]);
        const taskStats = this.getAll(this._taskUsageKey);
        Object.keys(taskStats).forEach(k =>
        {
            if (taskStats[k].timestamp < lowestTime)  {
                lowestTime = taskStats[k].timestamp ;
            }
        });
        const daysSinceFirstRunTask = this.wrapper.utils.getDateDifference(lowestTime, now, "d")  || 1;
        avg = Math.floor(Object.keys(taskStats).length / daysSinceFirstRunTask / (period === "d" ? 1 : 7));
        this.log.methodDone("get average run count", 2, logPad, [[ "calculated average", avg ]]);
        return avg;
    };


	private getEmptyITask = (): ITeTask =>
    ({
        name: "N/A",
        fsPath: "",
        listType: "all",
        pinned: false,
        running: false,
        source: "Workspace",
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
        runTime: this.getEmptyITaskRuntimeInfo()
    });


    private getEmptyITaskRuntimeInfo = (): ITaskRuntimeInfo => (
    {
        average: 0,
        fastest: 0,
        first: 0,
        last: 0,
        slowest: 0,
        avgDown: false,
        avgUp: false,
        lastDown: false,
        lastUp: false,
        newFast: false,
        newSlow: false
    });


    getRuntimeInfo = (treeId: string): ITaskRuntimeInfo =>
    {
        const stats = this.getTaskUsageStore();
        if (stats.runtimes[treeId]) {
            return this.wrapper.objUtils.pickBy<any>(stats.runtimes[treeId], k => k !== "runtimes");
        }
        return this.getEmptyITaskRuntimeInfo();
    };


    private getTaskUsageStore = (): ITeTaskStats =>
    {
        let store = this.wrapper.storage.get<ITeTaskStats>(this.wrapper.keys.Storage.TaskUsage);
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


    getTodayCount = (logPad: string) =>
    {
        let count = 0;
        this.log.methodStart("get today run count", 2, logPad);
        const taskStats = this.getAll();
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
            // const dt = new Date(ms - tzOffset); // TODO - CHeck need tzOffset
            return dt.toLocaleDateString() + " " + dt.toLocaleTimeString();
        }
        return "N/A";
    };


    private onFavoriteTasksChanged = async(e: ITeTaskChangeEvent) =>
    {
        if (this._trackUsage  && this._trackTaskStats)
        {
            const stats = this.getTaskUsageStore();
            stats.favorites = [ ...e.tasks ];
            await this.saveTaskUsageStore(stats);
        }
    };


    private onLastTasksChanged = async(e: ITeTaskChangeEvent) =>
    {
        if (this._trackUsage  && this._trackTaskStats)
        {
            const stats = this.getTaskUsageStore();
            stats.last = [ ...e.tasks ];
            await this.saveTaskUsageStore(stats);
        }
    };


    private onConfigChanged = (e: ConfigurationChangeEvent) =>
    {
        if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.TrackUsage))
        {
            this._trackUsage = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TrackUsage, true);
        }
        if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.TaskMonitorTrackStats))
        {
            this._trackTaskStats = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TaskMonitorTrackStats, true);
            if (this._trackTaskStats && !this._trackUsage)
            {
                this._trackUsage = this._trackTaskStats;
                void this.wrapper.config.update(this.wrapper.keys.Config.TrackUsage, this._trackTaskStats);
            }
        }
        if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.AllowUsageReporting))
        {
            this._allowUsageReporting = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.AllowUsageReporting, false);
        }
    };


    private onTaskStatusChanged = async(e: ITeTaskStatusChangeEvent) =>
    {
        const logPad = this.log.lastPad,
              taskName = `${e.task.name} (${e.task.source})`;
        this.log.methodStart("task usage tracker: on running task changed", 2, logPad, false, [
            [ "task name", taskName ], [ "tree id", e.task.treeId ], [ "is running", e.isRunning ],
            [ "track usage enabled", this._trackUsage ], [ "track tasks enabled", this._trackTaskStats ]
        ]);
        if (this._trackUsage && this._trackTaskStats)
        {
            if (e.isRunning)
            {
                this._runStartTimes[e.treeId] = Date.now();
                await this.trackTask(e.task, logPad + "   ");
            }
            else {
                await this.trackTaskRuntime(e.task, logPad + "   ");
            }
        }
        this.log.methodDone("task usage tracker: on running task changed", 2, logPad);
    };


	async reset(key?: string): Promise<void>
	{
		const usages =  this.wrapper.storage.get<UsageStore>(this.wrapper.keys.Storage.Usage);
		if (!usages) return;
		if (!key)
        {
			await this.wrapper.storage.delete(this.wrapper.keys.Storage.Usage);
            await this.wrapper.storage.delete(this.wrapper.keys.Storage.TaskUsage);
			this._onDidChange.fire(undefined);
		}
		else {
			await this.wrapper.storage.delete(`${this.wrapper.keys.Storage.Usage}.${key}`);
			await this.wrapper.storage.delete(`${this.wrapper.keys.Storage.TaskUsage}.${key}`);
			this._onDidChange.fire({ key, usage: undefined });
		}
	}


    private saveTaskUsageStore = (store: ITeTaskStats) => this.wrapper.storage.update(this.wrapper.keys.Storage.TaskUsage, store);


	async track(key: string): Promise<ITeTrackedUsage | undefined>
	{
        if (!this._trackUsage) {
            return;
        }

		const timestamp = Date.now(),
			  usages =  this.wrapper.storage.get<UsageStore>(this.wrapper.keys.Storage.Usage, {});

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

		await this.wrapper.storage.update(this.wrapper.keys.Storage.Usage, usages);

		//
		// TODO - Telemetry
		//
		//  this.wrapper.telemetry.sendEvent("usage/track", { "usage.key": key, "usage.count": usage.count });

        //
        // Fire usage change event
        // If the key is the task usage key `task:`, then skip firing the event, as trackTask() will
        // for the event once finished recording stats
        //
        if (!key.startsWith(this._taskUsageKey)) {
		    this._onDidChange.fire({ key, usage });
        }

		return usage;
	}


    private trackFamousTasks = (iTask: ITeTask, stats: ITeTaskStats, usage: ITeTrackedUsage) =>
    {
        let added = false,
            changed = false;
        const specTaskListLength = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFoldersNumLastTasks, 10);
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


    private trackTask = async (iTask: ITeTask, logPad: string) =>
    {
        const stats = this.getTaskUsageStore();
        this.log.methodStart("track task usage details", 2, logPad);

        //
        // Process with Usage Tracker and copy usage stats to task usage tracking state
        //
        const usage = await this.track(`${this._taskUsageKey}${iTask.treeId}`) as ITeTrackedUsage;
        Object.assign(iTask.runCount, usage.count);
        // Object.assign(iTask.runTime, {
        //     avgDown: false,
        //     avgUp: false,
        //     lastDown: false,
        //     lastUp: false,
        //     newFast: false,
        //     newSlow: false
        // });
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
        // Fire usage  change event and maybe the `famous tasks` list change event
        //
        this._onDidChange.fire({ key: this._taskUsageKey, usage });
        if (famousChanged) {
            this._onDidFamousTasksChange.fire({ task: { ...iTask, ...{ listType: "famous" }}, tasks: [ ...stats.famous ], type: "famous" });
        }
        this.log.methodDone("track task usage details", 2, logPad);
    };


    private trackTaskRuntime = async(iTask: ITeTask, logPad: string) =>
    {
        let avg = 0;
        const now = Date.now(),
              stats = this.getTaskUsageStore();
        this.log.methodStart("track task runtime details", 2, logPad);
        //
        // Create runtime stats and add to stats store
        //
        const newRtStats = {
            start: this._runStartTimes[iTask.treeId],
            end: now,
            time: now - this._runStartTimes[iTask.treeId]
        };
        let taskRtStats = stats.runtimes[iTask.treeId];
        if (!taskRtStats)
        {
            taskRtStats = stats.runtimes[iTask.treeId] = {
                runtimes: [],
                average: newRtStats.time,
                fastest: newRtStats.time,
                first: newRtStats.time,
                last: newRtStats.time,
                slowest: newRtStats.time,
                avgDown: false,
                avgUp: false,
                lastDown: false,
                lastUp: false,
                newFast: false,
                newSlow: false
            };
        }
        //
        // Clear flags in base stats object
        //
        Object.assign(taskRtStats, {
            avgDown: false,
            avgUp: false,
            lastDown: false,
            lastUp: false,
            newFast: false,
            newSlow: false
        });
        //
        // Check fastest runtime, was this time was the fastest?
        //
        if (newRtStats.time < taskRtStats.fastest || (this.wrapper.tests && taskRtStats.runtimes.length % 3 === 0)) {
            taskRtStats.fastest = newRtStats.time;
            taskRtStats.newFast = true;
        }
        //
        // Check slowest runtime, was this time was the slowest?
        //
        else if (newRtStats.time > taskRtStats.slowest) {
            taskRtStats.slowest = newRtStats.time;
            taskRtStats.newSlow = true;
        }
        //
        // Record last runtime
        //
        const newLast = newRtStats.time;
        taskRtStats.lastDown = newLast < taskRtStats.last;
        taskRtStats.lastUp = newLast > taskRtStats.last;
        taskRtStats.last = newRtStats.time;
        //
        // Record avg runtime
        //
        avg = newRtStats.time;
        taskRtStats.runtimes.forEach(r =>  avg += r.time);
        const newAvg = parseFloat((avg / (taskRtStats.runtimes.length + 1)).toFixed(3));
        taskRtStats.avgDown = newAvg < taskRtStats.average;
        taskRtStats.avgUp = newAvg > taskRtStats.average;
        taskRtStats.average = newAvg;
        //
        // Record the current runtime stats instance in the runtimes array
        //
        taskRtStats.runtimes.push(newRtStats);
        //
        // Add setting for # of days to keep stored stats, and clean runtimes array here
        //
        /* istanbul ignore next */
        taskRtStats.runtimes.slice().reverse().forEach((rt, index, object) =>
        {
            if (!rt.start || !rt.end)
            {
                taskRtStats.runtimes.splice(object.length - 1 - index, 1);
            }
            //
            // TODO - Add setting for # of days to keep stored stats, and clean runtimes array here
            //
            const keepStatsForDays = 0; // this.wrapper.config.get<boolean>(this.wrapper.keys.Config.);
            if (keepStatsForDays > 0 && rt.end < now - (1000 * 60 * 60 * (keepStatsForDays * 24))) {}
        });
        //
        // Remove the temp runtime start time from the startTime dictionary
        //
        delete this._runStartTimes[iTask.treeId];
        //
        // Update reference iTask with new calculated runtimes
        //
        Object.assign(iTask.runTime, this.wrapper.objUtils.pickBy(taskRtStats, t => t !== "runtimes"));
        //
        // Persist / save stats
        //
        await this.saveTaskUsageStore(stats);
        this.log.methodDone("track task runtime details", 2, logPad);
    };

}
