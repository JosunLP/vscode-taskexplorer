/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */

import { apply } from "./object";
import { basename, dirname, join } from "path";
import { execIf, popIfExistsBy, wrap } from "./utils";
import { BasicSourceMapConsumer, RawSourceMap, SourceMapConsumer } from "source-map";
import { asString, isArray, isEmpty, isError, isObject, isObjectEmpty, isPrimitive, isString } from "./typeUtils";
import { appendFileSync, copyFile, createDirSync, deleteFileSync, pathExistsSync, readJsonAsync, writeFile } from "./fs";
import { commands, ConfigurationChangeEvent, Disposable, ExtensionContext, ExtensionMode, OutputChannel, window } from "vscode";
import {
    Commands, IConfiguration, ConfigKeys, ILog, ILogConfig, ILogControl, ILogState, ITeWrapper, LogLevel, VsCodeCommands,
    SpmServerResource
} from "../../interface";

interface IDisposable { dispose: () => any }

type LogColor = [ number, number ];
type HttpGetFunction = (url: SpmServerResource, ...args: any[]) => Promise<ArrayBuffer>;

interface ILogSymbols
{
    bullet: "●"; bulletBig: "⬢"; checkboxOn: "☒"; checkboxOff: "☐"; end: "◀"; error: "✘"; info: "ℹ";
    pointer: "❯"; pointerSmall: "›"; start: "▶"; star: "★"; success: "✔"; up: "△"; warning: "⚠";
    blue: { error: "✘"; info: "ℹ"; success: "✔"; warning: "⚠" };
    color: { end: "◀"; error: "✘"; info: "ℹ"; pointer: "❯"; start: "▶"; success: "✔"; up: "△"; warning: "⚠" };
}


/**
 * @class TeLog
 * @since 3.0.0
 */
export class TeLog implements ILog, Disposable
{
    protected readonly _logState: ILogState;
    protected readonly _logConfig: ILogConfig;
    protected readonly _logControl: ILogControl;
    private _errorsWritten = 0;
    private _fileNameTimer: NodeJS.Timeout;
    private _wrapper: ITeWrapper | undefined;
    private _httpGetFn: HttpGetFunction | undefined;
    private _srcMapConsumer: BasicSourceMapConsumer | undefined;

    private readonly _wasmPath: string;
    private readonly _wasmRtPath: string;
    private readonly _srcMapPath: string;
    private readonly _moduleFile: string;
    private readonly _moduleName: string;
    private readonly _modulePath: string;
    private readonly _runtimeDir: string;
    private readonly _dbgModuleDir: string;
    private readonly _symbols: ILogSymbols;
    private readonly _config: IConfiguration;
    private readonly _context: ExtensionContext;
    private readonly _disposables: IDisposable[];
    private readonly _separator = "-----------------------------------------------------------------------------------------";
    private readonly _stackLineParserRgx = /at (?:<anonymous>[\. ]|)+(.+?)(?:\.<anonymous> | )+\((.+)\:([0-9]+)\:([0-9]+)\)/i;
    private readonly _stackLineFilterRgx = /(?:^Error\: ?$|(?:(?:Object|[\/\\\(\[ \.])(?:getStamp|errorWrite[a-z]+?|write2?|_?error|warn(?:ing)?|values?|method[DS]|extensionHost|node\:internal)(?: |\]|\/)))/i;
    private readonly _colors: Record<string, LogColor> =
    {
        bold: [ 1, 22 ],
        italic: [ 3, 23 ],
        underline: [ 4, 24 ],
        inverse: [ 7, 27 ],
        white: [ 37, 39 ],
        grey: [ 90, 39 ],
        black: [ 30, 39 ],
        blue: [ 34, 39 ],
        cyan: [ 36, 39 ],
        green: [ 32, 39 ],
        magenta: [ 35, 39 ],
        red: [ 31, 39 ],
        yellow: [ 33, 39 ]
    };

    constructor(context: ExtensionContext, config: IConfiguration, logConfig?: Partial<ILogConfig>, logControl?: Partial<ILogControl>)
    {
        this.enable(false);
        this._config = config;
        this._context = context;
        this._disposables = [];
        this._symbols = this.getSymbols();
        this._modulePath = join(this._context.extensionUri.fsPath, "dist", "taskexplorer.js");
        this._runtimeDir = dirname(this._modulePath);
        this._moduleFile = basename(this._modulePath);
        this._moduleName = this._moduleFile.replace(".js", "");
        this._dbgModuleDir = join(this._context.globalStorageUri.fsPath, "debug");
        this._wasmRtPath = join(this._runtimeDir, "mappings.wasm");
        this._wasmPath = join(this._dbgModuleDir, "mappings.wasm");
        this._srcMapPath = join(this._dbgModuleDir, `${this._moduleFile}.map`);
        this._fileNameTimer = 0 as unknown as NodeJS.Timeout;
        this._logState = this.getDefaultState();
        this._logConfig = apply(this.getDefaultConfig(context), logConfig!);
        this._logControl = apply(this.getDefaultControl(context.extensionMode === ExtensionMode.Test, config), logControl!);
        createDirSync(this._dbgModuleDir);
        createDirSync(this._logConfig.dirPath);
        this.writeErrorChannelHeader();
        this.writeOutputChannelHeader();
        this.setFileName();
		context.subscriptions.push(this);
        execIf(this._logConfig.errorChannel, this._disposables.push, this, null, this._logConfig.errorChannel);
        execIf(this._logConfig.outputChannel, this._disposables.push, this, null, this._logConfig.outputChannel);
        this._disposables.push(
            config.onDidChange(this.processConfigChanges, this),
            commands.registerCommand(Commands.ShowOutputWindow, (show: boolean) => this.showOutput(show, this._logConfig.outputChannel), this),
            commands.registerCommand(Commands.ShowErrorOutputWindow, (show: boolean) => this.showOutput(show, this._logConfig.errorChannel), this)
        );
    }

    dispose = () =>
    {
        clearTimeout(this._fileNameTimer);
        this._disposables.splice(0).forEach(d => d.dispose());
        try { deleteFileSync(this._wasmRtPath); } catch {}
    };


    private get allowScaryColors(): boolean { return !this._logConfig.isTests || !this._logControl.blockScaryColors; }
    private get httpGet(): HttpGetFunction { return <HttpGetFunction>this._httpGetFn; }

    protected get colors(): Record<string, LogColor> { return this._colors; }

    get control(): ILogControl { return this._logControl; }
    get lastPad(): string { return this._logState.lastLogPad; }
    get state(): ILogState { return this._logState; }
    get symbols(): ILogSymbols { return this._symbols; }
    get wrapper(): ITeWrapper { return <ITeWrapper>this._wrapper; }

    private _blank = (level?: LogLevel, queueId?: string) => this._write("", level, "", queueId);


    private _dequeue = (queueId: string) =>
    {
        if (this._logState.msgQueue[queueId])
        {
            this._logState.msgQueue[queueId].forEach(l => l.fn.call(l.scope, ...l.args));
            delete this._logState.msgQueue[queueId];
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
            withColor: enable ? this._withColor : () => {},
            write: enable ? this._write : () => {},
            write2: enable ? this._write2 : () => {}
        });
    };


    private _error = (msg: any, params?: (string|any)[][], queueId?: string, symbols: [ string, string ] = [ "", "" ]) =>
    {
        if (!msg) { return; }
        if (!symbols || !symbols[0]) {
            const symbol1 = this.allowScaryColors ? this.symbols.color.error : this.symbols.blue.error;
            symbols = [ symbol1, this.symbols.error ];
        }
        //
        // Ignore consecutive duplicate messages
        //
        const errMsgs = this.parseValue(msg);
        if (this._logState.lastErrorMesage[0] === errMsgs[0])
        {
            if (!isArray(msg)) {
                return;
            }
            /* istanbul ignore next */
            if (errMsgs[1] === this._logState.lastErrorMesage[1] && errMsgs.length === this._logState.lastErrorMesage.length) {
                return;
            }
        }
        this._errorsWritten++;
        this._logState.lastErrorMesage = errMsgs;
        const currentWriteToConsole = this._logControl.writeToConsole,
              currentWriteToFile = this._logControl.enableFile,
              currentWriteToOutputWindow = this._logControl.enableOutputWindow;
        //
        // Write blank line
        //
        if (!this._logState.lastWriteWasBlankError && !this._logState.lastWriteToConsoleWasBlank)
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
                    this._value(`   ${n}`, v, 1, "", queueId, true);
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
            enableOutputWindow: currentWriteToOutputWindow
        });
        apply(this._logState, {
            lastWriteWasBlank: true,
            lastWriteWasBlankError: true,
            lastWriteToConsoleWasBlank: true
        });
    };


    private errorConsole = (msg: string, symbols: [ string, string ], queueId?: string) =>
    {
        apply(this._logControl, { writeToConsole: true, enableFile: false, enableOutputWindow: false });
        if (!this._logControl.blockScaryColors) {
            this._write(symbols[0] + " " + msg, 1, "", queueId, false, true);
        }
        else {
            this._write(this.withColor(symbols[0] + " " + msg, this.colors.grey), 1, "", queueId, false, true);
        }
    };


    private errorFile = (msg: string, symbols: [ string, string ]) =>
    {
        apply(this._logControl, { writeToConsole: false, enableFile: true, enableOutputWindow: false });
        this._write(`*** ${msg}`, 1, "", undefined, false, true);
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
        const ts = `${sInfo.stamp} ${this.symbols.pointer} ${symbols[1]}`;
        this._logConfig.errorChannel.appendLine(`${ts} --- ERROR ${this._errorsWritten} ${this._separator}`);
        this._logConfig.errorChannel.appendLine(ts);
        this._logConfig.errorChannel.appendLine(`${ts} line          : ${sInfo.line}`);
        this._logConfig.errorChannel.appendLine(`${ts} column        : ${sInfo.column}`);
        this._logConfig.errorChannel.appendLine(`${ts} name          : ${sInfo.name}`);
        this._logConfig.errorChannel.appendLine(`${ts} file          : ${sInfo.source}`);
        this._logConfig.errorChannel.appendLine(ts);
        this._logConfig.errorChannel.appendLine(`${ts} error message :`);
        this._logConfig.errorChannel.appendLine(ts);
    };


    private getDefaultConfig = (context: ExtensionContext): ILogConfig =>
    {
        const pkgJson = context.extension.packageJSON;
        return {
            channelWriteFn: "appendLine",
            dirPath: context.logUri.fsPath,
            errorChannel: window.createOutputChannel(`${context.extension.packageJSON.displayName} (Errors)`),
            extensionAuthor: isObject(pkgJson.author) ? pkgJson.author.name : pkgJson.name,
            extensionId: context.extension.id,
            isTests: context.extensionMode === ExtensionMode.Test,
            outputChannel: window.createOutputChannel(context.extension.packageJSON.displayName)
        };
    };


    private getDefaultControl = (isTests: boolean, config: IConfiguration): ILogControl =>
    {
        return {
            blockScaryColors: isTests,
            enable: config.get<boolean>(ConfigKeys.LogEnable, false),
            enableOutputWindow: config.get<boolean>(ConfigKeys.LogEnableOutputWindow, true),
            enableFile: config.get<boolean>(ConfigKeys.LogEnableFile, false),
            enableModuleReload: config.get<boolean>(ConfigKeys.LogEnableModuleReload, false),
            level: config.get<LogLevel>(ConfigKeys.LogLevel, 1),
            trace: false,
            valueWhiteSpace: 45,
            writeToConsole: false,
            writeToConsoleLevel: 2
        };
    };


    private getDefaultStamp = () =>
    {
        const timeTags = (new Date(Date.now() - this._logState.tzOffset)).toISOString().slice(0, -1).split("T");
        return {
            column: 1,
            source: this._moduleFile,
            line: 1,
            name: "anonymous",
            stamp: timeTags.join(" "),
            stampDate: timeTags[0],
            stampTime: timeTags[1]
        };
    };


    private getDefaultState = (): ILogState =>
    {
        return {
            fileName: "",
            lastErrorMesage: [],
            lastLogPad: "",
            lastWriteWasBlank: false,
            lastWriteWasBlankError: false,
            lastWriteToConsoleWasBlank: false,
            msgQueue: {},
            tzOffset: (new Date()).getTimezoneOffset() * 60000,
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


    private getSymbols = (): ILogSymbols => ({
        success: "✔",
        info: "ℹ",
        warning: "⚠",
        error: "✘",
        pointer: "❯",
        start: "▶",
        end: "◀",
        star: "★",
        checkboxOn: "☒",
        checkboxOff: "☐",
        pointerSmall: "›",
        bullet: "●",
        bulletBig: "⬢",
        up: "△",
        blue:
        {
            error: <"✘">this._withColor("✘", this._colors.blue),
            info: <"ℹ">this._withColor("ℹ", this._colors.blue),
            success: <"✔">this._withColor("✔", this._colors.blue),
            warning: <"⚠">this._withColor("⚠", this._colors.blue),
        },
        color:
        {
            success: <"✔">this._withColor("✔", this._colors.green),
            info: <"ℹ">this._withColor("ℹ", this._colors.magenta),
            warning: <"⚠">this._withColor("⚠", this._colors.yellow),
            error: <"✘">this._withColor("✘", this._colors.red),
            start: <"▶">this._withColor("▶", this._colors.green),
            end: <"◀">this._withColor("◀", this._colors.green),
            pointer: <"❯">this._withColor("❯", this._colors.grey),
            up: <"△">this._withColor("△", this._colors.green),
        }
    });


    init = async (wrapper: ITeWrapper, version: string, env: string, newVersionOrInstall: boolean, httpGetFn: HttpGetFunction, promptRestartFn: (...args: any[]) => any) =>
    {
        this._wrapper = wrapper;
        this._httpGetFn = httpGetFn;
        await this.installDebugSupport(version, env, newVersionOrInstall);
        await this.installSourceMapSupport(version, env, newVersionOrInstall);
        //
        // Logging is disabled by default in construction of the logging module, take any
        // necessary actions if it's enabled in user settings
        //
        if (this._logControl.enable)
        {
            if (newVersionOrInstall) {
                const msg = "New debug support files have been installed, a restart is required to re-enable logging";
                queueMicrotask(() => promptRestartFn(msg));
            }
            else {
                this.enable(this._logControl.enable);
            }
        }
    };


    private installDebugSupport = (version: string, env: string, clean?: boolean, swap?: boolean): Promise<void> =>
    {
        return wrap(async () =>
        {
            const enable = this._logControl.enable,
                  teRelModulePath = join(this._dbgModuleDir, "taskexplorer.js"),
                  rtRelModulePath = join(this._dbgModuleDir, "runtime.js"),
                  vendorRelModulePath = join(this._dbgModuleDir, "vendor.js"),
                  teDbgModulePath = join(this._dbgModuleDir, "taskexplorer.debug.js"),
                  rtDbgModulePath = join(this._dbgModuleDir, "runtime.debug.js"),
                  vendorDbgModulePath = join(this._dbgModuleDir, "vendor.debug.js"),
                  tePath = join(this._runtimeDir, "taskexplorer.js"),
                  rtPath = join(this._runtimeDir, "runtime.js"),
                  vendorPath = join(this._runtimeDir, "vendor.js"),
                  remoteBasePath: `app/${string}/v${string}` = `app/vscode-taskexplorer/v${version}/${env}`;
            if (clean)
            {
                deleteFileSync(teRelModulePath);
                deleteFileSync(rtRelModulePath);
                deleteFileSync(vendorRelModulePath);
                deleteFileSync(teDbgModulePath);
                deleteFileSync(rtDbgModulePath);
                deleteFileSync(vendorDbgModulePath);
            }
            await execIf(!pathExistsSync(teDbgModulePath), async () =>
            {
                const moduleContent = await this.httpGet(`${remoteBasePath}/taskexplorer.debug.js`);
                await writeFile(teDbgModulePath, Buffer.from(moduleContent));
            });
            await execIf(!pathExistsSync(rtDbgModulePath), async () =>
            {
                const moduleContent = await this.httpGet(`${remoteBasePath}/runtime.debug.js`);
                await writeFile(rtDbgModulePath, Buffer.from(moduleContent));
            });
            await execIf(!pathExistsSync(vendorDbgModulePath), async () =>
            {
                const moduleContent = await this.httpGet(`${remoteBasePath}/vendor.debug.js`);
                await writeFile(vendorDbgModulePath, Buffer.from(moduleContent));
            });
            await execIf(!pathExistsSync(teRelModulePath), () => copyFile(tePath, teRelModulePath), this);
            await execIf(!pathExistsSync(rtRelModulePath), () => copyFile(rtPath, rtRelModulePath), this);
            await execIf(!pathExistsSync(vendorRelModulePath), () => copyFile(vendorPath, vendorRelModulePath), this);
            if (swap)
            {
                await copyFile(!enable ? teRelModulePath : teDbgModulePath, tePath);
                await copyFile(!enable ? rtRelModulePath : rtDbgModulePath, rtPath);
                await copyFile(!enable ? vendorRelModulePath : vendorDbgModulePath, vendorPath);
            }
        },
        [ this._error, "Unable to install logging supprt" ], this);
    };


    private installSourceMapSupport = (version: string, env: string, clean?: boolean): Promise<void> =>
    {
        return wrap(async () =>
        {
            const downloadWasm = !pathExistsSync(this._wasmPath),
                  downloadSourceMap = !pathExistsSync(this._srcMapPath),
                  remoteBasePath: `app/vscode-taskexplorer/v${string}` = `app/vscode-taskexplorer/v${version}/${env}`;
            if (clean)
            {
                deleteFileSync(this._wasmPath);
                deleteFileSync(this._srcMapPath);
            }
            await execIf(downloadWasm, async () =>
            {
                const wasmContent = await this.httpGet(`${remoteBasePath}/mappings.wasm`);
                await writeFile(this._wasmPath, Buffer.from(wasmContent));
            });
            await execIf(downloadSourceMap, async () =>
            {
                const srcMapContent = await this.httpGet(`${remoteBasePath}/${this._moduleName}.js.map`);
                await writeFile(this._srcMapPath, Buffer.from(srcMapContent));
            });
            await copyFile(this._wasmPath, this._wasmRtPath);
            const srcMap = await readJsonAsync<RawSourceMap>(this._srcMapPath);
            this._srcMapConsumer = await new SourceMapConsumer(srcMap);
            this._disposables.push({
                dispose: () => wrap(c => c.destroy(), [ this._error ], this, this._srcMapConsumer)
            });
        },
        [ this._error, "Unable to install source map supprt for error tracing" ], this);
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


    private msUntilMidnight(): number
    {
        const midnight = new Date();
        midnight.setHours(24);
        midnight.setMinutes(0);
        midnight.setSeconds(0);
        midnight.setMilliseconds(0);
        return (!this._logConfig.isTests ? /* istanbul ignore next */midnight.getTime() - new Date().getTime() : 120000);
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
        const cfgBaseKey = this.wrapper.config.baseSection,
              cfgKeys = this.wrapper.keys.Config;
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnable}`))
        {
            this._logControl.enable = this._config.get<boolean>(cfgKeys.LogEnable, false);
            void this.processLogEnableChange();
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnableOutputWindow}`))
        {
            this._logControl.enableOutputWindow = this._config.get<boolean>(cfgKeys.LogEnableOutputWindow, true);
            if (this._logControl.enableOutputWindow && !this._logControl.enable) {
                await this._config.update(cfgKeys.LogEnable, this._logControl.enableOutputWindow);
            }
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnableFile}`))
        {
            this._logControl.enableFile = this._config.get<boolean>(cfgKeys.LogEnableFile, false);
            if (this._logControl.enableFile)
            {
                this.writeLogFileLocation();
                window.showInformationMessage("Log file location: " + this._logState.fileName);
                if (!this._logControl.enable) {
                    await this._config.update(cfgKeys.LogEnable, this._logControl.enableFile);
                }
            }
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnableModuleReload}`))
        {
            this._logControl.enableModuleReload = this._config.get<boolean>(cfgKeys.LogEnableModuleReload, false);
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogLevel}`))
        {
            this._logControl.level = this._config.get<LogLevel>(cfgKeys.LogLevel, 1);
        }
    };


    private processLogEnableChange = async () =>
    {
        const enable = this._logControl.enable,
              enabledPreviously = enable && pathExistsSync(join(this._dbgModuleDir, "taskexplorer.js"));
        if (this._logControl.enableModuleReload || !enabledPreviously)
        {
            const msg = `To ${enable ? "enable" : "disable"} logging ${enabledPreviously ? "for the 1st time" : ""}, ` +
                        `the ${enable ? "debug" : "release"} module must be ${!enabledPreviously ? "activated" : "installed"} ` +
                        "and will require a restart";
            const action = await window.showInformationMessage(msg, "Restart", "Cancel");
            if (action === "Restart")
            {
                await this.installDebugSupport(this.wrapper.version, this.wrapper.env, false, true);
                void commands.executeCommand<void>(this.wrapper.keys.VsCodeCommands.Reload);
            }
        }
        else { this.enable(enable); }
    };


    private setFileName = () =>
    {
        const locISOTime = (new Date(Date.now() - this._logState.tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, "");
        this._logState.fileName = join(this._logConfig.dirPath, `vscode-${this._moduleName}-${locISOTime}.log`);
        if (this._logControl.enableFile) {
            this.writeLogFileLocation();
        }
        if (this._fileNameTimer) {
            clearTimeout(this._fileNameTimer);
        }
        this._fileNameTimer = setTimeout(this.setFileName, this.msUntilMidnight());
    };


    private showOutput = async(show: boolean, channel: OutputChannel) =>
    {
        if (show) {
            await commands.executeCommand<void>(VsCodeCommands.FocusOutputWindowPanel);
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
        this._error(msg, params, queueId, [ this.allowScaryColors ? this.symbols.color.warning : this.symbols.blue.warning, this.symbols.warning ]);


    private _withColor = (msg: string, color: LogColor) => "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m";


    private writeErrorChannelHeader = () =>
    {
        this._logConfig.errorChannel.appendLine("");
        this._logConfig.errorChannel.appendLine("****************************************************************************************************");
        this._logConfig.errorChannel.appendLine(" Task Explorer Error Logging Channel");
        this._logConfig.errorChannel.appendLine("****************************************************************************************************");
        this._logConfig.errorChannel.appendLine("");
    };


    private writeOutputChannelHeader = () =>
    {
        this._logConfig.outputChannel.appendLine("");
        this._logConfig.outputChannel.appendLine("****************************************************************************************************");
        this._logConfig.errorChannel.appendLine(" Task Explorer Error Logging Channel");
        this._logConfig.outputChannel.appendLine("****************************************************************************************************");
        this._logConfig.outputChannel.appendLine("");
    };


    private writeLogFileLocation = () =>
    {
        this._logConfig.outputChannel.appendLine("***********************************************************************************************");
        this._logConfig.outputChannel.appendLine(` Task Explorer Log File: ${this._logState.fileName}`);
        this._logConfig.outputChannel.appendLine("***********************************************************************************************");
        console.log(`    ${this.symbols.color.info} ${this.withColor("*************************************************************************************", this.colors.grey)}`);
        console.log(`    ${this.symbols.color.info} ${this.withColor(` Task Explorer Log File: ${this._logState.fileName}`, this.colors.grey)}`);
        console.log(`    ${this.symbols.color.info} ${this.withColor("*************************************************************************************", this.colors.grey)}`);
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
                    msgs[m] = (this.allowScaryColors ? this.symbols.color.error : this.symbols.blue.error) + " " + msgs[m];
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
                        if (!this._logState.msgQueue[queueId]) this._logState.msgQueue[queueId] = [];
                        this._logState.msgQueue[queueId].push({ fn, scope, args: [ ...args, _msg ] });
                    }
                }
                else
                {
                    if (!queueId) {
                        fn.call(scope, _msg);
                    }
                    else {
                        if (!this._logState.msgQueue[queueId]) this._logState.msgQueue[queueId] = [];
                        this._logState.msgQueue[queueId].push({ fn, scope, args: [ _msg ] });
                    }
                }
            firstLineDone = true;
        }
    };


    private _write = (msg: string, level?: LogLevel, logPad?: string, queueId?: string, isValue?: boolean, isError?: boolean) =>
    {
        if (msg === null || msg === undefined || (this._logState.lastWriteWasBlank && msg === "")) {
            return;
        }
        const isMinLevel = (!level || level <= this._logControl.level);
        if (logPad === undefined) {
            logPad = ""; // this._logState.lastLogPad || "";
        } //
         // VSCODE OUTPUT WINDOW LOGGING
        //
        if (this._logControl.enableOutputWindow && (isMinLevel || isError))
        {
            const ts = this.getStamp().stamp  + " " + this.symbols.pointer;
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logConfig.outputChannel.appendLine, this._logConfig.outputChannel, ts, false);
            if (isError && this._srcMapConsumer && (!this._errorsWritten || msg)) {
                this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logConfig.errorChannel.appendLine, this._logConfig.errorChannel, ts, false);
            }
        } //
         // CONSOLE LOGGING
        //
        if (this._logControl.writeToConsole && (isError || !level || level <= this._logControl.writeToConsoleLevel))
        {
            const ts = !this._logConfig.isTests ? /* istanbul ignore next */this.getStamp().stampTime + " " + this.symbols.pointer : "   ";
            msg = this.withColor(msg, this.colors.grey);
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, console.log, console, ts, false);
            this._logState.lastWriteToConsoleWasBlank = false;
        } //
         // FILE LOGGING
        //
        if (this._logControl.enableFile && isMinLevel)
        {
            const ts = this.getStamp().stampTime + " >";
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, appendFileSync, null, ts, true, this._logState.fileName);
        }
        apply(this._logState, { lastLogPad: logPad, lastWriteWasBlank: (msg === "") });
        if (!isError)
        {
            apply(this._logState, { lastErrorMesage: [], lastWriteWasBlankError: false });
            this._logState.lastWriteToConsoleWasBlank = this._logState.lastWriteToConsoleWasBlank && !this._logConfig.isTests;
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
    value = this._value;
    values = this._values;
    warn = this._warn;
    withColor = this._withColor;
    write = this._write;
    write2 = this._write2;

}
