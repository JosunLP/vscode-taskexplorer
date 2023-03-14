/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { startupFocus } from "../utils/suiteUtils";
import { closeTeWebview, showTeWebview } from "../utils/commandUtils";
import { activate, testControl, suiteFinished, exitRollingCount, endRollingCount, teWrapper } from "../utils/utils";


suite("Welcome Page Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        await activate(this);
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


	test("Open Welcome Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.webview.show.page.welcome + testControl.slowTime.closeEditors);
		await showTeWebview(teWrapper.welcomePage);
		await closeTeWebview(teWrapper.welcomePage);
        endRollingCount(this);
	});

});
