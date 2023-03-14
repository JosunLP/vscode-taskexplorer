/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { commands } from "vscode";
import { waitForTeIdle, testControl as tc, teWrapper, sleep } from "./utils";
import { ITeWebview, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";

let explorerHasFocused = false;


export const echoWebviewCommand = async(command: string, teWebview: ITeWebview, waitForServer?: boolean) =>
{
    const echoCmd = { method: "echo/command/execute", overwriteable: false };
	const result = await teWebview.notify(echoCmd, { command });
    expect(result).to.be.equal(true);
    if (waitForServer) {
		await sleep(500);
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
