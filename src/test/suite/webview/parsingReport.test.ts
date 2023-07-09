/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Uri } from "vscode";
import { ITeWrapper } from ":types";
import { startupFocus } from "../../utils/suiteUtils";
import { closeTeWebviewPanel, executeSettingsUpdate, showTeWebview } from "../../utils/commandUtils";
import {
	activate, testControl as tc, suiteFinished, getWsPath, exitRollingCount, waitForTeIdle, endRollingCount,
	createwebviewForRevive, waitForWebviewReadyEvent, waitForWebviewsIdle
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
        ({ teWrapper } = await activate());
		projectUri = Uri.file(getWsPath("."));
		pkgMgr = teWrapper.config.getVs<string>("npm.packageManager", "npm");
		userTasks = teWrapper.config.get<boolean>("specialFolders.showUserTasks", false);
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
		await teWrapper.config.updateVsWs("npm.packageManager", pkgMgr);
        await waitForTeIdle(tc.waitTime.config.eventFast);
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
		this.slow(tc.slowTime.webview.show.page.parsingReport + tc.slowTime.config.event + tc.slowTime.webview.closeSync);
		 // specialFolders.showUserTasks is already false
		await executeSettingsUpdate("specialFolders.showUserTasks", false, tc.waitTime.config.showHideUserTasks, tc.slowTime.config.showHideUserTasks);
		await showTeWebview(teWrapper.parsingReportPage, projectUri);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
		await waitForWebviewsIdle();
        endRollingCount(this);
	});


	test("Open Report Page (Single Project w/ User Tasks)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReport + tc.slowTime.config.showHideUserTasks + tc.slowTime.webview.closeSync);
		await executeSettingsUpdate("specialFolders.showUserTasks", true, tc.waitTime.config.showHideUserTasks, tc.slowTime.config.showHideUserTasks);
		await showTeWebview(teWrapper.parsingReportPage, projectUri, "", 5);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
		await waitForWebviewsIdle();
        endRollingCount(this);
	});


	test("Open Report Page (All Projects)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReportFull + tc.slowTime.webview.closeSync);
		await showTeWebview(teWrapper.parsingReportPage);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});


	test("Open Report Page (All Projects, Yarn Enabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReportFull + (tc.slowTime.config.enableEvent * 2) + tc.slowTime.webview.closeSync);
        await teWrapper.config.updateVsWs("npm.packageManager", "yarn");
        await waitForTeIdle(tc.waitTime.config.enableEvent);
		await showTeWebview(teWrapper.parsingReportPage);
        await teWrapper.config.updateVsWs("npm.packageManager", pkgMgr);
        await waitForTeIdle(tc.waitTime.config.enableEvent);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});


	test("Deserialize Report Page (All Projects)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.webview.show.page.parsingReport * 2) + tc.slowTime.webview.closeSync);
		const panel = createwebviewForRevive("Task Explorer Parsing Report", "parsingReport");
	    await teWrapper.parsingReportPage.serializer?.deserializeWebviewPanel(panel, null);
		await waitForWebviewReadyEvent(teWrapper.parsingReportPage);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});

});
