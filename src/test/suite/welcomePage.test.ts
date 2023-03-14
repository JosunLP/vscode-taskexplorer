/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand, showTeWebview } from "../utils/commandUtils";
import { activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, teWrapper, promiseFromEvent } from "../utils/utils";
import { expect } from "chai";


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
		await closeEditors();
        endRollingCount(this);
	});

});
