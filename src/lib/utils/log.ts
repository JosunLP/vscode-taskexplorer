/* eslint-disable @typescript-eslint/naming-convention */

import { join } from "path";
import { apply } from "./object";
import { figures, LogColors } from "./figures";
import { appendFileSync, createDir } from "./fs";
import { executeCommand, registerCommand } from "../command/command";
import { ConfigurationChangeEvent, Disposable, ExtensionContext, ExtensionMode, OutputChannel, window } from "vscode";
import { asString, isArray, isEmpty, isError, isFunction, isObject, isObjectEmpty, isPrimitive, isString } from "./typeUtils";
import { Commands, IConfiguration, IDictionary, ILog, ILogControl, ITeWrapper, LogLevel, VsCodeCommands } from "../../interface";


export class TeLog implements ILog, Disposable
{
    private _wrapper: ITeWrapper | undefined;
    private _fileNameTimer: NodeJS.Timeout;
    private readonly _logControl: ILogControl;
    // private _wrapper: TeWrapper | undefined;
    private readonly _config: IConfiguration;
    private readonly _disposables: Disposable[] = [];
    private readonly _moduleMap: IDictionary<string> =
    {
        TaskTreeDataProvider: "TREE",
        LicenseManager: "AUTH"
    };


    constructor(context: ExtensionContext, config: IConfiguration, testsRunning: number)
    {
        this._fileNameTimer = 0 as unknown as NodeJS.Timeout;
        this._logControl = this.getDefaultLogControl(context, config);

        this._config = config;
        apply(this._logControl, {
            isTests: context.extensionMode === ExtensionMode.Test,
            isTestsBlockScaryColors: this._logControl.isTests,
            enable: config.get<boolean>("logging.client.enable", false),
            level: config.get<LogLevel>("logging.client.level", 1),
            enableOutputWindow: config.get<boolean>("logging.client.enableOutputWindow", true),
            enableFile: config.get<boolean>("logging.client.enableFile", false),
            enableFileSymbols: config.get<boolean>("logging.client.enableFileSymbols", true),
            outputChannelWriteFn: "appendLine",
            outputChannel: window.createOutputChannel("ExtJs Language Client")
        });
        this._disposables.push(
            this._logControl.outputChannel,
            registerCommand(Commands.ShowOutputWindow, this.showOutput, this),
            config.onDidChange(this.processConfigChanges, this)
        );
		context.subscriptions.push(this);
    }

    dispose = () => { clearTimeout(this._fileNameTimer); };


    private get allowScaryColors() {
        return !this._logControl.isTests || !this._logControl.isTestsBlockScaryColors;
    }

    protected get colors(): LogColors {
        return figures.colors;
    }

    get control(): ILogControl {
        return this._logControl;
    }

    get lastPad(): string {
        return this._logControl.lastLogPad;
    }

    get wrapper(): ITeWrapper | undefined {
        return this._wrapper;
    }

    set wrapper(wrapper) {
        this._wrapper = wrapper;
    }


    private _blank = (level?: LogLevel, queueId?: string) => this._write("", level, "", queueId);


    private _dequeue = (queueId: string) =>
    {
        if (this._logControl.msgQueue[queueId])
        {
            this._logControl.msgQueue[queueId].forEach(l => l.fn.call(l.scope, ...l.args));
            delete this._logControl.msgQueue[queueId];
        }
    };


    protected enable = (enable: boolean) =>
    {
        apply(this,
        {
            blank: enable ? this._blank : () => {},
            dequeue: enable ? this._dequeue : () => {},
            error: enable ? this._error : () => {},
            info: enable ? this._write : () => {},
            methodStart: enable ? this._methodStart : () => {},
            methodDone: enable ? this._methodDone : () => {},
            methodEvent: enable ? this._methodEvent : () => {},
            value: enable ? this._value : () => {},
            values: enable ? this._values : () => {},
            warn: enable ? this._warn : () => {},
            withColor: enable ? figures.withColor : () => {},
            write: enable ? this._write : () => {}
        });
    };


    private _error = (msg: any, params?: (string|any)[][], queueId?: string, symbols: [ string, string ] = [ "", "" ]) =>
    {
        if (!msg) { return; }

        if (!symbols || !symbols[0]) {
            const symbol1 = this.allowScaryColors ? figures.color.error : figures.color.errorTests;
            symbols = [ symbol1, figures.error ];
        }

        const errMsgs = this.parseValue(msg);

        if (this._logControl.lastErrorMesage[0] === errMsgs[0])
        {
            if (!isArray(msg)) {
                return;
            }
            /* istanbul ignore next */
            if (errMsgs[1] === this._logControl.lastErrorMesage[1] && errMsgs.length === this._logControl.lastErrorMesage.length) {
                return;
            }
        }
        this._logControl.lastErrorMesage = errMsgs;

        const currentWriteToConsole = this._logControl.writeToConsole,
              currentWriteToFile = this._logControl.enableFile,
              currentWriteToOutputWindow = this._logControl.enableOutputWindow;

        if (!this._logControl.lastWriteWasBlankError && !this._logControl.lastWriteToConsoleWasBlank)
        {
            this.errorWriteLogs("", currentWriteToFile, symbols, queueId);
        }

        errMsgs.forEach(m => this.errorWriteLogs(m, currentWriteToFile, symbols, queueId));

        if (params)
        {
            for (const [ n, v, l ] of params)
            {
                this._logControl.enableFile = false;
                this._logControl.writeToConsole = true;
                this._logControl.enableOutputWindow = false;
                this._value(symbols[0] + "   " + n, v, 1, "", queueId);
                if (currentWriteToFile)
                {
                    this._logControl.enableFile = true;
                    this._logControl.writeToConsole = false;
                    this._logControl.enableOutputWindow = false;
                    if (this._logControl.enableFileSymbols) {
                        this._value(symbols[1] + "   " + n, v, 1, "", queueId);
                    }
                    else {
                        this._value("   " + n, v, 1, "", queueId);
                    }
                }
                if (currentWriteToOutputWindow)
                {
                    this._logControl.enableFile = false;
                    this._logControl.writeToConsole = false;
                    this._logControl.enableOutputWindow = true;
                    this._value(symbols[1] + "   " + n, v, 1, "", queueId);
                }
            }
        }

        this.errorWriteLogs("", currentWriteToFile, symbols, queueId);

        apply(this._logControl, {
            enableFile: currentWriteToFile,
            writeToConsole: currentWriteToConsole,
            enableOutputWindow: currentWriteToOutputWindow,
            lastWriteWasBlank: true, lastWriteWasBlankError: true, lastWriteToConsoleWasBlank: true
        });
    };


    private errorConsole = (msg: string, symbols: [ string, string ], queueId?: string) =>
    {
        apply(this._logControl, { writeToConsole: true, enableFile: false, enableOutputWindow: false });
        if (!this._logControl.isTestsBlockScaryColors) {
            this._write(symbols[0] + " " + msg, 1, "", queueId, false, true);
        }
        else {
            this._write(figures.withColor(symbols[0] + " " + msg, this.colors.grey), 1, "", queueId, false, true);
        }
    };


    private errorFile = (msg: string, symbols: [ string, string ]) =>
    {
        apply(this._logControl, { writeToConsole: false, enableFile: true, enableOutputWindow: false });
        if (this._logControl.enableFileSymbols) {
            this._write(`${symbols[1]} ${msg}`, 1, "", undefined, false, true);
        }
        else {
            this._write(`*** ${msg}`, 1, "", undefined, false, true);
        }
    };


    private errorOutputWindow = (msg: string, symbols: [ string, string ]) =>
    {
        apply(this._logControl, { writeToConsole: false, enableFile: false, enableOutputWindow: true });
        this._write(symbols[1] + " " + msg, 1, "", undefined, false, true);
    };


    private errorWriteLogs = (lMsg: string, fileOn: boolean, symbols: [ string, string ], queueId?: string) =>
    {
        this.errorConsole(lMsg, symbols, queueId); // always write errors to console
        if (fileOn) this.errorFile(lMsg, symbols);
        this.errorOutputWindow(lMsg, symbols);     // always write errors to output window
    };


    init = async (logDirectory: string) =>
    {
        await createDir(logDirectory);
        this._logControl.dirPath = logDirectory;
        this.setFileName();
        this.enable(this._logControl.enable);
    };


    private getDefaultLogControl = (context: ExtensionContext, config: IConfiguration): ILogControl =>
    {
        return {
            dirPath: context.logUri.fsPath,
            enable: config.get<boolean>("logging.enable", false),
            enableOutputWindow: config.get<boolean>("logging.enableOutputWindow", true),
            enableFile: config.get<boolean>("logging.enableFile", false),
            enableFileSymbols: config.get<boolean>("logging.enableFileSymbols", true),
            fileName: "",
            isTests: context.extensionMode === ExtensionMode.Test,
            isTestsBlockScaryColors: context.extensionMode === ExtensionMode.Test,
            lastErrorMesage: [],
            lastLogPad: "",
            lastWriteWasBlank: false,
            lastWriteWasBlankError: false,
            lastWriteToConsoleWasBlank: false,
            level: config.get<LogLevel>("logging.level", 1),
            msgQueue: {},
            outputChannelWriteFn: "appendLine",
            outputChannel: window.createOutputChannel("Task Explorer"),
            useTags: true,
            useTagsMaxLength: 8,
            type: "global",
            tzOffset: (new Date()).getTimezoneOffset() * 60000,
            valueWhiteSpace: 45,
            writeToConsole: false,
            writeToConsoleLevel: 2
        };
    };


    private getStamp = () =>
    {
        const timeTags = (new Date(Date.now() - this._logControl.tzOffset)).toISOString().slice(0, -1).split("T");
        const info = {
            tag: "",
            stamp: timeTags.join(" "),
            stampDate: timeTags[0],
            stampTime: timeTags[1]
        };

        if (this._logControl.useTags)
        {
            const err = new Error();
            let stackline = "";
            const errStackLines = asString(err.stack, "at unknown ").split("\n");
            for (const l in errStackLines)
            {
                if (!/(?:Error| (?:Object\.)?(?:write|_?error|warn(?:ing)?|values?|method[DS]) )/.test(errStackLines[l]))
                {
                    stackline = errStackLines[l];
                    break;
                }
            }
            //
            // Stackline at this point will be something like:
            //
            //     at <anonymous> refresh (c:\\....\tree.js:line:col) // Dev / TS
            //
            //     at TaskTreeDataProvider.runLastTask (c:\\....\extension.js:1:col) // Prod / Webpack
            //     at TaskTreeDataProvider.<anonymous> (c:\\....\extension.js:1:col) // Prod / Webpack
            //
            info.tag = this._moduleMap[stackline.substring(stackline.indexOf("at ") + 3, stackline.lastIndexOf(" "))];
        }

        return info;
    };


    private _methodStart = (msg: string, level?: LogLevel, logPad = "", doLogBlank?: boolean, params?: (string|any)[][], queueId?: string) =>
    {
        if (!level || level <= this._logControl.level)
        {
            if (doLogBlank === true) { this._blank(level, queueId); }
            this._write("*start* " + msg, level, logPad, queueId); // , color);
            if (params) {
                this._values(level || 1, logPad + "   ", params, queueId);
            }
        }
    };


    private _methodDone = (msg: string, level?: LogLevel, logPad = "", params?: (string|any)[][], queueId?: string) =>
    {
        if (!level || level <= this._logControl.level)
        {
            if (params) {
                this._values(level || 1, logPad + "   ", params, queueId);
            }
            this._write("*done* " + msg, level, logPad, queueId); // , LogColor.cyan);
        }
    };


    private _methodEvent = (msg: string, tag?: string, level?: LogLevel, params?: (string|any)[][], queueId?: string) =>
    {
        if (!level || level <= this._logControl.level)
        {
            this._write(`[${tag || "EVENT"}] ` + msg, level, "", queueId);
            if (params) {
                this._values(level || 1, "   ", params, queueId);
            }
        }
    };


    private msUntilMidnight(): number
    {
        const midnight = new Date();
        midnight.setHours(24);
        midnight.setMinutes(0);
        midnight.setSeconds(0);
        midnight.setMilliseconds(0);
        return (!this._logControl.isTests ? /* istanbul ignore next */midnight.getTime() - new Date().getTime() : 120000);
    }


    private parseValue = (value: any, accumulated: string[] = []) =>
    {
        let eMsg = "";
        if (isString(value))
        {
            eMsg = value;
        }
        else if (isPrimitive(value))
        {
            eMsg = value.toString();
        }
        else if (isError(value))
        {
            if (value.stack) {
                eMsg = value.stack;
            }
            else { eMsg = value.message; }
        }
        else if (isArray(value))
        {
            if (isEmpty(value)) {
                eMsg = "[] (empty array)";
            }
            else if (isString(value[0])) {
                eMsg = `[ ${value.join(", ")} ]`;
            }
            else {
                value.forEach(m => this.parseValue(m, accumulated));
                return accumulated;
            }
        }
        else if (isObject<any>(value))
        {
            if (value.messageX)
            {
                eMsg = value.messageX;
                if (value.message) {
                    eMsg += `\nBase Error: ${value.message}`;
                }
            }
            else if (value.message) {
                eMsg = value.message;
            }
            else if (isObjectEmpty(value)) {
                eMsg = "{} (empty object)";
            }
            else {
                try { eMsg = JSON.stringify(value, null, 3); } catch {}
            }
        }
        if (!eMsg)
        {
            if (value === undefined) {
                eMsg = "undefined";
            }
            else if (value === null) {
                eMsg = "null";
            }
            else {
                try { eMsg = value.toString(); } catch {}
            }
        }
        accumulated.push(eMsg);
        return accumulated;
    };


    private processConfigChanges = (e: ConfigurationChangeEvent) =>
    {
        if (e.affectsConfiguration("taskexplorer.logging.enable"))
        {
            this._logControl.enable = this._config.get<boolean>("logging.enable", false);
            this.enable(this._logControl.enable);
        }
        if (e.affectsConfiguration("taskexplorer.logging.enableOutputWindow"))
        {
            this._logControl.enableOutputWindow = this._config.get<boolean>("logging.enableOutputWindow", true);
            if (!this._logControl.enable) {
                void this._config.update("logging.enable", this._logControl.enableFile);
            }
        }
        if (e.affectsConfiguration("taskexplorer.logging.enableFile"))
        {
            this._logControl.enableFile = this._config.get<boolean>("logging.enableFile", false);
            if (this._logControl.enableFile)
            {
                this.writeLogFileLocation();
                window.showInformationMessage("Log file location: " + this._logControl.fileName);
                if (!this._logControl.enable) {
                    void this._config.update("logging.enable", this._logControl.enableFile);
                }
            }
        }
        if (e.affectsConfiguration("taskexplorer.logging.enableFileSymbols"))
        {
            this._logControl.enableFileSymbols = this._config.get<boolean>("logging.enableFileSymbols", true);
        }
        if (e.affectsConfiguration("taskexplorer.logging.level"))
        {
            this._logControl.level = this._config.get<LogLevel>("logging.level", 1);
        }
    };


    private setFileName = () =>
    {
        const locISOTime = (new Date(Date.now() - this._logControl.tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, "");
        this._logControl.fileName = join(this._logControl.dirPath, `vscode-extjs-${this._logControl.type}-${locISOTime}.log`);
        this.writeLogFileLocation();
        if (this._fileNameTimer) {
            clearTimeout(this._fileNameTimer);
        }
        this._fileNameTimer = setTimeout(this.setFileName, this.msUntilMidnight());
    };


    protected showOutput = async(show: boolean) =>
    {
        const channel: OutputChannel = this._logControl.outputChannel as OutputChannel;
        if (show) {
            await executeCommand(VsCodeCommands.FocusOutputWindowPanel);
            channel.show();
        }
        else {
            channel.hide();
        }
    };


    private _value = (msg: string, value: any, level?: LogLevel, logPad = "", queueId?: string) =>
    {
        if (!level || level <= this._logControl.level)
        {
            let logMsg = (msg || "").padEnd(this._logControl.valueWhiteSpace - logPad.length) + ": ";
            logMsg += this.parseValue(value)[0];
            this._write(logMsg, level, logPad, queueId, true);
        }
    };


    private _values = (level: LogLevel, logPad: string, params: (string|any)[][], queueId?: string) =>
    {
        if (!level || level <= this._logControl.level)
        {
            for (const [ m, v ] of params) {
                this._value(m, v, level, logPad, queueId);
            }
        }
    };


    private _warn = (msg: any, params?: (string|any)[][], queueId?: string) =>
        this._error(msg, params, queueId, [ this.allowScaryColors ? figures.color.warning : figures.color.warningTests, figures.warning ]);


    protected writeLogFileLocation = () =>
    {
        if (this._logControl.enable && this._logControl.enableFile &&  this._logControl.outputChannel &&
            isString(this._logControl.outputChannelWriteFn) && isFunction(this._logControl.outputChannel[this._logControl.outputChannelWriteFn]))
        {
            const channelLog = this._logControl.outputChannel[this._logControl.outputChannelWriteFn];
            channelLog("***********************************************************************************************");
            channelLog(` ExtJs Intellisense Log File: ${this._logControl.fileName}`);
            channelLog("***********************************************************************************************");
            console.log(`    ${figures.color.info} ${figures.withColor("*************************************************************************************", this.colors.grey)}`);
            console.log(`    ${figures.color.info} ${figures.withColor(` ExtJs Intellisense Log File: ${this._logControl.fileName}`, this.colors.grey)}`);
            console.log(`    ${figures.color.info} ${figures.withColor("*************************************************************************************", this.colors.grey)}`);
        }
    };


    /**
     * The "writeInternal" function is the  "end-all" log function.  All logging calls eventually make it here.
     *
     * @private
     * @since 2.0.0
     *
     * @param msg The log message to write
     * @param logPad Left-side logmessage padding
     * @param queueId A queue ID that can be used to delay immediate log writes and later write them at
     * the same time (useful for async ops). Use `log.dequeue` to write all queued messages of a specified ID.
     * @param isValue This call is from `log.value` or `log.values`.
     * @param isError This call is from `log.error` or `log.warn`.
     * @param fn The logging function to use, i.e. 'console.log', 'outputChannel.appendLine', 'file.write', etc
     * @param scope Scope to call the logging function on. If empty, `vscode.window` is used.
     * @param ts The message timestamp
     * @param isFile This call is a file write.
     * @param args The function arguments to use in the `fn` call.  As of v3.0, the only caller to use this args
     * parameter is write() when file logging is enabled, and 'args' is the filename to be written.
     */
    private writeInternal = (msg: string, logPad: string, queueId: string | undefined, isValue: boolean, isError: boolean,
                             fn: (...fnArgs: any) => void, scope: any,  ts: string, isFile: boolean, ...args: any) =>
    {
        const msgs = msg.split("\n").filter(m => !!m.trim());
        let firstLineDone = false,
            valuePad = "";

        if (msgs.length > 1)
        {
            if (isValue)  {
                for (let i = 0; i < this._logControl.valueWhiteSpace + 2; i++) {
                    valuePad += " ";
                }
            }
            else if (isError && /\[[0-9]{1,2}m/.test(msg))
            {   //
                // Replace red error colors with something nicer while running tests, so I can stop having
                // small 500ms bursts of heartbeat drop and temporary anger while red errors flash in
                // front of my eyes.
                //
                // / \[[0-9]{1,2}m[\W]{1}\[[0-9]{1,2}m/.test(msg) // keep this, matches full symbol and will need someday guarantee it
                for (let m = 1; m < msgs.length; m++) {
                    msgs[m] = (this.allowScaryColors ? figures.color.error : figures.color.errorTests) + " " + msgs[m];
                }
            }
        }

        for (const m of msgs)
        {
            const _logPad = isValue && firstLineDone ? valuePad : logPad,
                  _msg = ts + " " + _logPad + m.trimEnd() + (isFile ? "\n" : "");
                if (args && args.length > 0)
                {
                    if (!queueId) {
                        fn.call(scope, ...args, _msg);
                    }
                    else {
                        if (!this._logControl.msgQueue[queueId]) this._logControl.msgQueue[queueId] = [];
                        this._logControl.msgQueue[queueId].push({ fn, scope, args: [ ...args, _msg ] });
                    }
                }
                else
                {
                    if (!queueId) {
                        fn.call(scope, _msg);
                    }
                    else {
                        if (!this._logControl.msgQueue[queueId]) this._logControl.msgQueue[queueId] = [];
                        this._logControl.msgQueue[queueId].push({ fn, scope, args: [ _msg ] });
                    }
                }
            firstLineDone = true;
        }
    };


    private _write = (msg: string, level?: LogLevel, logPad?: string, queueId?: string, isValue?: boolean, isError?: boolean) =>
    {
        if (msg === null || msg === undefined || (this._logControl.lastWriteWasBlank && msg === "")) {
            return;
        }
        const isMinLevel = (!level || level <= this._logControl.level);
        if (logPad === undefined) {
            logPad = this._logControl.lastLogPad || "";
        } //
         // VSCODE OUTPUT WINDOW LOGGING
        //
        if (this._logControl.enableOutputWindow && this._logControl.outputChannel && this._logControl.outputChannelWriteFn && isMinLevel)
        {
            const ts = this.getStamp().stamp + " ";
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logControl.outputChannel[this._logControl.outputChannelWriteFn], this._logControl.outputChannel, ts, false);
        } //
         // CONSOLE LOGGING
        //
        if (this._logControl.writeToConsole && (isError || !level || level <= this._logControl.writeToConsoleLevel))
        {
            const ts = !this._logControl.isTests ? /* istanbul ignore next */this.getStamp().stampTime + " " + figures.pointer : "   ";
            msg = figures.withColor(msg, this.colors.grey);
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, console.log, console, ts, false);
            this._logControl.lastWriteToConsoleWasBlank = false;
        } //
         // FILE LOGGING
        //
        if (this._logControl.enableFile && isMinLevel)
        {
            const ts = this.getStamp().stampTime + (this._logControl.enableFileSymbols ? " " + figures.pointer : " >");
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, appendFileSync, null, ts, true, this._logControl.fileName);
        }
        apply(this._logControl, { lastLogPad: logPad, lastWriteWasBlank: (msg === "") });
        if (!isError)
        {
            apply(this._logControl, { lastErrorMesage: [], lastWriteWasBlankError: false });
            this._logControl.lastWriteToConsoleWasBlank = this._logControl.lastWriteToConsoleWasBlank && !this._logControl.isTests;
        }
    };


    blank = this._blank;
    dequeue = this._dequeue;
    error = this._error;
    info = this._write;
    methodStart = this._methodStart;
    methodDone = this._methodDone;
    methodEvent = this._methodEvent;
    value = this._value;
    values = this._values;
    warn = this._warn;
    withColor = figures.withColor;
    write = this._write;

}
