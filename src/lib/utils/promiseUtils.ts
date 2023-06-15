
import { Disposable, Event, EventEmitter } from "vscode";
import { PromiseAdapter } from "../../interface/ITeUtilities";


const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);


export const oneTimeEvent = <T>(event: Event<T>): Event<T> =>
{
	return (listener: (e: T) => unknown, thisArgs?: unknown, disposables?: Disposable[]) =>
    {
		const result = event(e => { result.dispose(); return listener.call(thisArgs, e); }, null, disposables);
		return result;
	};
};


/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export const promiseFromEvent = <T, U>(event: Event<T>, adapter: PromiseAdapter<T, U> = passthrough): { promise: Promise<U>; cancel: EventEmitter<void> } =>
{
    let subscription: Disposable;
    const cancel = new EventEmitter<void>();

    return {
        promise: new Promise<U>((resolve, reject) =>
        {
            cancel.event(/* istanbul ignore next */_ => reject("Cancelled"));
            subscription = event((value: T) =>
            {
                try {
                    Promise.resolve(adapter(value, resolve, reject)).catch(reject);
                }
                catch (error) { /* istanbul ignore next */reject(error); }
            });
        })
        .then((result: U) =>
        {
            subscription.dispose();
            return result;
        },
        /* istanbul ignore next */
        error =>
        {
            subscription.dispose();
            throw error;
        }),
        cancel
    };
};
