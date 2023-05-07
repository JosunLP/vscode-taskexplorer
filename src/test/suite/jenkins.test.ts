/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

import * as path from "path";
import { Uri } from "vscode";
import { expect } from "chai";
import { env } from "process";
import { startupFocus } from "../utils/suiteUtils";
import { executeSettingsUpdate } from "../utils/commandUtils";
import { ITaskExplorerApi, ITaskExplorerProvider, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { activate, endRollingCount, exitRollingCount, getWsPath, suiteFinished, testControl as tc,
    testInvDocPositions, verifyTaskCount, waitForTeIdle
} from "../utils/utils";

const testsName = "jenkins";
let startTaskCount = 0; // set in suiteSetup() as it will change depending on single or multi root ws

let teWrapper: ITeWrapper;
let teApi: ITaskExplorerApi;
let provider: ITaskExplorerProvider;
let fileUri: Uri;
let setEnvJenkinsToken = false;

suite("Jenkins Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate(this));
        startTaskCount = tc.isMultiRootWorkspace ? 1 : 0;
        provider = teApi.providers[testsName];
        fileUri = Uri.file(path.join(getWsPath("."), "Jenkinsfile"));
        if (!env.JENKINS_API_TOKEN) {
            env.JENKINS_API_TOKEN = "FAKE_TOKEN";
            setEnvJenkinsToken = true;
        }
        teWrapper.treeManager.configWatcher.enableConfigWatcher(false);
        await executeSettingsUpdate("pathToPrograms.jenkins", "https://jenkins.spmeesseman.com");
        teWrapper.treeManager.configWatcher.enableConfigWatcher(true);
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        if (setEnvJenkinsToken) {
            delete env.JENKINS_API_TOKEN;
        }
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        teWrapper.treeManager.configWatcher.enableConfigWatcher(false);
        await executeSettingsUpdate("pathToPrograms.jenkins", "");
        teWrapper.treeManager.configWatcher.enableConfigWatcher(true);
        suiteFinished(this);
    });


	test("Enable (Off by Default)", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent);
        await executeSettingsUpdate(`enabledTasks.${testsName}`, true, tc.waitTime.config.enableEvent);
        endRollingCount(this);
    });


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
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
        await executeSettingsUpdate(`enabledTasks.${testsName}`, false, tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, 0);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate(`enabledTasks.${testsName}`, true, tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(fileUri.fsPath,
`
pipeline {
    agent any
    stages {
      stage("Prepare") {
        steps {
            echo "Start pipeline..."
        }
      }
    }
}
`);
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
        endRollingCount(this);
    });


    test("Document Position", async function()
    {
        if (exitRollingCount(this)) return;
        testInvDocPositions(provider);
        const docText = await teWrapper.fs.readFileAsync(fileUri.fsPath);
        expect(provider.getDocumentPosition("stage", docText)).to.be.equal(0);
        endRollingCount(this);
    });


    test("Delete File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Re-create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(fileUri.fsPath,
`
pipeline {
    agent any
    stages {
      stage("Prepare") {
        steps {
            echo "Start pipeline..."
        }
      }
    }
}
`);
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
        endRollingCount(this);
});



    test("No Jenkins or Curl Path", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.pathToProgramsEvent * 4) + (tc.slowTime.tasks.count.verify * 4));
        try {
            await executeSettingsUpdate("pathToPrograms.curl", "", tc.waitTime.config.pathToProgramsEvent);
            await verifyTaskCount(testsName, 0);
        }
        catch (e) { throw e; }
        finally {
            await executeSettingsUpdate("pathToPrograms.curl", "curl", tc.waitTime.config.pathToProgramsEvent);
            await verifyTaskCount(testsName, startTaskCount + 1);
        }
        try {
            await executeSettingsUpdate("pathToPrograms.jenkins", "", tc.waitTime.config.pathToProgramsEvent);
            await verifyTaskCount(testsName, 0);
        }
        catch (e) { throw e; }
        finally {
            await executeSettingsUpdate("pathToPrograms.jenkins", "https://jenkins.spmeesseman.com", tc.waitTime.config.pathToProgramsEvent);
            await verifyTaskCount(testsName, startTaskCount + 1);
        }
        endRollingCount(this);
    });


    test("Delete File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Disable (Default is OFF)", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.disableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate(`enabledTasks.${testsName}`, false, tc.waitTime.config.disableEvent);
        await verifyTaskCount(testsName, 0);
        endRollingCount(this);
    });

});
