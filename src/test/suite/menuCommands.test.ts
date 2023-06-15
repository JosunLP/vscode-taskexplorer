/* eslint-disable @typescript-eslint/no-unused-expressions */

import { TaskExecution, Uri } from "vscode";
import { executeTeCommand2, focusExplorerView } from "../utils/commandUtils";
import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import {
    activate, clearOverrideShowInputBox, endRollingCount, exitRollingCount, getWsPath,
    needsTreeBuild, overrideNextShowInfoBox, overrideNextShowInputBox, suiteFinished, testControl as tc, verifyTaskCount, waitForTaskExecution
} from "../utils/utils";
import { expect } from "chai";

let teWrapper: ITeWrapper;
const antUri: Uri = Uri.file(getWsPath("build.xml"));
const gruntFolderUri: Uri = Uri.file(getWsPath("grunt"));
const batchUri: Uri = Uri.file(getWsPath("hello.bat"));
const pythonUri: Uri = Uri.file(getWsPath("test.py"));
const readmeUri: Uri = Uri.file(getWsPath("README.md"));
const antStartCount = 3;
const gruntStartCount = 7;
const pythonStartCount = 2;


suite("Menu Command Tests", () =>
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
        if (exitRollingCount(this)) return;
        if (needsTreeBuild(true)) {
            await focusExplorerView(teWrapper, this);
        }
        endRollingCount(this);
	});


    test("Disable Task Types", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.tasks.count.verify * 2) + (tc.slowTime.config.disableEvent * 2));
        await executeTeCommand2("disableTaskType", [ pythonUri ], tc.waitTime.config.disableEvent);
        await verifyTaskCount("python", 0);
        await executeTeCommand2("disableTaskType", [ antUri ], tc.waitTime.config.disableEvent);
        await verifyTaskCount("ant", 0);
        endRollingCount(this);
    });


    test("Enable Task Types", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.tasks.count.verify * 2) + (tc.slowTime.config.enableEvent * 2) + tc.slowTime.config.eventFast);
        await executeTeCommand2("enableTaskType", [ pythonUri ], tc.waitTime.config.enableEvent);
        await verifyTaskCount("python", pythonStartCount);
        await executeTeCommand2("enableTaskType", [ antUri ], tc.waitTime.config.enableEvent);
        await verifyTaskCount("ant", antStartCount);
        overrideNextShowInfoBox(undefined);
        await executeTeCommand2("enableTaskType", [ readmeUri ], tc.waitTime.config.eventFast);
        endRollingCount(this);
    });


    test("Add File to Excludes", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.tasks.count.verify * 2) + (tc.slowTime.config.excludesEvent * 2));
        await executeTeCommand2("addToExcludesEx", [ pythonUri ], tc.waitTime.config.excludesEvent);
        await verifyTaskCount("python", pythonStartCount - 1);
        await executeTeCommand2("addToExcludesEx", [ antUri ], tc.waitTime.config.excludesEvent);
        await verifyTaskCount("ant", antStartCount - 2);
        endRollingCount(this);
    });


    test("Remove File from Excludes", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.tasks.count.verify * 2) + (tc.slowTime.config.excludesEvent * 2));
        await executeTeCommand2("removeFromExcludes", [ pythonUri ], tc.waitTime.config.excludesEvent);
        await verifyTaskCount("python", pythonStartCount);
        await executeTeCommand2("removeFromExcludes", [ antUri ], tc.waitTime.config.excludesEvent);
        await verifyTaskCount("ant", antStartCount);
        endRollingCount(this);
    });


    test("Add Folder to Excludes", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.count.verify + tc.slowTime.config.excludesEvent);
        await executeTeCommand2("addToExcludesEx", [ gruntFolderUri ], tc.waitTime.config.excludesEvent);
        await verifyTaskCount("grunt", 0);
        overrideNextShowInfoBox(undefined);
        await executeTeCommand2("addToExcludesEx", [ readmeUri ], tc.waitTime.config.eventFast);
        endRollingCount(this);
    });


    test("Remove Folder from Excludes", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.count.verify + tc.slowTime.config.excludesEvent);
        await executeTeCommand2("removeFromExcludes", [ gruntFolderUri ], tc.waitTime.config.excludesEvent);
        await verifyTaskCount("grunt", gruntStartCount);
        overrideNextShowInfoBox(undefined);
        await executeTeCommand2("removeFromExcludes", [ readmeUri ], tc.waitTime.config.eventFast);
        endRollingCount(this);
    });


    test("Run Script Type Task", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.bashScript);
        clearOverrideShowInputBox();
        overrideNextShowInputBox("--nosleep");
        const exec = await executeTeCommand2<TaskExecution | undefined>("runWithArgs", [ batchUri, batchUri ], tc.waitTime.config.excludesEvent);
        expect(exec).to.not.be.undefined;
        await waitForTaskExecution(exec, 1000);
        endRollingCount(this);
    });

});
