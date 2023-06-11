/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

import { expect } from "chai";
import { TaskExecution } from "vscode";
import * as utils from "../utils/utils";
import {ITaskItem, ITeWrapper, ITaskFolder } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, executeTeCommand, executeTeCommand2, focusExplorerView, focusSearchView } from "../utils/commandUtils";

const tc = utils.testControl;
const startTaskSlowTime = tc.slowTime.config.event + (tc.slowTime.config.showHideSpecialFolder * 2) + (tc.slowTime.commands.standard * 2);

let teWrapper: ITeWrapper;
let lastTask: ITaskItem | null = null;
let ant: ITaskItem[];
let bash: ITaskItem[];
let batch: ITaskItem[];
let python: ITaskItem[];
let antTask: ITaskItem;
let clickAction: string;
let oNumLastTasks: number;


suite("Task Tests", () =>
{

    suiteSetup(async function()
    {
        if (utils.exitRollingCount(this, true)) return;
        ({ teWrapper } = await utils.activate(this));
        clickAction = teWrapper.config.get<string>(teWrapper.keys.Config.TaskButtonsClickAction);
        oNumLastTasks = teWrapper.config.get<number>(teWrapper.keys.Config.SpecialFoldersNumLastTasks);
        await executeSettingsUpdate(teWrapper.keys.Config.SpecialFoldersNumLastTasks, 3);
        await executeSettingsUpdate(teWrapper.keys.Config.SpecialFoldersShowLastTasks, true);
        utils.endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
        await executeSettingsUpdate(teWrapper.keys.Config.SpecialFoldersNumLastTasks, oNumLastTasks);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskButtonsClickAction, clickAction);
		await utils.closeEditors(); // close task monitor from previous test suite
        utils.suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        if (utils.exitRollingCount(this)) return;
        if (utils.needsTreeBuild()) {
            await focusExplorerView(teWrapper, this);
        }
        utils.endRollingCount(this);
	});


    test("Check Task Counts", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.getTreeTasks * 4);
        bash = await utils.treeUtils.getTreeTasks(teWrapper, "bash", 1);
        batch = await utils.treeUtils.getTreeTasks(teWrapper, "batch", 2);
        ant = await utils.treeUtils.getTreeTasks(teWrapper, "ant", 3);
        python = await utils.treeUtils.getTreeTasks(teWrapper, "python", 2);
        utils.endRollingCount(this);
    });


    test("Run Non-Existent Last Task", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.storage.update);
        utils.overrideNextShowInfoBox("Workspace", true);
        await executeTeCommand("taskexplorer.clearLastTasks");
        await utils.sleep(1);
        utils.overrideNextShowInfoBox("Global");
        await executeTeCommand("taskexplorer.clearLastTasks");
        await utils.sleep(1);
        expect(await executeTeCommand("runLastTask", tc.waitTime.runCommandMin)).to.be.equal(undefined, "Return TaskExecution should be undefined");
        utils.endRollingCount(this);
    });


    test("Keep Terminal on Stop (OFF)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.event + (tc.slowTime.commands.run * 2) + tc.slowTime.commands.runStop + tc.slowTime.commands.runPause + 3000);
        await executeSettingsUpdate(teWrapper.keys.Config.KeepTerminalOnTaskDone, false);
        let exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.runCommandMin);
        expect(exec).to.not.be.equal(undefined, "Starting the 'batch0' task did not return a valid TaskExecution");
        await utils.waitForTaskExecution(exec, 1750);
        await executeTeCommand2("stop", [ batch[0] ], tc.waitTime.taskCommand);
        batch[0].paused = true;
        utils.overrideNextShowInfoBox(undefined);
        exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.taskCommand) ;
        await utils.waitForTaskExecution(exec, 1750);
        await executeTeCommand2("stop", [ batch[0] ]);
        utils.endRollingCount(this);
    });


    test("Run Pause and Run", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.run * 2) + tc.slowTime.commands.runStop + tc.slowTime.commands.runPause + 7000);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec, 1750);
        await executeTeCommand2("pause", [ batch[0] ], tc.waitTime.taskCommand);
        await utils.sleep(450);
        await executeTeCommand2("run", [ batch[0] ], tc.waitTime.taskCommand) ;
        await utils.waitForTaskExecution(exec, 800);
        await executeTeCommand2("stop", [ batch[0] ]);
        await utils.waitForTaskExecution(exec, 500);
        utils.endRollingCount(this);
    });


    test("Run Pause and Stop (Keep Terminal on Stop OFF)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + tc.slowTime.commands.runPause + 6400);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec, 1750);
        await executeTeCommand2("pause", [ batch[0] ], tc.waitTime.taskCommand);
        await utils.sleep(450);
        await utils.waitForTaskExecution(exec, 500);
        await executeTeCommand2("stop", [ batch[0] ]);
        await utils.waitForTaskExecution(exec, 500);
        utils.endRollingCount(this);
    });


    test("Keep Terminal on Stop (ON)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + tc.slowTime.config.event + 5000);
        await executeSettingsUpdate(teWrapper.keys.Config.KeepTerminalOnTaskDone, true);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.runCommandMin) ;
        expect(exec).to.not.be.equal(undefined, "Starting the 'batch0' task did not return a valid TaskExecution");
        await utils.waitForTaskExecution(exec, 1500);
        await executeTeCommand2("stop", [ batch[0] ], tc.waitTime.taskCommand);
        await utils.waitForTaskExecution(exec, 1000);
        utils.endRollingCount(this);
    });


    test("Run Pause and Stop (Keep Terminal on Stop ON)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + tc.slowTime.commands.runPause + 5400);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec, 1750);
        await executeTeCommand2("pause", [ batch[0] ], tc.waitTime.taskCommand);
        await utils.sleep(450);
        await utils.waitForTaskExecution(exec, 500);
        await executeTeCommand2("stop", [ batch[0] ], tc.waitTime.taskCommand);
        utils.endRollingCount(this);
    });


    test("Trigger Busy on Task Commands", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh + (tc.slowTime.commands.standard * 5) + 1200);
        utils.clearOverrideShowInfoBox();
        executeTeCommand("refresh", 500, 2000);               // don't await
        await utils.sleep(2);
        utils.overrideNextShowInfoBox(undefined);
        executeTeCommand("runLastTask", 0);                   // don't await
        utils.overrideNextShowInfoBox(undefined);
        executeTeCommand2("run", [ batch[0] ], 0);            // don't await
        utils.overrideNextShowInfoBox(undefined);
        executeTeCommand2("restart", [ batch[0] ], 0);        // don't await
        utils.overrideNextShowInfoBox(undefined);
        executeTeCommand2("stop", [ batch[0] ], 0);           // don't await
        utils.overrideNextShowInfoBox(undefined);
        executeTeCommand2("pause", [ batch[0] ], 0);           // don't await
        await utils.waitForTeIdle(tc.waitTime.refreshCommand);      // now wait for refresh
        utils.endRollingCount(this);
    });


    test("Pause", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runPause + tc.slowTime.commands.runStop + tc.slowTime.config.event + 5600);
        await executeSettingsUpdate(teWrapper.keys.Config.KeepTerminalOnTaskDone, false);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ batch[0] ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec, 2000);
        await utils.waitForTeIdle(tc.waitTime.runCommandMin);
        await executeTeCommand2("pause", [ batch[0] ], tc.waitTime.taskCommand);
        await utils.sleep(800);
        await executeTeCommand2("stop", [ batch[0] ], tc.waitTime.taskCommand);
        utils.endRollingCount(this);
    });


    test("Run Task (No Terminal)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.tasks.bashScript + tc.slowTime.commands.runStop  + 5200);
        const bashTask = bash[0];
        await executeTeCommand2("setPinned", [ bashTask, "last" ]) ;
        await startTask(bashTask, false);
        const exec = await executeTeCommand2<TaskExecution | undefined>("runNoTerm", [ bashTask ], tc.waitTime.runCommandMin) ;
        await utils.sleep(100);
        await utils.waitForTaskExecution(exec, 2000);
        await executeTeCommand2("stop", [ bash[0] ], tc.waitTime.taskCommand);
        await utils.waitForTaskExecution(exec, 500);
        lastTask = bashTask;
        utils.endRollingCount(this);
    });


    test("Run Ant Task (w/ Ansicon)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.enableEvent * 2) + tc.slowTime.commands.run +  (tc.slowTime.config.event * 2) +
                  tc.slowTime.tasks.antTaskWithAnsicon + 300 + tc.slowTime.commands.focusChangeViews);
        antTask = ant.find(t => t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
        expect(antTask).to.not.be.equal(undefined, "The 'hello' ant task was not found in the task tree");
        await executeSettingsUpdate("pathToPrograms.ansicon", utils.getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"), tc.waitTime.config.enableEvent);
        utils.overrideNextShowInfoBox(undefined);
        await executeSettingsUpdate("enableAnsiconForAnt", true, tc.waitTime.config.enableEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, false);
        await startTask(antTask, false);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ antTask ], tc.waitTime.runCommandMin) ;
        await utils.sleep(100);
        teWrapper.treeManager.runningTasks; // access the getter while there's an actual running task for coverage
        await utils.sleep(50);
        teWrapper.treeManager.runningTasks; // access the getter while there's an actual running task for coverage
        await focusSearchView(); // randomly show/hide view to test refresh event queue in tree/tree.ts
        await utils.waitForTaskExecution(exec);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, true);
        lastTask = antTask;
        utils.endRollingCount(this);
    });


    test("Run Ant Task (w/o Ansicon)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.event * 2) + tc.slowTime.commands.run + tc.slowTime.tasks.antTask);
        await executeSettingsUpdate("enableAnsiconForAnt", false, tc.waitTime.config.enableEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.KeepTerminalOnTaskDone, true);
        await executeTeCommand2("setPinned", [ bash[0], "last" ]) ;
        await executeTeCommand2("setPinned", [ antTask, "last" ]) ;
        await startTask(antTask, false);
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ antTask ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec);
        lastTask = antTask;
        utils.endRollingCount(this);
    });


    test("Run Batch Task", async function()
    {
        if (utils.exitRollingCount(this)) return;
        const slowTime = (tc.slowTime.commands.run * 2) + tc.slowTime.commands.runStop + 6500 +
                          startTaskSlowTime + (tc.slowTime.config.event * 5) +
                          (tc.slowTime.commands.standard * 2) + tc.slowTime.general.closeEditors + tc.slowTime.tasks.batchScriptCmd;
        this.slow(slowTime);
        await focusExplorerView(teWrapper); // randomly show/hide view to test refresh event queue in tree/tree.ts
        const batchTask = batch[0];
        await startTask(batchTask, true);
        await executeSettingsUpdate(teWrapper.keys.Config.KeepTerminalOnTaskDone, false);
        await executeSettingsUpdate("visual.disableAnimatedIcons", false);
        await executeSettingsUpdate("specialFolders.showLastTasks", false);
        //
        // Execute w/ open
        //
        let exec = await executeTeCommand2<TaskExecution | undefined>("open", [ batchTask, true ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec, 2000);
        //
        // Stop
        //
        await executeTeCommand2("stop", [ batchTask ], tc.waitTime.taskCommand);
        //
        // Open task file
        //
        await executeSettingsUpdate(teWrapper.keys.Config.TaskButtonsClickAction, "Open");
        await executeTeCommand2("open", [ batchTask ], tc.waitTime.command);
        await utils.closeEditors();
        //
        // Open terminal
        //
        await executeTeCommand2("openTerminal", [ python[0] ], tc.waitTime.command);
        await executeTeCommand2("openTerminal", [ batchTask ], tc.waitTime.command);
        //
        // Run Last Task
        //
        await executeSettingsUpdate("showRunningTask", false);
        exec = await executeTeCommand<TaskExecution | undefined>("runLastTask", tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec, 1250);
        //
        // Restart Task
        //
        exec = await executeTeCommand2<TaskExecution | undefined>("restart", [ batchTask ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec,  1250);
        //
        // End
        //
        await executeTeCommand2("stop", [ batchTask ], tc.waitTime.taskCommand);
        await utils.waitForTaskExecution(exec,  500);
        lastTask = batchTask;
        utils.endRollingCount(this);
    });


    test("Run Batch Task (With Args)", async function()
    {   //
        // There are 2 batch file "tasks" - they both utils.sleep for 7 seconds, 1 second at a time
        //
        if (utils.exitRollingCount(this)) return;
        const slowTime = (tc.slowTime.commands.run * 1) + 5000 /* 7500 */ + startTaskSlowTime + (tc.slowTime.commands.runStop * 1 /* 2 */) +
                         (tc.slowTime.commands.standard * 3) + (tc.slowTime.config.event * 4) + tc.slowTime.tasks.batchScriptBat + tc.slowTime.config.showHideSpecialFolder;
        this.slow(slowTime);
        const batchTask = batch[1];
        await startTask(batchTask, true);
        await executeSettingsUpdate("visual.disableAnimatedIcons", true);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskButtonsClickAction, "Execute");
        await executeSettingsUpdate("specialFolders.showLastTasks", true);
        await executeTeCommand2("setPinned", [ antTask, "last" ]) ;
        await executeTeCommand2("setPinned", [ batchTask, "last" ]) ;
        utils.overrideNextShowInputBox(undefined);
        let exec = await executeTeCommand2<TaskExecution | undefined>("runWithArgs", [ batchTask ], tc.waitTime.runCommandMin) ;
        expect(exec).to.be.undefined;
        exec = await executeTeCommand2<TaskExecution | undefined>("runWithArgs", [ batchTask, "--test --test2" ], tc.waitTime.runCommandMin) ;
        expect(exec).to.not.be.undefined;
        await utils.waitForTaskExecution(exec, 1500);
        await executeTeCommand2("stop", [ batchTask ], tc.waitTime.taskCommand);
        utils.overrideNextShowInputBox("--test --test2");
        exec = await executeTeCommand2<TaskExecution | undefined>("runWithArgs", [ batchTask ], tc.waitTime.runCommandMin + 1000) ;
        expect(exec).to.not.be.undefined;
        await executeSettingsUpdate("showRunningTask", true);
        await executeTeCommand2("openTerminal", [ batchTask ], tc.waitTime.command);
        await utils.waitForTaskExecution(exec, 1250);
        await executeTeCommand2("stop", [ batchTask ], tc.waitTime.taskCommand);
        await utils.waitForTaskExecution(exec,  500);
        lastTask = batchTask;
        utils.endRollingCount(this);
    });


    test("Set Pinned Tasks", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.event * 6);
        await executeTeCommand2("setPinned", [ lastTask, "last" ]) ;
        await executeTeCommand2("setPinned", [ batch[0], "last" ]) ;
        await executeTeCommand2("setPinned", [ batch[0], "all" ]) ;
        await executeTeCommand2("setPinned", [ antTask, "all" ]) ;
        await executeTeCommand2("setPinned", [ python[0], "all" ]) ;
        await executeTeCommand2("setPinned", [ antTask, "running" ]) ;
        utils.endRollingCount(this);
    });

});


async function startTask(taskItem: ITaskItem, addToSpecial: boolean)
{
    if (tc.log.taskExecutionSteps) {
        console.log(`    ${teWrapper.figures.color.info} Run ${taskItem.taskSource} task | ${taskItem.label} | ${taskItem.getFolder()?.name}`);
    }
    if (addToSpecial)
    {
        await executeSettingsUpdate(teWrapper.keys.Config.TaskButtonsClickAction, "Execute");
        let removed = await executeTeCommand2("addRemoveFavorite", [ taskItem ]);
        if (removed) {
            await executeTeCommand2("addRemoveFavorite", [ taskItem ]);
        }
        const taskTree = teWrapper.treeManager.getTaskTree();
        if (taskTree)
        {
            const sFolder= taskTree[0].label === "Favorites" ? taskTree[0] as any :
                           (taskTree[1].label === "Favorites" ? taskTree[1] as any : null);
            if (sFolder)
            {
                const sTaskItem = sFolder.taskFiles.find((t: ITaskItem) => sFolder.getTaskItemId(t.id) === taskItem.id);
                if (sTaskItem)
                {
                    utils.overrideNextShowInputBox("test label");
                    removed = await executeTeCommand2("addRemoveCustomLabel", [ sTaskItem ]);
                    if (removed) {
                        await executeTeCommand2("addRemoveCustomLabel", [ sTaskItem ]);
                    }
                    if (lastTask) {
                        await executeTeCommand2("openTerminal", [ lastTask ]);
                    }
                }
            }
        }
    }
}
