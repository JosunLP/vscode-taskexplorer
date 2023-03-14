/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { expect } from "chai";
import { commands, Uri } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import {
    executeSettingsUpdate, executeTeCommand, focusExplorerView, showTeWebview
} from "../../utils/commandUtils";
import {
    activate, closeEditors, endRollingCount, exitRollingCount, getWsPath, promiseFromEvent,
    sleep, suiteFinished, testControl as tc
} from "../../utils/utils";

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


    test("Focus SideBar", async function()
    {   //
        // Note: SideBar was enabled for Usage Test Suite, andleft enabled.  Disable when
        // this test suite has completed
        //
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.config.registerExplorerEvent);
        await showTeWebview(teWrapper.homeView);
        endRollingCount(this);
    });


    test("Home View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.focusChangeViews * 3) + tc.slowTime.commands.fast + (tc.slowTime.config.enableEvent * 2));
        const echoCmd = { method: "echo/command/execute", overwriteable: false };
        await executeSettingsUpdate("enabledTasks.bash", false, tc.waitTime.config.enableEvent);
        await executeSettingsUpdate("enabledTasks.bash", true, tc.waitTime.config.enableEvent);
        expect(teWrapper.homeView.description).to.not.be.undefined;
        await focusExplorerView(teWrapper);
        await teWrapper.homeView.notify(echoCmd, { command: "taskexplorer.view.releaseNotes.show" }); // not visible, ignored
        void commands.executeCommand("taskexplorer.view.home.focus");
        await promiseFromEvent(teWrapper.homeView.onReadyReceived).promise;
        await teWrapper.homeView.notify(echoCmd, { command: "taskexplorer.view.parsingReport.show", args: [ Uri.file(getWsPath(".")) ] });
        await promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
        await teWrapper.homeView.notify(echoCmd, { command: "taskexplorer.view.releaseNotes.show" });
        await promiseFromEvent(teWrapper.releaseNotesPage.onReadyReceived).promise;
        endRollingCount(this);
    });


    test("Home View Header Buttons", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.openUrl * 3);
        await commands.executeCommand("taskexplorer.donate");
        await commands.executeCommand("taskexplorer.openBugReports");
        await commands.executeCommand("taskexplorer.openRepository");
        endRollingCount(this);
    });


    test("Task Usage View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.webview.show.view.taskUsage * 2) + tc.slowTime.commands.focusChangeViews);
        await showTeWebview(teWrapper.taskUsageView);
        await focusExplorerView(teWrapper);
        await teWrapper.homeView.notify({ method: "echo/fake" }, { command: "taskexplorer.view.taskUsage.focus" }); // cover notify() when not visible
        await showTeWebview(teWrapper.taskUsageView);
        endRollingCount(this);
    });


	test("Task Usage View (Tracking Disabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.event * 2) + tc.slowTime.webview.show.page.taskDetails + tc.slowTime.commands.focusChangeViews);
        await focusExplorerView(teWrapper);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
		await showTeWebview(teWrapper.taskUsageView);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
        endRollingCount(this);
	});


    test("Task Count View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.webview.show.view.taskCount * 2) + tc.slowTime.commands.focusChangeViews);
        await showTeWebview(teWrapper.taskCountView);
        await focusExplorerView(teWrapper);
        await commands.executeCommand("taskexplorer.view.taskCount.focus");
        endRollingCount(this);
    });


    test("Post an Unknown Random Message", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.fast + 1100);
        await commands.executeCommand("taskexplorer.view.home.focus");
        await teWrapper.homeView.notify({ method: "echo/fake", overwriteable: false }, { command: "taskexplorer.view.releaseNotes.show" });
        await sleep(550); // wait for webworker to respond, takes ~ 400-600ms
        endRollingCount(this);
    });


	test("Toggle Active Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.commands.focusChangeViews * 4) + (tc.slowTime.webview.notify * 2) + 250 + (tc.slowTime.commands.fast * 3));
        const echoCmd = { method: "echo/fake", overwriteable: false };
	    await showTeWebview(teWrapper.parsingReportPage);
	    await showTeWebview(teWrapper.licensePage);
        await teWrapper.parsingReportPage.notify(echoCmd, { command: "taskexplorer.fakeCommand" }); // not visible, ignored
        await sleep(50);
	    await showTeWebview(teWrapper.releaseNotesPage);
        await teWrapper.licensePage.notify(echoCmd, { command: "taskexplorer.fakeCommand" }); // not visible, ignored
        await sleep(50);
	    await teWrapper.parsingReportPage.show();
        await sleep(10);
        await commands.executeCommand("workbench.action.nextEditor");
        await commands.executeCommand("workbench.action.nextEditor");
        await commands.executeCommand("workbench.action.previousEditor");
        endRollingCount(this);
	});


    test("Cover Webview Properties (Post-Show)", async function()
    {
        if (exitRollingCount(this)) return;
        teWrapper.homeView.description = teWrapper.homeView.description;
		await closeEditors();
        while (teWrapper.licensePage.visible || teWrapper.releaseNotesPage.visible  || teWrapper.parsingReportPage.visible) {
            await sleep(25);
        }
        endRollingCount(this);
    });


    test("Simulate Remove/Show/Hide SideBar Views", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.focus * 4) + 120);
        await executeTeCommand("taskexplorer.view.taskCount.removeView", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.removeView", 5);
        await executeTeCommand("taskexplorer.view.home.removeView", 5);
        while (teWrapper.homeView.visible || teWrapper.taskCountView.visible  || teWrapper.taskUsageView.visible) {
            await sleep(10);
        }
        await executeTeCommand("taskexplorer.view.taskCount.resetViewLocation", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.resetViewLocation", 5);
        await executeTeCommand("taskexplorer.view.home.resetViewLocation", 5);
        await executeTeCommand("taskexplorer.view.taskCount.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.home.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.taskCount.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.home.toggleVisibility", 5);
        endRollingCount(this);
    });


    test("Disable SideBar", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableSideBar", false, tc.waitTime.config.registerExplorerEvent);
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
