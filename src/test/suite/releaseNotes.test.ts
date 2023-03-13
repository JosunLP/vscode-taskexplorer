/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Extension } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand } from "../utils/commandUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, promiseFromEvent } from "../utils/utils";

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
		this.slow(testControl.slowTime.viewReleaseNotes);
		void executeTeCommand("taskexplorer.view.releaseNotes.show", testControl.waitTime.viewWebviewPage);
        await promiseFromEvent(teWrapper.releaseNotesPage.onReadyReceived).promise;
        endRollingCount(this);
	});


	test("Open Release Notes (Error No Version)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 50 + testControl.slowTime.closeEditors + testControl.slowTime.webview.notify);
		await closeEditors();
		const version = extension.packageJSON.version;
		extension.packageJSON.version = "17.4444.0";
		try {
			await executeTeCommand("taskexplorer.view.releaseNotes.show", testControl.waitTime.viewWebviewPage);
			await promiseFromEvent(teWrapper.releaseNotesPage.onReadyReceived).promise;
			await teWrapper.releaseNotesPage.notify({ method: "echo/fake" }, { command: "taskexplorer.view.parsingReport.show" }); // cover notify() when not visible
			await sleep(25);
		}
		catch (e) { throw e; }
		finally { extension.packageJSON.version = version; }
        endRollingCount(this);
	});

});
