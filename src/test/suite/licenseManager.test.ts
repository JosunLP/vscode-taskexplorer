/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { join } from "path";
import { expect } from "chai";
import * as utils from "../utils/utils";
import { Task, WebviewPanel } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand } from "../utils/commandUtils";
import { ITeLicenseManager, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { StorageKeys } from "../../lib/constants";

const tc = utils.testControl;
const licMgrMaxFreeTasks = 500;             // Should be set to what the constants are in lib/licenseManager
const licMgrMaxFreeTaskFiles = 100;         // Should be set to what the constants are in lib/licenseManager
const licMgrMaxFreeTasksForTaskType = 100;  // Should be set to what the constants are in lib/licenseManager
const licMgrMaxFreeTasksForScriptType = 50; // Should be set to what the constants are in lib/licenseManager

let licMgr: ITeLicenseManager;
let teWrapper: ITeWrapper;


suite("License Manager Tests", () =>
{
	let oLicenseKey: string | undefined;

	suiteSetup(async function()
	{
        if (utils.exitRollingCount(this, true)) return;
		//
		// The LetsEncrypt certificate is rejected by VSCode/Electron Test Suite (?).
		// See https://github.com/electron/electron/issues/31212.
		// TLS cert validation will be disabled in utils.activate()
		// Works fine when debugging, works fine when the extension is installed, just fails in the
		// tests with the "certificate is expired" error as explained in the link above.  For tests,
		// and until this is resolved in vscode/test-electron (I think that's wherethe problem is?),
		// we just disable TLS_REJECT_UNAUTHORIZED in the NodeJS environment.
		//
        ({ teWrapper } = await utils.activate(this));
		oLicenseKey = await teWrapper.storage.getSecret("taskexplorer.licenseKey");
		await teWrapper.storage.updateSecret("taskexplorer.licenseKey30Day", undefined);
		licMgr = teWrapper.licenseManager;
		licMgr.setTestData({
			logRequestSteps: tc.log.licServerReqSteps,
			maxFreeTasks: licMgrMaxFreeTasks,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
        utils.endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
		teWrapper.tests = true;
		await utils.closeEditors();
		await teWrapper.storage.updateSecret("taskexplorer.licenseKey30Day", undefined);
		if (oLicenseKey) {
			await teWrapper.storage.updateSecret("taskexplorer.licenseKey", oLicenseKey);
		}
		licMgr?.setTestData({
			maxFreeTasks: licMgrMaxFreeTasks,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
        utils.suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Get Maximum # of Tasks", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicensed(true);
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(Infinity);
		await utils.setLicensed(false);
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(licMgrMaxFreeTasks);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of NPM Tasks", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicensed(true);
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(Infinity);
		await utils.setLicensed(false);
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForTaskType);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Ant Tasks", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicensed(true);
		expect(licMgr.getMaxNumberOfTasks("ant")).to.be.a("number").that.is.equal(Infinity);
		await utils.setLicensed(false);
		expect(licMgr.getMaxNumberOfTasks("ant")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForTaskType);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Bash Tasks (Scripts)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicensed(true);
		expect(licMgr.getMaxNumberOfTasks("bash")).to.be.a("number").that.is.equal(Infinity);
		await utils.setLicensed(false);
		expect(licMgr.getMaxNumberOfTasks("bash")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForScriptType);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Python Tasks (Scripts)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicensed(true);
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(Infinity);
		await utils.setLicensed(false);
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForScriptType);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Task Files", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicensed(true);
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(Infinity);
		await utils.setLicensed(false);
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(licMgrMaxFreeTaskFiles);
        utils.endRollingCount(this);
	});


	test("License Info Page - View Report (From Webview)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.pageWithDetail + 1100 + (tc.slowTime.storageUpdate * 2) + tc.slowTime.licenseMgr.setLicenseCmd);
		await utils.setLicensed(false);
		await teWrapper.licensePage.show();
        await utils.promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
		await utils.sleep(10);
		await teWrapper.licensePage.view?.webview.postMessage({ command: "extendTrial" });
		await setTasks();
		await utils.sleep(50);
		await teWrapper.licensePage.view?.webview.postMessage({ command: "showParsingReport" });
        await utils.promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
        utils.endRollingCount(this);
	});


	test("License Info Page - Enter License Key (From Webview)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + 1100 + tc.slowTime.storageUpdate);
		utils.overrideNextShowInputBox("1234-5678-9098-0000000");
		await teWrapper.licensePage.view?.webview.postMessage({ command: "enterLicense" });
		await utils.sleep(500);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Has License", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense + tc.slowTime.licenseMgr.page + (tc.slowTime.licenseMgr.setLicenseCmd * 2) + 500);
		teWrapper.tests = false;
		await utils.setLicensed(true);
		teWrapper.tests = true;
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Prompt (Enter Valid Key)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.enterKey + tc.slowTime.storageUpdate + 500);
		await teWrapper.storage.update(StorageKeys.LastLicenseNag, undefined);
		await utils.setLicensed(false);
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1234-5678-9098-7654321");
		utils.overrideNextShowInfoBox(undefined);
		await setTasks();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Prompt (Enter Invalid Key)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.enterKey + tc.slowTime.storageUpdate + 500);
		await teWrapper.storage.update(StorageKeys.LastLicenseNag, Date.now() - (1000 * 60 * 60 * 24) + 45);
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1111-2222-3333-4444-5555");
		utils.overrideNextShowInfoBox(undefined);
		await setTasks();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Prompt (Enter Invalid Key Length)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.enterKey + tc.slowTime.storageUpdate + 500);
		await teWrapper.storage.delete(StorageKeys.LastLicenseNag);
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1234");
		utils.overrideNextShowInfoBox(undefined);
		await setTasks();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Page w/ No License Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.checkLicense + 500);
		await utils.setLicensed(false);
		await teWrapper.licensePage.show();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Page w/ Set License Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.setLicenseCmd + tc.slowTime.licenseMgr.checkLicense + 500);
		await utils.setLicensed(true);
		await teWrapper.licensePage.show();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Deserialize License Page", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.viewReport + 30);
		let panel = utils.createwebviewForRevive("Task Explorer Licensing", "licensePage");
	    await teWrapper.licensePage.serializer?.deserializeWebviewPanel(panel, null);
		await utils.sleep(5);
		(teWrapper.licensePage.view as WebviewPanel)?.dispose();
		panel = utils.createwebviewForRevive("Task Explorer Licensing", "licensePage");
		await utils.sleep(5);
	    await teWrapper.licensePage.serializer?.deserializeWebviewPanel(panel, null);
		await utils.sleep(5);
		panel.dispose();
		await utils.closeEditors();
        utils.endRollingCount(this);
	});



	test("License Info", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		await teWrapper.storage.update(StorageKeys.LastLicenseNag, undefined);
		await utils.setLicensed(false);
		utils.overrideNextShowInfoBox("Info");
		await setTasks();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Not Now", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		await utils.setLicensed(false);
		utils.overrideNextShowInfoBox("Not Now");
		await setTasks();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});



	test("License Cancel", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		await teWrapper.storage.update(StorageKeys.LastLicenseNag, undefined);
		await utils.setLicensed(false);
		utils.overrideNextShowInfoBox(undefined);
		await setTasks();
		await utils.sleep(250);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Enter License Key on Startup", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((tc.slowTime.licenseMgr.enterKey * 2) + 1000);
		await teWrapper.storage.delete(StorageKeys.LastLicenseNag);
		await utils.setLicensed(false);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1111-2222-3333-4444-5555");
		await executeTeCommand("enterLicense");
		await utils.sleep(250);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("");
		await executeTeCommand("enterLicense");
		await utils.sleep(250);
        utils.endRollingCount(this);
	});


	test("Enter License Key by Command Palette", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.enterKey * 3);
		await teWrapper.storage.delete(StorageKeys.LastLicenseNag);
		await utils.setLicensed(false);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1234-5678-9098-7654321");
		await executeTeCommand("enterLicense", tc.waitTime.command * 2);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("");
		await executeTeCommand("enterLicense", tc.waitTime.command * 2, 1100, "   ");
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("");
		await executeTeCommand("enterLicense", tc.waitTime.command * 2, 1100, "   ", 1);
        utils.endRollingCount(this);
	});


	test("Enter License Key on Startup (1st Time)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.checkLicense + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd);
		await utils.setLicensed();
		await setTasks();
        utils.endRollingCount(this);
	});


	test("Enter License Key on Startup (> 1st Time)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd);
		await utils.setLicensed(true);
		await setTasks();
        utils.endRollingCount(this);
	});


	test("Invalid License Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense +  tc.slowTime.licenseMgr.setLicenseCmd);
		await utils.setLicensed(false);
		await setTasks();
        utils.endRollingCount(this);
	});


	test("Request 30-Day License (From Webview)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.get30DayLicense +
				  tc.slowTime.storageSecretRead + tc.slowTime.closeEditors + 1100);
		await teWrapper.licensePage.show();
		await utils.sleep(50);
		const result = await teWrapper.licensePage.view?.webview.postMessage({ command: "extendTrial" });
		await utils.sleep(500);
		expect(result).to.be.equal(true);
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.get30DayLicense);
		const newKey = await teWrapper.storage.getSecret("taskexplorer.licenseKey30Day");
		await utils.closeEditors();
		expect(newKey).to.be.a("string").with.length.that.is.greaterThan(20);
        utils.endRollingCount(this);
	});


	test("Request 30-Day License (From Command Palette)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.closeEditors + tc.slowTime.licenseMgr.get30DayLicense + tc.slowTime.storageSecretUpdate);
		await teWrapper.storage.updateSecret("taskexplorer.licenseKey30Day", undefined);
		const result = await executeTeCommand<{ panel: any; newKey: any }>("extendTrial");
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.get30DayLicense);
		await utils.closeEditors();
		expect(result).to.be.an("object");
		expect(result.panel).to.not.be.undefined;
		expect(result.newKey).to.be.a("string").with.length.that.is.greaterThan(20);
        utils.endRollingCount(this);
	});


	test("Re-request a 30-Day License", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.standard + tc.slowTime.closeEditors + tc.slowTime.storageSecretUpdate);
		const result = await executeTeCommand<{ panel: any; newKey: any }>("extendTrial");
		await utils.closeEditors();
		await teWrapper.storage.updateSecret("taskexplorer.licenseKey30Day", undefined);
		expect(result).to.be.an("object");
		expect(result.panel).to.not.be.undefined;
		expect(result.newKey).to.be.undefined;
        utils.endRollingCount(this);
	});


	test("Task Limit Reached (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((Math.round(tc.slowTime.commands.refresh * 0.75)) + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd);
		await utils.setLicensed(false);
		licMgr.setTestData({
			maxFreeTasks: 25,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		utils.overrideNextShowInfoBox(undefined);
		await utils.treeUtils.refresh();
		expect(teWrapper.treeManager.getTasks().length).to.be.equal(25);
        utils.endRollingCount(this);
	});


	test("Task Type Limit Reached (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(Math.round(tc.slowTime.commands.refresh * 0.9));
		licMgr.setTestData({
			maxFreeTasks: licMgrMaxFreeTasks,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: 10,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		utils.overrideNextShowInfoBox(undefined);
		await utils.treeUtils.refresh();
		expect(teWrapper.treeManager.getTasks().filter((t: Task) => t.source === "gulp").length).to.be.equal(10);
        utils.endRollingCount(this);
	});


	test("Task Script Type Limit Reached (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(Math.round(tc.slowTime.commands.refresh * 0.9));
		licMgr.setTestData({
			maxFreeTasks: licMgrMaxFreeTasks,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: 1
		});
		utils.overrideNextShowInfoBox(undefined);
		await utils.treeUtils.refresh();
		expect(teWrapper.treeManager.getTasks().filter((t: Task) => t.source === "batch").length).to.be.equal(1);
        utils.endRollingCount(this);
	});


	test("Task File Limit Reached (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(Math.round(tc.slowTime.commands.refresh * 0.9) + tc.slowTime.fs.createFolderEvent);
		const outsideWsDir = utils.getProjectsPath("testA");
		await teWrapper.fs.createDir(outsideWsDir);
		await teWrapper.fs.writeFile(
            join(outsideWsDir, "Gruntfile.js"),
            "module.exports = function(grunt) {\n" +
            '    grunt.registerTask(\n"default13", ["jshint:myproject"]);\n' +
            '    grunt.registerTask("upload13", ["s3"]);\n' +
            "};\n"
        );
		licMgr.setTestData({
			maxFreeTasks: licMgrMaxFreeTasks,
			maxFreeTaskFiles: 5,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		utils.overrideNextShowInfoBox(undefined);
		await utils.treeUtils.refresh();
		await teWrapper.fs.copyDir(outsideWsDir, utils.getWsPath("."), undefined, true); // Cover fileCache.addFolder()
        await utils.waitForTeIdle(tc.waitTime.fs.createFolderEvent);
		await teWrapper.fs.deleteDir(join(utils.getWsPath("."), "testA"));
        await utils.waitForTeIdle(tc.waitTime.fs.deleteFolderEvent);
		await teWrapper.fs.deleteDir(outsideWsDir);
        utils.endRollingCount(this);
	});


	test("Enter Valid License Key After Max Task Count Reached", async function()
	{
        if (utils.exitRollingCount(this)) return;
        if (licMgr)
		{
			this.slow(tc.slowTime.commands.refresh);
			await teWrapper.storage.update(StorageKeys.LastLicenseNag, undefined);
			utils.overrideNextShowInfoBox("Enter License Key");
			utils.overrideNextShowInputBox("1234-5678-9098-7654321");
			utils.overrideNextShowInfoBox(undefined);
			await executeTeCommand("enterLicense");
		}
        utils.endRollingCount(this);
	});


	test("Reset Max Limits (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		if (licMgr)
		{
			this.slow(tc.slowTime.commands.refresh);
			await utils.setLicensed(true);
			licMgr.setTestData({
				maxFreeTasks: licMgrMaxFreeTasks,
				maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
				maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
				maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
			});
			await utils.treeUtils.refresh();
		}
        utils.endRollingCount(this);
	});


    test("Max Task Reached MessageBox", async function()
    {
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.enterKey);
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox(undefined);
		await licMgr.setMaxTasksReached(undefined, true);
		utils.overrideNextShowInfoBox("Info");
		await licMgr.setMaxTasksReached("npm", true);
		utils.overrideNextShowInfoBox("Not Now");
		await licMgr.setMaxTasksReached("ant", true);
		utils.overrideNextShowInfoBox(undefined);
		await licMgr.setMaxTasksReached("gulp", true);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox(undefined);
		await licMgr.setMaxTasksReached("grunt", true);
		utils.overrideNextShowInfoBox("Info");
		await licMgr.setMaxTasksReached("grunt", true);
		utils.overrideNextShowInfoBox("Info");
		await licMgr.setMaxTasksReached();
        utils.endRollingCount(this);
	});

});


async function setTasks()
{
	// let removed: Task | undefined;
	// if (++setTasksCallCount % 2 === 1) {
	// 	removed = tasks.pop();
	// }
	// await licMgr.setTasks(tasks);
	// if (removed) {
	// 	tasks.push(removed);
	// }
}
