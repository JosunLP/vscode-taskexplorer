
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
