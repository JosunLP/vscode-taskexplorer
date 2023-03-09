/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand2 } from "../utils/commandUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, treeUtils } from "../utils/utils";

let teWrapper: ITeWrapper;
let batch: ITaskItem[];


suite("Task Details Page Tests", () =>
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
		await closeEditors();
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Open Details Page (Used Task)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 200);
		batch = await treeUtils.getTreeTasks(teWrapper, "batch", 2);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ batch[0] ], testControl.waitTime.viewReport);
		await sleep(75);
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewReleaseNotes + 200);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ batch[1] ], testControl.waitTime.viewReport);
		await sleep(75);
        endRollingCount(this);
	});

});
