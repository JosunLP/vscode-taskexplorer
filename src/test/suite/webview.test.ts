/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { expect } from "chai";
import { commands, Uri } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, focusExplorerView, focusSidebarView } from "../utils/commandUtils";
import {
    activate, closeEditors, endRollingCount, exitRollingCount, getWsPath, promiseFromEvent, sleep, suiteFinished, testControl as tc, waitForTeIdle
} from "../utils/utils";

abstract class IpcMessage<Params = void>
{
	_?: Params; // Required for type inferencing to work properly
	constructor(public readonly method: string, public readonly overwriteable: boolean = false) {}
}
interface IpcExecCommandParams
{
	command: string;
	args?: any[];
}
class IpcNotification<Params = void> extends IpcMessage<Params> {}

const IpcEchoCommandRequest = new IpcNotification<IpcExecCommandParams>("command/echo");
const IpcEchoCustomCommandRequest = new IpcNotification<IpcExecCommandParams>("command/custom/echo");


let teWrapper: ITeWrapper;


suite("Webview Tests", () =>
{
    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate(this));
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        await closeEditors();
        suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Enable and Focus SideBar", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews + tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableSideBar", true, tc.waitTime.config.enableEvent);
        await waitForTeIdle(tc.waitTime.config.registerExplorerEvent);
        await focusSidebarView();
        await waitForTeIdle(tc.waitTime.refreshCommand);
        endRollingCount(this);
    });


    test("Home View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.focusChangeViews * 3) + tc.slowTime.commands.fast + (tc.slowTime.config.enableEvent * 2) + 2000);
        let loaded = false,
            loadTime = 0;
        const d = teWrapper.homeView.onContentLoaded(() => { loaded = true; }); // cover onContentLoaded
        await teWrapper.homeView.show();
        while (!loaded && loadTime < 21) { await sleep(10); loadTime += 10; }
        d.dispose();
        await commands.executeCommand("taskexplorer.view.home.focus");
        await executeSettingsUpdate("enabledTasks.bash", false, tc.waitTime.config.enableEvent);
        await sleep(5);
        await executeSettingsUpdate("enabledTasks.bash", true, tc.waitTime.config.enableEvent);
        expect(teWrapper.homeView.description).to.not.be.undefined;
        await focusExplorerView(teWrapper);
        await sleep(5);
        await teWrapper.homeView.notify(IpcEchoCommandRequest, { command: "taskexplorer.view.releaseNotes.show" }); // not visible, ignored
        await commands.executeCommand("taskexplorer.view.home.focus");
        await promiseFromEvent(teWrapper.homeView.onReadyReceived).promise;
        await sleep(5);
        await teWrapper.homeView.notify(IpcEchoCommandRequest, { command: "taskexplorer.view.parsingReport.show", args: [ Uri.file(getWsPath(".")) ] });
        await promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
        await sleep(5);
        await teWrapper.homeView.notify(IpcEchoCommandRequest, { command: "taskexplorer.view.releaseNotes.show" });
        await promiseFromEvent(teWrapper.releaseNotesPage.onReadyReceived).promise;
        await sleep(5);
        await commands.executeCommand("taskexplorer.view.home.refresh");
        await commands.executeCommand("taskexplorer.donate");
        endRollingCount(this);
    });


    test("Task Usage View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await commands.executeCommand("taskexplorer.view.taskUsage.focus");
        await focusExplorerView(teWrapper);
        await teWrapper.taskUsageView.show();
        await sleep(5);
        endRollingCount(this);
    });


    test("Task Count View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await teWrapper.taskCountView.show();
        await sleep(5);
        await focusExplorerView(teWrapper);
        await commands.executeCommand("taskexplorer.view.taskCount.focus");
        await sleep(5);
        endRollingCount(this);
    });


    test("Release Notes Page", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await teWrapper.releaseNotesPage.show();
        await sleep(5);
        endRollingCount(this);
    });


    test("Parsing Report Page", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await teWrapper.parsingReportPage.show();
        endRollingCount(this);
    });


    test("License Info Page", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await teWrapper.licensePage.show();
        endRollingCount(this);
    });


    test("Post an Unknown Random Message", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.fast + 1100);
        await commands.executeCommand("taskexplorer.view.home.focus");
        await teWrapper.homeView.notify(IpcEchoCustomCommandRequest, { command: "taskexplorer.view.releaseNotes.show" });
        await sleep(550); // wait for webworker to respond, takes ~ 400-600ms
        endRollingCount(this);
    });


	test("Focus open Editors", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews * 3);
	    await teWrapper.parsingReportPage.show();
        await sleep(5);
	    await teWrapper.licensePage.show();
        await sleep(5);
	    await teWrapper.releaseNotesPage.show();
        await sleep(5);
	    await teWrapper.licensePage.show();
        await sleep(5);
	    await teWrapper.parsingReportPage.show();
        await sleep(5);
        await commands.executeCommand("workbench.action.nextEditor");
        await commands.executeCommand("workbench.action.nextEditor");
        endRollingCount(this);
	});


    test("Cover Webview Properties (Post-Show)", async function()
    {
        if (exitRollingCount(this)) return;
        teWrapper.homeView.description = teWrapper.homeView.description;
		await closeEditors();
        endRollingCount(this);
    });


    test("Disable SideBar", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent + tc.slowTime.config.enableEvent);
        await executeSettingsUpdate("enableSideBar", false, tc.waitTime.config.enableEvent);
        await waitForTeIdle(tc.waitTime.config.registerExplorerEvent);
        endRollingCount(this);
    });


    test("Focus Explorer View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await focusExplorerView(teWrapper);
        endRollingCount(this);
    });

});
