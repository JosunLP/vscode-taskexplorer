/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

import * as path from "path";
import { Uri } from "vscode";
import { expect } from "chai";
import { PerlTaskProvider } from "../../providers/perl";
import { configuration } from "../../lib/utils/configuration";
import { IFilesystemApi, ITaskExplorerApi } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, executeSettingsUpdate, executeTeCommand, getWsPath, suiteFinished, testControl, treeUtils, verifyTaskCount } from "../helper";

const testsName = "perl";
const startTaskCount = 7;

let teApi: ITaskExplorerApi;
let fsApi: IFilesystemApi;
let provider: PerlTaskProvider;
let dirName: string;
let fileUri: Uri;
let successCount = 0;


suite("Perl Tests", () =>
{

    suiteSetup(async function()
    {
        teApi = await activate(this);
        fsApi = teApi.testsApi.fs;
        provider = teApi.providers.get(testsName) as PerlTaskProvider;
        dirName = getWsPath("tasks_test_");
        fileUri = Uri.file(path.join(dirName, "newscript.pl"));
        ++successCount;
    });

    suiteTeardown(async function()
    {
        suiteFinished(this);
    });


    test("Build Tree (View Collapsed)", async function()
    {
        expect(successCount).to.be.equal(1, "rolling success count failure");
        await treeUtils.refresh(this);
        ++successCount;
    });



    test("Document Position", async function()
    {
        expect(successCount).to.be.equal(2, "rolling success count failure");
        // provider.getDocumentPosition(undefined, undefined);
        // provider.getDocumentPosition("test", undefined);
        // provider.getDocumentPosition(undefined, "test");
        ++successCount;
    });


    test("Start", async function()
    {
        expect(successCount).to.be.equal(3, "rolling success count failure");
        this.slow(testControl.slowTime.verifyTaskCount + testControl.waitTime.min);
        // await verifyTaskCount(testsName, startTaskCount);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });


    test("Disable", async function()
    {
        expect(successCount).to.be.equal(4, "rolling success count failure");
        this.slow(testControl.slowTime.configEnableEvent + testControl.slowTime.verifyTaskCount + testControl.waitTime.configEnableEvent + testControl.waitTime.min);
        // await teApi.config.updateWs("enabledTasks.perl", false);
        // await teApi.waitForIdle(testControl.waitTime.configEnableEvent);
        // await verifyTaskCount(testsName, 0);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });


    test("Re-enable", async function()
    {
        expect(successCount).to.be.equal(5, "rolling success count failure");
        this.slow(testControl.slowTime.configEnableEvent + testControl.slowTime.verifyTaskCount + testControl.waitTime.configEnableEvent + testControl.waitTime.min);
        // await teApi.config.updateWs("enabledTasks.perl", true);
        // await teApi.waitForIdle(testControl.waitTime.configEnableEvent);
        // await verifyTaskCount(testsName, startTaskCount);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });


    test("Create File", async function()
    {
        expect(successCount).to.be.equal(6, "rolling success count failure");
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.verifyTaskCount + testControl.waitTime.fsCreateEvent + testControl.waitTime.min);
        // if (!(await fsApi.pathExists(dirName))) {
        //     await fsApi.createDir(dirName);
        // }
        // await fsApi.writeFile(
        //     fileUri.fsPath,
        //     "module.exports = function(perl) {\n" +
        //     '    perl.registerTask(\n"default2", ["jshint:myproject"]);\n' +
        //     '    perl.registerTask("upload2", ["s3"]);\n' +
        //     "};\n"
        // );
        // await teApi.waitForIdle(testControl.waitTime.fsCreateEvent);
        // await verifyTaskCount(testsName, startTaskCount + 2);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });


    test("Add 4 Tasks to File", async function()
    {
        expect(successCount).to.be.equal(7, "rolling success count failure");
        this.slow(testControl.slowTime.fsModifyEvent + testControl.slowTime.verifyTaskCount + testControl.waitTime.fsModifyEvent + testControl.waitTime.min);
        // await fsApi.writeFile(
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
        // await teApi.waitForIdle(testControl.waitTime.fsModifyEvent);
        // await verifyTaskCount(testsName, startTaskCount + 6);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });


    test("Remove 2 Tasks from File", async function()
    {
        expect(successCount).to.be.equal(8, "rolling success count failure");
        this.slow(testControl.slowTime.fsDeleteEvent + testControl.slowTime.verifyTaskCount + testControl.waitTime.fsModifyEvent + testControl.waitTime.min);
        // await fsApi.writeFile(
        //     fileUri.fsPath,
        //     "module.exports = function(perl) {\n" +
        //     '    perl.registerTask(\n"default2", ["jshint:myproject"]);\n' +
        //     '    perl.registerTask("upload2", ["s3"]);\n' +
        //     '    perl.registerTask("upload5", ["s5"]);\n' +
        //     '    perl.registerTask("upload6", ["s7"]);\n' +
        //     "};\n"
        // );
        // await teApi.waitForIdle(testControl.waitTime.fsModifyEvent);
        // await verifyTaskCount(testsName, startTaskCount + 4);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });


    test("Delete File", async function()
    {
        expect(successCount).to.be.equal(9, "rolling success count failure");
        this.slow(testControl.slowTime.fsDeleteEvent + testControl.slowTime.verifyTaskCount + testControl.waitTime.fsDeleteEvent + testControl.waitTime.min);
        // await fsApi.deleteFile(fileUri.fsPath);
        // await fsApi.deleteDir(dirName);
        // await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent);
        // await verifyTaskCount(testsName, startTaskCount);
        // await teApi.waitForIdle(testControl.waitTime.min);
        ++successCount;
    });

});