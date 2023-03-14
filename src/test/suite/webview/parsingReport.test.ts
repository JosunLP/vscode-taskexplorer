/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Uri, WebviewPanel } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, showTeWebview } from "../../utils/commandUtils";
import {
	activate, closeEditors, testControl, suiteFinished, sleep, getWsPath, exitRollingCount,
	waitForTeIdle, endRollingCount, createwebviewForRevive
} from "../../utils/utils";

let teWrapper: ITeWrapper;
let projectUri: Uri;
let userTasks: boolean;
let pkgMgr: string;


suite("Parsing Report Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate(this));
		projectUri = Uri.file(getWsPath("."));
		pkgMgr = teWrapper.config.getVs<string>("npm.packageManager");
		userTasks = teWrapper.config.get<boolean>("specialFolders.showUserTasks");
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		// teWrapper.explorer = origExplorer;
		// teWrapper.sidebar = origSidebar;
		await closeEditors();
		await teWrapper.config.updateVsWs("npm.packageManager", pkgMgr);
        await waitForTeIdle(testControl.waitTime.config.eventFast);
		await executeSettingsUpdate("specialFolders.showUserTasks", userTasks);
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Open Report Page (Single Project No User Tasks)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.parsingReport + testControl.slowTime.config.showHideUserTasks + testControl.slowTime.closeEditors);
		await executeSettingsUpdate("specialFolders.showUserTasks", false, testControl.waitTime.config.showHideUserTasks);
		await showTeWebview(teWrapper.parsingReportPage, projectUri);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Report Page (Single Project w/ User Tasks)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.parsingReport + testControl.slowTime.config.showHideUserTasks + testControl.slowTime.closeEditors);
		await executeSettingsUpdate("specialFolders.showUserTasks", true, testControl.waitTime.config.showHideUserTasks);
		await showTeWebview(teWrapper.parsingReportPage, projectUri, "", 5);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Report Page (All Projects)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.parsingReportFull + testControl.slowTime.closeEditors);
		await showTeWebview(teWrapper.parsingReportPage);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Report Page (All Projects, Yarn Enabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.parsingReport + (testControl.slowTime.config.enableEvent * 2));
        await teWrapper.config.updateVsWs("npm.packageManager", "yarn");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
		await showTeWebview(teWrapper.parsingReportPage);
        await teWrapper.config.updateVsWs("npm.packageManager", pkgMgr);
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
		await closeEditors();
        endRollingCount(this);
	});


	test("Deserialize Report Page (All Projects)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.parsingReport + 30);
		let panel = createwebviewForRevive("Task Explorer Parsing Report", "parsingReport");
	    await teWrapper.parsingReportPage.serializer?.deserializeWebviewPanel(panel, null);
		await sleep(5);
		(teWrapper.parsingReportPage.view as WebviewPanel)?.dispose();
		panel = createwebviewForRevive("Task Explorer Parsing Report", "parsingReport");
		await sleep(5);
	    await teWrapper.parsingReportPage.serializer?.deserializeWebviewPanel(panel, null);
		await sleep(5);
		await closeEditors();
        endRollingCount(this);
	});

});
