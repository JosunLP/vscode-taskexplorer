
import { TeWrapper } from "../wrapper";
import { Disposable, Event, EventEmitter } from "vscode";

export interface IEventTask
{
    args: any[];
    data?: any;
    debounceEvent?: string;
    event: string;
    ignoreActive?: boolean;
    owner: string;
    scope: any;
    type: string;
    waitReady?: boolean;
    delay?: number;
    fn: (...args: any[]) => unknown | PromiseLike<any>;
}

export interface IEventQueue
{
    isBusy(type?: string): boolean;
    queue(e: IEventTask): Promise<void>;
}


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

    get onReady(): Event<void> {
        return this._onReady.event;
    }


    // private getKey = (e: IEventTask) => `cache-key-${e.owner}-${e.type}-${e.event}`;


	isBusy(type: string) {
		return !!this._currentEvent && this._currentEvent.type === type;
	}


    private queueIfNeeded = (e: IEventTask) =>
    {
        const ce = !e.ignoreActive ? this._currentEvent : undefined,
              // ce = !e.ignoreActive || e.debounceEvent ? this._currentEvent : undefined,
              // debounce = this.wrapper.typeUtils.isString(e.debounceEvent),
              has = (ce && ce.owner === e.owner && ce.type === e.type && ce.event === e.event) ||
                    /* (debounce && !!this._eventQueue.find(e2 => e2 && e2.owner === e.owner && e2.type === e.type && e2.event.startsWith(e.debounceEvent))) || */
                    !!this._eventQueue.find(ev => e.owner === ev.owner && e.type === ev.type && e.event === ev.event);
        if (!has) {
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
        const next = this._currentEvent = <IEventTask>this._eventQueue.shift();
        this.wrapper.log.methodOnce("queue", "process event", 1, "", [
            [ "next event", next.event ], [ "arg1", this.wrapper.typeUtils.isString(next.args[0]) ? next.args[0] : next.args[0].fsPath ],
            [ "arg2", this.wrapper.typeUtils.isUri(next.args[1]) ? next.args[1].fsPath : "none (log padding)" ],
            [ "# of events still pending", this._eventQueue.length ]
        ]);
        if (this._currentEvent) {
            await this.processEvent(this._currentEvent);
        }
        else {
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
