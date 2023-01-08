/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import figures from "../figures";
import { appendFileSync } from "fs";
import { dirname, join } from "path";
import { createDir } from "./fs";
import { configuration } from "./configuration";
import { isArray, isError, isFunction, isObject, isObjectEmpty, isString } from "./utils";
import { OutputChannel, ExtensionContext, commands, window, workspace, ConfigurationChangeEvent } from "vscode";
import { stringify } from "json5";

export interface IMsgQueueItem
{
    fn: any;
    args: any[];
    scope: any;
}

const tzOffset = (new Date()).getTimezoneOffset() * 60000;
const logValueWhiteSpace = 45;
const msgQueue: { [queueId: string]:  IMsgQueueItem[] } = {};

let enable = false;
let enableFile = false;
let enableFileSymbols = false;
let enableOutputWindow = false;
let fileName = "";
let isTests = false;
let logLevel = -1;
let writeToConsole = false;
let writeToConsoleLevel = 2;
let lastErrorMesage: string[] = [];
let lastWriteWasBlank = false;
let lastWriteWasBlankError = false;
let lastWriteToConsoleWasBlank = false;
let logOutputChannel: OutputChannel | undefined;


export function blank(level?: number, queueId?: string)
{
    write("", level, "", queueId);
}


export const colors = figures.colors;


export function dequeue(queueId: string)
{
    if (msgQueue[queueId])
    {
        msgQueue[queueId].forEach((l) =>
        {
            l.fn.call(l.scope, ...l.args);
        });
        delete msgQueue[queueId];
    }
}


export const error = (msg: any, params?: (string|any)[][], queueId?: string) => _error(msg, params, queueId);


function errorConsole(msg: string, symbols: [ string, string ], queueId?: string)
{
    writeToConsole = true;
    enableFile = false;
    enableOutputWindow = false;
    write(symbols[0] + " " + msg, 0, "", queueId, false, true);
}


function errorFile(msg: string, symbols: [ string, string ])
{
    writeToConsole = false;
    enableFile = true;
    enableOutputWindow = false;
    if (enableFileSymbols) {
        write(symbols[1] + " " + msg, 0, "", undefined, false, true);
    }
    else if (msg) {
        write(msg, 0, "", undefined, false, true);
    }
}


function errorOutputWindow(msg: string, symbols: [ string, string ])
{
    writeToConsole = false;
    enableFile = false;
    enableOutputWindow = true;
    write(symbols[1] + " " + msg, 0, "", undefined, false, true);
}


const errorWriteLogs = (lMsg: string | undefined, fileOn: boolean, outWinOn: boolean, symbols: [ string, string ], queueId?: string) =>
{
    if (lMsg !== undefined)
    {
        errorConsole(lMsg, symbols, queueId);
        if (fileOn) errorFile(lMsg, symbols);
        if (outWinOn) errorOutputWindow(lMsg, symbols);
    }
};


const errorParse = (err: any, symbols: [ string, string ], queueId?: string, callCount = 0, accumulated: string[] = []) =>
{
    let eMsg: string | undefined;
    if (!err) {
        return accumulated;
    }
    if (isString(err))
    {
        eMsg = err;
    }
    else if (isError(err))
    {
        if (err.stack) {
            eMsg = err.stack;
        }
        else { eMsg = err.message; }
    }
    else if (isArray(err))
    {
        err.forEach((m: any) => errorParse(m, symbols, queueId, ++callCount, accumulated));
        return accumulated;
    }
    else if (isObject(err))
    {
        if (err.messageX) {
            eMsg = err.messageX;
        }
        else if (err.message) {
            eMsg = err.message;
        }
        else if (isObjectEmpty(err)) {
            eMsg = "{} (empty object)";
        }
        else if (isFunction(err.toString)) {
            eMsg = err.toString();
        }
    }
    else if (err && isFunction(err.toString)) {
        eMsg = err.toString();
    }
    if (eMsg)
    {
        accumulated.push(eMsg);
    }
    return accumulated;
};


function _error(msg: any, params?: (string|any)[][], queueId?: string, symbols: [ string, string ] = [ "", "" ])
{
    if (!msg) {
        return;
    }
    const currentWriteToConsole = writeToConsole;
    const currentWriteToFile = enableFile;
    const currentWriteToOutputWindow = enableOutputWindow;
    const errMsgs = errorParse(msg, symbols, queueId);
    if (!symbols || !symbols[0]) symbols = [ figures.color.error, figures.error ];

    if (lastErrorMesage[0] === errMsgs[0])
    {
        if (!isArray(msg)) {
            return;
        }
        if (errMsgs[1] === lastErrorMesage[1] && errMsgs.length === lastErrorMesage.length) {
            return;
        }
    }
    lastErrorMesage = errMsgs;

    if (!lastWriteWasBlankError && !lastWriteToConsoleWasBlank)
    {
        errorWriteLogs("", currentWriteToFile, currentWriteToOutputWindow, symbols, queueId);
    }

    errMsgs.forEach((m) => errorWriteLogs(m, currentWriteToFile, currentWriteToOutputWindow, symbols, queueId));

    if (params)
    {
        for (const [ n, v, l ] of params)
        {
            enableFile = false;
            writeToConsole = true;
            enableOutputWindow = false;
            value(symbols[0] + "   " + n, v, 0, "", queueId);
            if (currentWriteToFile)
            {
                enableFile = true;
                writeToConsole = false;
                enableOutputWindow = false;
                if (enableFileSymbols) {
                    value(symbols[1] + "   " + n, v, 0, "", queueId);
                }
                else if (msg) {
                    value("   " + n, v, 0, "", queueId);
                }
            }
            if (currentWriteToOutputWindow)
            {
                enableFile = false;
                writeToConsole = false;
                enableOutputWindow = true;
                value(symbols[1] + "   " + n, v, 0, "", queueId);
            }
        }
    }

    errorWriteLogs("", currentWriteToFile, currentWriteToOutputWindow, symbols, queueId);

    writeToConsole = currentWriteToConsole;
    enableFile = currentWriteToFile;
    enableOutputWindow = currentWriteToOutputWindow;

    lastWriteWasBlank = true;
    lastWriteWasBlankError = true;
    lastWriteToConsoleWasBlank = true;
}


export async function initLog(settingGrpName: string, dispName: string, context: ExtensionContext, testsRunning: boolean)
{
    function showLogOutput(show: boolean)
    {
        if (logOutputChannel && show) {
            logOutputChannel.show();
        }
    }

    isTests = testsRunning;
    enable = configuration.get<boolean>("logging.enable", false);
    logLevel = configuration.get<number>("logging.level", 1);
    enableOutputWindow = configuration.get<boolean>("logging.enableOutputWindow", true);
    enableFile = configuration.get<boolean>("logging.enableFile", false);
    enableFileSymbols = configuration.get<boolean>("logging.enableFileSymbols", true);
    fileName = join(context.logUri.fsPath, getFileName());
    await createDir(dirname(fileName));

    //
    // Set up a log in the Output window (even if enableOutputWindow is off)
    //
    logOutputChannel = window.createOutputChannel(dispName);
    context.subscriptions.push(logOutputChannel);
    context.subscriptions.push(
        commands.registerCommand(settingGrpName + ".showOutput", showLogOutput)
    );
    const d = workspace.onDidChangeConfiguration(async e => {
        await processConfigChanges(context, e);
    });
    context.subscriptions.push(d);
    // showLogOutput(showLog || false);

    write("Log has been initialized", 1);
    logLogFileLocation();
}


function getFileName()
{
    const locISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, "");
    return `taskexplorer-${locISOTime}.log`;
}


export const getLogFileName = () => fileName;


export const isLoggingEnabled = () => enable;


function logLogFileLocation()
{
    if (enable && enableFile)
    {
        /* istanbul ignore else */
        if (logOutputChannel)
        {
            logOutputChannel.appendLine("***********************************************************************************************");
            logOutputChannel.appendLine(" Log File: " + fileName);
            logOutputChannel.appendLine("***********************************************************************************************");
        }
        /* istanbul ignore else */
        if (isTests)
        {
            console.log(`    ${figures.color.info} ${withColor("*************************************************************************************", colors.grey)}`);
            console.log(`    ${figures.color.info} ${withColor(" Log File: " + fileName, colors.grey)}`);
            console.log(`    ${figures.color.info} ${withColor("*************************************************************************************", colors.grey)}`);
        }
    }
}


export function methodStart(msg: string, level?: number, logPad = "", doLogBlank?: boolean, params?: (string|any)[][], queueId?: string) // , color?: LogColor)
{
    if (enable)
    {
        const lLevel = level || 1;
        if (doLogBlank === true) {
            blank(lLevel, queueId);
        }
        write("*start* " + msg, lLevel, logPad, queueId); // , color);
        values(lLevel, logPad + "   ", params, false, queueId);
    }
}


export function methodDone(msg: string, level?: number, logPad = "", params?: (string|any)[][], queueId?: string)
{
    if (enable)
    {
        const lLevel = level || 1;
        values(lLevel, logPad + "   ", params, false, queueId);
        write("*done* " + msg, lLevel, logPad, queueId); // , LogColor.cyan);
    }
}


async function processConfigChanges(ctx: ExtensionContext, e: ConfigurationChangeEvent)
{
    if (e.affectsConfiguration("taskExplorer.logging.enable"))
    {
        enable = configuration.get<boolean>("logging.enable", false);
    }
    if (e.affectsConfiguration("taskExplorer.logging.enableOutputWindow"))
    {
        enableOutputWindow = configuration.get<boolean>("logging.enableOutputWindow", true);
    }
    if (e.affectsConfiguration("taskExplorer.logging.enableFile"))
    {
        enableFile = configuration.get<boolean>("logging.enableFile", false);
        logLogFileLocation();
        if (enableFile) {
            window.showInformationMessage("Log file location: " + fileName);
        }
    }
    if (e.affectsConfiguration("taskExplorer.logging.enableFileSymbols"))
    {
        enableFileSymbols = configuration.get<boolean>("logging.enableFileSymbols", true);
    }
    if (e.affectsConfiguration("taskExplorer.logging.level"))
    {
        logLevel = configuration.get<number>("logging.level", -1);
    }
}


export function setWriteToConsole(set: boolean, level = 2)
{
    writeToConsole = set;
    writeToConsoleLevel = level;
}


export function value(msg: string, value: any, level?: number, logPad = "", queueId?: string)
{
    if (enable)
    {
        let logMsg = msg,
            valuePad = "";
        const spaces = msg && msg.length ? msg.length + logPad.length : (value === undefined ? 9 : 4);
        for (let i = spaces; i < logValueWhiteSpace; i++) {
            valuePad += " ";
        }
        logMsg += (valuePad + ": ");

        if (isString(value))
        {
            logMsg += value;
        }
        else if (isArray(value))
        {
            logMsg += `[ ${value.join(", ")} ]`;
        }
        else if (isObject(value))
        {
            try {
                logMsg += JSON.stringify(value, null, 3);
            }
            catch {
                logMsg += value.toString();
            }
        }
        else if (value || value === 0 || value === "" || value === false)
        {
            logMsg += value.toString();
        }
        else if (value === undefined)
        {
            logMsg += "undefined";
        }
        else {
            logMsg += "null";
        }

        write(logMsg, level, logPad, queueId, true);
    }
}


export function values(level: number, logPad: string, params: any | (string|any)[][], doLogBlank?: boolean, queueId?: string)
{
    if (enable && params)
    {
        if (doLogBlank === true) {
            blank(level, queueId);
        }
        for (const [ n, v ] of params) {
            value(n, v, level, logPad, queueId);
        }
    }
}


export const warn = (msg: any, params?: (string|any)[][], queueId?: string) => _error(msg, params, queueId, [ figures.color.warning, figures.warning ]);


export const withColor = figures.withColor;


export function write(msg: string, level?: number, logPad = "", queueId?: string, isValue?: boolean, isError?: boolean) // , color?: LogColor)
{
    if (!enable || msg === null || msg === undefined || (lastWriteWasBlank && msg === "")) {
        return;
    }

    const _write = (fn: (...fnArgs: any) => void, scope: any,  ts: string, isFile: boolean, ...args: any) =>
    {
        const msgs = msg.split("\n").filter(m => !!m.trim());
        let firstLineDone = false,
            valuePad = "";
        if (msgs.length > 1)
        {
            if (isValue)  {
                for (let i = 0; i < logValueWhiteSpace + 2; i++) {
                    valuePad += " ";
                }
            }
            else if (isError && /\[[0-9]{1,2}m/.test(msg))
            {   // \[[0-9]{1,2}m[\W]{1}\[[0-9]{1,2}m/.test(msg)
                for (let m = 1; m < msgs.length; m++) {
                    msgs[m] = figures.color.error + " " + msgs[m];
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
                    if (!msgQueue[queueId]) msgQueue[queueId] = [];
                    msgQueue[queueId].push({
                        fn,
                        scope: scope || window,
                        args: [ ...args, _msg ]
                    });
                }
            }
            else {
                if (!queueId) {
                    fn.call(scope || window, _msg);
                }
                else {
                    if (!msgQueue[queueId]) msgQueue[queueId] = [];
                    msgQueue[queueId].push({
                        fn,
                        scope: scope || window,
                        args: [ _msg ]
                    });
                }
            }
            firstLineDone = true;
        }
    };

    const timeTags = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1).split("T");

    if (enableOutputWindow && logOutputChannel)
    {
        if (!level || level <= logLevel)
        {
            const ts = timeTags.join(" ") + " ";
            _write(logOutputChannel.appendLine, logOutputChannel, ts, false);
        }
    }
    if (writeToConsole)
    {
        if (!level || level <= writeToConsoleLevel || isError)
        {
            const ts = !isTests ? timeTags[1] + " " + figures.pointer + " " : "    ";
            msg = withColor(msg, colors.grey);
            _write(console.log, console, ts, false);
            lastWriteToConsoleWasBlank = false;
        }
    }
    if (enableFile)
    {
        if (!level || level <= logLevel)
        {
            let ts;
            if (enableFileSymbols) {
                ts = timeTags[1]  + " " + figures.pointer + " ";
            }
            else {
                ts = timeTags[1]  + " ";
            }
            _write(appendFileSync, null, ts, true, fileName);
        }
    }

    lastWriteWasBlank = (msg === "");
    if (!isError) {
        lastErrorMesage = [];
        lastWriteWasBlankError = false;
        if (isTests) {
            lastWriteToConsoleWasBlank = false;
        }
    }

}
