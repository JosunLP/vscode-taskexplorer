/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

//
// Documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Uri } from "vscode";
import { configuration } from "../../common/configuration";
import { activate, getWsPath, isReady, testsControl, verifyTaskCount } from "../helper";
import { TaskExplorerApi } from "@spmeesseman/vscode-taskexplorer-types";
import { ComposerTaskProvider } from "../../providers/composer";


const testsName = "composer";
const waitTimeForFsEvent = testsControl.waitTimeForFsEvent;

let teApi: TaskExplorerApi;
let pathToComposer: string;
let enableComposer: boolean;
let dirName: string;
let fileUri: Uri;


suite("Composer Tests", () =>
{

    suiteSetup(async function()
    {   //
        // Initialize
        //
        teApi = await activate(this);
        assert(isReady(testsName) === true, "    ✘ TeApi not ready");
        dirName = getWsPath("tasks_test_");
        fileUri = Uri.file(path.join(dirName, "composer.json"));
        //
        // Store / set initial settings
        //
        pathToComposer = configuration.get<string>("pathToPrograms.composer");
        enableComposer = configuration.get<boolean>("enabledTasks.composer");
        await configuration.updateWs("pathToPrograms.composer", "php\\composer.exe");
        await configuration.updateWs("enabledTasks.composer", true);
    });


    suiteTeardown(async function()
    {   //
        // Reset settings
        //
        await configuration.updateWs("pathToPrograms.composer", pathToComposer);
        await configuration.updateWs("enabledTasks.composer", enableComposer);
    });


    test("Document Position", async function()
    {
        const provider = teApi.providers.get(testsName) as ComposerTaskProvider;
        // provider.readTasks();
        provider.getDocumentPosition(undefined, undefined);
        provider.getDocumentPosition("test", undefined);
        provider.getDocumentPosition(undefined, "test");
    });


    test("Start", async function()
    {
        await verifyTaskCount(testsName, 2);
    });


    test("Disable", async function()
    {
        await configuration.updateWs("enabledTasks.composer", false);
        await teApi.waitForIdle(50);
        await verifyTaskCount(testsName, 0);
    });


    test("Re-enable", async function()
    {
        await configuration.updateWs("enabledTasks.composer", true);
        await teApi.waitForIdle(50);
        await verifyTaskCount(testsName, 2);
    });


    test("Create file", async function()
    {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { mode: 0o777 });
        }

        fs.writeFileSync(
            fileUri.fsPath,
            "{\n" +
            '  "scripts":\n' +
            "  {\n" +
            '    "test1": "run -r test",\n' +
            '    "test2": "open -p tmp.txt",\n' +
            '    "test3": "start -x 1 -y 2"\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "}\n"
        );

        await teApi.waitForIdle(waitTimeForFsEvent);
        await verifyTaskCount(testsName, 5);
    });


    test("Add task to file", async function()
    {
        fs.writeFileSync(
            fileUri.fsPath,
            "{\n" +
            '  "scripts":\n' +
            "  {\n" +
            '    "test1": "run -r test",\n' +
            '    "test2": "open -p tmp.txt",\n' +
            '    "test3": "start -x 1 -y 2",\n' +
            '    "test4": "start -x 2 -y 3"\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "}\n"
        );

        await teApi.waitForIdle(waitTimeForFsEvent);
        await verifyTaskCount(testsName, 6);
    });


    test("Remove task from file", async function()
    {
        fs.writeFileSync(
            fileUri.fsPath,
            "{\n" +
            '  "scripts":\n' +
            "  {\n" +
            '    "test1": "run -r test",\n' +
            '    "test2": "open -p tmp.txt"\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "}\n"
        );

        await teApi.waitForIdle(waitTimeForFsEvent);
        await verifyTaskCount(testsName, 4);
    });


    test("Invalid JSON", async function()
    {
        fs.writeFileSync(
            fileUri.fsPath,
            "{\n" +
            '  "scripts":\n' +
            "  {\n" +
            '    "test1": "run -r test",\n' +
            '    "test2" "open -p tmp.txt",,\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "\n"
        );

        await teApi.waitForIdle(waitTimeForFsEvent);
        await verifyTaskCount(testsName, 2);
    });



    test("Delete file", async function()
    {
        fs.unlinkSync(fileUri.fsPath);
        fs.rmdirSync(dirName, {
            recursive: true
        });

        await teApi.waitForIdle(waitTimeForFsEvent);
        await verifyTaskCount(testsName, 2);
    });

});
