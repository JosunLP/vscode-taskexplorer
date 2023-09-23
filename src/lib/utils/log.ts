/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */

/**
 * @file lib/utils/log.ts
 * @author @spmeesseman Scott Meesseman
 */

import { apply } from "./object";
import { basename, dirname, join, resolve } from "path";
import { awaitMaybe, execIf, popIfExistsBy, wrap } from "./utils";
import { BasicSourceMapConsumer, RawSourceMap, SourceMapConsumer } from "source-map";
import {
    asString, isArray, isEmpty, isError, isObject, isObjectEmpty, isPrimitive, isString
} from "./typeUtils";
import {
    ILog, ILogConfig, ILogControl, ILogState, LogLevel, ILogSymbols, LogColor, ILogColors, ILogDisposable
} from "../../interface";
import {
    appendFileSync, copyFile, createDirSync, deleteDir, findFilesSync, pathExistsSync, readFileAsync,
    readFileSync, readJsonAsync, writeFile
} from "./fs";

// export class LogOutputChannel implements ILogOutputChannel
// {
//     constructor(writeFn: (message: string) => void) {}
// }


/**
 * @class Log
 */
export abstract class Log implements ILog, ILogDisposable
{
    abstract disposeApp(): void | PromiseLike<void>;

    private _errorsWritten = 0;
    private _fileNameTimer: NodeJS.Timeout | undefined;
    private _srcMapConsumer: BasicSourceMapConsumer | undefined;

    private readonly _logState: ILogState;
    private readonly _logConfig: ILogConfig;
    private readonly _logControl: ILogControl;
    private readonly _logControlPrev: ILogControl;
    private readonly _baseDisposables: ILogDisposable[] = [];
    private readonly _moduleInfo = { dir: "", file: "", name: "", path: "", storageDir: "", version: "" };
    private readonly _separator = "----------------------------------------------------------------------------------------------------";
    private readonly _stackLineParserRgx = /at (?:<anonymous>[\. ]|)+(.+?)(?:\.<anonymous> | )+\((.+)\:([0-9]+)\:([0-9]+)\)/i;
    private readonly _stackLineFilterRgx = /(?:^Error\: ?$|(?:(?:Object|[\/\\\(\[ \.])(?:getStamp|errorWrite[a-z]+?|write2?|_?error|warn(?:ing)?|values?|method[DS]|extensionHost|node\:internal)(?: |\]|\/)))/i;


    constructor(logConfig: ILogConfig, logControl: ILogControl)
    {
        this.enable(false);
        this.verifyConfig(logConfig);
        this._logConfig = apply({}, logConfig);
        this._logControl = apply({}, logControl);
        this._logControlPrev = apply({}, logControl);
        this._symbols = this.getSymbols();
        this._logState = this.getDefaultState();
        this.setModuleInfo();
        this.writeErrorChannelHeader();
        this.writeOutputChannelHeader();
        this.setFileName();
    }

    dispose = async () =>
    {
        clearTimeout(this._fileNameTimer);
        const result = this.disposeApp();
        await awaitMaybe(result);
        this._baseDisposables.splice(0).forEach(d => d.dispose());
        //
        // TODO - Delete depending on config setting ModuleReplace?
        //
        // try { deleteFileSync(join(this._runtimeDir, "mappings.wasm")); } catch {}
    };

    get colors(): Readonly<ILogColors> { return this._colors; }
    get config(): Readonly<ILogConfig> { return this._logConfig; }
    get control(): ILogControl { return this._logControl; }
    get lastPad(): string { return this._logState.lastLogPad; }
    get state(): Readonly<ILogState> { return this._logState; }
    get symbols(): Readonly<ILogSymbols> { return this._symbols; }

    private get allowScaryColors(): boolean { return !this._logConfig.isTests || !this._logControl.blockScaryColors; }

    private readonly _colors: ILogColors =
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

    private readonly _symbols: ILogSymbols =
    {
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
            error: <"✘">this.withColor("✘", this._colors.blue),
            info: <"ℹ">this.withColor("ℹ", this._colors.blue),
            success: <"✔">this.withColor("✔", this._colors.blue),
            warning: <"⚠">this.withColor("⚠", this._colors.blue)
        },
        color:
        {
            success: <"✔">this.withColor("✔", this._colors.green),
            info: <"ℹ">this.withColor("ℹ", this._colors.magenta),
            warning: <"⚠">this.withColor("⚠", this._colors.yellow),
            error: <"✘">this.withColor("✘", this._colors.red),
            start: <"▶">this.withColor("▶", this._colors.green),
            end: <"◀">this.withColor("◀", this._colors.green),
            pointer: <"❯">this.withColor("❯", this._colors.grey),
            up: <"△">this.withColor("△", this._colors.green)
        }
    };


    private _blank = (level?: LogLevel, queueId?: string) => this._write("", level, "", queueId);


    private _dequeue = (queueId: string) =>
    {
        if (this._logState.msgQueue[queueId])
        {
            this._logState.msgQueue[queueId].forEach(l => l.fn.call(l.scope, ...l.args));
            delete this._logState.msgQueue[queueId];
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
            value: enable ? this._value : () => {},
            values: enable ? this._values : () => {},
            warn: enable ? this._warn : () => {},
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
        // Write error symbol only / blank line
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
        // Write error symbol only / blank line
        //
        this.errorWriteLogs("", currentWriteToFile, symbols, queueId);
        //
        // Reset channel configuration
        //
        apply(this._logControl, {
            enableFile: currentWriteToFile,
            writeToConsole: currentWriteToConsole,
            enableOutputWindow: currentWriteToOutputWindow
        });
        //
        // Save error state
        //
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


    private errorFile = (msg: string) =>
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
        if (fileOn) this.errorFile(lMsg);
        this.errorOutputWindow(lMsg, symbols);     // always write errors to output window
    };


    private errorWriteChannelInfo = (symbols: [ string, string ]) =>
    {
        execIf(this._logConfig.errorChannel, (c) =>
        {
            const sInfo = this.getStamp(true);
            const ts = `${sInfo.stamp} ${this.symbols.pointer} ${symbols[1]}`;
            c.write(`${ts} --- ERROR ${this._errorsWritten} ${this._separator.substring(0, this._separator.length - 10 - this._errorsWritten.toString().length)}`);
            c.write(ts);
            c.write(`${ts} line          : ${sInfo.line}`);
            c.write(`${ts} column        : ${sInfo.column}`);
            c.write(`${ts} name          : ${sInfo.name}`);
            c.write(`${ts} file          : ${sInfo.source}`);
            c.write(ts);
            c.write(`${ts} error message :`);
            c.write(ts);
        }, this);
    };


    private getDefaultStamp = () =>
    {
        const timeTags = (new Date(Date.now() - this._logState.tzOffset)).toISOString().slice(0, -1).split("T");
        return {
            column: 1,
            source: this._moduleInfo.file,
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
            tzOffset: (new Date()).getTimezoneOffset() * 60000
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
            execIf(match, (m) =>
            {
                const [ _, name, source, line, column ] = m;
                apply(info, { source: basename(source), name, column: parseInt(column, 10), line: parseInt(line, 10) });
                execIf(this._srcMapConsumer, c => apply(info, c.originalPositionFor({ line: info.line, column: info.column })));
            }, this);
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
            error: <"✘">this.withColor("✘", this._colors.blue),
            info: <"ℹ">this.withColor("ℹ", this._colors.blue),
            success: <"✔">this.withColor("✔", this._colors.blue),
            warning: <"⚠">this.withColor("⚠", this._colors.blue)
        },
        color:
        {
            success: <"✔">this.withColor("✔", this._colors.green),
            info: <"ℹ">this.withColor("ℹ", this._colors.magenta),
            warning: <"⚠">this.withColor("⚠", this._colors.yellow),
            error: <"✘">this.withColor("✘", this._colors.red),
            start: <"▶">this.withColor("▶", this._colors.green),
            end: <"◀">this.withColor("◀", this._colors.green),
            pointer: <"❯">this.withColor("❯", this._colors.grey),
            up: <"△">this.withColor("△", this._colors.green)
        }
    });


    initBase = async (isNewInstallOrVersion: boolean) =>
    {   //
        // Calling application should `clean` when there is a version change or for a new
        // install (as user may have uninstalled and reinstralled, there's no way for the
        // app to perform cleanup when unsinstalled in some cases)
        //
        await execIf(isNewInstallOrVersion, async () =>
        {
            await deleteDir(this._moduleInfo.storageDir);
            createDirSync(this._moduleInfo.storageDir);
        }, this);
        await this.installDebugSupport();
        await this.installSourceMapSupport();
console.log("------------initbase");
        /* istanbul ignore if */
        if (this._logControl.enable)
        {
            if (isNewInstallOrVersion) {
                const msg = "Debug support files have been installed, a restart is required to re-enable logging";
                void this._logConfig.promptRestartFn(msg);
            }
            else {
                this.enable(this._logControl.enable);
            }
        }
    };


    private installDebugSupport = (swap?: boolean): Promise<void> =>
    {
        return wrap(async () =>
        {
            const enable = this._logControl.enable,
                  dbgModuleStorageDir = this._moduleInfo.storageDir,
                  curModuleContent = await readFileAsync(this._moduleInfo.path),
                  relModuleHash = this._logConfig.moduleHash[this._moduleInfo.name],
                  releaseFile = `${this._moduleInfo.name}.${relModuleHash}.js`,
                  releaseFileNoHash = this._moduleInfo.file,
                  dbgModuleHash = this._logConfig.moduleHash[this._moduleInfo.name + ".debug"],
                  debugFile = `${this._moduleInfo.name}.debug.${dbgModuleHash}.js`,
                  debugFileNoHash = `${this._moduleInfo.name}.debug.js`,
                  isCurrentlyDbg = curModuleContent.substring(curModuleContent.length - 100).includes(`${debugFile}.map`);
            //
            // Retrieve the debug modules from the server if not already downloaded and save them
            // to the configured storage directory
            //
            const remotePath = `res/app/${this._logConfig.app}/v${this._moduleInfo.version}/${this._logConfig.env}`;
            let doSwap = (!isCurrentlyDbg && swap === true) || swap === undefined,
                storageFilePath = join(dbgModuleStorageDir, debugFileNoHash);
            await execIf(
                doSwap && !pathExistsSync(storageFilePath),
                async () => {
                    const content = await this._logConfig.httpGetFn(`${remotePath}/${debugFile}`);
                    await writeFile(storageFilePath, Buffer.from(content));
                },
                this, [ this.warn, `could not download debug module ${debugFile}` ]
            );
console.log("------------installDebugSupport 1");
            //
            // Make a copy of the release modules currently in the runtime directory if not
            // already saved to the configured storage directory
            //
            doSwap = (swap === true && isCurrentlyDbg) || swap === undefined;
            storageFilePath = join(dbgModuleStorageDir, this._moduleInfo.file);
            await execIf(
                doSwap && !pathExistsSync(storageFilePath),
                () => copyFile(this._moduleInfo.path, storageFilePath),
                this, [ this.warn, `could not load release module ${releaseFile}` ]
            );
console.log("------------installDebugSupport 2");
            //
            // Swap release / debug modules i.e. overwrite the current runtime file in the
            // configured module runtime directory
            //
            /* istanbul ignore if */
            if (swap)
            {
                const cpFile = !enable ? releaseFileNoHash : debugFileNoHash;
                await copyFile(join(dbgModuleStorageDir, cpFile), join(this._moduleInfo.dir, releaseFileNoHash));
            }
console.log("------------installDebugSupport 3");
        },
        [ this._error, "Unable to install logging supprt" ], this);
    };


    private installSourceMapSupport = (): Promise<void> =>
    {
        return wrap(async () =>
        {
            const wasmPath = join(this._moduleInfo.storageDir, "mappings.wasm"),
                  dbgModuleHash = this._logConfig.moduleHash[this._moduleInfo.name + ".debug"],
                  srcMapFile = `${this._moduleInfo.name}.debug.${dbgModuleHash}.js.map`,
                  srcMapPath = join(this._moduleInfo.storageDir, srcMapFile),
                  remoteBasePath = `res/app/${this._logConfig.app}/v${this._moduleInfo.version}/${this._logConfig.env}`;
            //
            // Retrieve the sourcemap support files from the server if not already downloaded and
            // save them to the globalStorage directory (full path defined as *DbgModulePath).
            // This includes the <module>.js.map file and the web assembly file from the third
            // party vendor `source-map` npm package `mappings.wasm`.
            //
            await execIf(!pathExistsSync(wasmPath), async () => // Assembly file `mappings.wasm`
            {
                const content = await this._logConfig.httpGetFn(`${remoteBasePath}/mappings.wasm`);
                await writeFile(wasmPath, Buffer.from(content));
            });
            await execIf(!pathExistsSync(srcMapPath), async () => // Sourcemap file `<module>.js.map`
            {
                const content = await this._logConfig.httpGetFn(`${remoteBasePath}/${srcMapFile}`);
                await writeFile(srcMapPath, Buffer.from(content));
            });
            //
            // Assembly file must reside in the same directory as the sourcemap file (update: same
            // directory as module file?), copy it there
            //
            // await copyFile(wasmPath, join(this._moduleInfo.storageDir, "mappings.wasm"));
            await copyFile(wasmPath, join(this._moduleInfo.dir, "mappings.wasm"));
            //
            // Create SourceMap instance and register it's destroy call as a disposable
            //
            const srcMap = await readJsonAsync<RawSourceMap>(srcMapPath);
            this._srcMapConsumer = await new SourceMapConsumer(srcMap);
            this._baseDisposables.push({
                dispose: () => wrap(c => c.destroy(), [ this._error ], this, this._srcMapConsumer)
            });
        },
        [ this._error, "Unable to install source map support for error tracing" ], this);
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


    reset = async () =>
    {
        let enable = this._logControl.enable;
        const enableChanged = enable !== this._logControlPrev.enable,
              fileEnableChanged = this._logControl.enableFile !== this._logControlPrev.enableFile;
        if (this._logControl.enableFile && fileEnableChanged)
        {
            this.writeLogFileLocation();
        }
        if (enableChanged)
        {
            if (this._logControl.enableModuleReload)
            {
                const msg = `To ${enable ? "enable" : "disable"} logging, the ${enable ? "debug" : "release"} ` +
                            "module must be activated and will require a restart";
                enable = !(await this._logConfig.promptRestartFn(msg, this.installDebugSupport, this, true)) && enable;
            }
            this.enable(enable);
        }
        apply(this._logControlPrev, this._logControl);
    };


    private setFileName = () =>
    {
        const locISOTime = (new Date(Date.now() - this._logState.tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, "");
        this._logState.fileName = join(this._logConfig.logDirectory, `vscode-${this._moduleInfo.name}-${locISOTime}.log`);
        this.writeLogFileLocation();
        clearTimeout(this._fileNameTimer);
        this._fileNameTimer = setTimeout(this.setFileName, this.msUntilMidnight());
    };


    /**
     * @function
     * @private
     * @throws {Error}
     */
    private setModuleInfo = () =>
    {
        const files = findFilesSync("package.json", { cwd: this._logConfig.installDirectory, absolute: true, maxDepth: 1 });
        execIf(files[0], (pkgJsonFile) =>
        {
            const pkgJson = JSON.parse(readFileSync(pkgJsonFile)),
                  path = resolve(this._logConfig.installDirectory, pkgJson.main).replace(".js", "") + ".js",
                  file = basename(path);
            apply(this._moduleInfo, {
                file,
                path,
                dir: dirname(path),
                name: file.replace(/(?:\.[a-f0-9]{16,})?\.js/, ""),
                storageDir: join(this._logConfig.storageDirectory, "debug"),
                version: pkgJson.version
            });
            createDirSync(this._moduleInfo.storageDir);
            createDirSync(this._logConfig.logDirectory);
            createDirSync(this._logConfig.storageDirectory);
        },
        this, [ this._error, new Error("Could not find package.json") ]);
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


    /* istanbul ignore next */
    private verifyConfig = (cfg: ILogConfig) =>
    {
        let errDsc = "";
        if (!cfg.installDirectory) {
            errDsc = "Install directory not specified";
        }
        if (!cfg.logDirectory) {
            errDsc = "Log file directory not specified";
        }
        if (!cfg.storageDirectory) {
            errDsc = "Storage directory not specified";
        }
        if (!cfg.httpGetFn) {
            errDsc = "Callback function for http get not specified";
        }
        if (!cfg.promptRestartFn) {
            errDsc = "Callback function for prompt restart not specified";
        }
        if (!cfg.moduleHash) {
            errDsc = "Module hash not specified";
        }
        else if (!isObject(cfg.moduleHash)) {
            errDsc = "Module hash must be an object";
        }
        else if (isObjectEmpty(cfg.moduleHash)) {
            errDsc = "Module hash object must not be empty";
        }
        else if (Object.keys(cfg.moduleHash).length < 2) {
            errDsc = "Module hash object must contain at least two keys to indicate release and debug hash";
        }
        else {
            for (const hash of Object.values(cfg.moduleHash))
            {
                if (hash.length < 16) {
                    errDsc = "Module hash object must not be empty";
                    break;
                }
            }
        }
        if (errDsc) {
            throw new Error(errDsc);
        }
    };


    private _warn = (msg: any, params?: (string|any)[][], queueId?: string) =>
    {
        this._error(msg, params, queueId, [ this.allowScaryColors ? this.symbols.color.warning : this.symbols.blue.warning, this.symbols.warning ]);
    };


    withColor(msg: string, color: LogColor) { return "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m"; };


    private writeErrorChannelHeader = () =>
    {
        execIf(this._logConfig.errorChannel, (c) =>
        {
            c.write("");
            c.write(this._separator);
            c.write(" Task Explorer Error Logging Channel");
            c.write(this._separator);
            c.write("");
        }, this);
    };


    private writeOutputChannelHeader = () =>
    {
        execIf(this._logConfig.outputChannel, (c) =>
        {
            c.write("");
            c.write(this._separator);
            c.write(" Task Explorer Error Logging Channel");
            c.write(this._separator);
            c.write("");
        }, this);
    };


    private writeLogFileLocation = () =>
    {
        execIf(this._logControl.enableFile, () =>
        {   execIf(this._logConfig.outputChannel, (c) =>
            {
                c.write(this._separator);
                c.write(` Task Explorer Log File: ${this._logState.fileName}`);
                c.write(this._separator);
            }, this);
            const sep = `    ${this.symbols.color.info} ${this.withColor(this._separator, this.colors.grey)}`;
            console.log(sep);
            console.log(`    ${this.symbols.color.info} ${this.withColor(` Task Explorer Log File: ${this._logState.fileName}`, this.colors.grey)}`);
            console.log(sep);
        }, this);
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
        if (this._logControl.enableOutputWindow && this._logConfig.outputChannel && (isMinLevel || isError))
        {
            const ts = this.getStamp().stamp  + " " + this.symbols.pointer;
            this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logConfig.outputChannel.write, this._logConfig.outputChannel, ts, false);
            if (isError && this._logConfig.errorChannel && this._srcMapConsumer && (!this._errorsWritten || msg)) {
                this.writeInternal(msg, logPad, queueId, !!isValue, !!isError, this._logConfig.errorChannel.write, this._logConfig.errorChannel, ts, false);
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
    write = this._write;
    write2 = this._write2;

}
