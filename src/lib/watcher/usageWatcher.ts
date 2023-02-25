
import { TeWrapper } from "../wrapper";
import { Disposable, Event, EventEmitter } from "vscode";
import { IDictionary, ITeUsageWatcher, TrackedUsage, UsageChangeEvent } from "../../interface";


export class UsageWatcher implements ITeUsageWatcher, Disposable
{
	private _onDidChange = new EventEmitter<UsageChangeEvent | undefined>();


	constructor(private readonly wrapper: TeWrapper) {}


	dispose(): void {}


	get onDidChange(): Event<UsageChangeEvent | undefined>
	{
		return this._onDidChange.event;
	}


	get = (key: string): TrackedUsage | undefined => this.wrapper.storage.get<TrackedUsage>("usages." + key);


	getAll = (key?: string): IDictionary<TrackedUsage> =>
	{
		const storeAll = this.wrapper.storage.get<IDictionary<TrackedUsage>>("usages", {}),
			  store: IDictionary<TrackedUsage> = {};
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
		const usages =  this.wrapper.storage.get<IDictionary<TrackedUsage>>("usages");
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


	async track(key: string): Promise<TrackedUsage>
	{
		let usages =  this.wrapper.storage.get<IDictionary<TrackedUsage>>("usages");
		if (!usages) {
			usages = {}; // as NonNullable<typeof usages>;
		}

		const usedAt = Date.now();

		let usage = usages[key];
		if (!usage)
		{
			usage = {
				count: 1,
				countToday: 1,
				firstUsedAt: usedAt,
				lastUsedAt: usedAt,
			};
			usages[key] = usage;
		}
		else
		{
			const now = Date.now(),
				  lastDate = new Date(usage.lastUsedAt);
			/* istanbul ignore if */
			if (lastDate.getDate() !== new Date(now).getDate()) {
				usage.countToday = 0; // Reset, the day has changed since the last record ran task
			}
			usage.count++;
			usage.countToday++;
			usage.lastUsedAt = usedAt;
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
