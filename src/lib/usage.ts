
import { TeWrapper } from "./wrapper";
import { StorageProps } from "./constants";
import { Disposable, Event, EventEmitter } from "vscode";
import { IDictionary, ITeUsage, ITeTrackedUsage, ITeUsageChangeEvent } from "../interface";

type UsageStore = IDictionary<ITeTrackedUsage>;


export class Usage implements ITeUsage, Disposable
{
	private readonly _disposables: Disposable[];
	private readonly _onDidChange: EventEmitter<ITeUsageChangeEvent | undefined>;


	constructor(private readonly wrapper: TeWrapper)
	{
		this._onDidChange = new EventEmitter<ITeUsageChangeEvent | undefined>();
		this._disposables = [ this._onDidChange ];
	}


	dispose()
    {
        this._disposables.forEach(d => d.dispose());
        this._disposables.splice(0);
    }


	get onDidChange(): Event<ITeUsageChangeEvent | undefined> {
		return this._onDidChange.event;
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
}
