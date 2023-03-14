/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Task, TaskExecution } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { echoWebviewCommand, executeSettingsUpdate, executeTeCommand, executeTeCommand2 } from "../utils/commandUtils";
import {
	activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount, endRollingCount,
	promiseFromEvent, waitForTaskExecution, treeUtils, waitForTeIdle
} from "../utils/utils";
import { refresh } from "../utils/treeUtils";

let teWrapper: ITeWrapper;
let ant: ITaskItem[];
let task: Task;
let taskItem: ITaskItem;


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


	test("Run Task", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.commands.run + testControl.slowTime.commands.runStop + testControl.slowTime.getTreeTasks);
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		taskItem = ant.find(t => !t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
		task = taskItem.task;
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ task ], "last")[0];
		const exec = await executeTeCommand2<TaskExecution | undefined>("taskexplorer.run", [ iTask ]);
        await waitForTaskExecution(exec, 700);
		await executeTeCommand2("taskexplorer.stop", [ iTask ]);
        await waitForTaskExecution(exec, 50);
        endRollingCount(this);
	});


	test("Favorite Task", async function()
	{
        if (exitRollingCount(this)) return;
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ task ], "favorites")[0];
		await echoWebviewCommand("taskexplorer.addRemoveFavorite", teWrapper.taskMonitorPage, 0, iTask);
		await promiseFromEvent(teWrapper.treeManager.onDidFavoriteTasksChange).promise;
		await echoWebviewCommand("taskexplorer.addRemoveFavorite", teWrapper.taskMonitorPage, 0, iTask);
		await promiseFromEvent(teWrapper.treeManager.onDidFavoriteTasksChange).promise;
        endRollingCount(this);
	});


	test("Pin Task", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.commands.standard * 2);
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ task ], "last")[0];
		await executeTeCommand2("taskexplorer.setPinned", [ iTask ]);
		await executeTeCommand2("taskexplorer.setPinned", [ iTask ]);
        endRollingCount(this);
	});


    test("Refresh Tree", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.commands.refresh);
        await refresh();
        endRollingCount(this);
    });


	test("Toggle App Settings (From Extension)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.config.event * 8);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TimerMode, "MM:SS:MSS");
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TimerMode, "MM:SS:MS");
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, true);
		await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, true);  // cover non-taskmonitor config change
		await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, false); // cover non-taskmonitor config change
        endRollingCount(this);
	});


	test("Simulate Toggle App Settings (From App Menu)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.eventFast * 2) + 1210);
		const mType = { method: "echo/config/update", overwriteable: false };
        await sleep(5);
		await teWrapper.taskMonitorPage.notify(mType, { key: teWrapper.keys.Config.TaskMonitor.TimerMode, value: "MM:SS:MSS" });
        await sleep(50);
		await teWrapper.taskMonitorPage.notify(mType, { key: teWrapper.keys.Config.TaskMonitor.TimerMode, value: "MM:SS:MS" });
        await sleep(550); // wait for webworker to respond, takes ~ 400-600ms
		await closeEditors();
        endRollingCount(this);
	});

});
