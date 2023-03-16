/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Uri } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { closeTeWebviewPanel, executeSettingsUpdate, showTeWebview } from "../../utils/commandUtils";
import {
	activate, testControl as tc, suiteFinished, getWsPath, exitRollingCount, waitForTeIdle, endRollingCount,
	createwebviewForRevive, waitForWebviewReadyEvent
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
		this.slow(tc.slowTime.webview.show.page.parsingReport + tc.slowTime.config.showHideUserTasks + tc.slowTime.general.closeEditors);
		await executeSettingsUpdate("specialFolders.showUserTasks", false, tc.waitTime.config.showHideUserTasks);
		await showTeWebview(teWrapper.parsingReportPage, projectUri);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});


	test("Open Report Page (Single Project w/ User Tasks)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReport + tc.slowTime.config.showHideUserTasks + tc.slowTime.general.closeEditors);
		await executeSettingsUpdate("specialFolders.showUserTasks", true, tc.waitTime.config.showHideUserTasks);
		await showTeWebview(teWrapper.parsingReportPage, projectUri, "", 5);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});


	test("Open Report Page (All Projects)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReportFull + tc.slowTime.general.closeEditors);
		await showTeWebview(teWrapper.parsingReportPage);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});


	test("Open Report Page (All Projects, Yarn Enabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReport + (tc.slowTime.config.enableEvent * 2));
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
		this.slow((tc.slowTime.webview.show.page.parsingReport * 2) + 30 + tc.slowTime.general.closeEditors);
		const panel = createwebviewForRevive("Task Explorer Parsing Report", "parsingReport");
	    await teWrapper.parsingReportPage.serializer?.deserializeWebviewPanel(panel, null);
		await waitForWebviewReadyEvent(teWrapper.parsingReportPage);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        endRollingCount(this);
	});

});
