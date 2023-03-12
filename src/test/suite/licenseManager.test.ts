/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { join } from "path";
import { expect } from "chai";
import { env, Task } from "vscode";
import * as utils from "../utils/utils";
import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand } from "../utils/commandUtils";
import { ITeAccount, ITeLicenseManager, ITeWrapper, TeLicenseType } from "@spmeesseman/vscode-taskexplorer-types";

let licMgr: ITeLicenseManager;
let teWrapper: ITeWrapper;
let oAccount: ITeAccount;
let licMgrMaxFreeTasks: number;
let licMgrMaxFreeTaskFiles: number;
let licMgrMaxFreeTasksForTaskType: number;
let licMgrMaxFreeTasksForScriptType: number;

const tc = utils.testControl;
const restoreAccount = () => { if (oAccount) teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(oAccount)); };
const setNag = (v?: number) => teWrapper.storage.update(teWrapper.keys.Storage.LastLicenseNag, v);
const setTasks = (e: any) => { licMgr.setTestData({ callTasksChanged: e }); };


suite("License Manager Tests", () =>
{

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
		licMgr = teWrapper.licenseManager;
		expect(licMgr.isLicensed).to.be.equal(true);
		expect(licMgr.isTrial).to.be.equal(true);
		oAccount = { ...licMgr.account };
		licMgrMaxFreeTasks = licMgr.getMaxNumberOfTasks();
		licMgrMaxFreeTaskFiles = licMgr.getMaxNumberOfTaskFiles();
		licMgrMaxFreeTasksForTaskType = licMgr.getMaxNumberOfTasks("npm");
		licMgrMaxFreeTasksForScriptType = licMgr.getMaxNumberOfTasks("batch");
        utils.endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
		await utils.closeEditors();
		await restoreAccount();
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


	test("Focus Explorer View", async function() { await startupFocus(this); });


	test("Get Maximum # of Tasks", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(licMgrMaxFreeTasks);
		await utils.setLicenseType(oAccount.license.type); // reset
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of NPM Tasks", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForTaskType);
		await utils.setLicenseType(oAccount.license.type); // reset
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Ant Tasks", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.getMaxNumberOfTasks("ant")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForTaskType);
		await utils.setLicenseType(oAccount.license.type); // reset
		expect(licMgr.getMaxNumberOfTasks("ant")).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Bash Tasks (Scripts)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.getMaxNumberOfTasks("bash")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForScriptType);
		await utils.setLicenseType(oAccount.license.type); // reset
		expect(licMgr.getMaxNumberOfTasks("bash")).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Python Tasks (Scripts)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForScriptType);
		await utils.setLicenseType(oAccount.license.type); // reset
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Task Files", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getMaxTasks + (tc.slowTime.licenseMgr.setLicenseCmd * 2));
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(licMgrMaxFreeTaskFiles);
		await utils.setLicenseType(oAccount.license.type); // reset
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Validate on Session Expired", async function()
	{   //
		// In LICENSED MODE - Running on fresh trial license at this point.
		// Simulate a session expiration and token refresh
		//
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense + 300);
		expect(licMgr.isLicensed).to.be.equal(true);
		expect(licMgr.isTrial).to.be.equal(true);
		try {
			licMgr.setTestData({ sessionInterval: 1 });
			await licMgr.checkLicense("");
		} catch {}
		finally {
			licMgr.setTestData({ sessionInterval: undefined });
		}
		expect(licMgr.isLicensed).to.be.equal(true);
		expect(licMgr.isTrial).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("Open License Info Page and View Parsing Report", async function()
	{   //
		// Run test in  UNLICENSED MODE - Set license type to TeLicenseType.Free
		//
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.pageWithDetail + 10);
		void teWrapper.licensePage.show();
        await utils.promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
		await teWrapper.licensePage.view?.webview.postMessage({ command: "showParsingReport" });
        await utils.promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
		await utils.sleep(5);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Request Trial Extension (From Webview)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.getTrialExtension +
				  tc.slowTime.storageSecretRead + tc.slowTime.closeEditors + 1100);
		void teWrapper.licensePage.show();
        await utils.promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
		await utils.sleep(5);
		const result = await teWrapper.licensePage.view?.webview.postMessage({ command: "extendTrial" });
		await utils.sleep(500);
		expect(result).to.be.equal(true);
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.getTrialExtension);
		await utils.closeEditors();
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("Set License Mode - UNLICENSED", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.isLicensed).to.be.equal(false);
		expect(licMgr.isTrial).to.be.equal(false);
        utils.endRollingCount(this);
	});



	test("License Page w/ No License Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page);
		void teWrapper.licensePage.show();
        await utils.promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Nag - Info", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		await setNag();
		utils.clearOverrideShowInfoBox();
		utils.overrideNextShowInfoBox("Info");
		await licMgr.checkLicense("");
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Nag - Not Now", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		await setNag();
		utils.clearOverrideShowInfoBox();
		utils.overrideNextShowInfoBox("Not Now");
		await licMgr.checkLicense("");
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Restore Trial Account", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await restoreAccount();
		expect(licMgr.isLicensed).to.be.equal(true);
		expect(licMgr.isTrial).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("Register (Not Implemented Yet)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		//
		// TODO - Register commad is not implemented yet, and may not be used
		//
		await executeTeCommand("register");
        utils.endRollingCount(this);
	});


	test("Request Trial Extension (From Command Palette)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.closeEditors + tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.storageSecretUpdate);
		await executeTeCommand<{ panel: any; newKey: any }>("extendTrial");
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.getTrialExtension);
		await utils.closeEditors();
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("Re-request a Trial Extension (Deny)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.standard + tc.slowTime.closeEditors + tc.slowTime.storageSecretUpdate);
		await executeTeCommand<{ panel: any; newKey: any }>("extendTrial");
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Set License Mode - UNLICENSED", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.isLicensed).to.be.equal(false);
		expect(licMgr.isTrial).to.be.equal(false);
        utils.endRollingCount(this);
	});


	test("Task Limit Reached (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((Math.round(tc.slowTime.commands.refresh * 0.75)) + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd);
		licMgr.setTestData({
			maxFreeTasks: 25,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		setTasks({ tasks: teWrapper.treeManager.getTasks() });
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
		setTasks({ tasks: teWrapper.treeManager.getTasks(), task: {source: "gulp" }});
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
		setTasks({ tasks: teWrapper.treeManager.getTasks(), task: {source: "batch" }});
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
		setTasks({ tasks: teWrapper.treeManager.getTasks(), task: {source: "grunt" }});
		utils.overrideNextShowInfoBox(undefined);
		await utils.treeUtils.refresh();
		await teWrapper.fs.copyDir(outsideWsDir, utils.getWsPath("."), undefined, true); // Cover fileCache.addFolder()
        await utils.waitForTeIdle(tc.waitTime.fs.createFolderEvent);
		await teWrapper.fs.deleteDir(join(utils.getWsPath("."), "testA"));
        await utils.waitForTeIdle(tc.waitTime.fs.deleteFolderEvent);
		await teWrapper.fs.deleteDir(outsideWsDir);
        utils.endRollingCount(this);
	});


	test("Reset Max Limits (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.refresh);
		await restoreAccount();
		licMgr.setTestData({
			maxFreeTasks: licMgrMaxFreeTasks,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		await utils.treeUtils.refresh();
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
