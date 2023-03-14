/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { startupFocus } from "../../utils/suiteUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { closeTeWebview, executeSettingsUpdate, showTeWebview } from "../../utils/commandUtils";
import { activate, testControl as tc, suiteFinished, exitRollingCount, endRollingCount } from "../../utils/utils";

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
		// a task after startupFOcus() the showWelcome test below will take ~3s instead of 500ms
		//
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, true, tc.waitTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, false, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


	test("Open Welcome Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.welcome + tc.slowTime.closeEditors);
		await showTeWebview(teWrapper.welcomePage);
		await closeTeWebview(teWrapper.welcomePage);
        endRollingCount(this);
	});

});
