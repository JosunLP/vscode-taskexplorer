/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { expect } from "chai";
import { commands, Uri } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, executeTeCommand, focusExplorerView, focusSidebarView } from "../utils/commandUtils";
import {
    activate, closeEditors, endRollingCount, exitRollingCount, getWsPath, promiseFromEvent, sleep, suiteFinished, testControl as tc, waitForTeIdle
} from "../utils/utils";

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
        void teWrapper.homeView.show();
        await promiseFromEvent(teWrapper.homeView.onReadyReceived).promise;
        await waitForTeIdle(tc.waitTime.refreshCommand);
        endRollingCount(this);
    });


    test("Home View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.focusChangeViews * 3) + tc.slowTime.commands.fast + (tc.slowTime.config.enableEvent * 2) + 2000);
        const echoCmd = { method: "echo/command/execute", overwriteable: false };
        await commands.executeCommand("taskexplorer.view.home.focus");
        await executeSettingsUpdate("enabledTasks.bash", false, tc.waitTime.config.enableEvent);
        await sleep(5);
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
        await commands.executeCommand("taskexplorer.view.home.refresh");
        // await commands.executeCommand("taskexplorer.donate"); for now 'purchaseLicense' is calling 'donate'
        await commands.executeCommand("taskexplorer.purchaseLicense"); // ^^^ TODO ^^^
        await commands.executeCommand("taskexplorer.openBugReports");
        await commands.executeCommand("taskexplorer.openRepository");
        endRollingCount(this);
    });


    test("Task Usage View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews + 100);
        await commands.executeCommand("taskexplorer.view.taskUsage.focus");
        await focusExplorerView(teWrapper);
        await teWrapper.homeView.notify({ method: "echo/fake" }, { command: "taskexplorer.view.taskUsage.focus" }); // cover notify() when not visible
        await teWrapper.taskUsageView.show();
        await promiseFromEvent(teWrapper.taskUsageView.onReadyReceived).promise;
        endRollingCount(this);
    });


    test("Task Count View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await teWrapper.taskCountView.show();
        await promiseFromEvent(teWrapper.taskCountView.onReadyReceived).promise;
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


	test("Focus open Editors", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews * 4 + 250);
        const echoCmd = { method: "echo/fake", overwriteable: false };
	    await teWrapper.parsingReportPage.show();
        await promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
        await sleep(5);
	    await teWrapper.licensePage.show();
        await promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
        await sleep(5);
        await teWrapper.parsingReportPage.notify(echoCmd, { command: "taskexplorer.fakeCommand" }); // not visible, ignored
        await sleep(50);
	    await teWrapper.releaseNotesPage.show();
        await promiseFromEvent(teWrapper.releaseNotesPage.onReadyReceived).promise;
        await sleep(5);
        await teWrapper.licensePage.notify(echoCmd, { command: "taskexplorer.fakeCommand" }); // not visible, ignored
        await sleep(50);
	    await teWrapper.licensePage.show();
        await sleep(5);
	    await teWrapper.parsingReportPage.show();
        await sleep(5);
	    await teWrapper.releaseNotesPage.show();
        await sleep(5);
	    await teWrapper.parsingReportPage.show();
        await sleep(5);
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
        endRollingCount(this);
    });


    test("Simulate Remove/Show/Hide SideBar Views", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.focus * 4) + 120);
        await executeTeCommand("taskexplorer.view.taskCount.removeView", 5);
        await executeTeCommand("taskexplorer.view.taskUsage.removeView", 5);
        await executeTeCommand("taskexplorer.view.home.removeView", 5);
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
