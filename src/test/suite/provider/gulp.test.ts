
import * as path from "path";
import { Uri } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import { ITaskExplorerApi, ITaskExplorerProvider, ITeWrapper } from ":types";
import {
    activate, endRollingCount, exitRollingCount, getWsPath, suiteFinished, testControl as tc,
    testInvDocPositions, updateInternalProviderAutoDetect, verifyTaskCount, waitForTeIdle
} from "../../utils/utils";

const testsName = "gulp";
const startTaskCount = 17;

let teWrapper: ITeWrapper;
let teApi: ITaskExplorerApi;
let provider: ITaskExplorerProvider;
let fileUri: Uri;
let file2Uri: Uri;


suite("Gulp Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate());
        provider = teApi.providers[testsName];
        fileUri = Uri.file(path.join(getWsPath("."), "gulpfile.js"));
        file2Uri = Uri.file(path.join(getWsPath("."), "gulpfile.mjs"));
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        await executeSettingsUpdate("useGulp", false, tc.waitTime.config.event);
        await updateInternalProviderAutoDetect("gulp", "off"); // turned on in tests initSettings()
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await teWrapper.fs.deleteFile(file2Uri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent + tc.waitTime.config.disableEvent);
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
        this.slow(tc.slowTime.config.disableEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.config.updateWs("enabledTasks.gulp", false);
        await waitForTeIdle(tc.waitTime.config.disableEvent);
        await verifyTaskCount(testsName, 0);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.config.updateWs("enabledTasks.gulp", true);
        await waitForTeIdle(tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create JS File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "var gulp = require('gulp');\n" +
            "gulp.task('hello3', (done) => {\n" +
            "    console.log('Hello3!');\n" +
            "    done();\n" +
            "});\n" +
            'gulp.task(\n"hello4", (done) => {\n' +
            "    console.log('Hello4!');\n" +
            "    done();\n" +
            "});\n"
        );
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 2);
        endRollingCount(this);
    });


    test("Add Task to JS File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.modifyEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "var gulp = require('gulp');\n" +
            "gulp.task('hello3', (done) => {\n" +
            "    console.log('Hello3!');\n" +
            "    done();\n" +
            "});\n" +
            'gulp.task(\n"hello4", (done) => {\n' +
            "    console.log('Hello4!');\n" +
            "    done();\n" +
            "});\n" +
            'gulp.task(\n"hello5", (done) => {\n' +
            "    console.log('Hello5!');\n" +
            "    done();\n" +
            "});\n"
        );
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await verifyTaskCount(testsName, startTaskCount + 3);
        endRollingCount(this);
    });


    test("Remove 2 Tasks from JS File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "var gulp = require('gulp');\n" +
            "gulp.task('hello3', (done) => {\n" +
            "    console.log('Hello3!');\n" +
            "    done();\n" +
            "});\n"
        );
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
        endRollingCount(this);
    });


    test("Delete JS File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create MJS File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createFolderEvent + tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(
            file2Uri.fsPath,
            "import pkg from 'gulp';\n" +
            "const { task, series } = pkg;\n" +
            "function clean2(cb) {\n" +
            "    console.log('clean2!!!');\n" +
            "    cb();\n" +
            "}\n" +
            "function build2(cb) {\n" +
            "    console.log('build2!!!');\n" +
            "    cb();\n" +
            "}\n" +
            "const _build1 = build2;\n" +
            "const _build2 = build2;\n" +
            "const build3 = build2;\n" +
            "const build4 = build2;\n" +
            "export { _build1 as build1 };\n" +
            "export { _build2 as build2 };\n" +
            "export { build3 };\n" +
            "export { build4 };\n" +
            "export const default123 = series(clean2, build2);\n"
        );
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 5);
        endRollingCount(this);
    });


    test("Delete MJS File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(file2Uri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Gulp Parser", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent  + tc.waitTime.config.event + tc.slowTime.tasks.count.verify + (tc.slowTime.tasks.gulpParser * 4));
        await updateInternalProviderAutoDetect("gulp", "off"); // turned on in tests initSettings()
        await waitForTeIdle(tc.waitTime.config.enableEvent);
        await executeSettingsUpdate("useGulp", true);
        await waitForTeIdle(tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });

});
