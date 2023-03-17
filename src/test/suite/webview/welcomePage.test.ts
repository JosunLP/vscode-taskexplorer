/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { closeTeWebviewPanel, executeSettingsUpdate, showTeWebview } from "../../utils/commandUtils";
import { activate, testControl as tc, suiteFinished, exitRollingCount, endRollingCount, sleep } from "../../utils/utils";

let teWrapper: ITeWrapper;


suite("Welcome Page Tests", () =>
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
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
		const tmp = teWrapper.welcomePage.visible; // cover wrapper getter until we need tests for welcome page
	});

/*
	test("Open Welcome Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.welcome + tc.slowTime.webview.closeSync);
		await showTeWebview(teWrapper.welcomePage);
		await closeTeWebviewPanel(teWrapper.welcomePage);
        endRollingCount(this);
	});
*/
});
