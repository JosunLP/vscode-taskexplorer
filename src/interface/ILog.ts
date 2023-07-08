
import { IDictionary } from ":types";
import { OutputChannel } from "vscode";

export interface ILogControl
{
    enable: boolean;
    enableFile: boolean;
    enableFileSymbols: boolean;
    enableOutputWindow: boolean;
    fileName: string;
    isTests: boolean;
    isTestsBlockScaryColors: boolean;
    lastErrorMesage: string[];
    lastLogPad: string;
    lastWriteWasBlank: boolean;
    lastWriteWasBlankError: boolean;
    lastWriteToConsoleWasBlank: boolean;
    logLevel: number;
    logOutputChannel: OutputChannel | undefined;
    logValueWhiteSpace: number;
    msgQueue: IDictionary<ILogQueueItem[]>;
    tzOffset: number;
    useTags: boolean;
    useTagsMaxLength: number;
    writeToConsole: boolean;
    writeToConsoleLevel: number;
};

export interface ILogQueueItem
{
    fn: any;
    args: any[];
    scope: any;
}

export interface ILog
{
    blank(level?: number, queueId?: string): void;
    dequeue(queueId: string): void;
    error(msg: any, params?: (string|any)[][], queueId?: string): void;
    isLoggingEnabled(): boolean;
    getLogFileName(): string;
    getLogPad(): string;
    methodStart(msg: string, level?: number, logPad?: string, doLogBlank?: boolean, params?: (string|any)[][], queueId?: string): void;
    methodDone(msg: string, level?: number, logPad?: string, params?: (string|any)[][], queueId?: string): void;
    methodOnce(tag: string, msg: string, level?: number, logPad?: string, params?: (string|any)[][], queueId?: string): void;
    setWriteToConsole(set: boolean, level?: number): void;
    value(msg: string, value: any, level?: number, logPad?: string, queueId?: string): void;
    values(level: number, logPad: string, params: any | (string|any)[][], queueId?: string): void;
    warn(msg: any, params?: (string|any)[][], queueId?: string): void;
    write(msg: string, level?: number, logPad?: string, queueId?: string, isValue?: boolean, isError?: boolean): void;
    withColor(msg: string, color: any): void;
}
