import { commands } from "vscode";
import { configuration } from "../../lib/utils/configuration";
import { waitForTeIdle, testControl as tc, teExplorer } from "./utils";

let explorerHasFocused = false;


export const executeSettingsUpdate = async (key: string, value?: any, minWait?: number, maxWait?: number) =>
{
    const rc = await configuration.updateWs(key, value);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.config.event),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
    return rc;
};


export const executeTeCommandAsync = async (command: string, minWait?: number, maxWait?: number, ...args: any[]) =>
{
    commands.executeCommand(`vscode-taskexplorer.${command}`, ...args);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.command),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
};


export const executeTeCommand2Async = (command: string, args: any[], minWait?: number, maxWait?: number) => executeTeCommandAsync(command, minWait, maxWait, ...args);


export const executeTeCommand = async <T>(command: string, minWait?: number, maxWait?: number, ...args: any[]) =>
{
    command = !command.startsWith("vscode-taskexplorer.") && !command.startsWith("taskExplorer.") ? `vscode-taskexplorer.${command}` : command;
    const rc = await commands.executeCommand(command, ...args);
    await waitForTeIdle(minWait === 0 ? minWait : (minWait || tc.waitTime.command),
                        maxWait === 0 ? maxWait : (maxWait || tc.waitTime.max));
    return rc as T;
};


export const executeTeCommand2 = <T>(command: string, args: any[], minWait?: number, maxWait?: number) => executeTeCommand<T>(command, minWait, maxWait, ...args);


export const focusExplorerView = async (instance?: any) =>
{
    if (!teExplorer.isVisible())
    {
        if (instance) {
            instance.slow(tc.slowTime.commands.focus + tc.slowTime.commands.refresh);
        }
        await commands.executeCommand("taskExplorer.focus");
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


export const focusSidebarView = () => commands.executeCommand("taskExplorerSideBar.focus");


export const hasExplorerFocused = () => explorerHasFocused;
