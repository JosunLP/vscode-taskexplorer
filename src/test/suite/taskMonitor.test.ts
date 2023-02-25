/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Extension, Task, TaskExecution } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand, executeTeCommand2 } from "../utils/commandUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, promiseFromEvent, waitForTaskExecution, treeUtils, waitForTeIdle } from "../utils/utils";

let teWrapper: ITeWrapper;
let ant: ITaskItem[];
let task: Task;


suite("Task Monitor App Tests", () =>
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


	test("Open Task Monitor React App", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewTaskMonitor);
		executeTeCommand("taskexplorer.view.taskMonitor.show", 10);
        await promiseFromEvent(teWrapper.taskMonitorPage.onReadyReceived).promise;
        endRollingCount(this);
	});


	// test("Open All Tabs", async function()
	// {
    //     if (exitRollingCount(this)) return;
    //     endRollingCount(this);
	// });


	test("Simulate Run Task", async function()
	{
        if (exitRollingCount(this)) return;
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		await waitForTeIdle(testControl.waitTime.getTreeTasks);
		task = (ant.find(t => !t.taskFile.fileName.includes("hello.xml")) as ITaskItem).task;
		const exec = await executeTeCommand2<TaskExecution | undefined>("taskexplorer.run", [{
			name: task.name,
			definition: task.definition,
			source: task.source,
			running: false,
			listType: "last",
			treeId: task.definition.taskItemId,
			pinned: false
		}]);
        await waitForTaskExecution(exec, 800);
        endRollingCount(this);
	});


	// test("Simulate Favorite Task", async function()
	// {
    //     if (exitRollingCount(this)) return;
    //     endRollingCount(this);
	// });


	test("Simulate Pin Task", async function()
	{
        if (exitRollingCount(this)) return;
		await executeTeCommand2<TaskExecution | undefined>("taskexplorer.setPinned", [{
			name: task.name,
			definition: task.definition,
			source: task.source,
			running: false,
			listType: "last",
			treeId: task.definition.taskItemId,
			pinned: false
		}]);
		await sleep(10);
		await executeTeCommand2<TaskExecution | undefined>("taskexplorer.setPinned", [{
			name: task.name,
			definition: task.definition,
			source: task.source,
			running: false,
			listType: "last",
			treeId: task.definition.taskItemId,
			pinned: false
		}]);
        endRollingCount(this);
	});


	// test("Toggle Timer", async function()
	// {
    //     if (exitRollingCount(this)) return;
    //     endRollingCount(this);
	// });

});
