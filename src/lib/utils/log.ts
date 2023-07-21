/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */

import { apply } from "./object";
import { figures } from "./figures";
import { basename, join } from "path";
import { appendFileSync, createDirSync } from "./fs";
import { execIf, popIfExistsBy, wrap } from "./utils";
import { executeCommand, registerCommand } from "../command/command";
import { BasicSourceMapConsumer, RawSourceMap, SourceMapConsumer } from "source-map";
import { asString, isArray, isEmpty, isError, isObject, isObjectEmpty, isPrimitive, isString } from "./typeUtils";
import { ConfigurationChangeEvent, Disposable, ExtensionContext, ExtensionMode, OutputChannel, window } from "vscode";
import { Commands, IConfiguration, ConfigKeys, ILog, ILogControl, ITeWrapper, LogLevel, VsCodeCommands } from "../../interface";


/**
 * @class TeLog
 * @since 3.0.0
 */
export class TeLog implements ILog, Disposable
{
    private _errorsWritten = 0;
    private _fileNameTimer: NodeJS.Timeout;
    private _wrapper: ITeWrapper | undefined;
    private _srcMapConsumer: BasicSourceMapConsumer | undefined;

    private readonly _wasmPath: string;
    private readonly _wasmRtPath: string;
    private readonly _srcMapPath: string;
    private readonly _config: IConfiguration;
    private readonly _logControl: ILogControl;
    private readonly _context: ExtensionContext;
    private readonly _disposables: Disposable[];
    private readonly _separator = "-----------------------------------------------------------------------------------------";
    private readonly _stackLineParserRgx = /at (?:<anonymous>[\. ]|)+(.+?)(?:\.<anonymous> | )+\((.+)\:([0-9]+)\:([0-9]+)\)/i;
    private readonly _stackLineFilterRgx = /(?:^Error\: ?$|(?:(?:Object|[\/\\\(\[ \.])(?:getStamp|errorWrite[a-z]+?|write2?|_?error|warn(?:ing)?|values?|method[DS]|extensionHost|node\:internal)(?: |\]|\/)))/i;


    constructor(context: ExtensionContext, config: IConfiguration)
    {
        this._config = config;
        this._context = context;
        createDirSync(this._context.logUri.fsPath);
        createDirSync(join(this._context.globalStorageUri.fsPath, "debug"));
        this._wasmRtPath = join(this._context.extensionUri.fsPath, "dist", "mappings.wasm");
        this._wasmPath = join(this._context.globalStorageUri.fsPath, "debug", "mappings.wasm");
        this._srcMapPath = join(this._context.globalStorageUri.fsPath, "debug", "taskexplorer.js.map");
        this._fileNameTimer = 0 as unknown as NodeJS.Timeout;
        this._logControl = {
            dirPath: context.logUri.fsPath,
            enable: config.get<boolean>(ConfigKeys.LogEnable, false),
            enableOutputWindow: config.get<boolean>(ConfigKeys.LogEnableOutputWindow, true),
            enableFile: config.get<boolean>(ConfigKeys.LogEnableFile, false),
            enableModuleReload: config.get<boolean>(ConfigKeys.LogEnableModuleReload, false),
            errorChannel: window.createOutputChannel(`${context.extension.packageJSON.displayName} (Errors)`),
            fileName: "",
            isTests: context.extensionMode === ExtensionMode.Test,
            isTestsBlockScaryColors: context.extensionMode === ExtensionMode.Test,
            lastErrorMesage: [],
            lastLogPad: "",
            lastWriteWasBlank: false,
            lastWriteWasBlankError: false,
            lastWriteToConsoleWasBlank: false,
            level: config.get<LogLevel>(ConfigKeys.LogLevel, 1),
            msgQueue: {},
            outputChannel: window.createOutputChannel(context.extension.packageJSON.displayName),
            trace: false,
            tzOffset: (new Date()).getTimezoneOffset() * 60000,
            valueWhiteSpace: 45,
            writeToConsole: false,
            writeToConsoleLevel: 2
        };
        this.enable(this._logControl.enable);
        this.writeErrorChannelHeader();
        this.writeOutputChannelHeader();
        this.setFileName();
        this._disposables = [
            this._logControl.errorChannel,
            this._logControl.outputChannel,
            registerCommand(Commands.ShowOutputWindow, (show: boolean) => this.showOutput(show, this._logControl.outputChannel), this),
            registerCommand(Commands.ShowErrorOutputWindow, (show: boolean) => this.showOutput(show, this._logControl.errorChannel), this),
            config.onDidChange(this.processConfigChanges, this)
        ];
		context.subscriptions.push(this);
    }

    dispose = () =>
    {
        clearTimeout(this._fileNameTimer);
        this._disposables.splice(0).forEach(d => d.dispose());
        try { this.wrapper.fs.deleteFileSync(this._wasmRtPath); } catch {}
    };


    private get allowScaryColors() { return !this._logControl.isTests || !this._logControl.isTestsBlockScaryColors; }

    get control(): ILogControl { return this._logControl; }

    get lastPad(): string { return this._logControl.lastLogPad; }

    get wrapper(): ITeWrapper { return <ITeWrapper>this._wrapper; }
    set wrapper(v) { this._wrapper = v; void this.installSourceMapSupport(); }


    private _blank = (level?: LogLevel, queueId?: string) => this._write("", level, "", queueId);


    private _dequeue = (queueId: string) =>
    {
        if (this._logControl.msgQueue[queueId])
        {
            this._logControl.msgQueue[queueId].forEach(l => l.fn.call(l.scope, ...l.args));
            delete this._logControl.msgQueue[queueId];
        }
    };


    private enable = (enable: boolean) =>
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
            // method: enable ? this._method : () => {},
            value: enable ? this._value : () => {},
            values: enable ? this._values : () => {},
            warn: enable ? this._warn : () => {},
            withColor: enable ? figures.withColor : () => {},
            write: enable ? this._write : () => {},
            write2: enable ? this._write2 : () => {}
        });
    };


    private _error = (msg: any, params?: (string|any)[][], queueId?: string, symbols: [ string, string ] = [ "", "" ]) =>
    {
        if (!msg) { return; }
        if (!symbols || !symbols[0]) {
            const symbol1 = this.allowScaryColors ? figures.color.error : figures.color.errorTests;
            symbols = [ symbol1, figures.error ];
        }
        //
        // Ignore consecutive duplicate messages
        //
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
        this._errorsWritten++;
        this._logControl.lastErrorMesage = errMsgs;
        const currentWriteToConsole = this._logControl.writeToConsole,
              currentWriteToFile = this._logControl.enableFile,
              currentWriteToOutputWindow = this._logControl.enableOutputWindow;
        //
        // Write blank line
        //
        if (!this._logControl.lastWriteWasBlankError && !this._logControl.lastWriteToConsoleWasBlank)
        {
            this.errorWriteLogs("", currentWriteToFile, symbols, queueId);
        }
        //
        // Add additional error info to error channel
        //
        if (!queueId && this._srcMapConsumer) {
            this.errorWriteChannelInfo(symbols);
        }
        //
        // Write all parsed lines from parameter `msg` to thw enabled log channels
        //
        errMsgs.forEach(m => this.errorWriteLogs(m, currentWriteToFile, symbols, queueId));
        //
        // Write all specified additional values to thw enabled log channels
        //
        if (isArray(params, false) && isArray(params[0]))
        {
            for (const [ n, v ] of params)
            {
                this._logControl.enableFile = false;
                this._logControl.writeToConsole = true;
                this._logControl.enableOutputWindow = false;
                this._value(`${symbols[1]}   ${n}`, v, 1, "", queueId, true);
                if (currentWriteToFile)
                {
                    this._logControl.enableFile = true;
                    this._logControl.writeToConsole = false;
                    this._logControl.enableOutputWindow = false;
                    // if (file symbols)) {
                    //     this._value(`${symbols[1]}   ${n}`, v, 1, "", queueId, true);
                    // }
                    // else {
                        this._value(`   ${n}`, v, 1, "", queueId, true);
                    // }
                }
                if (currentWriteToOutputWindow)
                {
                    this._logControl.enableFile = false;
                    this._logControl.writeToConsole = false;
                    this._logControl.enableOutputWindow = true;
                    this._value(`${symbols[1]}   ${n}`, v, 1, "", queueId, true);
                }
            }
        }
        //
        // Write blank line
        //
        this.errorWriteLogs("", currentWriteToFile, symbols, queueId);
        //
        // Reset channel configuration and save error state
        //
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
            this._write(figures.withColor(symbols[0] + " " + msg, figures.colors.grey), 1, "", queueId, false, true);
        }
    };


    private errorFile = (msg: string, symbols: [ string, string ]) =>
    {
        apply(this._logControl, { writeToConsole: false, enableFile: true, enableOutputWindow: false });
        // if (file symbols) {
            this._write(`${symbols[1]} ${msg}`, 1, "", undefined, false, true);
        // }
        // else {
        //     this._write(`*** ${msg}`, 1, "", undefined, false, true);
        // }
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


    private errorWriteChannelInfo = (symbols: [ string, string ]) =>
    {
        const sInfo = this.getStamp(true);
        const ts = `${sInfo.stamp} ${figures.pointer} ${symbols[1]}`;
        this._logControl.errorChannel.appendLine(`${ts} --- ERROR ${this._errorsWritten} ${this._separator}`);
        this._logControl.errorChannel.appendLine(ts);
        this._logControl.errorChannel.appendLine(`${ts} line          : ${sInfo.line}`);
        this._logControl.errorChannel.appendLine(`${ts} column        : ${sInfo.column}`);
        this._logControl.errorChannel.appendLine(`${ts} name          : ${sInfo.name}`);
        this._logControl.errorChannel.appendLine(`${ts} file          : ${sInfo.source}`);
        this._logControl.errorChannel.appendLine(ts);
        this._logControl.errorChannel.appendLine(`${ts} error message :`);
        this._logControl.errorChannel.appendLine(ts);
    };


    private getDefaultStamp = () =>
    {
        const timeTags = (new Date(Date.now() - this._logControl.tzOffset)).toISOString().slice(0, -1).split("T");
        return {
            column: 1,
            source: "taskexplorer.js",
            line: 1,
            name: "anonymous",
            stamp: timeTags.join(" "),
            stampDate: timeTags[0],
            stampTime: timeTags[1]
        };
    };


    private getStamp = (detailed?: boolean) =>
    {
        const info = this.getDefaultStamp();
        if (detailed || this._logControl.trace)
        {
            let stackline = "";
            const err = new Error(),
                  errStackLines = asString(err.stack, "at unknown ").split("\n"),
                  logLineRgx = this._stackLineFilterRgx;
            popIfExistsBy(errStackLines, l => logLineRgx.test(l) || l.includes("Error:"));
            stackline = errStackLines[0];
            //
            // Stackline at this point will be something like:
            //
            //     at <anonymous> refresh (c:\\....\tree.js:line:col) // Dev / TS
            //
            //     at TaskTreeDataProvider.runLastTask (c:\\....\extension.js:1:col) // Prod / Webpack
            //     at TaskTreeDataProvider.<anonymous> (c:\\....\extension.js:1:col) // Prod / Webpack
            //
            const match = stackline.match(this._stackLineParserRgx);
            if (match)
            {
                const [ _, name, source, line, column ] = match;
                apply(info, { source: basename(source), name, column: parseInt(column, 10), line: parseInt(line, 10) });
                execIf(this._srcMapConsumer, c => apply(info, c.originalPositionFor({ line: info.line, column: info.column })));
            }
        }
        return info;
    };


    private installSourceMapSupport = (): Promise<void> =>
    {
        return this.wrapper.utils.wrap(async (w) =>
        {
            const downloadWasm = !w.fs.pathExistsSync(this._wasmPath),
                  downloadSourceMap = !w.fs.pathExistsSync(this._srcMapPath);
            await w.utils.execIf(downloadWasm, async () =>
            {
                const wasmContent = await w.server.get("app/shared/mappings.wasm", "");
                await w.fs.writeFile(this._wasmPath, Buffer.from(wasmContent));
            });
            await w.utils.execIf(downloadSourceMap, async () =>
            {
                const srcMapContent = await w.server.get(`app/${w.extensionName}/v${w.version}/${w.extensionNameShort}.js.map`, "");
                await w.fs.writeFile(this._srcMapPath, Buffer.from(srcMapContent));
            });
            await w.fs.copyFile(this._wasmPath, this._wasmRtPath);
            const srcMap = await w.fs.readJsonAsync<RawSourceMap>(this._srcMapPath);
            this._srcMapConsumer = await new SourceMapConsumer(srcMap);
            this._disposables.push({
                dispose: () => wrap(c => c.destroy(), [ this._error ], this, this._srcMapConsumer)
            });
        },
        [ this._error ], this, this.wrapper);
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
            this._write(`[${tag || "event"}] ` + msg, level, "", queueId);
            if (params) {
                this._values(level || 1, "   ", params, queueId);
            }
        }
    };


    // private _method = (fileTag: string, methodTag: string, msg: string, level: LogLevel, logPad: string, params?: (string|any)[][], queueId?: string) =>
    // {
    //     if (!level || level <= this._logControl.level)
    //     {
    //         const tag = `[${fileTag}][${methodTag}] ${logPad}`;
    //         this._write(`[${tag}]${msg}`, level, "", queueId);
    //         if (params) {
    //             for (const [ m, v ] of params) {
    //                 this._value(`[${tag}]${m}`, v, level, "", queueId);
    //             }
    //         }
    //     }
    // };


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
            else { eMsg = value.message.toLowerCase(); }
        }
        else if (isArray(value))
        {
            if (isEmpty(value)) {
                eMsg = "[] (empty array)";
            }
            else if (value.every(v => isString(v))) {
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


    private processConfigChanges = async (e: ConfigurationChangeEvent) =>
    {
        const cfgKeys = this.wrapper.keys.Config;
        if (e.affectsConfiguration(`taskexplorer.${cfgKeys.LogEnable}`))
        {
            this._logControl.enable = this._config.get<boolean>(cfgKeys.LogEnable, false);
            this.enable(this._logControl.enable);
        }
        if (e.affectsConfiguration(`taskexplorer.${cfgKeys.LogEnableOutputWindow}`))
        {
            this._logControl.enableOutputWindow = this._config.get<boolean>(cfgKeys.LogEnableOutputWindow, true);
            if (this._logControl.enableOutputWindow && !this._logControl.enable) {
                await this._config.update(cfgKeys.LogEnable, this._logControl.enableOutputWindow);
            }
        }
        if (e.affectsConfiguration(`taskexplorer.${cfgKeys.LogEnableFile}`))
        {
            this._logControl.enableFile = this._config.get<boolean>(cfgKeys.LogEnableFile, false);
            if (this._logControl.enableFile)
            {
                this.writeLogFileLocation();
                window.showInformationMessage("Log file location: " + this._logControl.fileName);
                if (!this._logControl.enable) {
                    await this._config.update(cfgKeys.LogEnable, this._logControl.enableFile);
                }
            }
        }
        if (e.affectsConfiguration(`taskexplorer.${cfgKeys.LogEnableModuleReload}`))
        {
            this._logControl.enableModuleReload = this._config.get<boolean>(cfgKeys.LogEnableModuleReload, false);
        }
        if (e.affectsConfiguration(`taskexplorer.${cfgKeys.LogLevel}`))
        {
            this._logControl.level = this._config.get<LogLevel>(cfgKeys.LogLevel, 1);
        }
    };


    private setFileName = () =>
    {
        const locISOTime = (new Date(Date.now() - this._logControl.tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, "");
        this._logControl.fileName = join(this._logControl.dirPath, `vscode-taskexplorer-${locISOTime}.log`);
        this.writeLogFileLocation();
        if (this._fileNameTimer) {
            clearTimeout(this._fileNameTimer);
        }
        this._fileNameTimer = setTimeout(this.setFileName, this.msUntilMidnight());
    };


    private showOutput = async(show: boolean, channel: OutputChannel) =>
    {
        if (show) {
            await executeCommand(VsCodeCommands.FocusOutputWindowPanel);
            channel.show();
        }
        else {
            channel.hide();
        }
    };


    private _value = (msg: string, value: any, level?: LogLevel, logPad = "", queueId?: string, isError?: boolean) =>
    {
        if (!level || level <= this._logControl.level)
        {
            let logMsg = (msg || "").padEnd(this._logControl.valueWhiteSpace - logPad.length) + ": ";
            logMsg += this.parseValue(value)[0];
            this._write(logMsg, level, logPad, queueId, true, isError);
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


    private writeErrorChannelHeader = () =>
    {
        this._logControl.errorChannel.appendLine("");
        this._logControl.errorChannel.appendLine("****************************************************************************************************");
        this._logControl.errorChannel.appendLine(" Task Explorer Error Logging Channel");
        this._logControl.errorChannel.appendLine("****************************************************************************************************");
        this._logControl.errorChannel.appendLine("");
    };


    private writeOutputChannelHeader = () =>
    {
        this._logControl.outputChannel.appendLine("");
        this._logControl.outputChannel.appendLine("****************************************************************************************************");
        this._logControl.errorChannel.appendLine(" Task Explorer Error Logging Channel");
        this._logControl.outputChannel.appendLine("****************************************************************************************************");
        this._logControl.outputChannel.appendLine("");
    };


    private writeLogFileLocation = () =>
    {
        if (this._logControl.enable && this._logControl.enableFile)
        {
            this._logControl.outputChannel.appendLine("***********************************************************************************************");
            this._logControl.outputChannel.appendLine(` Task Explorer Log File: ${this._logControl.fileName}`);
            this._logControl.outputChannel.appendLine("***********************************************************************************************");
            console.log(`    ${figures.color.info} ${figures.withColor("*************************************************************************************", figures.colors.grey)}`);
            console.log(`    ${figures.color.info} ${figures.withColor(` Task Explorer Log File: ${this._logControl.fileName}`, figures.colors.grey)}`);
            console.log(`    ${figures.color.info} ${figures.withColor("*************************************************************************************", figures.colors.grey)}`);
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
            logPad = ""; // this._logControl.lastLogPad || "";
        } //
         // VSCODE OUTPUT WINDOW LOGGING
        //
        if (this._logControl.enableOutputWindow && (isMinLevel || isError))
        {
            const ts = this.getStamp().stamp  + " " + figures.pointer;
            if (this._logControl.enableOutputWindow) {
                this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logControl.outputChannel.appendLine, this._logControl.outputChannel, ts, false);
            }
            if (isError && this._srcMapConsumer && (!this._errorsWritten || msg)) {
                this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logControl.errorChannel.appendLine, this._logControl.errorChannel, ts, false);
            }
        } //
         // CONSOLE LOGGING
        //
        if (this._logControl.writeToConsole && (isError || !level || level <= this._logControl.writeToConsoleLevel))
        {
            const ts = !this._logControl.isTests ? /* istanbul ignore next */this.getStamp().stampTime + " " + figures.pointer : "   ";
            msg = figures.withColor(msg, figures.colors.grey);
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, console.log, console, ts, false);
            this._logControl.lastWriteToConsoleWasBlank = false;
        } //
         // FILE LOGGING
        //
        if (this._logControl.enableFile && isMinLevel)
        {
            const ts = this.getStamp().stampTime + /* (file symbols ? " " + figures.pointer : */ " >";
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, appendFileSync, null, ts, true, this._logControl.fileName);
        }
        apply(this._logControl, { lastLogPad: logPad, lastWriteWasBlank: (msg === "") });
        if (!isError)
        {
            apply(this._logControl, { lastErrorMesage: [], lastWriteWasBlankError: false });
            this._logControl.lastWriteToConsoleWasBlank = this._logControl.lastWriteToConsoleWasBlank && !this._logControl.isTests;
        }
    };


    private _write2 = (tag: string, msg: string, level: LogLevel, logPad: string, params?: (string|any)[][], queueId?: string, isValue?: boolean, isError?: boolean) =>
    {
        if (!level || level <= this._logControl.level)
        {
            this._write(`[${tag}] ${logPad}${msg}`, level, "", queueId, isValue, isError);
            if (params) {
                for (const [ m, v ] of params) {
                    this._value(`[${tag}] ${logPad}${m}`, v, level, "", queueId);
                }
            }
        }
    };


    blank = this._blank;
    dequeue = this._dequeue;
    error = this._error;
    info = this._write;
    methodStart = this._methodStart;
    methodDone = this._methodDone;
    methodEvent = this._methodEvent;
    // method = this._method;
    value = this._value;
    values = this._values;
    warn = this._warn;
    withColor = figures.withColor;
    write = this._write;
    write2 = this._write2;

}
