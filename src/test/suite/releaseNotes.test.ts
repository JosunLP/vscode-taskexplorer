/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Extension, WebviewPanel } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand } from "../utils/commandUtils";
import { ITaskExplorerApi } from "@spmeesseman/vscode-taskexplorer-types";
import {
	activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, createwebviewForRevive
} from "../utils/utils";

let teApi: ITaskExplorerApi;
let extension: Extension<any>;
let webviewPanel: WebviewPanel | undefined;


suite("Release Notes Page Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, extension } = await activate(this));
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		webviewPanel?.dispose();
		webviewPanel = undefined;
		await closeEditors();
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Open Release Notes", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 200);
		webviewPanel = await executeTeCommand("showReleaseNotesPage", testControl.waitTime.viewReport) as WebviewPanel;
		await sleep(100);
        endRollingCount(this);
	});


	test("Open Release Notes (Error No Version)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 200);
		await closeEditors();
		const version = extension.packageJSON.version;
		extension.packageJSON.version = "17.4444.0";
		try {
			webviewPanel = await executeTeCommand("showReleaseNotesPage", testControl.waitTime.viewReport) as WebviewPanel;
			await sleep(100);
		}
		catch (e) { throw e; }
		finally { extension.packageJSON.version = version; }
        endRollingCount(this);
	});


	test("View License Info from Webview", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + testControl.slowTime.licenseMgr.pageWithDetail + 1000);
		await webviewPanel?.webview.postMessage({ command: "showLicensePage" });
		await sleep(500);
        endRollingCount(this);
	});


	test("View Parsing Report from Webview", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + testControl.slowTime.licenseMgr.pageWithDetail + 1000);
	    await webviewPanel?.webview.postMessage({ command: "showParsingReportPage" });
		await sleep(500);
		webviewPanel?.dispose();
		webviewPanel = undefined;
        endRollingCount(this);
	});

/*
	test("Deserialize Release Notes Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 200);
		const panel = createwebviewForRevive(getViewTitle(), getViewType());
	    await getReleaseNotesSerializer().deserializeWebviewPanel(panel, null);
		await sleep(50);
		teApi.testsApi.isBusy = true;
		setTimeout(() => { teApi.testsApi.isBusy = false; }, 50);
	    await getReleaseNotesSerializer().deserializeWebviewPanel(panel, null);
		await sleep(50);
		panel.dispose();
		await closeEditors();
        endRollingCount(this);
	});
*/
});
