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
	});


    test("Update Relevant Settings", async function()
    {   //
		// These settings as of 3/14/23 aren't really relevant, but, if there isn't a break or
		// a task after startupFOcus() the showWelcome test below will take ~3s instead of ~7-800ms
		//
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.event * 2) + 6000);
        // await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, true);
        // await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, false);
        await sleep(3000);
        endRollingCount(this);
    });


	test("Open Welcome Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.welcome + tc.slowTime.webview.closeSync);
		await showTeWebview(teWrapper.welcomePage);
		await closeTeWebviewPanel(teWrapper.welcomePage);
        endRollingCount(this);
	});
});
