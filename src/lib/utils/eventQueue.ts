
import { TeWrapper } from "../wrapper";
import { Disposable, Event, EventEmitter } from "vscode";
import { IEventQueue, IEventTask } from "../../interface";


export class EventQueue implements IEventQueue, Disposable
{
    private _currentEvent: IEventTask | undefined;
    private readonly _disposables: Disposable[];
    private readonly _onReady: EventEmitter<void>;
    private readonly _eventQueue: IEventTask[];
    // private readonly _delayTimers: { key: string; timer: NodeJS.Timeout }[];

    constructor(private readonly wrapper: TeWrapper)
	{
		this._eventQueue = [];
        this._disposables = [];
		// this._delayTimers = [];
		this._onReady = new EventEmitter<void>();
        this._disposables.push(
            this._onReady
        );
	}

	dispose = () => this._disposables.splice(0).forEach(d => d.dispose());
    // dispose = () =>
    // {
    //     this._eventQueue.splice(0);
    //     this._delayTimers.splice(0).forEach(/* ist  anbul ignore next */(ti) => clearTimeout(ti.timer));
    // };


    get onReady(): Event<void> { return this._onReady.event; }

    // private getKey = (e: IEventTask) => `cache-key-${e.owner}-${e.type}-${e.event}`;


	isBusy(owner: string) { return !!this._currentEvent && this._currentEvent.owner === owner; }


    private compareEvents = (e: IEventTask, e2: IEventTask, skipEventName = false) =>
        e.owner === e2.owner && e.type === e2.type && (skipEventName || e.event === e2.event);


    private compareDebounceEvent = (e: IEventTask, e2: IEventTask) =>
        this.compareEvents(e, e2, true) && e2.event.startsWith(<string>e.debounceEvent);


    private queueIfNeeded = (e: IEventTask) =>
    {
        const ce = !e.ignoreActive || e.debounceEvent ? this._currentEvent : undefined,
              has = (ce && (this.compareEvents(e, ce) || (e.debounceEvent && this.compareDebounceEvent(e, ce)))) ||
                    !!this._eventQueue.find(ev => this.compareEvents(e, ev)) ||
                    (e.debounceEvent && !!this._eventQueue.find(de => this.compareDebounceEvent(e, de)));
        if (!has)
        {
            this.wrapper.log.methodOnce("queue", "queue event", 1, "", [
                [ "event", e.event ], [ "# of events currently pending", this._eventQueue.length ]
            ]);
            this._eventQueue.push(e);
        }
    };


    private processEvent = async (e: IEventTask) =>
    {
        try {
            if (e.waitReady === true) {
                await this.wrapper.waitReady([ this, e.scope ]);
            }
            await e.fn.call(e.scope, ...e.args);
        }
        catch {}
        finally { void this.processQueue(); }
    };


    private processQueue = async () =>
    {
        const next = this._currentEvent = this._eventQueue.shift();
        if (next)
        {
            let argCt = 0;
            this.wrapper.log.methodOnce("queue", "process event", 1, "", [
                [ "next event", next.event ], [ "# of events still pending", this._eventQueue.length ],
                ...next.args.filter(a => this.wrapper.typeUtils.isPrimitive(a)).map(a => [ `arg ${++argCt}`, a ])
            ]);
            await this.processEvent(next);
        }
        else {
            this.wrapper.log.methodOnce("queue", "process events complete, queue empty", 1, "");
            this._onReady.fire();
        }
    };


    // private timedQueue = (e: IEventTask) =>
    // {
    //     popIfExistsBy(this._delayTimers, v => v.key === this.getKey(e));
    //     return this.queue(e);
    // };


    queue = async (e: IEventTask) =>
    {
        if (!this._currentEvent)
        {
            this._currentEvent = e;
            await this.processEvent(e);
        }
        else { this.queueIfNeeded(e); }
    };


    // queue = async (e: IEventTask) =>
    // {
    //     if (isNumber(e.delay))
    //     {
    //         const key = this.getKey(e),
    //               cTIdx = this._delayTimers.findIndex(ti => ti.key === key);
    //         if (cTIdx !== -1) {
    //             clearTimeout(this._delayTimers.splice(cTIdx, 1)[0].timer);
    //         }
    //         await new Promise<void>((resolve) =>
    //         {
    //             this._delayTimers.push({
    //                 key, timer: setTimeout((e2) => resolve(this.timedQueue(e2)), e.delay, pickNot(e, "delay"))
    //             });
    //         });
    //     }
    //     else if (!this.isBusy())
    //     {
    //         this._currentEvent = e;
    //         await this.processEvent(e);
    //     }
    //     else { this.queueIfNeeded(e); }
    // };

}
