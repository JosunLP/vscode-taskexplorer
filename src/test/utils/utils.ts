/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */

import * as path from "path";
import { expect } from "chai";
import * as treeUtils from "./treeUtils";
import { testControl } from "../control";
import { closeTeWebviewPanel } from "./commandUtils";
import { getWsPath, getProjectsPath } from "./sharedUtils";
import { cleanupSettings, initSettings } from "./initSettings";
import { TestTracker, colors, figures, sleep, writeErrorsAreOk } from "@spmeesseman/test-utils";
import {
    ITaskExplorerApi, ITaskExplorerProvider, ITeWrapper, TeLicenseType, ITeWebview, PromiseAdapter
} from ":types";
import {
    commands, ConfigurationTarget, Event, EventEmitter, Extension, extensions, Task, TaskExecution,
    tasks, Uri, ViewColumn, window, workspace
} from "vscode";

export let teApi: ITaskExplorerApi;
export let teWrapper: ITeWrapper;
export { sleep, testControl, treeUtils, getWsPath, getProjectsPath };

const testTracker = new TestTracker();
export const consoleWrite = testTracker.utils.writeConsole;
export const isRollingCountError = testTracker.isRollingCountError;
export const getSuccessCount = testTracker.utils.getSuccessCount;
export const suiteFinished = testTracker.utils.suiteFinished;
export const endRollingCount = testTracker.utils.endRollingCount;
export const exitRollingCount = testTracker.utils.exitRollingCount;

let activated = false;
let extension: Extension<any>;
let overridesShowInputBox: any[] = [];
let overridesShowInfoBox: any[] = [];
let overridesShowWarningBox: any[] = [];
let NODE_TLS_REJECT_UNAUTHORIZED: string | undefined;

const tc = testControl;
const overridesGetExtension: any[] = [];
const originalShowInputBox = window.showInputBox;
const originalShowInfoBox = window.showInformationMessage;
const originalGetExtension = extensions.getExtension;
const disableSSLMsg = "Disabled ssl cert validation due to Electron/LetsEncrypt DST Root CA X3 Expiry";

//
// Suppress some stderr messages.  It's just tests.
//
// process.stderr.on("data", data => {
//     if (!data.includes("UNRESPONSIVE ext") && !data.includes("(node:22580)")) {
//         process.stdout.write(data);
//     }
// });
// process.on("warning", (warning) => {
//     if (!warning.message.includes("UNRESPONSIVE ext") && !warning.message.includes("(node:22580)")) {
//         console.warn(warning.name);    // Print the warning name
//         console.warn(warning.message); // Print the warning message
//         console.warn(warning.stack);   // Print the stack trace
//     }
// });
// process.on("warning", (warning) => {});


window.showInputBox = (...args: any[]) =>
{
    let next = overridesShowInputBox.shift();
    if (typeof next === "undefined") {
        // return originalShowInputBox.call(null, args as any);
        // overrideNextShowInputBox("");
        next = undefined;
    }
    return new Promise((resolve, reject) => { resolve(next); });
};


window.showInformationMessage = (str: string, ...args: any[]) =>
{
    let next = overridesShowInfoBox.shift();
    if (typeof next === "undefined") {
        next = undefined;
        // return originalShowInfoBox(str, args as any);
    }
    return new Promise<string | undefined>((resolve, reject) => { resolve(next); });
};


window.showWarningMessage = (_str: string, ..._args: any[]) =>
{
    let next = overridesShowWarningBox.shift();
    if (typeof next === "undefined") {
        next = undefined;
        // return originalShowInfoBox(str, args as any);
    }
    return new Promise<string | undefined>((resolve) => { resolve(next); });
};

extensions.getExtension = (str: string) =>
{
    const next = overridesGetExtension.shift();
    if (typeof next === "undefined")
    {
        return originalGetExtension(str);
    }
    return next;
};


export const activate = async () =>
{
    extension = <Extension<any>>extensions.getExtension("spmeesseman.vscode-taskexplorer");
    expect(extension).to.not.be.undefined;

    if (!activated)
    {   //
        // Set startup settings for this tests run using workspace settings scope.
        // The initSettings() functions does it's own logging to the console.
        //
        await initSettings();
        //
		// The LetsEncrypt certificate is rejected by VSCode/Electron Test Suite (?).
		// See https://github.com/electron/electron/issues/31212. Expiry of DST Root CA X3.
		// Works fine when debugging, works fine when the extension is installed, just fails in the
		// tests with the "certificate is expired" error as explained in the link above.  For tests,
		// and until this is resolved in vscode/test-electron (I think that's wherethe problem is?),
		// we just disable TLS_REJECT_UNAUTHORIZED in the NodeJS environment.
		//
		NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        //
        // Activate extension
        // Note that the '*' is removed from package.json[activationEvents] before the runTest() call
        //
        teWrapper = await extension.activate();
		// await sleep(serverActivationDelay); // Wait for server activation
        console.log(`    ${figures.color.info} ${figures.withColor("Extension successfully activated", colors.grey)}`);
		activated = true;
        //
        // Ensure extension initialized successfully
        //
        teApi = teWrapper.api;
        expect(teApi).to.not.be.empty;
        expect(teWrapper.explorer).to.not.be.empty;
        expect(isReady()).to.be.equal(true, `    ${figures.color.error} TeApi not ready`);
        console.log(`    ${figures.color.info} ${figures.withColor("Waiting for extension to initialize", colors.grey)}`);
        await Promise.all([
            teWrapper.isReady || promiseFromEvent(teWrapper.onReady).promise,
            teWrapper.welcomePage.visible || waitForWebviewReadyEvent(teWrapper.welcomePage, 15000)
        ]);
        await waitForWebviewsIdle();
        teWrapper.welcomePage.title = `${teWrapper.extensionTitle} Tutorial (Tests)`;
        teWrapper.welcomePage.title = teWrapper.welcomePage.originalTitle || "";
        await closeTeWebviewPanel(teWrapper.welcomePage);
        await waitForWebviewsIdle();
        await waitForTeIdle();
        //
        // Write to console is just a tests feature, it's not controlled by settings, set it here if needed
        //
        teWrapper.log.control.writeToConsole = tc.log.console;
        teWrapper.log.control.writeToConsoleLevel = tc.log.level;
        //
        // Increase slow times for local license server (making remote db requests)
        //
        if (testControl.apiServer === "localhost")
        {
            const factor = 2.85;
            tc.slowTime.licenseMgr.purchaseLicense  = Math.round(tc.slowTime.licenseMgr.purchaseLicense * factor);
            tc.slowTime.licenseMgr.validateLicense  = Math.round(tc.slowTime.licenseMgr.validateLicense * factor);
            tc.slowTime.licenseMgr.getTrialExtension  = Math.round(tc.slowTime.licenseMgr.getTrialExtension * factor);
        }
        //
        // Set options in testUtils / bestTImes module
        //
        testTracker.options = {
            isMultiRootWorkspace: tc.isMultiRootWorkspace,
            ...tc.testTracker,
            store: {
                getStoreValue: teWrapper.storage.get2.bind(teWrapper.storage),
                updateStoreValue: teWrapper.storage.update2.bind(teWrapper.storage)
            }
        };
        //
        // All done
        //
        const tzOffset = (new Date()).getTimezoneOffset() * 60000,
              locISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1).replace("T", " ").replace(/[\-]/g, "/");
        consoleWrite("Tests initialization completed, ready");
        consoleWrite(`   Time started     : ${locISOTime}`);
        consoleWrite(`   Tests Machine ID : ${process.env.testsMachineId}`);
        consoleWrite(`   Extension Author : ${teWrapper.extensionAuthor}`);
        consoleWrite(`   Extension Name   : ${teWrapper.extensionName}`);
        consoleWrite(`   Extension ID     : ${teWrapper.extensionId}`);
        consoleWrite(`   Extension Title  : ${teWrapper.extensionTitle}`);
        consoleWrite(`   Extension Short  : ${teWrapper.extensionTitleShort}`);
        consoleWrite(`   ${disableSSLMsg}`, figures.color.warningTests);

        activated = true;
    }

    return {
        teApi,
        teWrapper,
        extension
    };
};


export const cleanup = async () =>
{
    console.log(`    ${figures.color.info}`);
    console.log(`    ${figures.color.info} ${figures.withColor("Tests complete, clean up", colors.grey)}`);

    if (teWrapper)
    {   //
        // Cleanup or reset any settings, and clear license/account from tests storage
        //
        await cleanupSettings();
        extensions.getExtension = originalGetExtension;
        window.showInputBox = originalShowInputBox;
        window.showInformationMessage = originalShowInfoBox;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = NODE_TLS_REJECT_UNAUTHORIZED;
        //
        // File cleanup
        //
        console.log(`    ${figures.color.info} ${figures.withColor("Removing any leftover temporary files", colors.grey)}`);
        // teWrapper.fileWatcher.skipEvent({ files: [ "*" ], type: "all" });
        try {
            const packageLock2Dir = path.join(getWsPath("."), "npm_test");
            if (await teWrapper.fs.pathExists(packageLock2Dir)) {
                await teWrapper.fs.deleteDir(packageLock2Dir);
            }
        } catch (e) { console.error(e); }
        // extjsWrapper.fileWatcher.skipEvent({ files: [], type: "all" });
        //
        // Reset Grunt and Gulp VSCode internal task providers, which we enabled b4 extension activation.
        // These get reset at the end of the Gulp suite's tests, but just in case we do it again here...
        //
        console.log(`    ${figures.color.info} ${figures.withColor("Resetting modified global settings", colors.grey)}`);
        await teWrapper.config.updateVs("grunt.autoDetect", tc.vsCodeAutoDetectGrunt);
        await teWrapper.config.updateVs("gulp.autoDetect", tc.vsCodeAutoDetectGulp);
        // await workspace.getConfiguration("grunt").update("autoDetect", tc.vsCodeAutoDetectGrunt, ConfigurationTarget.Global);
        // await workspace.getConfiguration("gulp").update("autoDetect", tc.vsCodeAutoDetectGulp, ConfigurationTarget.Global);
        console.log(`    ${figures.color.info} ${figures.withColor("Cleanup complete", colors.grey)}`);
    }
    else {
        console.log(`    ${figures.color.warning} ${figures.withColor("App wrapper was not initializeds", colors.grey)}`);
    }
    //
    // Process execution timesand do the dorky best time thing that I forsome reason spent a whole
    // day of my life coding.
    //
    await testTracker.processTimes();
    //
    // Delete stored user account
    //
    await teWrapper.storage.deleteSecret(teWrapper.keys.Storage.Account);
    //
    // Log file name (log below just before exit, but get path before extension deactivation)
    //
    let logFileName: string | undefined;
    if (tc.log.enabled && tc.log.file && tc.log.openFileOnFinish)
    {
        logFileName = teWrapper.log.control.fileName;
    }
    //
    // Deactivate extension / Dispose disposable resources
    //
    console.log(`    ${figures.color.info} ${figures.withColor("Deactivating extension", colors.grey)}`);
    // try {
    //     await  (extension as any).deactivate();
    // } catch {}
    const disposables = teWrapper.context.subscriptions.splice(0);
    try {
        for (const d of disposables) { const r = d.dispose(); if (teWrapper.typeUtils.isPromise(r)) { await r; }}
    } catch {}
    console.log(`    ${figures.color.info} ${figures.withColor("Extension successfully deactivated", colors.grey)}`);
    //
    // Write logfile name for eacy click-access
    //
    if (logFileName)
    {
        console.log(`    ${figures.color.info}`);
        console.log(`    ${figures.color.info} ${figures.withColor("Log File Location:", colors.grey)}`);
        console.log(`    ${figures.color.info} ${figures.withColor("   " + logFileName, colors.grey)}`);
        console.log(`    ${figures.color.info}`);
    }
    //
    // Exit
    //
    console.log(`    ${figures.color.info} ${figures.withColor("Exiting", colors.grey)}`);
    console.log(`    ${figures.color.info}`);
};


export const clearOverrideShowInputBox = () => { overridesShowInputBox = []; };


export const clearOverrideShowInfoBox = () => { overridesShowInfoBox = []; };


export const clearOverrideShowWarningBox = () => { overridesShowWarningBox = []; };


export const closeEditors = () => commands.executeCommand("openEditors.closeAll");


export const closeActiveEditor = () => commands.executeCommand("workbench.action.closeActiveEditor");


export const createwebviewForRevive = (viewTitle: string, viewType: string) =>
{
    const resourceDir = Uri.joinPath(teWrapper.context.extensionUri, "res");
    const panel = window.createWebviewPanel(
        `taskexplorer.view.${viewType}`,
        viewTitle,
        ViewColumn.One,
        {
            enableScripts: true,
            enableCommandUris: true,
			enableFindWidget: true,
			retainContextWhenHidden: true,
            localResourceRoots: [ resourceDir ]
        }
    );
    return panel;
};


export const getPackageManager = () =>
{
    let pkgMgr = workspace.getConfiguration("npm", null).get<string>("packageManager") || "npm";
    if (pkgMgr.match(/(npm|auto)/)) { // pnpm/auto?  only other option is yarn
        pkgMgr = "npm";
    }
    return pkgMgr;
};


export const getTeApi = () => teApi;


const isExecuting = (task: Task) =>
{
    const execs = tasks.taskExecutions.filter(e => e.task.name === task.name && e.task.source === task.source &&
                                            e.task.scope === task.scope && e.task.definition.path === task.definition.path);
    const exec = execs.find(e => e.task.name === task.name && e.task.source === task.source &&
                            e.task.scope === task.scope && e.task.definition.path === task.definition.path);
    return exec;
};


const isReady = (taskType?: string) =>
{
    let err: string | undefined;
    if (!teApi)                                 err = `    ${figures.color.error} ${figures.withColor("TeApi null", colors.grey)}`;
    else {
        if (!teWrapper.explorer)                err = `    ${figures.color.error} ${figures.withColor("TeApi Explorer provider == null", colors.grey)}`;
        // /else if (!teApi.sidebar)            err = `    ${figures.color.error} ${figures.withColor("TeApi Sidebar Provider == null", colors.grey)}`;
        else if (!teApi.providers)              err = `    ${figures.color.error} ${figures.withColor("Providers null", colors.grey)}`;
    }
    if (!err && taskType) {
        if (!teApi.providers[taskType])         err = `    ${figures.color.error} ${taskType} ${figures.withColor("Provider == null", colors.grey)}`;
    }
    if (!err && !(workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined)) {
                                                err = `    ${figures.color.error} ${figures.withColor("Workspace folder does not exist", colors.grey)}`;
    }
    if (!err && !extensions.getExtension("spmeesseman.vscode-taskexplorer")) {
                                                err = `    ${figures.color.error} ${figures.withColor("Extension not found", colors.grey)}`;
    }
    if (err) {
        console.log(err);
    }
    return !err ? true : err;
};


export const logErrorsAreFine = (willFail = true) =>
{
    if (willFail && tc.log.enabled && teWrapper.config.get<boolean>("logging.enabled"))
    {
        writeErrorsAreOk();
    }
};


export const overrideNextShowInputBox = (value: any, clear?: boolean) => { if (clear === true) clearOverrideShowInputBox(); overridesShowInputBox.push(value); };


export const overrideNextShowInfoBox = (value: any, clear?: boolean) => { if (clear === true) clearOverrideShowInfoBox(); overridesShowInfoBox.push(value); };


export const overrideNextShowWarningBox = (value: any, clear?: boolean) => { if (clear === true) clearOverrideShowWarningBox(); overridesShowWarningBox.push(value); };


const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);


export const waitForWebviewReadyEvent = async (view: ITeWebview, timeout = 10000, followUpDelay?: number) => waitForEvent(view.onDidReceiveReady, timeout, followUpDelay);


export const oneTimeEvent = <T>(event: Event<T>): Event<T> => teWrapper.promiseUtils.oneTimeEvent(event);


export const waitForEvent = async <T>(event: Event<T>, timeout = 10000, followUpDelay = 2) =>
{
    const eventPromise = teWrapper.promiseUtils.promiseFromEvent(event),
          to = setTimeout((ep: EventEmitter<void>) => ep.fire(), timeout, eventPromise.cancel),
          fuSleepMs = Math.ceil(followUpDelay / 2);
    try {
        await eventPromise.promise;
        clearTimeout(to);
        await sleep(fuSleepMs);
        await sleep(fuSleepMs);
        return true;
    }
    catch (e) {
        if (e === "cancelled") {
            await sleep(fuSleepMs);
            await sleep(fuSleepMs);
            return true;
        }
        clearTimeout(to);
        await sleep(fuSleepMs);
        await sleep(fuSleepMs);
        return false;
    }
};


export const promiseFromEvent = <T, U>(e: Event<T>, adapter: PromiseAdapter<T, U> = passthrough) => teWrapper.promiseUtils.promiseFromEvent(e, adapter);


export const setLicenseType = async (type: TeLicenseType) =>
{
    const licMgr = teWrapper.licenseManager,
          account = licMgr.account;
    account.license.type = type;
    if (type === 1) {
        account.license.state = 1;
    }
    else if (type === 0) {
        account.license.state = 0;
    }
    else if (type >= 4) {
        account.license.state = 2;
    }
    else {
        account.license.state = 0;
    }
};


export const tagLog = (test: string, suite: string) =>
{
    teWrapper.log.write("******************************************************************************************");
    teWrapper.log.write(" SUITE: " + suite.toUpperCase() + "  -  TEST : " + test);
    teWrapper.log.write("******************************************************************************************");
};


export const testInvDocPositions = (provider: ITaskExplorerProvider) =>
{
    provider.getDocumentPosition(undefined, undefined);
    provider.getDocumentPosition("test", undefined);
    provider.getDocumentPosition(undefined, "test");
    provider.getDocumentPosition("test", "");
    provider.getDocumentPosition("test", " ");
    provider.getDocumentPosition("test", "\n");
};


export const updateInternalProviderAutoDetect = async(source: "grunt"|"gulp", value: "on"|"off") =>
{
    await workspace.getConfiguration(source).update("autoDetect", value, ConfigurationTarget.Global);
};


/**
 * @param taskType Task type / source
 * @param expectedCount Expected # of tasks
 * @param retries Number of retries to make if expected count doesn'tmatch.  100ms sleep between each retry.
 */
export const verifyTaskCount = async (taskType: string, expectedCount: number, retries = 1, retryWait = 300) =>
{
    let tTasks = await tasks.fetchTasks({ type: taskType !== "Workspace" ? taskType : undefined });
    if (taskType === "Workspace") {
        tTasks = tTasks.filter(t => t.source === "Workspace");
    }
    else if (taskType === "grunt" || taskType === "gulp") { // cheap.  we ignore internal grunt/gulp while building
        tTasks = tTasks.filter(t => !!t.definition.uri);    // the task tree so ignore them here  too.
    }
    while (--retries >= 0 && tTasks.length !== expectedCount)
    {
        await sleep(retryWait > 0 ? retryWait : 100);
        tTasks = await tasks.fetchTasks({ type: taskType !== "Workspace" ? taskType : undefined });
        if (taskType === "Workspace") {
            tTasks = tTasks.filter(t => t.source === "Workspace");
        }
        else if (taskType === "grunt" || taskType === "gulp") {
            tTasks = tTasks.filter(t => !!t.definition.uri);
        }
        else if (taskType === "npm" && !teWrapper.config.get<boolean>(teWrapper.keys.Config.UseNpmProvider)) {
            tTasks = tTasks.filter(t => teWrapper.fs.pathExistsSync(teWrapper.pathUtils.getTaskAbsolutePath(t, true)) && (!teWrapper.typeUtils.isWorkspaceFolder(t.scope) || !teWrapper.utils.isExcluded(path.join(t.scope.uri.fsPath, t.definition.path || ""), teWrapper.log)));
        }
    }
    if (expectedCount >= 0) {
        expect(tTasks.length).to.be.equal(expectedCount, `${figures.color.error} Unexpected ${taskType} task count (Found ${tTasks.length} of ${expectedCount})`);
    }
    return tTasks.length;
};


export const waitForTaskExecution = async (exec: TaskExecution | undefined, maxWait?: number) =>
{
    if (exec)
    {
        const taskName = exec.task.name;
        let waitedAfterStarted = 0,
            waitedHasNotStarted = 0,
            hasExec = false,
            isExec = !!isExecuting(exec.task);
        if (tc.log.taskExecutionSteps) {
            console.log(`    ${figures.color.infoTask}   ${figures.withColor(`Waiting for '${taskName}' task execution`, colors.grey)}`);
        }
        while ((isExec && (maxWait === undefined || waitedAfterStarted < maxWait)) || (!isExec && !hasExec && waitedHasNotStarted < 3000))
        {
            await sleep(50);
            isExec = !!isExecuting(exec.task);
            if (isExec) {
                if (!hasExec && tc.log.taskExecutionSteps) {
                    console.log(`    ${figures.color.infoTask}     ${figures.withColor(`Task execution started, waited ${waitedAfterStarted + waitedHasNotStarted} ms`, colors.grey)}`);
                }
                hasExec = isExec;
                waitedAfterStarted += 50;
            }
            else if (!hasExec) { waitedHasNotStarted += 50; }
        }
        if (tc.log.taskExecutionSteps) {
            console.log(`    ${figures.color.infoTask}     ${figures.withColor(`Task execution wait finished, waited ${waitedAfterStarted + waitedHasNotStarted} ms`, colors.grey)}`);
        }
    }
};


export const waitForTeIdle = async (minWait = 1, maxWait = 15000, delay = 0, verbose = false) =>
{
    const now = Date.now(),
          eventsProcessed: string[] = [];
    let waited = 0;
    if (verbose) consoleWrite("START: WAIT FOR TASK EXPLORER IDLE");
    if (delay > 0) {
        if (verbose) consoleWrite(`   Delay ${delay}ms`);
        await sleep(delay);
    }
    if (!teWrapper.busy)
    {
        if (verbose) consoleWrite("   Not busy, stall");
        const preWait = minWait > 30 ? 30 : minWait;
        while (waited < preWait && !teWrapper.busy)
        {
            await sleep(10);
            waited += 10;
        }
    }
    const _event = () =>
    {
        let event: [ Event<any>, string ] | undefined;
        if (!teWrapper.isReady) {
            event = [ teWrapper.onReady, "wrapper" ];
        }
        else if (teWrapper.fileCache.isBusy) {
            event = [ teWrapper.fileCache.onReady, "fileCache" ];
        }
        else if (teWrapper.fileWatcher.isBusy) {
            event = [ teWrapper.fileWatcher.onReady, "fileWatcher" ];
        }
        else if (teWrapper.licenseManager.isBusy) {
            event = [ teWrapper.licenseManager.onReady, "licenseManager" ];
        }
        else if (teWrapper.treeManager.configWatcher.isBusy) {
            event = [ teWrapper.treeManager.configWatcher.onReady, "treeManager" ];
        }
        else if (teWrapper.treeManager.isBusy) {
            event = [ teWrapper.treeManager.onDidAllTasksChange, "treeManager" ];
        }
        return event;
    };
    if (teWrapper.busy)
    {
        if (verbose) consoleWrite("   Busy");
        let eventInfo = _event();
        while (eventInfo)
        {
            if (eventsProcessed.length >= 3 && eventsProcessed[0] === eventInfo[1] && eventsProcessed[1] === eventInfo[1] && eventsProcessed[2] === eventInfo[1])
            {
                if (verbose) {
                    consoleWrite(`   Event '${eventInfo[1]}' fired 3 times, break wait`);
                }
                break;
            }
            if (verbose) {
                consoleWrite(`   Wait for event '${eventInfo[1]}'`);
            }
            await Promise.race<any>([
                promiseFromEvent<any, any>(eventInfo[0]).promise,
                new Promise<any>(resolve => setTimeout(resolve, maxWait - waited))
            ]);
            waited = Date.now() - now;
            eventsProcessed.unshift(eventInfo[1]);
            if (verbose) {
                consoleWrite(`   Event '${eventInfo[1]}' has fired, continue`);
            }
            if (waited < maxWait) {
                eventInfo = _event();
            }
        };
    }
    if (verbose) consoleWrite("   Not busy");
    if (minWait > waited)
    {
        if (verbose) consoleWrite("   Waiting minumum specified time");
        const  toWait = minWait - waited;
        if (toWait >= 40)
        {
            while (minWait > waited) {
                await sleep(20);
                waited += 20;
            }
        }
        else {
            await sleep(toWait);
        }
    }
    if (verbose) consoleWrite("COMPLETE: WAIT FOR TASK EXPLORER IDLE");
};


export const waitForTeIdle2 = async (minWait = 1, maxWait = 15000) =>
{
    let waited = 0;
    const _wait = async (iterationsIdle: number) =>
    {
        let iteration = 0;
        const sleepTime = 20;
        while (((iteration < iterationsIdle && waited < minWait /* && !gotNotIdle */) || teWrapper.busy) && waited < maxWait)
        {
            await sleep(sleepTime);
            waited += sleepTime;
            ++iteration;
            if (teWrapper.busy) {
                iteration = 0;
            }
        }
    };
    await _wait(2);
    await sleep(1);
    await _wait(1);
    if (minWait > waited && minWait > 1)
    {
        if (minWait - waited >= 30)
        {
            const sleepTime = Math.ceil((minWait - waited) / 3);
            while (minWait > waited) {
                await sleep(sleepTime);
                waited += sleepTime;
            }
        }
        else {
            await sleep(minWait - waited);
        }
    }
};


export const waitForWebviewsIdle = async (minWait = 1, maxWait = 15000) =>
{
    let waited = 0;
    const _wait = async (iterationsIdle: number) =>
    {
        let iteration = 0;
        const sleepTime = 20;
        while (((iteration < iterationsIdle && waited < minWait /* && !gotNotIdle */) || teWrapper.busyWebviews) && waited < maxWait)
        {
            await sleep(sleepTime);
            waited += sleepTime;
            ++iteration;
            if (teWrapper.busyWebviews) {
                iteration = 0;
            }
        }
    };
    await _wait(2);
    await sleep(1);
    await _wait(1);
    if (minWait > waited && minWait > 1)
    {
        if (minWait - waited >= 30)
        {
            const sleepTime = Math.ceil((minWait - waited) / 3);
            while (minWait > waited) {
                await sleep(sleepTime);
                waited += sleepTime;
            }
        }
        else {
            await sleep(minWait - waited);
        }
    }
};


export const deleteAndWait = async (path: string, content: string, maxWait = 15000) =>
{
    await waitForTeIdle2(1);
    if (teWrapper.fs.isDirectory(path)) {
        void teWrapper.fs.deleteDir(path);
    }
    else {
        void teWrapper.fs.deleteFile(path);
    }
    await waitForEvent(teWrapper.treeManager.onDidAllTasksChange, maxWait);
};


export const writeAndWait = async (path: string, content: string, maxWait = 15000) =>
{
    await waitForTeIdle2(1);
    void teWrapper.fs.writeFile(path, content);
    await waitForEvent(teWrapper.treeManager.onDidAllTasksChange, maxWait);
};
