/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

import * as assert from "assert";
import * as fs from "fs";
import * as util from "../../common/utils";
import { tasks, Uri, workspace, WorkspaceFolder } from "vscode";
import { configuration } from "../../common/configuration";
import { activate, executeTeCommand, getWsPath, isReady, sleep, verifyTaskCount } from "../helper";
import { TaskExplorerApi } from "@spmeesseman/vscode-taskexplorer-types";
import { AntTaskProvider } from "../../providers/ant";
import { waitForCache } from "../../cache";


let teApi: TaskExplorerApi;
let provider: AntTaskProvider;
let rootWorkspace: WorkspaceFolder;
let buildXmlFile: string;
let buildXmlFileUri: Uri;
let buildFileXml: string;


suite("Ant Tests", () =>
{
    const testsName = "ant";


    suiteSetup(async function()
    {
        teApi = await activate(this);
        assert(isReady(testsName) === true, "    ✘ TeApi not ready");

        provider = teApi.providers.get(testsName) as AntTaskProvider;
        rootWorkspace = (workspace.workspaceFolders as WorkspaceFolder[])[0];
        buildXmlFile = getWsPath("build.xml");
        buildXmlFileUri = Uri.file(buildXmlFile);
        buildFileXml = util.readFileSync(buildXmlFileUri.fsPath);

        await configuration.updateWs("useAnt", false);
    });


    suiteTeardown(async function()
    {
        fs.writeFileSync(buildXmlFileUri.fsPath, buildFileXml);
    });


    test("Document Position", async function()
    {
        const xml = util.readFileSync(buildXmlFileUri.fsPath);
        provider.getDocumentPosition(undefined, undefined);
        provider.getDocumentPosition("test", undefined);
        provider.getDocumentPosition(undefined, "test");
        provider.getDocumentPosition("test_isnt_there", xml);
        const index = provider.getDocumentPosition("test-build2", xml);
        assert(index === 275, `test-build2 task position should be 275 (actual ${index}`);
    });


    test("Start", async function()
    {
        // await teApi.explorer?.invalidateTasksCache(testsName);
        await verifyTaskCount("ant", 3);
    });


    test("Disable", async function()
    {
        await configuration.updateWs("enabledTasks.ant", false);
        // await sleep(500);
        // await teApi.explorer?.invalidateTasksCache(testsName);
        await sleep(100);
        await teApi.explorer?.waitForRefreshComplete();
        await verifyTaskCount("ant", 0);
    });


    test("Re-enable", async function()
    {
        await configuration.updateWs("enabledTasks.ant", true);
        await sleep(100);
        await teApi.explorer?.waitForRefreshComplete();
        // await teApi.explorer?.invalidateTasksCache(testsName);
        await verifyTaskCount("ant", 3);
    });


    test("Non-existent file", async function()
    {
        await provider.readUriTasks(Uri.file(getWsPath("build2.xml")), "");
        await configuration.updateWs("useAnt", true);
        await provider.readUriTasks(Uri.file(getWsPath("build2.xml")), "");
        await configuration.updateWs("useAnt", false);
    });


    test("Set Up ansicon", async function()
    {
        //
        // Enable Ansicon
        //
        await configuration.updateWs("pathToPrograms.ansicon", "ansicon\\x64\\ansicon.exe");
        await configuration.updateWs("enableAnsiconForAnt", true);
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await configuration.updateWs("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await configuration.updateWs("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64") + "\\");
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await configuration.updateWs("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
    });


    test("Disable Ansicon", async function()
    {
        await configuration.updateWs("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"));
        await configuration.updateWs("enableAnsiconForAnt", false);
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await configuration.updateWs("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
    });


    test("DAnsicon Path", async function()
    {
        await configuration.updateWs("pathToPrograms.ansicon", undefined);
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
    });


    test("Win32 create task", async function()
    {
        await configuration.updateWs("pathToPrograms.ant", getWsPath("..\\tools\\ant\\bin\\ant.bat"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await configuration.updateWs("pathToPrograms.ant", getWsPath("..\\tools\\ant\\bin\\ant"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
    });


    test("Non-Win32 create task", async function()
    {
        // const platform = process.platform;
        // eslint-disable-next-line @typescript-eslint/dot-notation
        // provider.platform = "linux";
        // provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        // eslint-disable-next-line @typescript-eslint/dot-notation
        // delete provider.platform;
        // await tasks.fetchTasks({ type: testsName });
    });


    test("Ant parser", async function()
    {
        await configuration.updateWs("pathToPrograms.ant", getWsPath("..\\tools\\ant\\bin\\ant.bat"));
        await runCheck(3, 2, 3, 2);
    });


    test("Ant parser no default", async function()
    {
        fs.writeFileSync(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir=".">\n' +
            '    <property name="testProp" value="test2" />\n' +
            "    <target name='test-build'></target>\n" +
            "</project>\n"
        );
        await runCheck(2, 1, 2, 1);
    });


    test("Ant parser invalid target", async function()
    {
        fs.writeFileSync(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir="." default="test2">\n' +
            "    <target name='test-build'></target>\n" +
            "    <target name='test-build2'></target>\n" +
            '    <target name="test4"></target>\n' +
            '    <target namee="test5"></target>\n' + // incorrectly spelled 'name' property
            "</project>\n"
        );
        await runCheck(4, 3, 1, 0);
    });


    test("Ant parser no target", async function()
    {
        fs.writeFileSync(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir="." default="test2">\n' +
            '    <property name="testProp" value="test2" />\n' +
            "</project>\n"
        );
        await runCheck(1, 0, 1, 0);
    });


    test("Ant parser no project", async function()
    {
        fs.writeFileSync(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            "<some_node>\n" +
            '    <property name="testProp" value="test2" />\n' +
            "</some_node>\n"
        );
        await runCheck(1, 0, 1, 0);
    });


    test("Ant parser invalid xml", async function()
    {
        fs.writeFileSync(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir="." default="test2">\n' +
            '    <property name="testProp" value="test2" />\n' +
            "    <target name='test-build'></target>\n" +
            '    <target name="test-build2"></target>\n' +
            '    <target name="test4"></target>\n' +
            '    <target namee="test5"</target>\n' + // incorrect XML test5"</
            "</project>\n"
        );
        await runCheck(1, 0, 1, 0);
    });

});


/**
 * <x>2 shouldalways be 1 less than <x>2.  The single task in hello.xml is not in
 * the count for readUriTasks()
 *
 * @param noAnt1 # of tasks in fetchTasks() using xml2js parser
 * @param noAnt2 # of tasks in readUriTasks() using xml2js parser
 * @param withAnt1 # of tasks in fetchTasks() using ant parser
 * @param withAnt2 # of tasks in readUriTasks() using ant parser
 */
async function runCheck(noAnt1: number, noAnt2: number, withAnt1: number, withAnt2: number)
{
    await sleep(500);
    //
    // Don't use Ant
    //
    await configuration.updateWs("useAnt", false);
    let antTasks = await tasks.fetchTasks({ type: "ant" });
    assert(antTasks.length === noAnt1, `Did not read ${noAnt1} ant tasks(1)(actual ${antTasks ? antTasks.length : 0})`);
    antTasks = await provider.readUriTasks(buildXmlFileUri, "");
    assert(antTasks.length === noAnt2, `Did not read ${noAnt2} ant tasks (2)(actual ${antTasks ? antTasks.length : 0})`);
    //
    // Use Ant
    //
    await configuration.updateWs("useAnt", true);
    antTasks = await tasks.fetchTasks({ type: "ant" });
    assert(antTasks.length === withAnt1, `Did not read ${withAnt1} ant tasks (3)(actual ${antTasks ? antTasks.length : 0})`);
    antTasks = await provider.readUriTasks(buildXmlFileUri, "");
    assert(antTasks.length === withAnt2, `Did not read ${withAnt2} ant tasks (4)(actual ${antTasks ? antTasks.length : 0})`);
    //
    // Reset
    //
    await configuration.updateWs("useAnt", false);
}
