/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Extension, Task, TaskExecution } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeSettingsUpdate, executeTeCommand, executeTeCommand2 } from "../utils/commandUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount, promiseFromEvent, waitForTaskExecution, treeUtils, waitForTeIdle } from "../utils/utils";
import { ConfigKeys } from "../../lib/constants";

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
		this.slow(testControl.slowTime.webview.show.page.taskMonitor);
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
		this.slow(testControl.slowTime.commands.run);
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
		this.slow(testControl.slowTime.commands.standard * 2);
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


	test("Toggle App Settings", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.config.event * 6);
		await executeSettingsUpdate(ConfigKeys.TaskMonitor.TimerMode, "MM:SS:MSS");
		await executeSettingsUpdate(ConfigKeys.TaskMonitor.TimerMode, "MM:SS:MS");
		await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, false);
		await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, true);
		await executeSettingsUpdate(ConfigKeys.TrackUsage, false);
		await executeSettingsUpdate(ConfigKeys.TrackUsage, true);
        endRollingCount(this);
	});


	test("Simulate Toggle App Settings from App Menu", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.eventFast * 2) + 1210);
		const mType = { method: "echo/config/update", overwriteable: false };
        await sleep(5);
		await teWrapper.taskMonitorPage.notify(mType, { key: ConfigKeys.TaskMonitor.TimerMode, value: "MM:SS:MSS" });
        await sleep(50);
		await teWrapper.taskMonitorPage.notify(mType, { key: ConfigKeys.TaskMonitor.TimerMode, value: "MM:SS:MS" });
        await sleep(550); // wait for webworker to respond, takes ~ 400-600ms
		await closeEditors();
        endRollingCount(this);
	});

});
