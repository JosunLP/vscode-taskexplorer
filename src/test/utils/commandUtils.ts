/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { commands } from "vscode";
import { waitForTeIdle, testControl as tc, teWrapper, sleep, promiseFromEvent } from "./utils";
import { ITeWebview, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";

let explorerHasFocused = false;
const wvShown: string[] = [];


export const echoWebviewCommand = async(command: string, teWebview: ITeWebview, waitForServer: number, ...args: any[]) =>
{
    const echoCmd = { method: "echo/command/execute", overwriteable: false };
	const result = await teWebview.notify(echoCmd, { command, args });
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
        await waitForTeIdle(tc.waitTime.min);
    }
};


export const focusFileExplorer = () => commands.executeCommand("workbench.files.action.focusFilesExplorer");


export const focusSearchView = () => commands.executeCommand("workbench.view.search.focus");


// export const focusSidebarView = () => commands.executeCommand("taskExplorerSideBar.focus");
export const focusSidebarView = () => commands.executeCommand("taskexplorer.view.taskTreeSideBar.focus");


export const hasExplorerFocused = () => explorerHasFocused;


export const showTeWebview = async(teView: ITeWebview | string, ...args: any[]) =>
{
    let teWebview: ITeWebview;
    if (typeof teView === "string" || teView instanceof String)
    {
        teWebview = await executeTeCommand2<ITeWebview>(`taskexplorer.view.${teView}.show`, args, tc.waitTime.viewWebviewPage);
    }
    else {
        teWebview = teView;
        void teWebview.show(undefined, ...args);
    }
    await promiseFromEvent(teWebview.onReadyReceived).promise;
    expect(teWebview.visible).to.be.equal(true);
    if (!wvShown.includes(teWebview.title)) wvShown.push(teWebview.title);
};

// export const showTeWebviewTimeout = (teView: ITeWebview, baseTimeout: number) => baseTimeout + (wvShown.includes(teView.title) ? 0 : 400);
