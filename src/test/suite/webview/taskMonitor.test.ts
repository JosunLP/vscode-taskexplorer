/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Task, TaskExecution } from "vscode";
import { refresh } from "../../utils/treeUtils";
import { startupFocus } from "../../utils/suiteUtils";
import { ITaskItem, ITeWrapper } from ":types";
import {
	echoWebviewCommand, executeSettingsUpdate, executeTeCommand, executeTeCommand2
} from "../../utils/commandUtils";
import {
	activate, closeEditors, testControl as tc, suiteFinished, sleep, exitRollingCount, endRollingCount,
	promiseFromEvent, waitForTaskExecution, treeUtils
} from "../../utils/utils";

let teWrapper: ITeWrapper;
let ant: ITaskItem[];
let task: Task;
let taskItem: ITaskItem;
let oNumLastTasks: number | undefined;


suite("Task Monitor App Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate());
		oNumLastTasks = teWrapper.config.get<number>(teWrapper.keys.Config.SpecialFoldersNumLastTasks);
		await executeSettingsUpdate(teWrapper.keys.Config.SpecialFoldersNumLastTasks, 2); // covering usage.trackFamousTasks
        await executeSettingsUpdate(teWrapper.keys.Config.KeepTerminalOnTaskDone, true);
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		if (oNumLastTasks) {  // covering usage.trackFamousTasks stats.famous.pop()
			await executeSettingsUpdate(teWrapper.keys.Config.SpecialFoldersNumLastTasks, oNumLastTasks);
		}
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Open Task Monitor React App", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskMonitor);
		executeTeCommand("taskexplorer.view.taskMonitor.show", 10);
        await promiseFromEvent(teWrapper.taskMonitorPage.onDidReceiveReady).promise;
        endRollingCount(this);
	});


	test("Run Task 1", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + tc.slowTime.tasks.getTreeTasks + 2600);
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		taskItem = ant.find(t => !t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
		task = taskItem.task;
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ task ], "last")[0];
		const exec = await executeTeCommand2<TaskExecution | undefined>("taskexplorer.run", [ iTask ]);
		await sleep(150);
        await waitForTaskExecution(exec, 900);
		await executeTeCommand2("taskexplorer.stop", [ iTask ]);
        await waitForTaskExecution(exec, 100);
		await sleep(50);
        endRollingCount(this);
	});


	test("Run Task 2", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + tc.slowTime.tasks.getTreeTasks + tc.slowTime.tasks.gulpTask);
		const gulp = await treeUtils.getTreeTasks(teWrapper, "gulp", 14);
		taskItem = gulp.find(t => t.taskFile.fileName.includes("gulpfile.js") && (<string>t.label).includes("build33")) as ITaskItem;
		task = taskItem.task;
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ task ], "all")[0];
		const exec = await executeTeCommand2<TaskExecution | undefined>("taskexplorer.run", [ iTask ]);
		await sleep(100);
        await waitForTaskExecution(exec);
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
		this.slow(tc.slowTime.commands.standard * 2);
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ task ], "last")[0];
		await executeTeCommand2("taskexplorer.setPinned", [ iTask, "all" ]);
		await executeTeCommand2("taskexplorer.setPinned", [ iTask, "all" ]);
        endRollingCount(this);
	});


    test("Refresh Tree", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh);
        await refresh(teWrapper);
        endRollingCount(this);
    });


	test("Toggle App Settings (From Extension)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.event * 6) + (tc.slowTime.config.trackingEvent * 2));
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTimerMode, "MM:SS:MSS");
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTimerMode, "MM:SS:MS");
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, true);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, true);
		await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, true);  // cover non-taskmonitor config change
		await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, false); // cover non-taskmonitor config change
        endRollingCount(this);
	});


	test("Simulate Toggle App Settings (From App Menu)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.eventFast * 2) + 1210);
		const mType = { method: "echo/config/update", overwriteable: false };
        await sleep(5);
		await teWrapper.taskMonitorPage.postMessage(mType, { key: teWrapper.keys.Config.TaskMonitorTimerMode, value: "MM:SS:MSS" });
        await sleep(50);
		await teWrapper.taskMonitorPage.postMessage(mType, { key: teWrapper.keys.Config.TaskMonitorTimerMode, value: "MM:SS:MS" });
        await sleep(550); // wait for webworker to respond, takes ~ 400-600ms
		await closeEditors();
        endRollingCount(this);
	});

});
