
import { blank } from "./blank";
import { dirname, join } from "path";
import { createDir } from "../utils/fs";
import { figures } from "../utils/figures";
import { IConfiguration, ILogControl } from "../../interface";
import { methodDone, methodOnce, methodStart } from "./method";
import { warn, setLogControl as setLogControlWarn } from "./warn";
import { write, setLogControl as setLogControlWrite } from "./write";
import { error, setLogControl as setLogControlError } from "./error";
import { value, values, setLogControl as setLogControlValue } from "./value";
import { OutputChannel, ExtensionContext, commands, window, workspace, ConfigurationChangeEvent } from "vscode";

export const logControl: ILogControl =
{
    enable: false,
    enableFile: false,
    enableFileSymbols: false,
    enableOutputWindow: false,
    fileName: "",
    isTests: false,
    isTestsBlockScaryColors: false,
    lastErrorMesage: [],
    lastLogPad: "",
    lastWriteWasBlank: false,
    lastWriteWasBlankError: false,
    lastWriteToConsoleWasBlank: false,
    logLevel: 1,
    logOutputChannel: undefined,
    logValueWhiteSpace: 45,
    msgQueue: {},
    useTags: true,
    useTagsMaxLength: 8,
    tzOffset: (new Date()).getTimezoneOffset() * 60000,
    writeToConsole: false,
    writeToConsoleLevel: 2
};


const colors = figures.colors;


const dequeue = (queueId: string) =>
{
    if (logControl.msgQueue[queueId])
    {
        logControl.msgQueue[queueId].forEach((l) =>
        {
            l.fn.call(l.scope, ...l.args);
        });
        delete logControl.msgQueue[queueId];
    }
};


/**
 * @param enable If `false`, set all log function to empty functions.  If `true`, apply all log functions
 */
const enableLog = (enable: boolean) =>
{
    Object.assign(logFunctions,
    {
        blank: enable ? blank : () => {},
        dequeue: enable ? dequeue : () => {},
        error: enable ? error : () => {},
        methodStart: enable ? methodStart : () => {},
        methodDone: enable ? methodDone : () => {},
        methodOnce: enable ? methodOnce : () => {},
        value: enable ? value : () => {},
        values: enable ? values : () => {},
        warn: enable ? warn : () => {},
        withColor: enable ? withColor : () => {},
        write: enable ? write : () => {}
    });
};


const getFileName = () =>
{
    const locISOTime = (new Date(Date.now() - logControl.tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, "");
    return `taskexplorer-${locISOTime}.log`;
};


const getLogFileName = () => logControl.fileName;


const isLoggingEnabled = () => logControl.enable;


const logLogFileLocation = () =>
{
    if (logControl.enable && logControl.enableFile)
    {
        const channel: OutputChannel = logControl.logOutputChannel as OutputChannel;
        channel.appendLine("***********************************************************************************************");
        channel.appendLine(" Log File: " + logControl.fileName);
        channel.appendLine("***********************************************************************************************");
        console.log(`    ${figures.color.info} ${figures.withColor("*************************************************************************************", colors.grey)}`);
        console.log(`    ${figures.color.info} ${figures.withColor(" Log File: " + logControl.fileName, colors.grey)}`);
        console.log(`    ${figures.color.info} ${figures.withColor("*************************************************************************************", colors.grey)}`);
    }
};


const getLogPad = () => logControl.lastLogPad;


const processConfigChanges = (config: IConfiguration, e: ConfigurationChangeEvent) =>
{
    if (e.affectsConfiguration("taskexplorer.logging.enable"))
    {
        logControl.enable = config.get<boolean>("logging.enable", false);
        enableLog(logControl.enable);
    }
    if (e.affectsConfiguration("taskexplorer.logging.enableOutputWindow"))
    {
        logControl.enableOutputWindow = config.get<boolean>("logging.enableOutputWindow", true);
    }
    if (e.affectsConfiguration("taskexplorer.logging.enableFile"))
    {
        logControl.enableFile = config.get<boolean>("logging.enableFile", false);
        logLogFileLocation();
        if (logControl.enableFile) {
            window.showInformationMessage("Log file location: " + logControl.fileName);
        }
    }
    if (e.affectsConfiguration("taskexplorer.logging.enableFileSymbols"))
    {
        logControl.enableFileSymbols = config.get<boolean>("logging.enableFileSymbols", true);
    }
    if (e.affectsConfiguration("taskexplorer.logging.level"))
    {
        logControl.logLevel = config.get<number>("logging.level", 1);
    }
};


const registerLog = async(context: ExtensionContext, config: IConfiguration, testsRunning: number) =>
{
    logControl.isTests = testsRunning > 0;
    logControl.isTestsBlockScaryColors = testsRunning > 1;
    logControl.enable = config.get<boolean>("logging.enable", false);
    logControl.logLevel = config.get<number>("logging.level", 1);
    logControl.enableOutputWindow = config.get<boolean>("logging.enableOutputWindow", true);
    logControl.enableFile = config.get<boolean>("logging.enableFile", false);
    logControl.enableFileSymbols = config.get<boolean>("logging.enableFileSymbols", true);
    logControl.fileName = join(context.logUri.fsPath, getFileName());
    await createDir(dirname(logControl.fileName));

    setLogControlError(logControl);
    setLogControlValue(logControl);
    setLogControlWarn(logControl);
    setLogControlWrite(logControl);

    //
    // Set up a log in the Output window (even if enableOutputWindow is off)
    // TODO - Localize text "Task Explorer" with wrapper.extensionName
    //
    logControl.logOutputChannel = window.createOutputChannel("Task Explorer");

    //
    // Register disposables
    //
    context.subscriptions.push(...[
        logControl.logOutputChannel,
        commands.registerCommand("taskexplorer.showOutput", (show: boolean) => showLogOutput(show)),
        workspace.onDidChangeConfiguration(e => processConfigChanges(config, e))
    ]);

    //
    // If logging isn't enabled, then set all log function to empty functions. This
    // function should only be called once, so don't let istanbul pop it
    //
    /* istanbul ignore next */
    if (!logControl.enable) {
        /* istanbul ignore next */
        enableLog(logControl.enable);
    }

    //
    // This function should only be called once, so blank it in the export
    //
    Object.assign(logFunctions,
    {
        registerLog: /* istanbul ignore next */() => {},
    });

    write("Log has been initialized", 1);
    logLogFileLocation();
};


const setWriteToConsole = (set: boolean, level = 2) =>
{
    logControl.writeToConsole = set;
    logControl.writeToConsoleLevel = level;
};


const showLogOutput = async(show: boolean) =>
{
    const channel: OutputChannel = logControl.logOutputChannel as OutputChannel;
    if (show) {
        await commands.executeCommand("workbench.panel.output.focus");
        channel.show();
    }
    else {
        channel.hide();
    }
};


const withColor = figures.withColor;


const logFunctions =
{
    blank,
    colors,
    dequeue,
    enableLog,
    error,
    registerLog,
    getLogFileName,
    getLogPad,
    isLoggingEnabled,
    methodStart,
    methodDone,
    methodOnce,
    setWriteToConsole,
    value,
    values,
    warn,
    withColor,
    write
};

export const log = logFunctions;
