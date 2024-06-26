
import { expect } from "chai";
import { startupBuildTree } from "../../utils/suiteUtils";
import { tasks, Uri, workspace, WorkspaceFolder } from "vscode";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import { ITaskExplorerApi, ITaskExplorerProvider, ITeWrapper } from ":types";
import {
    activate, getWsPath, testControl as tc, verifyTaskCount, logErrorsAreFine, suiteFinished,
    exitRollingCount, waitForTeIdle, overrideNextShowInfoBox, endRollingCount, testInvDocPositions
} from "../../utils/utils";

const testsName = "ant";
const startTaskCount = 3;
const slowTimeforAntRunTasks = (tc.slowTime.commands.fetchTasks * 2) + (tc.slowTime.config.event * 2) + tc.slowTime.tasks.antParser;

let teWrapper: ITeWrapper;
let teApi: ITaskExplorerApi;
let provider: ITaskExplorerProvider;
let rootWorkspace: WorkspaceFolder;
let buildXmlFile: string;
let buildXmlFileUri: Uri;
let buildFileXml: string;
let buildFileXmlRestored = false;


suite("Ant Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate());
        provider = teApi.providers[testsName];
        rootWorkspace = (workspace.workspaceFolders as WorkspaceFolder[])[0];
        buildXmlFile = getWsPath("build.xml");
        buildXmlFileUri = Uri.file(buildXmlFile);
        buildFileXml = await teWrapper.fs.readFileAsync(buildXmlFileUri.fsPath);
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        if (!buildFileXmlRestored) {
            await teWrapper.fs.writeFile(buildXmlFileUri.fsPath, buildFileXml);
        }
        await executeSettingsUpdate("useAnt", false);
        suiteFinished(this);
    });


    test("Build Tree", async function()
    {
        await startupBuildTree(teWrapper, this);
    });


    test("Start", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.count.verifyFirstCall);
        await verifyTaskCount("ant", startTaskCount);
        endRollingCount(this);
    });


    test("Document Position", async function()
    {
        if (exitRollingCount(this)) return;
        const xml = await teWrapper.fs.readFileAsync(buildXmlFileUri.fsPath);
        testInvDocPositions(provider);
        provider.getDocumentPosition("test_isnt_there", xml);
        let index = provider.getDocumentPosition("test-build", xml);
        expect(index).to.be.a("number").that.is.equal(104, `test-build2 task position should be 104 (actual ${index}`);
        index = provider.getDocumentPosition("test-build2", xml);
        expect(index).to.be.a("number").that.is.equal(275, `test-build2 task position should be 275 (actual ${index}`);
        endRollingCount(this);
    });


    test("Disable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks.ant", false);
        await verifyTaskCount("ant", 0);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks.ant", true);
        await verifyTaskCount("ant", startTaskCount);
        endRollingCount(this);
    });


    test("Enable Ansicon", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + (tc.slowTime.config.pathToProgramsEvent * 4));
        await executeSettingsUpdate("pathToPrograms.ansicon", "ansicon\\x64\\ansicon.exe");
        overrideNextShowInfoBox(undefined);
        await executeSettingsUpdate("enableAnsiconForAnt", true);
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await executeSettingsUpdate("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await executeSettingsUpdate("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64") + "\\");
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await executeSettingsUpdate("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        endRollingCount(this);
    });


    test("Disable Ansicon", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + (tc.slowTime.config.pathToProgramsEvent * 2));
        await executeSettingsUpdate("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"));
        await executeSettingsUpdate("enableAnsiconForAnt", false);
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await executeSettingsUpdate("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        endRollingCount(this);
    });


    test("Ansicon Path", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.pathToProgramsEvent * 2);
        await executeSettingsUpdate("pathToPrograms.ansicon", undefined);
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await executeSettingsUpdate("pathToPrograms.ansicon", getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"));
        endRollingCount(this);
    });


    test("Win32 Create Task", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.event * 2) + (tc.slowTime.commands.fast * 2));
        await executeSettingsUpdate("pathToPrograms.ant", getWsPath("..\\tools\\ant\\bin\\ant.bat"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        await executeSettingsUpdate("pathToPrograms.ant", getWsPath("..\\tools\\ant\\bin\\ant"));
        provider.createTask("test", "test", rootWorkspace, buildXmlFileUri, []);
        endRollingCount(this);
    });


    test("Ant Parser", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(slowTimeforAntRunTasks + tc.slowTime.config.pathToProgramsEvent);
        await executeSettingsUpdate("pathToPrograms.ant", getWsPath("..\\tools\\ant\\bin\\ant.bat"));
        await runCheck(startTaskCount, startTaskCount, false, false);
        endRollingCount(this);
    });


    test("Ant Parser No Default", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(slowTimeforAntRunTasks + tc.slowTime.fs.modifyEventAnt);
        await teWrapper.fs.writeFile(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir=".">\n' +
            '    <property name="testProp" value="test2" />\n' +
            "    <target name='test-build'></target>\n" +
            "</project>\n"
        );
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await runCheck(startTaskCount - 1, startTaskCount - 1, false, false);
        endRollingCount(this);
    });


    test("Ant Parser Invalid Target", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(slowTimeforAntRunTasks + tc.slowTime.fs.modifyEventAnt);
        await teWrapper.fs.writeFile(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir="." default="test2">\n' +
            "    <target name='test-build'></target>\n" +
            "    <target name='test-build2'></target>\n" +
            '    <target name="test4"></target>\n' +
            '    <target namee="test5"></target>\n' + // incorrectly spelled 'name' property
            "</project>\n"
        );
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await runCheck(startTaskCount + 1, startTaskCount - 2, true, false);
        endRollingCount(this);
    });


    test("Ant Parser No Target", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(slowTimeforAntRunTasks + tc.slowTime.fs.modifyEventAnt);
        await teWrapper.fs.writeFile(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            '<project basedir="." default="test2">\n' +
            '    <property name="testProp" value="test2" />\n' +
            "</project>\n"
        );
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await runCheck(startTaskCount - 2, startTaskCount - 2, false, false);
        endRollingCount(this);
    });


    test("Ant Parser No Project", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(slowTimeforAntRunTasks + tc.slowTime.fs.modifyEventAnt);
        await teWrapper.fs.writeFile(
            buildXmlFileUri.fsPath,
            '<?xml version="1.0"?>\n' +
            "<some_node>\n" +
            '    <property name="testProp" value="test2" />\n' +
            "</some_node>\n"
        );
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await runCheck(startTaskCount - 2, startTaskCount - 2, true, false);
        endRollingCount(this);
    });


    test("Ant Parser Invalid Xml", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(slowTimeforAntRunTasks + tc.slowTime.fs.modifyEventAnt);
        await teWrapper.fs.writeFile(
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
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await runCheck(startTaskCount - 2, startTaskCount - 2, true, true);
        endRollingCount(this);
    });


    test("Restore Build.xml File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.modifyEventAnt + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(buildXmlFileUri.fsPath, buildFileXml);
        buildFileXmlRestored = true;
        await waitForTeIdle(tc.waitTime.fs.modifyEvent);
        await verifyTaskCount("ant", startTaskCount);
        endRollingCount(this);
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
const runCheck = async (expectedCountNoAnt: number, expectedCountWithAnt: number, antWillFail: boolean, xml2jsWillFail: boolean) =>
{   //
    // Don't use Ant
    //
    await executeSettingsUpdate("useAnt", false, tc.waitTime.config.enableEvent);
    let antTasks = await tasks.fetchTasks({ type: "ant" });
    expect(antTasks.length).to.be.equal(expectedCountNoAnt, `Did not read ${expectedCountNoAnt} ant tasks(1)(actual ${antTasks ? antTasks.length : 0})`);
    logErrorsAreFine(xml2jsWillFail);
    //
    // Use Ant
    //
    await executeSettingsUpdate("useAnt", true, tc.waitTime.config.enableEvent);
    antTasks = await tasks.fetchTasks({ type: "ant" });
    expect(antTasks.length).to.be.equal(expectedCountWithAnt, `Did not read ${expectedCountWithAnt} ant tasks (3)(actual ${antTasks ? antTasks.length : 0})`);
    logErrorsAreFine(antWillFail);
};
