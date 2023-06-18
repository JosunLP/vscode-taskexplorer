
import * as path from "path";
import { Uri } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { ITaskExplorerApi, ITaskExplorerProvider, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, endRollingCount, exitRollingCount, getWsPath, needsTreeBuild, suiteFinished, testControl } from "../utils/utils";

const testsName = "perl";
const startTaskCount = 7;

let teApi: ITaskExplorerApi;
let teWrapper: ITeWrapper;
let provider: ITaskExplorerProvider;
let dirName: string;
let fileUri: Uri;


suite("Perl Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate(this));
        provider = teApi.providers[testsName];
        dirName = getWsPath("tasks_test_");
        fileUri = Uri.file(path.join(dirName, "newscript.pl"));
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
        // provider.getDocumentPosition(undefined, undefined);
        // provider.getDocumentPosition("test", undefined);
        // provider.getDocumentPosition(undefined, "test");
        endRollingCount(this);
    });


    test("Start", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.tasks.count.verify + testControl.waitTime.min);
        // await verifyTaskCount(testsName, startTaskCount);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });


    test("Disable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verify + testControl.waitTime.config.enableEvent + testControl.waitTime.min);
        // await teApi.testsApi.config.updateWs("enabledTasks.perl", false);
        // await waitForTeIdle(testControl.waitTime.config.enableEvent);
        // await verifyTaskCount(testsName, 0);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verify + testControl.waitTime.config.enableEvent + testControl.waitTime.min);
        // await teApi.testsApi.config.updateWs("enabledTasks.perl", true);
        // await waitForTeIdle(testControl.waitTime.config.enableEvent);
        // await verifyTaskCount(testsName, startTaskCount);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });


    test("Create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.createEvent + testControl.slowTime.tasks.count.verify + testControl.waitTime.fs.createEvent + testControl.waitTime.min);
        // if (!(await teWrapper.fs.pathExists(dirName))) {
        //     await teWrapper.fs.createDir(dirName);
        // }
        // await teWrapper.fs.writeFile(
        //     fileUri.fsPath,
        //     "module.exports = function(perl) {\n" +
        //     '    perl.registerTask(\n"default2", ["jshint:myproject"]);\n' +
        //     '    perl.registerTask("upload2", ["s3"]);\n' +
        //     "};\n"
        // );
        // await waitForTeIdle(testControl.waitTime.fs.createEvent);
        // await verifyTaskCount(testsName, startTaskCount + 2);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });


    test("Add 4 Tasks to File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.modifyEvent + testControl.slowTime.tasks.count.verify + testControl.waitTime.fs.modifyEvent + testControl.waitTime.min);
        // await teWrapper.fs.writeFile(
        //     fileUri.fsPath,
        //     "module.exports = function(perl) {\n" +
        //     '    perl.registerTask(\n"default2", ["jshint:myproject"]);\n' +
        //     '    perl.registerTask("upload2", ["s3"]);\n' +
        //     '    perl.registerTask("upload3", ["s4"]);\n' +
        //     '    perl.registerTask("upload4", ["s5"]);\n' +
        //     '    perl.registerTask("upload5", ["s6"]);\n' +
        //     '    perl.registerTask("upload6", ["s7"]);\n' +
        //     "};\n"
        // );
        // await waitForTeIdle(testControl.waitTime.fs.modifyEvent);
        // await verifyTaskCount(testsName, startTaskCount + 6);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });


    test("Remove 2 Tasks from File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.deleteEvent + testControl.slowTime.tasks.count.verify + testControl.waitTime.fs.modifyEvent + testControl.waitTime.min);
        // await teWrapper.fs.writeFile(
        //     fileUri.fsPath,
        //     "module.exports = function(perl) {\n" +
        //     '    perl.registerTask(\n"default2", ["jshint:myproject"]);\n' +
        //     '    perl.registerTask("upload2", ["s3"]);\n' +
        //     '    perl.registerTask("upload5", ["s5"]);\n' +
        //     '    perl.registerTask("upload6", ["s7"]);\n' +
        //     "};\n"
        // );
        // await waitForTeIdle(testControl.waitTime.fs.modifyEvent);
        // await verifyTaskCount(testsName, startTaskCount + 4);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });


    test("Delete File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.deleteEvent + testControl.slowTime.tasks.count.verify + testControl.waitTime.fs.deleteEvent + testControl.waitTime.min);
        // await teWrapper.fs.deleteFile(fileUri.fsPath);
        // await teWrapper.fs.deleteDir(dirName);
        // await waitForTeIdle(testControl.waitTime.fs.deleteEvent);
        // await verifyTaskCount(testsName, startTaskCount);
        // await waitForTeIdle(testControl.waitTime.min);
        endRollingCount(this);
    });

});
