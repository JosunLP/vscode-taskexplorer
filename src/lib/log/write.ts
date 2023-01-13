
import figures from "../figures";
import { logControl } from "./log";
import { appendFileSync } from "fs";
import { window } from "vscode"; // TODO - this is used as scope but thought browser 'window' duh

const colors = figures.colors;
// let lastWriteMsg: string | undefined;


// const shouldSkip = (msg: string) =>
// {
//     let should = msg === null || msg === undefined || (logControl.lastWriteWasBlank && msg === "");
//     if (!should && (msg.includes("***") || msg.includes("!!!")))
//     // if (!should && msg.replace(/(?:\[[0-9]{1,2}m|\[[0-9]{1,2}m[\W]{1}\[[0-9]{1,2}m)/g, "").trim().length <= 3)
//     {   // skip double '!!! ' and "*** " writes
//         should = msg === lastWriteMsg;
//         lastWriteMsg = msg;
//     }
//     return should;
// };


const _write = (msg: string, logPad: string, queueId: string | undefined, isValue: boolean, isError: boolean,
                fn: (...fnArgs: any) => void, scope: any,  ts: string, isFile: boolean, ...args: any) =>
{
    const msgs = msg.split("\n").filter(m => !!m.trim());
    let firstLineDone = false,
        valuePad = "";
    if (msgs.length > 1)
    {
        if (isValue)  {
            for (let i = 0; i < logControl.logValueWhiteSpace + 2; i++) {
                valuePad += " ";
            }
        }
        else if (isError && /\[[0-9]{1,2}m/.test(msg))
        {   // / \[[0-9]{1,2}m[\W]{1}\[[0-9]{1,2}m/.test(msg)
            for (let m = 1; m < msgs.length; m++) {
                msgs[m] = (!logControl.isTests || !logControl.isTestsBlockScaryColors ? figures.color.error : figures.color.errorTests) + " " + msgs[m];
            }
        }
    }
    for (const m of msgs)
    {
        const _logPad = isValue && firstLineDone ? valuePad : logPad;
        const _msg = ts + _logPad + m.trimEnd() + (isFile ? "\n" : "");
        if (args && args.length > 0) {
            if (!queueId) {
                fn.call(scope || window, ...args, _msg);
            }
            else {
                if (!logControl.msgQueue[queueId]) logControl.msgQueue[queueId] = [];
                logControl.msgQueue[queueId].push({
                    fn,
                    scope: scope || window,
                    args: [ ...args, _msg ]
                });
            }
        }
        else {
            if (!queueId) {
                fn.call(scope || /* istanbul ignore next */window, _msg);
            }
            else {
                if (!logControl.msgQueue[queueId]) logControl.msgQueue[queueId] = [];
                logControl.msgQueue[queueId].push({
                    fn,
                    scope: scope || /* istanbul ignore next */window,
                    args: [ _msg ]
                });
            }
        }
        firstLineDone = true;
    }
};


const write = (msg: string, level?: number, logPad = "", queueId?: string, isValue?: boolean, isError?: boolean) =>
{
    // if (shouldSkip(msg)) {
    if (msg === null || msg === undefined || (logControl.lastWriteWasBlank && msg === "")) {
        return;
    }

    const timeTags = (new Date(Date.now() - logControl.tzOffset)).toISOString().slice(0, -1).split("T");

    if (logControl.enableOutputWindow && logControl.logOutputChannel)
    {
        if (!level || level <= logControl.logLevel)
        {
            const ts = timeTags.join(" ") + " ";
            _write(msg, logPad, queueId, !!isValue, !!isError, logControl.logOutputChannel.appendLine, logControl.logOutputChannel, ts, false);
        }
    }
    if (logControl.writeToConsole)
    {
        if (!level || level <= logControl.writeToConsoleLevel || isError)
        {
            const ts = !logControl.isTests ? /* istanbul ignore next */timeTags[1] + " " + figures.pointer + " " : "    ";
            msg = figures.withColor(msg, colors.grey);
            _write(msg, logPad, queueId, !!isValue, !!isError, console.log, console, ts, false);
            logControl.lastWriteToConsoleWasBlank = false;
        }
    }
    if (logControl.enableFile)
    {
        if (!level || level <= logControl.logLevel)
        {
            let ts;
            if (logControl.enableFileSymbols) {
                ts = timeTags[1]  + " " + figures.pointer + " ";
            }
            else {
                ts = timeTags[1]  + " ";
            }
            _write(msg, logPad, queueId, !!isValue, !!isError, appendFileSync, null, ts, true, logControl.fileName);
        }
    }

    logControl.lastWriteWasBlank = (msg === "");
    if (!isError) {
        logControl.lastErrorMesage = [];
        logControl.lastWriteWasBlankError = false;
        /* istanbul ignore else */
        if (logControl.isTests) {
            logControl.lastWriteToConsoleWasBlank = false;
        }
    }

};

export default write;
