/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

import { join } from "path";
import { expect } from "chai";
import { startupFocus } from "../utils/suiteUtils";
import { MakeTaskProvider } from "../../lib/task/providers/make";
import { Uri, workspace, WorkspaceFolder } from "vscode";
import { executeSettingsUpdate } from "../utils/commandUtils";
import { ITaskExplorerApi, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import {
    activate, endRollingCount, exitRollingCount, getWsPath, suiteFinished, testControl as tc,
    testInvDocPositions, verifyTaskCount, waitForTeIdle
} from "../utils/utils";

const testsName = "make";
const startTaskCount = 8;

let teWrapper: ITeWrapper;
let teApi: ITaskExplorerApi;
let provider: MakeTaskProvider;
let dirName: string;
let fileUri: Uri;


suite("Makefile Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate(this));
        provider = teApi.providers[testsName] as MakeTaskProvider;
        dirName = getWsPath("tasks_test_");
        fileUri = Uri.file(join(dirName, "makefile"));
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


    test("Document Position", async function()
    {
        if (exitRollingCount(this)) return;
        testInvDocPositions(provider);
        const makefileContent = teWrapper.fs.readFileSync(getWsPath("make\\makefile"));
        let index = provider.getDocumentPosition("rule1", makefileContent);
        expect(index).to.equal(273, `rule1 task position should be 273 (actual ${index}`);
        index = provider.getDocumentPosition("rule2", makefileContent);
        expect(index).to.equal(306, `rule2 task position should be 306 (actual ${index}`);
        index = provider.getDocumentPosition("clean", makefileContent);
        expect(index).to.equal(401, `clean task position should be 401 (actual ${index}`);
        index = provider.getDocumentPosition("clean2", makefileContent);
        expect(index).to.equal(449, `clean2 task position should be 449 (actual ${index}`);
        index = provider.getDocumentPosition("clean3", makefileContent);
        expect(index).to.equal(730, `clean3 task position should be 730 (actual ${index}`);
        index = provider.getDocumentPosition("rule_does_not_exist", makefileContent);
        expect(index).to.equal(0, `rule_does_not_exist task position should be 0 (actual ${index}`);
        endRollingCount(this);
    });


    test("Path to make", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.pathToProgramsEvent * 4);
        const rootWorkspace = (workspace.workspaceFolders as WorkspaceFolder[])[0],
              filePath = getWsPath(join(testsName, "makefile")),
              fileUri = Uri.file(filePath);
        const pathToMake = teWrapper.config.get<string>("pathToPrograms." + testsName, "nmake");
        try {
            await executeSettingsUpdate("pathToPrograms." + testsName, "nmake");
            provider.createTask("test", "test", rootWorkspace, fileUri, []);
            await executeSettingsUpdate("pathToPrograms." + testsName, "make");
            provider.createTask("test", "test", rootWorkspace, fileUri, []);
            await executeSettingsUpdate("pathToPrograms." + testsName, undefined);
            provider.createTask("test", "test", rootWorkspace, fileUri, []);
        }
        catch (e) { throw e; }
        finally {
            await executeSettingsUpdate("pathToPrograms." + testsName, pathToMake);
        }
        endRollingCount(this);
    });


    test("Start", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.count.verify);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Disable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks." + testsName, false, tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, 0);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks." + testsName, true, tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createFolderEvent + tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.createDir(dirName);
        await waitForTeIdle(tc.waitTime.fs.createFolderEvent);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "copy_dependencies                         :\n" +
            "   copy /y ..\\dep\\*.acm $(OUTPUT_DIRECTORY)\\bin\n" +
            "   copy /y ..\\dep\\*.exe $(OUTPUT_DIRECTORY)\\bin\n" +
            "   copy /y ..\\dep\\*.dll $(OUTPUT_DIRECTORY)\\bin\n" +
            "   copy /y ..\\doc\\*.pdf $(OUTPUT_DIRECTORY)\\doc\n" +
            "   copy /y ..\\doc\\history.txt $(OUTPUT_DIRECTORY)\doc\n" +
            "   copy /y ..\\dep\\te\\TER15.DLL $(OUTPUT_DIRECTORY)\\bin\n" +
            "clean_obj                                : $(OBJ_DIRECTORY)\n" +
            "   rd /q /s $(OBJ_DIRECTORY)  \n" +
            "clean                                    : $(OUTPUT_DIRECTORY)\n" +
            "   rd /q /s $(OUTPUT_DIRECTORY)\n" +
            "   rd /q /s $(OBJ_DIRECTORY)  \n" +
            "clean                                    : $(OUTPUT_DIRECTORY)\n" + // cover duplicate
            "   rd /q /s $(OUTPUT_DIRECTORY)\n" +
            ".PHONY                                   : $(OUTPUT_DIRECTORY)\n" + // cover specialTargets
            "   rd /q /s $(OUTPUT_DIRECTORY)\n" +
            ".record.test                             : $(OUTPUT_DIRECTORY)\n" + // cover suffixRuleTargets
            "   console.write(\"test\")\n" +
            ".%SPECIAL                                : $(OUTPUT_DIRECTORY)\n" + // cover leading .
            "   console.write(\"special\")\n" +
            "%.done                                   : $(OUTPUT_DIRECTORY)\n" + // cover patternRuleTargets
            "   console.write(\"done\")\n"
        );
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 3);
        endRollingCount(this);
    });


    test("Delete File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.waitTime.fs.deleteFolderEvent + tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        await teWrapper.fs.deleteDir(dirName);
        await waitForTeIdle(tc.waitTime.fs.deleteFolderEvent);
        endRollingCount(this);
    });


    test("Re-create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createFolderEvent + tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.createDir(dirName);
        await waitForTeIdle(tc.waitTime.fs.createFolderEvent);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "copy_dependencies                         :\n" +
            "   copy /y ..\\dep\\*.acm $(OUTPUT_DIRECTORY)\\bin\n" +
            "   copy /y ..\\dep\\*.exe $(OUTPUT_DIRECTORY)\\bin\n" +
            "   copy /y ..\\dep\\*.dll $(OUTPUT_DIRECTORY)\\bin\n" +
            "   copy /y ..\\doc\\*.pdf $(OUTPUT_DIRECTORY)\\doc\n" +
            "   copy /y ..\\doc\\history.txt $(OUTPUT_DIRECTORY)\doc\n" +
            "   copy /y ..\\dep\\te\\TER15.DLL $(OUTPUT_DIRECTORY)\\bin\n" +
            "clean_obj                                : $(OBJ_DIRECTORY)\n" +
            "   rd /q /s $(OBJ_DIRECTORY)  \n" +
            "clean                                    : $(OUTPUT_DIRECTORY)\n" +
            "   rd /q /s $(OUTPUT_DIRECTORY)\n" +
            "   rd /q /s $(OBJ_DIRECTORY)  \n" +
            "clean                                    : $(OUTPUT_DIRECTORY)\n" + // cover duplicate
            "   rd /q /s $(OUTPUT_DIRECTORY)\n" +
            ".PHONY                                   : $(OUTPUT_DIRECTORY)\n" + // cover specialTargets
            "   rd /q /s $(OUTPUT_DIRECTORY)\n" +
            ".record.test                             : $(OUTPUT_DIRECTORY)\n" + // cover suffixRuleTargets
            "   console.write(\"test\")\n" +
            ".%SPECIAL                                : $(OUTPUT_DIRECTORY)\n" + // cover leading .
            "   console.write(\"special\")\n" +
            "%.done                                   : $(OUTPUT_DIRECTORY)\n" + // cover patternRuleTargets
            "   console.write(\"done\")\n"
        );
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 3);
        endRollingCount(this);
    });


    test("Delete Folder", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteFolderEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteDir(dirName);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


});
