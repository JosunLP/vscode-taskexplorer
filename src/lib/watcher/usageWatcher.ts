
import { TeWrapper } from "../wrapper";
import { Disposable, Event, EventEmitter } from "vscode";
import { IDictionary, ITeUsageWatcher, ITeTrackedUsage, ITeUsageChangeEvent } from "../../interface";


export class UsageWatcher implements ITeUsageWatcher, Disposable
{
	private _onDidChange = new EventEmitter<ITeUsageChangeEvent | undefined>();


	constructor(private readonly wrapper: TeWrapper) {}


	dispose(): void {}


	get onDidChange(): Event<ITeUsageChangeEvent | undefined>
	{
		return this._onDidChange.event;
	}


	get = (key: string): ITeTrackedUsage | undefined => this.wrapper.storage.get<ITeTrackedUsage>("usages." + key);


	getAll = (key?: string): IDictionary<ITeTrackedUsage> =>
	{
		const storeAll = this.wrapper.storage.get<IDictionary<ITeTrackedUsage>>("usages", {}),
			  store: IDictionary<ITeTrackedUsage> = {};
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


	async reset(key?: string): Promise<void>
	{
		const usages =  this.wrapper.storage.get<IDictionary<ITeTrackedUsage>>("usages");
		if (!usages) return;
		if (!key) {
			await  this.wrapper.storage.delete("usages");
			this._onDidChange.fire(undefined);
		}
		else {
			await  this.wrapper.storage.delete("usages." + key);
			this._onDidChange.fire({ key, usage: undefined });
		}
	}


	async track(key: string): Promise<ITeTrackedUsage>
	{
		let usages =  this.wrapper.storage.get<IDictionary<ITeTrackedUsage>>("usages");
		if (!usages) {
			usages = {}; // as NonNullable<typeof usages>;
		}

		const timestamp = Date.now();

		let usage = usages[key];
		if (!usage)
		{
			usage = {
				firstUsedAt: timestamp,
				timestamp,
				timestamps: [ timestamp ],
				count: {
					total: 0,
					today: 0,
					last7Days: 0,
					last14Days: 0,
					last30Days: 0,
					last60Days: 0,
					last90Days: 0
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
				today: usage.timestamps.filter(t => t > timestamp - (1 * dayToMsMultiplier)).length,
				last7Days: usage.timestamps.filter(t => t > timestamp - (7 * dayToMsMultiplier)).length,
				last14Days: usage.timestamps.filter(t => t > timestamp - (14 * dayToMsMultiplier)).length,
				last30Days: usage.timestamps.filter(t => t > timestamp - (30 * dayToMsMultiplier)).length,
				last60Days: usage.timestamps.filter(t => t > timestamp - (60 * dayToMsMultiplier)).length,
				last90Days: usage.timestamps.filter(t => t > timestamp - (90 * dayToMsMultiplier)).length
			};
		}

		//
		// TODO - Telemetry
		//
		//  this.wrapper.telemetry.sendEvent("usage/track", { "usage.key": key, "usage.count": usage.count });
		await this.wrapper.storage.update("usages", usages);
		this._onDidChange.fire({ key, usage });
		return usage;
	}
}
