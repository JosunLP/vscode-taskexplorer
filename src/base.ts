import { ILog } from "./interface";
import { log as coreLog } from "./lib/log/log";

export abstract class TeBase
{
    protected enableLog = false;

    protected log =
    {
        blank: this.enableLog ? coreLog.blank : () => {},
        dequeue: this.enableLog ? coreLog.dequeue : () => {},
        error: this.enableLog ? coreLog.error : () => {},
        methodStart: this.enableLog ? coreLog.methodStart : () => {},
        methodDone: this.enableLog ? coreLog.methodDone : () => {},
        methodOnce: this.enableLog ? coreLog.methodOnce : () => {},
        value: this.enableLog ? coreLog.value : () => {},
        values: this.enableLog ? coreLog.values : () => {},
        warn: this.enableLog ? coreLog.warn : () => {},
        withColor: this.enableLog ? coreLog.withColor : () => {},
        write: this.enableLog ? coreLog.write : () => {}
    };
}
