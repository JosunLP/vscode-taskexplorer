
import { join } from "path";
import { TaskExecution } from "vscode";
import * as utils from "../../utils/utils";
import { ITaskItem, ITeWrapper } from ":types";
import { writeAndWait } from "../../utils/utils";
import { startupFocus } from "../../utils/suiteUtils";
import { executeTeCommand2 } from "../../utils/commandUtils";

const testsName = "npm";
let teWrapper: ITeWrapper;
const tc = utils.testControl;
let startTaskCount = 5; // set in suiteSetup() as it will change depending on single or multi root ws
let packageJsonPath: string;
let packageJson2Dir: string;
let packageJson2Path: string;
let npmTaskItems: ITaskItem[];


suite("NPM Tests", () =>
{

    suiteSetup(async function()
    {
        if (utils.exitRollingCount(this, true)) return;
        ({ teWrapper } = await utils.activate());
        startTaskCount = !tc.isMultiRootWorkspace ? startTaskCount : startTaskCount + 15;
        packageJsonPath = utils.getWsPath("package.json");
        packageJson2Dir = utils.getWsPath("npm_test");
        packageJson2Path = join(packageJson2Dir, "package.json");
        utils.endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
        try { await teWrapper.fs.deleteDir(packageJson2Dir); } catch {}
        await utils.waitForTeIdle(tc.waitTime.fs.deleteEvent);
        utils.suiteFinished(this);
    });


    test("Focus Explorer View", async function()
	{
        await startupFocus(this);
        await utils.sleep(1);
        await utils.verifyTaskCount(testsName, startTaskCount, 2);
	});


    test("Create Nested Package File", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.createDir(packageJson2Dir);
        await utils.waitForTeIdle(tc.waitTime.fs.createFolderEvent * 2, 2000, 50);
        await writeAndWait(
            packageJson2Path,
            "{\r\n" +
            '    "name": "project1-subproject",\r\n' +
            '    "version": "0.0.1",\r\n' +
            '    "scripts":{\r\n' +
            '        "compile": "tsc -b"\r\n' +
            "    }\r\n" +
            "}\r\n"
        );
        await utils.verifyTaskCount(testsName, startTaskCount + 2, 2);
        utils.endRollingCount(this);
    });


    test("Delete Nested Package File Folder", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteFolderEvent + (tc.waitTime.fs.deleteEvent * 2) + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteDir(packageJson2Dir);
        await utils.waitForTeIdle(tc.waitTime.fs.deleteEvent * 2, 7000, 50, true);
        try {
            await utils.verifyTaskCount(testsName, startTaskCount);
        }
        catch (e)
        {   // since vscode npm task provider isnt good enough to readt to folder deletre
            // should e '1', since 'say_hello', 'build', and 'watch' scripts are defined
            // in tasks.json and will be workspace tasks.  The 'test' script should be the
            // only task displayed in the tree under 'npm', the 'install' task is ignored in the tree
            await utils.treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount - 4);
        }
        utils.endRollingCount(this);
    });


    test("Modify Package File - Inside Scripts Object", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.fs.modifyEvent * 2) + (tc.slowTime.tasks.count.verify * 2) + 50);
        await writeAndWait(
            packageJsonPath,
            "{\r\n" +
            '    "name": "project1",\r\n' +
            '    "version": "0.0.1",\r\n' +
            '    "scripts": {\r\n' +
            '        "build": "npx tsc -p ./"\r\n' +
            '        "say_hello": "cmd /c echo hello",\r\n' +
            '        "test": "node ./node_modules/vscode/bin/test",\r\n' +
            '        "test2": "node ./node_modules/vscode/bin/test",\r\n' +
            '        "watch": "tsc -watch -p ./",\r\n' +
            "    }\r\n" +
            "}\r\n"
        );
        await utils.verifyTaskCount(testsName, startTaskCount + 1, 2);
        await utils.sleep(25);
        await writeAndWait(
            packageJsonPath,
            "{\r\n" +
            '    "name": "project1",\r\n' +
            '    "version": "0.0.1",\r\n' +
            '    "scripts": {\r\n' +
            '        "build": "npx tsc -p ./"\r\n' +
            '        "say_hello": "cmd /c echo hello",\r\n' +
            '        "test": "node ./node_modules/vscode/bin/test",\r\n' +
            '        "watch": "tsc -watch -p ./",\r\n' +
            "    }\r\n" +
            "}\r\n"
        );
        await utils.verifyTaskCount(testsName, startTaskCount, 2);
        utils.endRollingCount(this);
    });


    test("Modify Package File - Outside Scripts Oject", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.modifyEvent + tc.slowTime.tasks.count.verify);
        await writeAndWait(
            packageJsonPath,
            "{\r\n" +
            '    "name": "project1",\r\n' +
            '    "version": "0.0.1",\r\n' +
            '    "author": "Scott Meesseman",\r\n' + // <- Add author
            '    "scripts": {\r\n' +
            '        "build": "npx tsc -p ./"\r\n' +
            '        "say_hello": "cmd /c echo hello",\r\n' +
            '        "test": "node ./node_modules/vscode/bin/test",\r\n' +
            '        "watch": "tsc -watch -p ./",\r\n' +
            "    }\r\n" +
            "}\r\n"
        );
        await utils.verifyTaskCount(testsName, startTaskCount, 2);
        utils.endRollingCount(this);
    });


    test("Modify Package File - Delete Scripts Oject", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.modifyEvent + tc.slowTime.tasks.count.verify);
        await writeAndWait(
            packageJsonPath,
            "{\r\n" +
            '    "name": "project1",\r\n' +
            '    "version": "0.0.1",\r\n' +
            '    "author": "Scott Meesseman",\r\n' +
            "}\r\n"
        );
        // - 2 /  + 3 because tasks.json still points to the build script (+ install task)
        await utils.verifyTaskCount(testsName, startTaskCount - 2, 2);
        utils.endRollingCount(this);
    });


    test("Modify Package File - Add Scripts Object", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.modifyEvent + tc.slowTime.tasks.count.verify);
        await writeAndWait(
            packageJsonPath,
            "{\r\n" +
            '    "name": "project1",\r\n' +
            '    "version": "0.0.1",\r\n' +
            '    "author": "Scott Meesseman",\r\n' +
            '    "scripts": {\r\n' +
            '        "build": "npx tsc -p ./"\r\n' +
            '        "say_hello": "cmd /c echo hello",\r\n' +
            '        "test": "node ./node_modules/vscode/bin/test",\r\n' +
            '        "watch": "tsc -watch -p ./",\r\n' +
            "    }\r\n" +
            "}\r\n"
        );
        await utils.verifyTaskCount(testsName, startTaskCount, 2);
        utils.endRollingCount(this);
    });



    test("Get Package Manager", function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.eventFast);
        utils.getPackageManager();
        utils.endRollingCount(this);
    });


    test("Document Position", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.findPosition + tc.slowTime.tasks.getTreeTasks + (tc.slowTime.tasks.findPositionDocOpen * (npmTaskItems.length - 1)) + (tc.slowTime.commands.fast * npmTaskItems.length));
        npmTaskItems = await utils.treeUtils.getTreeTasks(teWrapper, testsName, startTaskCount + 1);
        for (const taskItem of npmTaskItems) {
            await executeTeCommand2("open", [ taskItem ], tc.waitTime.commandFast);
        }
		await utils.closeEditors();
        utils.endRollingCount(this);
    });


    test("Install", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.npmInstallCommand);
        const exec = await executeTeCommand2<TaskExecution | undefined>(
            "runInstall", [ npmTaskItems[0].taskFile ], tc.waitTime.npmCommandMin, tc.waitTime.npmCommandMax
        );
        await utils.waitForTaskExecution(exec);
        utils.endRollingCount(this);
    });


    test("Update", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.npmCommand);
        const exec = await executeTeCommand2<TaskExecution | undefined>(
            "runUpdate", [ npmTaskItems[0].taskFile ], tc.waitTime.npmCommandMin, tc.waitTime.npmCommandMax
        );
        await utils.waitForTaskExecution(exec);
        utils.endRollingCount(this);
    });


    test("Update Specified Package", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.npmCommandPkg);
        utils.overrideNextShowInputBox("@spmeesseman/app-publisher", true);
        const exec = await executeTeCommand2<TaskExecution | undefined>(
            "runUpdatePackage", [ npmTaskItems[0].taskFile ], tc.waitTime.npmCommandMin, tc.waitTime.npmCommandMax
        );
        await utils.waitForTaskExecution(exec);
        utils.endRollingCount(this);
    });


    test("Audit", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.npmCommand);
        const exec = await executeTeCommand2<TaskExecution | undefined>(
            "runAudit", [ npmTaskItems[0].taskFile ], tc.waitTime.npmCommandMin, tc.waitTime.npmCommandMax
        );
        await utils.waitForTaskExecution(exec);
        utils.endRollingCount(this);
    });


    test("Audit Fix", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.npmCommand);
        const exec = await executeTeCommand2<TaskExecution | undefined>(
            "runAuditFix", [ npmTaskItems[0].taskFile ], tc.waitTime.npmCommandMin, tc.waitTime.npmCommandMax
        );
        await utils.waitForTaskExecution(exec);
        utils.endRollingCount(this);
    });


    test("Run Workspace Integrated Script", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.tasks.npmCommand);
        const tasks = await utils.treeUtils.getTreeTasks(teWrapper, "Workspace", 10);
        const task = tasks.find(t => t.label === "say_hello") as ITaskItem;
        const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ task ], tc.waitTime.runCommandMin) ;
        await utils.waitForTaskExecution(exec);
        utils.endRollingCount(this);
    });

});
