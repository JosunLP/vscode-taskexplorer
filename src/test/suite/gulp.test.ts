/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

import * as path from "path";
import { Uri, workspace, WorkspaceFolder } from "vscode";
import { activate, getWsPath, testsControl, verifyTaskCount } from "../helper";
import { IFilesystemApi, ITaskExplorerApi } from "@spmeesseman/vscode-taskexplorer-types";
import { GulpTaskProvider } from "../../providers/gulp";

const testsName = "gulp";
const startTaskCount = 17;

let teApi: ITaskExplorerApi;
let fsApi: IFilesystemApi;
let provider: GulpTaskProvider;
let dirName: string;
let fileUri: Uri;


suite("Gulp Tests", () =>
{

    suiteSetup(async function()
    {
        teApi = await activate(this);
        fsApi = teApi.testsApi.fs;
        provider = teApi.providers.get(testsName) as GulpTaskProvider;
        dirName = getWsPath("tasks_test_");
        fileUri = Uri.file(path.join(dirName, "gulpfile.js"));
    });


    test("Document Position", async function()
    {
        provider.getDocumentPosition(undefined, undefined);
        provider.getDocumentPosition("test", undefined);
        provider.getDocumentPosition(undefined, "test");
    });


    test("Start", async function()
    {
        this.slow(testsControl.slowTimeForVerifyTaskCount);
        await verifyTaskCount(testsName, startTaskCount);
    });


    test("Disable", async function()
    {
        this.slow(testsControl.slowTimeForConfigEnableEvent + testsControl.slowTimeForVerifyTaskCount);
        await teApi.config.updateWs("enabledTasks.gulp", false);
        await teApi.waitForIdle(testsControl.waitTimeForConfigEnableEvent);
        await verifyTaskCount(testsName, 0);
    });


    test("Re-enable", async function()
    {
        this.slow(testsControl.slowTimeForConfigEnableEvent + testsControl.slowTimeForVerifyTaskCount);
        await teApi.config.updateWs("enabledTasks.gulp", true);
        await teApi.waitForIdle(testsControl.waitTimeForConfigEnableEvent);
        await verifyTaskCount(testsName, startTaskCount);
    });


    test("Create File", async function()
    {
        this.slow(testsControl.slowTimeForFsCreateEvent + testsControl.slowTimeForVerifyTaskCount);
        if (!(await fsApi.pathExists(dirName))) {
            await fsApi.createDir(dirName);
        }
        await fsApi.writeFile(
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
        await teApi.waitForIdle(testsControl.waitTimeForFsCreateEvent);
        await verifyTaskCount(testsName, startTaskCount + 2);
    });


    test("Add Task to file", async function()
    {
        this.slow(testsControl.slowTimeForFsModifyEvent + testsControl.slowTimeForVerifyTaskCount);
        await fsApi.writeFile(
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
        await teApi.waitForIdle(testsControl.waitTimeForFsModifyEvent);
        await verifyTaskCount(testsName, startTaskCount + 3);
    });


    test("Remove 2 Tasks from file", async function()
    {
        this.slow(testsControl.slowTimeForFsDeleteEvent + testsControl.slowTimeForVerifyTaskCount);
        await fsApi.writeFile(
            fileUri.fsPath,
            "var gulp = require('gulp');\n" +
            "gulp.task('hello3', (done) => {\n" +
            "    console.log('Hello3!');\n" +
            "    done();\n" +
            "});\n"
        );
        await teApi.waitForIdle(testsControl.waitTimeForFsModifyEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
    });


    test("Delete File", async function()
    {
        this.slow(testsControl.slowTimeForFsDeleteEvent + testsControl.slowTimeForVerifyTaskCount);
        await fsApi.deleteFile(fileUri.fsPath);
        await fsApi.deleteDir(dirName);
        await teApi.waitForIdle(testsControl.waitTimeForFsDeleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
    });


    test("Gulp Parser", async function()
    {
        // const rootWorkspace = (workspace.workspaceFolders as WorkspaceFolder[])[0],
        //       gulpFile = getWsPath("gulp\\gulpfile.js");
        //
        // Use Gulp
        //
        await teApi.config.updateWs("useGulp", true);

        // await teApi.explorer?.invalidateTasksCache(testsName);
        // await tasks.fetchTasks({ type: testsName });
        // gulpTasks = await provider.readUriTasks(Uri.file(buildXmlFile));
        // assert(gulpTasks.length === 2, "# of Gulp tasks should be 2");
        // gulpTasks = await provider.readUriTasks(Uri.file(buildXmlFile), rootWorkspace);
        // assert(gulpTasks.length === 2, "# of Gulp tasks should be 2");

        //
        // Reset
        //
        await teApi.config.updateWs("useGulp", false);
    });

});
