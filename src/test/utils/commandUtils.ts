/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { commands, WebviewPanel } from "vscode";
import { ITeWebview, ITeWrapper } from ":types";
import { waitForTeIdle, testControl as tc, teWrapper, sleep, promiseFromEvent, waitForWebviewReadyEvent } from "./utils";

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
    const rc = await teWrapper.config.updateWs(key.replace("taskexplorer.", ""), value);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.config.event),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
    return rc;
};


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


export const showTeWebview = async(teView: ITeWebview | string, ...args: any[]) =>
{
    let teWebview: ITeWebview,
        wasVisible = false,
        force = false,
        timeout = 7000,
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
        wasVisible = true; // ?
        await sleep(25);
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

    if (!wasVisible || force || teWebview.isBusy)
    {
        await Promise.race<void>(
        [
            promiseFromEvent<void, void>(teWebview.onDidReceiveReady).promise,
            new Promise<void>(resolve => setTimeout(resolve, timeout)),
        ]);
        await sleep(1);
    }

    let waited = Date.now() - start;
    while (teWebview.isBusy && waited < timeout)
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
    const start = Date.now();
    const echoCmd = { method: "echo/command/execute", overwriteable: false };
    void webviewPageSender.postMessage(echoCmd, { command: `taskexplorer.view.${showCmdName}.show`, args: args.length > 0 ? args : undefined });
    await waitForWebviewReadyEvent(webviewPage, 4000);
    await sleep(1);
    let waited = Date.now() - start;
    while (webviewPage.isBusy && waited < 5000)
    {
        await sleep(25);
        waited += 25;
    }
    const msg = `Failed to show ${showCmdName} with echo command`;
    if (!webviewPage.visible)
    {
        console.log(`    ${teWrapper.log.symbols.blue.warning} ${teWrapper.log.withColor(msg, teWrapper.log.colors.grey)}`);
        console.log(`    ${teWrapper.log.symbols.blue.warning} ${teWrapper.log.withColor("Trying again in 100ms...", teWrapper.log.colors.grey)}`);
        await sleep(100);
        void webviewPageSender.postMessage(echoCmd, { command: `taskexplorer.view.${showCmdName}.show`, args: args.length > 0 ? args : undefined });
        await waitForWebviewReadyEvent(webviewPage, 3000);
        await sleep(1);
    }
    if (!webviewPage.visible)
    {
        console.log(`    ${teWrapper.log.symbols.blue.warning} ${teWrapper.log.withColor(msg, teWrapper.log.colors.grey)}`);
        console.log(`    ${teWrapper.log.symbols.blue.warning} ${teWrapper.log.withColor("Trying again in 100ms with showTeWebview...", teWrapper.log.colors.grey)}`);
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
    waited = Date.now() - start;
    while (webviewPage.isBusy && waited < 5000)
    {
        await sleep(25);
        waited += 25;
    }
    expect(webviewPage.isBusy).to.be.equal(false);
};


export const closeTeWebviewPanel = async(teView: ITeWebview) =>
{
    let waited = 0;
    const maxWait = 2200;
    while (teView.view && teView.isBusy) {
        await sleep(25);
        waited += 25;
    }
    if (teView.view) {
        (teView.view as WebviewPanel).dispose();
    }
    waited = 0;
    try {
        while (teView.visible && waited < maxWait) {
            await sleep(25);
            waited += 25;
        }
        while (teView.view && waited < maxWait) {
            await sleep(25);
            waited += 25;
        }
        expect(teView.visible).to.be.equal(false);
        expect(teView.isBusy).to.be.equal(false);
        expect(teView.view).to.be.undefined;
    } catch  {
        await sleep(10);
    }
};
