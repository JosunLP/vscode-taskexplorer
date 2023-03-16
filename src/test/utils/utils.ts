/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */

import * as path from "path";
import { expect } from "chai";
import * as treeUtils from "./treeUtils";
import { testControl } from "../control";
import { deactivate } from "../../extension";
import { startInput, stopInput } from "./input";
import { StorageKeys } from "../../lib/constants";
import { getWsPath, getProjectsPath } from "./sharedUtils";
import { cleanupSettings, initSettings } from "./initSettings";
import { closeTeWebviewPanel, hasExplorerFocused } from "./commandUtils";
import { getSuiteFriendlyName, getSuiteKey, processTimes } from "./bestTimes";
import {
    ITaskExplorerApi, ITaskExplorerProvider, ITaskItem, ITeWrapper, TeLicenseType
} from "@spmeesseman/vscode-taskexplorer-types";
import {
    commands, ConfigurationTarget, Disposable, Event, EventEmitter, Extension, extensions, Task,
    TaskExecution, tasks, Uri, ViewColumn, window, workspace
} from "vscode";
import { ITeWebview } from "../../interface";

const { symbols } = require("mocha/lib/reporters/base");

export { testControl };
export { treeUtils };
export { getWsPath, getProjectsPath };
export let teApi: ITaskExplorerApi;
export let teWrapper: ITeWrapper;

let activated = false;
let caughtControlC = false;
let hasRollingCountError = false;
let timeStarted: number;
let overridesShowInputBox: any[] = [];
let overridesShowInfoBox: any[] = [];
let NODE_TLS_REJECT_UNAUTHORIZED: string | undefined;

const tc = testControl;
const originalShowInputBox = window.showInputBox;
const originalShowInfoBox = window.showInformationMessage;
const disableSSLMsg = "Disabling certificate validation due to Electron Main Process Issue w/ LetsEncrypt DST Root CA X3 Expiry";

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


export const activate = async (instance?: Mocha.Context) =>
{
    if (instance)
    {
        instance.timeout(60 * 1000);
        const suite = instance.currentTest?.parent;
        if (suite)
        {
            const suiteKey = getSuiteKey(suite.title);
            tc.tests.suiteResults[suiteKey] = {
                timeStarted: Date.now(),
                numTests: suite.tests.length,
                success: false,
                successCount: -1,
                suiteName: getSuiteFriendlyName(suite.title),
                timeFinished: 0,
                numTestsFailed: 0
            };
            if (suite.parent) {
                tc.isSingleSuiteTest = suite.parent.suites.length <= 2;
            }
        }
    }

    const ext = extensions.getExtension("spmeesseman.vscode-taskexplorer");
    expect(ext).to.not.be.undefined;

    if (!activated)
    {
        timeStarted = Date.now();
        const tzOffset = (new Date()).getTimezoneOffset() * 60000,
              locISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1).replace("T", " ").replace(/[\-]/g, "/");
        //
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
        teWrapper = await (ext as any).activate();
        console.log(`    ${teWrapper.figures.color.info}`);
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Tests startup", teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Time started: " + locISOTime, teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Extension successfully activated", teWrapper.figures.colors.grey)}`);
        //
        // Ensure extension initialized successfully
        //
        teApi = teWrapper.api;
        expect(teApi).to.not.be.empty;
        expect(teWrapper.explorer).to.not.be.empty;
        expect(isReady()).to.be.equal(true, `    ${teWrapper.figures.color.error} TeApi not ready`);
        //
        // waitForIdle() added 1/2/03 - Tree loads in delay 'after' activate()
        //
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Waiting for extension to initialize", teWrapper.figures.colors.grey)}`);
        await waitForTeIdle();
        //
        // Write to console is just a tests feature, it's not controlled by settings, set it here if needed
        //
        teWrapper.log.setWriteToConsole(tc.log.console, tc.log.level);
        //
        // Catch CTRL+C and set hasRollingCountError if caught
        //
        startInput(setFailed);
        //
        // Increase slow times for local license server (making remote db requests)
        //
        if (teWrapper.server.apiServer === "localhost")
        {
            const factor = 2.85;
            tc.slowTime.licenseMgr.purchaseLicense  = Math.round(tc.slowTime.licenseMgr.purchaseLicense * factor);
            tc.slowTime.licenseMgr.validateLicense  = Math.round(tc.slowTime.licenseMgr.validateLicense * factor);
            tc.slowTime.licenseMgr.getTrialExtension  = Math.round(tc.slowTime.licenseMgr.getTrialExtension * factor);
        }
        //
        // All done
        //
        activated = true;
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Tests initialization completed, ready", teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.info}`);
		console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor(disableSSLMsg, teWrapper.figures.colors.grey)}`);
    }
    return {
        teApi,
        teWrapper,
        extension: ext as Extension<any>
    };
};


export const cleanup = async () =>
{
    console.log(`    ${teWrapper.figures.color.info}`);
    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Tests complete, clean up", teWrapper.figures.colors.grey)}`);
    if (caughtControlC) {
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("User cancelled (caught CTRL+C)", teWrapper.figures.colors.grey)}`);
    }

    if (tc.log.enabled && tc.log.file && tc.log.openFileOnFinish)
    {
        console.log(`    ${teWrapper.figures.color.info}`);
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Log File Location:", teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("   " + teWrapper.log.getLogFileName(), teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.info}`);
    }

    //
    // Stop CTRL+C and set hasRollingCountError
    //
    stopInput();

    //
    // Cleanup or reset any settings, and clear license/account from tests storage
    //
    await cleanupSettings();
    await teWrapper.storage.deleteSecret(StorageKeys.Account);

    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Deactivating extension", teWrapper.figures.colors.grey)}`);
    try { await deactivate(); } catch {}
    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Extension successfully deactivated", teWrapper.figures.colors.grey)}`);

    window.showInputBox = originalShowInputBox;
    window.showInformationMessage = originalShowInfoBox;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = NODE_TLS_REJECT_UNAUTHORIZED;

    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Removing any leftover temporary files", teWrapper.figures.colors.grey)}`);
    try {
        const packageLockFile = path.join(getWsPath("."), "package-lock.json");
        if (await teWrapper.fs.pathExists(packageLockFile)) {
            await teWrapper.fs.deleteFile(packageLockFile);
        }
    } catch (e) { console.error(e); }

    //
    // Reset Grunt and Gulp VSCode internal task providers, which we enabled b4 extension activation.
    // These get reset at the end of the Gulp suite's tests, but just in case we do it again here...
    //
    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Resetting modified global settings", teWrapper.figures.colors.grey)}`);
    await teWrapper.config.updateVs("grunt.autoDetect", tc.vsCodeAutoDetectGrunt);
    await teWrapper.config.updateVs("gulp.autoDetect", tc.vsCodeAutoDetectGulp);
    // await workspace.getConfiguration("grunt").update("autoDetect", tc.vsCodeAutoDetectGrunt, ConfigurationTarget.Global);
    // await workspace.getConfiguration("gulp").update("autoDetect", tc.vsCodeAutoDetectGulp, ConfigurationTarget.Global);

    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Cleanup complete", teWrapper.figures.colors.grey)}`);

    //
    // Process execution timesand do the dorky best time thing that I forsome reason spent a whole
    // day of my life coding.
    //
    try { await processTimes(timeStarted, hasRollingCountError); } catch (e) { console.error(e); }

    //
    // Exit
    //
    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Exiting", teWrapper.figures.colors.grey)}`);
    console.log(`    ${teWrapper.figures.color.info}`);

    //
    // If rolling count error is set, reset the mocha success icon for "cleanup" final test/step
    //
    if (hasRollingCountError) {
        symbols.ok = teWrapper.figures.color.success;
    }
};


export const clearOverrideShowInputBox = () => { overridesShowInputBox = []; };


export const clearOverrideShowInfoBox = () => { overridesShowInfoBox = []; };


export const closeEditors = async () =>
{
    await closeTeWebviewPanel(teWrapper.licensePage);
    await closeTeWebviewPanel(teWrapper.parsingReportPage);
    await closeTeWebviewPanel(teWrapper.releaseNotesPage);
    await closeTeWebviewPanel(teWrapper.welcomePage);
    await commands.executeCommand("openEditors.closeAll");
};


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
            localResourceRoots: [ resourceDir ]
        }
    );
    return panel;
};


export const getSuccessCount = (instance: Mocha.Context) =>
{

    const mTest = instance.test || instance.currentTest as Mocha.Runnable,
          suite = mTest.parent as Mocha.Suite,
          suiteKey = getSuiteKey(suite.title),
          suiteResults = tc.tests.suiteResults[suiteKey];
    return suiteResults.successCount;
};


export const endRollingCount = (instance: Mocha.Context, isSetup?: boolean) =>
{

    const mTest = (!isSetup ? instance.test : instance.currentTest) as Mocha.Runnable,
          suite = mTest.parent as Mocha.Suite,
          suiteKey = getSuiteKey(suite.title),
          suiteResults = tc.tests.suiteResults[suiteKey];
    ++suiteResults.successCount;
};


export const exitRollingCount = (instance: Mocha.Context, isSetup?: boolean, isTeardown?: boolean) =>
{

    const mTest = (!isSetup && !isTeardown ? instance.test : instance.currentTest) as Mocha.Runnable,
          suite = mTest.parent as Mocha.Suite,
          suiteKey = getSuiteKey(suite.title),
          suiteResults = tc.tests.suiteResults[suiteKey],
          testIdx = !isSetup && !isTeardown ? suite.tests.findIndex(t => t.title === mTest.title && !t.isFailed() && !t.isPassed()) :
                                              (isSetup ? undefined : (suiteResults ? suite.tests.length : undefined));

    try
    {
        expect(suiteResults?.successCount).to.be.equal(testIdx);
    }
    catch (e: any)
    {
        if (!hasRollingCountError) {
            const msg = `rolling success count failure @ test ${(testIdx || -1) + 1}, all further tests will be skipped`;
            console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor(msg, teWrapper.figures.colors.grey)}`);
        }
        setFailed(false);
        if (suite.tests.filter(t => t.isFailed).length === 0) {
            throw new Error("Rolling count error: " + e.message);
        }
    }

    return !isTeardown ? hasRollingCountError : !suiteResults && hasRollingCountError;
};

export const getPackageManager = () =>
{
    let pkgMgr = workspace.getConfiguration("npm", null).get<string>("packageManager") || "npm";
    if (pkgMgr.match(/(npm|auto)/)) { // pnpm/auto?  only other option is yarn
        pkgMgr = "npm";
    }
    return pkgMgr;
};

export const getSpecialTaskItemId = (taskItem: ITaskItem) =>
    taskItem.id.replace("Last Tasks:", "").replace("Favorites:", "").replace("User Tasks:", "");


export const getTeApi = () => teApi;


export const isRollingCountError = () => hasRollingCountError;


const isExecuting = (task: Task) =>
{
    const execs = tasks.taskExecutions.filter(e => e.task.name === task.name && e.task.source === task.source &&
                                            e.task.scope === task.scope && e.task.definition.path === task.definition.path);
    const exec = execs.find(e => e.task.name === task.name && e.task.source === task.source &&
                            e.task.scope === task.scope && e.task.definition.path === task.definition.path);
    return exec;
};


export const needsTreeBuild = (isFocus?: boolean) => (isFocus || !treeUtils.hasRefreshed()) && !hasExplorerFocused();


const isReady = (taskType?: string) =>
{
    let err: string | undefined;
    if (!teApi)                                 err = `    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("TeApi null", teWrapper.figures.colors.grey)}`;
    else {
        if (!teWrapper.explorer)                err = `    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("TeApi Explorer provider == null", teWrapper.figures.colors.grey)}`;
        // /else if (!teApi.sidebar)            err = `    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("TeApi Sidebar Provider == null", teWrapper.figures.colors.grey)}`;
        else if (!teApi.providers)              err = `    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("Providers null", teWrapper.figures.colors.grey)}`;
    }
    if (!err && taskType) {
        if (!teApi.providers[taskType])         err = `    ${teWrapper.figures.color.error} ${taskType} ${teWrapper.figures.withColor("Provider == null", teWrapper.figures.colors.grey)}`;
    }
    if (!err && !(workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined)) {
                                                err = `    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("Workspace folder does not exist", teWrapper.figures.colors.grey)}`;
    }
    if (!err && !extensions.getExtension("spmeesseman.vscode-taskexplorer")) {
                                                err = `    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("Extension not found", teWrapper.figures.colors.grey)}`;
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
        console.log(`    ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}`);
        console.log(`    ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.up}  ${teWrapper.figures.withColor("  THESE ERRORS WERE SUPPOSED TO HAPPEN!!!  ", teWrapper.figures.colors.green)}  ` +
                    `${teWrapper.figures.color.up}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}`);
        console.log(`    ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ` +
                    `${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}  ${teWrapper.figures.color.success}`);
    }
};


export const overrideNextShowInputBox = (value: any, clear?: boolean) => { if (clear === true) clearOverrideShowInputBox(); overridesShowInputBox.push(value); };


export const overrideNextShowInfoBox = (value: any, clear?: boolean) => { if (clear === true) clearOverrideShowInfoBox(); overridesShowInfoBox.push(value); };


const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);


export type PromiseAdapter<T, U> = (
    value: T,
    resolve:
        (value: U | PromiseLike<U>) => void,
    reject:
        (reason: any) => void
) => any;


export const waitForWebviewReadyEvent = async (view: ITeWebview, timeout = 5000) => waitForEvent(view.onReadyReceived, timeout);


export const waitForEvent = async <T>(event: Event<T>, timeout = 5000) =>
{
    const eventPromise = promiseFromEvent(event),
          to = setTimeout((ep: EventEmitter<void>) => ep.fire(), timeout, eventPromise.cancel);
    try {
        await eventPromise.promise;
        clearTimeout(to);
        return true;
    }
    catch (e) {
        if (e === "cancelled") {
            return true;
        }
        clearTimeout(to);
        return false;
    }
};


//
// Bad a** function w/ credits to GitLens extension author
//
export const promiseFromEvent = <T, U>(event: Event<T>, adapter: PromiseAdapter<T, U> = passthrough): { promise: Promise<U>; cancel: EventEmitter<void> } =>
{
    let subscription: Disposable;
    const cancel = new EventEmitter<void>();
    return {
        promise: new Promise<U>((resolve, reject) =>
        {
            cancel.event(_ => reject("cancelled"));
            subscription = event((value: T) =>
            {
                try {
                    Promise.resolve(adapter(value, resolve, reject)).catch(reject);
                }
                catch (e) { reject(e); }
            });
        })
        .then((result: U) => { subscription.dispose(); return result; },
        error => { subscription.dispose(); throw error; }),
        cancel
    };
};


export const setFailed = (ctrlc = true) =>
{
    caughtControlC = ctrlc;
    hasRollingCountError = true;
    symbols.ok = teWrapper.figures.withColor(teWrapper.figures.pointer, teWrapper.figures.colors.blue);
};


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


export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const suiteFinished = (instance: Mocha.Context) =>
{
    const suite = instance.currentTest?.parent;
    if (suite)
    {
        const numTestsFailedThisSuite = suite.tests.filter(t => t.isFailed()).length,
              suiteKey = getSuiteKey(suite.title),
              suiteResults = tc.tests.suiteResults[suiteKey];
        tc.tests.numTestsFail += numTestsFailedThisSuite;
        tc.tests.numTestsSuccess += suite.tests.filter(t => t.isPassed()).length;
        tc.tests.numSuites++;
        tc.tests.numTests += suite.tests.length;
        if (numTestsFailedThisSuite > 0) {
            tc.tests.numSuitesFail++;
        }
        else {
            tc.tests.numSuitesSuccess++;
        }
        tc.tests.suiteResults[suiteKey] = Object.assign(suiteResults,
        {
            success: numTestsFailedThisSuite === 0,
            timeFinished: Date.now(),
            numTestsFailed: numTestsFailedThisSuite
        });
    }
    else {
        teWrapper.log.warn("Suite Finished: Instance is undefined!");
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
    }
    if (expectedCount >= 0) {
        expect(tTasks.length).to.be.equal(expectedCount, `${teWrapper.figures.color.error} Unexpected ${taskType} task count (Found ${tTasks.length} of ${expectedCount})`);
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
            console.log(`    ${teWrapper.figures.color.infoTask}   ${teWrapper.figures.withColor(`Waiting for '${taskName}' task execution`, teWrapper.figures.colors.grey)}`);
        }
        while ((isExec && (maxWait === undefined || waitedAfterStarted < maxWait)) || (!isExec && !hasExec && waitedHasNotStarted < 3000))
        {
            await sleep(50);
            isExec = !!isExecuting(exec.task);
            if (isExec) {
                if (!hasExec && tc.log.taskExecutionSteps) {
                    console.log(`    ${teWrapper.figures.color.infoTask}     ${teWrapper.figures.withColor(`Task execution started, waited ${waitedAfterStarted + waitedHasNotStarted} ms`, teWrapper.figures.colors.grey)}`);
                }
                hasExec = isExec;
                waitedAfterStarted += 50;
            }
            else if (!hasExec) { waitedHasNotStarted += 50; }
        }
        if (tc.log.taskExecutionSteps) {
            console.log(`    ${teWrapper.figures.color.infoTask}     ${teWrapper.figures.withColor(`Task execution wait finished, waited ${waitedAfterStarted + waitedHasNotStarted} ms`, teWrapper.figures.colors.grey)}`);
        }
    }
};


export const waitForTeIdle = async (minWait = 1, maxWait = 15000) =>
{
    let waited = 0;
    const _wait = async (iterationsIdle: number) =>
    {
        let iteration = 0;
        while (((iteration < iterationsIdle && waited < minWait /* && !gotNotIdle */) || teWrapper.busy) && waited < maxWait)
        {
            await sleep(tc.waitForTeIdle.sleep);
            waited += tc.waitForTeIdle.sleep;
            ++iteration;
            if (teWrapper.busy) {
                iteration = 0;
            }
        }
    };
    await _wait(tc.waitForTeIdle.iterations1);
    await sleep(1);
    await _wait(tc.waitForTeIdle.iterations2);
    if (minWait > waited)
    {
        const sleepTime = Math.round((minWait - waited) / 3);
        while (minWait > waited) {
            await sleep(sleepTime);
            waited += sleepTime;
        }
    }
};
