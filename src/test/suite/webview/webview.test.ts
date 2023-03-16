/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { expect } from "chai";
import { commands, Uri } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import {
    executeSettingsUpdate, executeTeCommand, focusExplorerView, showTeWebview, showTeWebviewByEchoCmd
} from "../../utils/commandUtils";
import {
    activate, closeEditors, endRollingCount, exitRollingCount, getWsPath, promiseFromEvent, sleep,
    suiteFinished, testControl as tc, waitForTeIdle
} from "../../utils/utils";

let teWrapper: ITeWrapper;
let closedPages = false;


suite("Webview Tests", () =>
{
    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate(this));
        if (tc.isSingleSuiteTest) {
            await closeEditors();
            await sleep(50);
        }
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        if (!closedPages) {
            await closeEditors();
        }
        suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Focus SideBar", async function()
    {   //
        // SideBar was enabled for `Usage` Test Suite, and left enabled.  Disable when
        // this test suite has completed
        //
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.commands.focusChangeViews);
        await showTeWebview(teWrapper.homeView);
        await waitForTeIdle(tc.waitTime.focusCommand, tc.slowTime.webview.show.view.home);
        endRollingCount(this);
    });


    test("Home View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.focusChangeViews * 4) + (tc.slowTime.config.enableEvent * 2) +
                  tc.slowTime.webview.show.page.releaseNotes + tc.slowTime.webview.show.page.parsingReportFull +
                  tc.slowTime.webview.show.view.home + (tc.slowTime.webview.postMessage * 3) + 10);
        const echoCmd = { method: "echo/command/execute", overwriteable: false };
        await executeSettingsUpdate("enabledTasks.bash", false, tc.waitTime.config.enableEvent);
        await sleep(5);
        await executeSettingsUpdate("enabledTasks.bash", true, tc.waitTime.config.enableEvent);
        expect(teWrapper.homeView.description).to.not.be.undefined;
        await focusExplorerView(teWrapper);
        await teWrapper.homeView.postMessage(echoCmd, { command: "taskexplorer.view.releaseNotes.show" }); // not visible, ignored
        await showTeWebview(teWrapper.homeView, "force");
        expect(teWrapper.homeView.visible).to.be.equal(true);
        await showTeWebviewByEchoCmd("parsingReport", teWrapper.parsingReportPage, teWrapper.homeView, Uri.file(getWsPath(".")));
        await showTeWebviewByEchoCmd("releaseNotes", teWrapper.releaseNotesPage, teWrapper.homeView);
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
        await teWrapper.homeView.postMessage({ method: "echo/fake" }, { command: "taskexplorer.view.taskUsage.focus" }); // cover notify() when not visible
        await showTeWebview(teWrapper.taskUsageView);
        endRollingCount(this);
    });


	test("Task Usage View (Tracking Disabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.trackingEvent * 2) + tc.slowTime.webview.show.view.taskUsage + (tc.slowTime.commands.focusChangeViews * 2));
        await focusExplorerView(teWrapper);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
		await showTeWebview(teWrapper.taskUsageView, "timeout:2500");
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
        this.slow(tc.slowTime.webview.postMessage + 1100);
        await commands.executeCommand("taskexplorer.view.home.focus");
        await teWrapper.homeView.postMessage({ method: "echo/fake", overwriteable: false }, { command: "taskexplorer.view.releaseNotes.show" });
        await sleep(550); // wait for webworker to respond, takes ~ 400-600ms
        endRollingCount(this);
    });


	test("Toggle Active Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.commands.focusChangeViews * 4) + (tc.slowTime.webview.postMessage * 2) + 220 + (tc.slowTime.commands.fast * 3) +
                  tc.slowTime.webview.show.page.license + tc.slowTime.webview.show.page.parsingReportFull + tc.slowTime.webview.show.page.releaseNotes);
        const echoCmd = { method: "echo/fake", overwriteable: false };
	    await showTeWebview(teWrapper.parsingReportPage, "force");
	    await showTeWebview(teWrapper.licensePage, "force");
        await teWrapper.parsingReportPage.postMessage(echoCmd, { command: "taskexplorer.fakeCommand" }); // not visible, ignored
	    await showTeWebview(teWrapper.releaseNotesPage, "force");
        await teWrapper.licensePage.postMessage(echoCmd, { command: "taskexplorer.fakeCommand" }); // not visible, ignored
	    await showTeWebview(teWrapper.parsingReportPage, "force");
        await commands.executeCommand("workbench.action.nextEditor");
        await promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
        await commands.executeCommand("workbench.action.nextEditor");
        await promiseFromEvent(teWrapper.releaseNotesPage.onReadyReceived).promise;
        await commands.executeCommand("workbench.action.previousEditor");
        await promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
        endRollingCount(this);
	});


    test("Close Open Pages", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.general.closeEditors * 3);
        teWrapper.homeView.description = teWrapper.homeView.description;
		await closeEditors();
        closedPages = true;
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
        await sleep(10);
        await executeTeCommand("taskexplorer.view.taskCount.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.home.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.taskCount.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.toggleVisibility", 5);
        await executeTeCommand("taskexplorer.view.home.toggleVisibility", 5);
        await sleep(10);
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
