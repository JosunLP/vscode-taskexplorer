/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand } from "../utils/commandUtils";
import { activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, teWrapper } from "../utils/utils";


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
		await closeEditors();
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Open Welcome Page", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 200);
		await executeTeCommand("taskexplorer.view.welcome.show", testControl.waitTime.viewWebviewPage);
		await sleep(75);
		await teWrapper.welcomePage.show();
		await sleep(5);
        endRollingCount(this);
	});

});
