/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { join } from "path";
import { Uri } from "vscode";
import { ITeWrapper } from ":types";
import fsUtils from "../../utils/fsUtils";
import * as utils from "../../utils/utils";
import { testControl as tc } from "../../utils/utils";
import { startupFocus } from "../../utils/suiteUtils";
import { executeSettingsUpdate, executeTeCommand2 } from "../../utils/commandUtils";

const testsName = "tsc";
const startTaskCount = 0;
let teWrapper: ITeWrapper;
let rootPath: string;
let dirName: string;
let fileUri: Uri;
let fileUri2: Uri;
let fileUriBrowser: Uri;
let fileUriTest: Uri;


suite("Typescript Tests", () =>
{

    suiteSetup(async function()
    {
        if (utils.exitRollingCount(this, true)) return;
        ({ teWrapper } = await utils.activate());
        rootPath = utils.getWsPath(".");
        dirName = join(rootPath, "tasks_test_ts_");
        fileUri = Uri.file(join(rootPath, "tsconfig.json"));
        fileUriBrowser = Uri.file(join(rootPath, "tsconfig.web.json"));
        fileUriTest = Uri.file(join(rootPath, "tsconfig.test.json"));
        fileUri2 = Uri.file(join(dirName, "tsconfig.json"));
        await fsUtils.createDir(dirName);
        utils.endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
        await utils.closeEditors();
        try { await fsUtils.deleteFile(fileUri.fsPath); } catch {}
        try { await fsUtils.deleteFile(fileUriBrowser.fsPath); } catch {}
        try { await fsUtils.deleteFile(fileUriTest.fsPath); } catch {}
        try { await fsUtils.deleteDir(dirName); } catch {}
        utils.suiteFinished(this);
    });


    test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Start", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.count.verifyByTree);
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount);
        utils.endRollingCount(this);
    });


    test("Create File", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEventTsc + tc.slowTime.tasks.count.verifyByTree);
        await utils.writeAndWait(
            fileUri.fsPath,
            "{\n" +
            '  "compilerOptions":\n' +
            "  {\n" +
            '    "target": "es6",\n' +
            '    "lib": ["es2016"],\n' +
            '    "module": "commonjs",\n' +
            '    "outDir": "./out",\n' +
            '    "typeRoots": ["./node_modules/@types"],\n' +
            '    "strict": true,\n' +
            '    "experimentalDecorators": true,\n' +
            '    "sourceMap": true,\n' +
            '    "noImplicitThis": false\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "}\n"
        );
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 2);
        utils.endRollingCount(this);
    });


    test("Document Position", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.getTreeTasks + (tc.slowTime.tasks.findPosition * 2) + (tc.slowTime.general.closeEditors * 2));
        //
        // Typescript 'open' just opens the document, doesnt find the task position
        //
        const tscItems = await utils.treeUtils.getTreeTasks(teWrapper, "tsc", startTaskCount + 2);
        await executeTeCommand2("open", [ tscItems[0] ]);
        await utils.closeEditors();
        await executeTeCommand2("open", [ tscItems[1] ]);
        await utils.closeEditors();
        utils.endRollingCount(this);
    });


    test("Create File 2", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEventTsc + tc.slowTime.tasks.count.verifyByTree);
        await utils.writeAndWait(
            fileUri2.fsPath,
            "{\n" +
            '  "compilerOptions":\n' +
            "  {\n" +
            '    "target": "es6",\n' +
            '    "lib": ["es2016"],\n' +
            '    "module": "commonjs",\n' +
            '    "outDir": "./out",\n' +
            '    "typeRoots": ["./node_modules/@types"],\n' +
            '    "strict": true,\n' +
            '    "experimentalDecorators": true,\n' +
            '    "sourceMap": true,\n' +
            '    "noImplicitThis": false\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
        '  "exclude": ["node_modules","**/test/**","**/dom/**"]\n' +
            "}\n"
        );
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 4);
        utils.endRollingCount(this);
    });


    test("Multiple Build Specific Files", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.fs.createEventTsc * 2) + (tc.slowTime.fs.deleteEventTsc * 2) +
                  (tc.slowTime.tasks.count.verifyByTree * 2) + 50);
        await utils.writeAndWait(
            fileUriBrowser.fsPath,
            "{\n" +
            '  "compilerOptions":\n' +
            "  {\n" +
            '    "target": "es6",\n' +
            '    "lib": ["es2016"],\n' +
            '    "module": "commonjs",\n' +
            '    "outDir": "./out",\n' +
            '    "sourceMap": true,\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules","**/test/**","**/node/**"]\n' +
            "}\n"
        );
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 6);
        await utils.sleep(25);
        await utils.writeAndWait(
            fileUriTest.fsPath,
            "{\n" +
            '  "compilerOptions":\n' +
            "  {\n" +
            '    "target": "es6",\n' +
            '    "lib": ["es2016"],\n' +
            '    "module": "commonjs",\n' +
            '    "outDir": "./out",\n' +
            '    "sourceMap": true,\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules","**/dom/**"]\n' +
            "}\n"
        );
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 8);
        await fsUtils.deleteFile(fileUriBrowser.fsPath);
        await utils.waitForTeIdle2(1);
        await fsUtils.deleteFile(fileUriTest.fsPath);
        await utils.waitForTeIdle2(1);
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 4);
        utils.endRollingCount(this);
    });


    test("Disable", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate(`enabledTasks.${testsName}`, false, tc.waitTime.config.enableEvent);
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, 0);
        utils.endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate(`enabledTasks.${testsName}`, true, tc.waitTime.config.enableEvent);
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 4);
        utils.endRollingCount(this);
    });


    test("Invalid JSON", async function()
    {
        if (utils.exitRollingCount(this)) return;
        //
        // Note: FileWatcher ignores mod event for this task type since # of tasks never changes
        //
        this.slow(tc.slowTime.fs.modifyEventNoWatch + tc.slowTime.tasks.count.verifyByTree);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "{\n" +
            '    "compilerOptions":\n' +
            "  {\n" +
            '    "target": "es6",\n' +
            '    "lib": ["es2016"],\n' +
            '    "module": "commonjs",\n' +
            '    "outDir": "./out",\n' +
            '    "typeRoots": ["./node_modules/@types"],\n' +
            '    "strict": true,\n' +
            '    "experimentalDecorators": true,\n' +
            '    "sourceMap": true,\n' +
            '    "noImplicitThis": false\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "\n"
        );
        await utils.waitForTeIdle2(1);
        //
        // See fileWatcher.ts, we ignore modify event because the task count will never change
        // for this task type. So if there is invalid json after a save, the tasks will remain,
        // but are actually invalid.  TSC engine will report the old task count as well, so it
        // doesn't event matter if we had the file modify event watcher on or not.
        //
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 4);
        utils.endRollingCount(this);
    });


    test("Fix Invalid JSON", async function()
    {
        if (utils.exitRollingCount(this)) return;
        //
        // Note: FileWatcher ignores mod event for this task type since # of tasks never changes
        //
        this.slow(tc.slowTime.fs.modifyEventNoWatch + tc.slowTime.tasks.count.verifyByTree);
        await teWrapper.fs.writeFile(
            fileUri.fsPath,
            "{\n" +
            '    "compilerOptions":\n' +
            "  {\n" +
            '    "target": "es6",\n' +
            '    "lib": ["es2016"],\n' +
            '    "module": "commonjs",\n' +
            '    "outDir": "./out",\n' +
            '    "typeRoots": ["./node_modules/@types"],\n' +
            '    "strict": true,\n' +
            '    "experimentalDecorators": true,\n' +
            '    "sourceMap": true,\n' +
            '    "noImplicitThis": false\n' +
            "  },\n" +
            '  "include": ["**/*"],\n' +
            '  "exclude": ["node_modules"]\n' +
            "}\n"
        );
        await utils.waitForTeIdle2(1);
        //
        // See fileWatcher.ts, we ignore modify event because the task count will never change
        // for this task type. So if there is invalid json after a save, the tasks will remain,
        // but are actually invalid.  TSC engine will report the old task count as well, so it
        // doesn't event matter if we had the file modify event watcher on or not.
        //
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 4);
        utils.endRollingCount(this);
    });


    test("Delete File 1", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEventTsc + tc.slowTime.tasks.count.verifyByTree);
        await fsUtils.deleteFile(fileUri.fsPath, tc.waitTime.fs.deleteEventTsc);
        await utils.waitForTeIdle2(tc.waitTime.fs.deleteEventTsc);
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount + 2);
        utils.endRollingCount(this);
    });


    test("Delete File 2", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEventTsc + tc.slowTime.tasks.count.verifyByTree);
        await fsUtils.deleteFile(fileUri2.fsPath, tc.waitTime.fs.deleteEventTsc);
        await utils.waitForTeIdle2(tc.waitTime.fs.deleteEventTsc);
        await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount);
        utils.endRollingCount(this);
    });

});
