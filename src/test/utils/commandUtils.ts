/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { commands, WebviewPanel } from "vscode";
import { ITeWebview, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { waitForTeIdle, testControl as tc, teWrapper, sleep, promiseFromEvent, waitForWebviewReadyEvent } from "./utils";

let explorerHasFocused = false;
const wvShown: string[] = [];


export const echoWebviewCommand = async(command: string, teWebview: ITeWebview, waitForServer: number, ...args: any[]) =>
{
    const echoCmd = { method: "echo/command/execute", overwriteable: false };
	const result = await teWebview.postMessage(echoCmd, { command, args });
    expect(result).to.be.equal(true);
    if (waitForServer > 0) {
		await sleep(waitForServer);
		await waitForTeIdle(tc.waitTime.licenseMgr.request);
    }
    return result;
};


export const executeSettingsUpdate = async (key: string, value?: any, minWait?: number, maxWait?: number) =>
{
    const rc = await teWrapper.config.updateWs(key, value);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.config.event),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
    return rc;
};


export const executeTeCommandAsync = async (command: string, minWait?: number, maxWait?: number, ...args: any[]) =>
{
    commands.executeCommand(`taskexplorer.${command}`, ...args);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.command),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
};


export const executeTeCommand2Async = (command: string, args: any[], minWait?: number, maxWait?: number) => executeTeCommandAsync(command, minWait, maxWait, ...args);


export const executeTeCommand = async <T>(command: string, minWait?: number, maxWait?: number, ...args: any[]) =>
{
    command = !command.startsWith("taskexplorer.") ? `taskexplorer.${command}` : command;
    const rc = await commands.executeCommand(command, ...args);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.command),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
    return rc as T;
};


export const executeTeCommand2 = <T>(command: string, args: any[], minWait?: number, maxWait?: number) => executeTeCommand<T>(command, minWait, maxWait, ...args);


export const focusExplorerView = async (wrapper: ITeWrapper | undefined, instance?: any) =>
{
    if (!wrapper || !wrapper.treeManager.views.taskExplorer.visible)
    {
        if (instance) {
            instance.slow(tc.slowTime.commands.focus + tc.slowTime.commands.refresh);
        }
        await commands.executeCommand("taskexplorer.view.taskTreeExplorer.focus");
        await waitForTeIdle(tc.waitTime.focusCommand);
        explorerHasFocused = true;
    }
    else if (instance) {
        instance.slow(tc.slowTime.commands.focusAlreadyFocused);
        await sleep(1);
        await waitForTeIdle(tc.waitTime.min);
    }
};


export const focusFileExplorer = () => commands.executeCommand("workbench.files.action.focusFilesExplorer");


export const focusSearchView = () => commands.executeCommand("workbench.view.search.focus");


// export const focusSidebarView = () => commands.executeCommand("taskExplorerSideBar.focus");
export const focusSidebarView = () => commands.executeCommand("workbench.view.extension.taskExplorerSideBar");


export const hasExplorerFocused = () => explorerHasFocused;


export const showTeWebview = async(teView: ITeWebview | string, ...args: any[]) =>
{
    let teWebview: ITeWebview,
        wasVisible = false,
        force = false,
        timeout = 5000,
        waitOnly = false;
    const _args = [ ...args ];

    if (_args[0])
    {
        if (typeof _args[0] === "string" || _args[0] instanceof String)
        {
            if (_args[0].startsWith("timeout:"))
            {
                timeout = parseInt(_args[0].replace("timeout:", ""), 10);
                _args.splice(0, 1);
            }
            if (_args[0] === "force")
            {
                force = true;
                _args.splice(0, 1);
            }
            if (_args[0] === "waitOnly")
            {
                waitOnly = true;
                _args.splice(0, 1);
            }
        }
    }

    const start = Date.now();

    if (typeof teView === "string" || teView instanceof String)
    {
        if (_args.length > 0) {
            teWebview = await executeTeCommand2<ITeWebview>(`taskexplorer.view.${teView}.show`, _args, tc.waitTime.viewWebviewPage);
        }
        else {
            teWebview = await executeTeCommand<ITeWebview>(`taskexplorer.view.${teView}.show`, tc.waitTime.viewWebviewPage);
        }
    }
    else {
        teWebview = teView;
        wasVisible = teView.visible;
        if (!waitOnly && (!wasVisible || force)) {
            if (_args.length > 0) {
                void teWebview.show(undefined, ..._args);
            }
            else {
                void teWebview.show();
            }
        }
    }

    if (!wasVisible || force)
    {
        await Promise.race<void>(
        [
            promiseFromEvent<void, void>(teWebview.onDidReceiveReady).promise,
            new Promise<void>(resolve => setTimeout(resolve, timeout)),
        ]);
        await sleep(1);
    }

    let waited = Date.now() - start;
    while (teWebview.busy && waited < timeout)
    {
        await sleep(25);
        waited += 25;
    }

    expect(teWebview.view).to.not.be.undefined;
    expect(teWebview.visible).to.be.equal(true);

    if (!wvShown.includes(teWebview.title)) wvShown.push(teWebview.title);

    return teWebview;
};

// export const showTeWebviewTimeout = (teView: ITeWebview, baseTimeout: number) => baseTimeout + (wvShown.includes(teView.title) ? 0 : 400);

export const showTeWebviewByEchoCmd = async (showCmdName: string, webviewPage: ITeWebview, webviewPageSender: ITeWebview, ...args: any[]) =>
{
    const echoCmd = { method: "echo/command/execute", overwriteable: false };
    void webviewPageSender.postMessage(echoCmd, { command: `taskexplorer.view.${showCmdName}.show`, args: args.length > 0 ? args : undefined });
    await waitForWebviewReadyEvent(webviewPage, 3000);
    await sleep(1);
    const msg = `Failed to show ${showCmdName} with echo command`;
    if (!webviewPage.visible) {
        console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor(msg, teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor("Trying again in 100ms...", teWrapper.figures.colors.grey)}`);
        await sleep(100);
        void webviewPageSender.postMessage(echoCmd, { command: `taskexplorer.view.${showCmdName}.show`, args: args.length > 0 ? args : undefined });
        await waitForWebviewReadyEvent(webviewPage, 3000);
        await sleep(1);
    }
    if (!webviewPage.visible) {
        console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor(msg, teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor("Trying again in 100ms with showTeWebview...", teWrapper.figures.colors.grey)}`);
        await sleep(100);
        if (args.length > 0) {
            await showTeWebview(webviewPage, ...args);
        }
        else {
            await showTeWebview(webviewPage);
        }
        await sleep(1);
    }
    expect(webviewPage).to.not.be.undefined;
    expect(webviewPage.visible).to.be.equal(true);
    let waitedForBusy = 0;
    while (webviewPage.busy && ++waitedForBusy < 200) {
        await sleep(25);
    }
    expect(webviewPage.busy).to.be.equal(false);
};


export const closeTeWebviewPanel = async(teView: ITeWebview) =>
{
    let waited = 0;
    const maxWait = 2200;
    while (teView.view && teView.busy) {
        await sleep(25);
        waited += 25;
    }
    if (teView.view) {
        (teView.view as WebviewPanel).dispose();
    }
    waited = 0;
    while (teView.visible && waited < maxWait) {
        await sleep(25);
        waited += 25;
    }
    while (teView.view && waited < maxWait) {
        await sleep(25);
        waited += 25;
    }
    expect(teView.visible).to.be.equal(false);
};
