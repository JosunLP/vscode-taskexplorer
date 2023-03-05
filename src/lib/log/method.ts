
import { write } from "./write";
import { values } from "./value";


export const methodStart = (msg: string, level?: number, logPad = "", doLogBlank?: boolean, params?: (string|any)[][], queueId?: string) =>
{
    const lLevel = level || 1;
    if (doLogBlank === true) {
        write("", level, "", queueId);
    }
    write("*start* " + msg, lLevel, logPad, queueId); // , color);
    values(lLevel, logPad + "   ", params, queueId);
};


export const methodDone = (msg: string, level?: number, logPad = "", params?: (string|any)[][], queueId?: string) =>
{
    const lLevel = level || 1;
    values(lLevel, logPad + "   ", params, queueId);
    write("*done* " + msg, lLevel, logPad, queueId); // , LogColor.cyan);
};


export const methodOnce = (tag: string, msg: string, level?: number, logPad = "", params?: (string|any)[][], queueId?: string) =>
{
    const lLevel = level || 1;
    write(`*${tag} start* ` + msg, lLevel, logPad, queueId);
    values(lLevel, logPad + "   ", params, queueId);
    write(`*${tag} end* ` + msg, lLevel, logPad, queueId);
};
