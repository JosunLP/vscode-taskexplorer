/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { commands, Uri } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import {
    executeSettingsUpdate, executeTeCommand, focusExplorerView, showTeWebview, showTeWebviewByEchoCmd, focusFileExplorer, focusSidebarView, closeTeWebviewPanel
} from "../../utils/commandUtils";
import {
    activate, closeEditors, endRollingCount, exitRollingCount, getWsPath, promiseFromEvent, sleep,
    suiteFinished, testControl as tc, waitForWebviewReadyEvent
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
            await sleep(230);
            await closeTeWebviewPanel(teWrapper.welcomePage);
            await closeEditors();
            await sleep(150);
        }
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        if (!closedPages) {
            await closeEditors();
        }
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
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
        if (tc.isSingleSuiteTest) {
            this.slow(tc.slowTime.commands.focusSideBarFirstTime + tc.slowTime.webview.show.view.home + tc.slowTime.commands.focusChangeViews + 400);
        }
        else {
            this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.commands.focusChangeViews);
        }
        void focusSidebarView();
        await waitForWebviewReadyEvent(teWrapper.homeView, tc.slowTime.commands.focusSideBarFirstTime);
        await sleep(200);
        endRollingCount(this);
    });


    test("Home View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews + tc.slowTime.webview.show.page.releaseNotes +
                  tc.slowTime.webview.show.page.parsingReportFull + tc.slowTime.webview.show.view.home + 40);
        await sleep(10);
        await showTeWebviewByEchoCmd("parsingReport", teWrapper.parsingReportPage, teWrapper.homeView, Uri.file(getWsPath(".")));
        await sleep(10);
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


    test("Change Views from SideBar", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.postMessage + tc.slowTime.config.trackingEvent + tc.slowTime.commands.focusChangeViews + 200);
        await focusFileExplorer();
        await teWrapper.homeView.postMessage({ method: "echo/fake" }, { command: "taskexplorer.view.taskUsage.focus" }); // cover postMessage() when not visible
        await sleep(100);
        endRollingCount(this);
    });


    test("Task Count View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.webview.show.view.taskCount * 2) + tc.slowTime.commands.focusChangeViews);
        await showTeWebview(teWrapper.taskCountView);
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
        await promiseFromEvent(teWrapper.licensePage.onDidReceiveReady).promise;
        await commands.executeCommand("workbench.action.nextEditor");
        await promiseFromEvent(teWrapper.releaseNotesPage.onDidReceiveReady).promise;
        await commands.executeCommand("workbench.action.previousEditor");
        await promiseFromEvent(teWrapper.licensePage.onDidReceiveReady).promise;
        endRollingCount(this);
	});


    test("Close Open Pages", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.general.closeEditors * 3) + tc.slowTime.config.trackingEvent);
        teWrapper.homeView.description = teWrapper.homeView.description;
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
		await closeTeWebviewPanel(teWrapper.licensePage);
		await closeTeWebviewPanel(teWrapper.releaseNotesPage);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
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

});
