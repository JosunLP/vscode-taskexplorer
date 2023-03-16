/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Extension } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { closeTeWebviewPanel, showTeWebview } from "../../utils/commandUtils";
import {
	activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount
} from "../../utils/utils";
import { promiseFromEvent } from "../../../lib/utils/promiseUtils";

let teWrapper: ITeWrapper;
let extension: Extension<any>;


suite("Release Notes Page Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper, extension } = await activate(this));
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


	test("Open Release Notes", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.releaseNotes + testControl.slowTime.webview.closeSync + 10);
		await showTeWebview(teWrapper.releaseNotesPage);
		await sleep(5);
		await closeTeWebviewPanel(teWrapper.releaseNotesPage);
        endRollingCount(this);
	});


	test("Open Release Notes (Error No Version)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.releaseNotes + testControl.slowTime.webview.closeSync + testControl.slowTime.webview.postMessage);
		const version = extension.packageJSON.version;
		extension.packageJSON.version = "17.4444.0";
		try {
			await showTeWebview(teWrapper.releaseNotesPage);
			void teWrapper.releaseNotesPage.postMessage({ method: "echo/fake" }, { command: "taskexplorer.view.parsingReport.show" }); // cover notify() when not visible
			await promiseFromEvent(teWrapper.releaseNotesPage.onDidReceiveMessage).promise;
		}
		catch (e) { throw e; }
		finally { extension.packageJSON.version = version; }
		await closeTeWebviewPanel(teWrapper.releaseNotesPage);
        endRollingCount(this);
	});

});
