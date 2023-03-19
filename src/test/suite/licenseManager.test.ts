/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { join } from "path";
import { expect } from "chai";
import { Disposable, Task } from "vscode";
import * as utils from "../utils/utils";
import { startupFocus } from "../utils/suiteUtils";
import { ITeAccount, ITeLicenseManager, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import {
	closeTeWebviewPanel, echoWebviewCommand, executeSettingsUpdate, executeTeCommand, focusExplorerView, showTeWebview, showTeWebviewByEchoCmd
} from "../utils/commandUtils";

const tc = utils.testControl;

let licMgr: ITeLicenseManager;
let teWrapper: ITeWrapper;
let oAccount: ITeAccount;
let licMgrMaxFreeTasks: number;
let licMgrMaxFreeTaskFiles: number;
let licMgrMaxFreeTasksForTaskType: number;
let licMgrMaxFreeTasksForScriptType: number;
let disposable: Disposable | undefined;


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
		expect(licMgr).to.not.be.undefined;
		expect(licMgr.isLicensed).to.be.equal(true);
		expect(licMgr.isPaid).to.be.equal(false);
		expect(licMgr.isTrial).to.be.equal(true);
		expect(licMgr.isTrialExtended).to.be.equal(false);
		oAccount = JSON.parse(JSON.stringify(licMgr.account));
		await utils.setLicenseType(1);
		try {
			licMgrMaxFreeTasks = licMgr.getMaxNumberOfTasks();
			licMgrMaxFreeTaskFiles = licMgr.getMaxNumberOfTaskFiles();
			licMgrMaxFreeTasksForTaskType = licMgr.getMaxNumberOfTasks("npm");
			licMgrMaxFreeTasksForScriptType = licMgr.getMaxNumberOfTasks("batch");
		}
		catch (e) {throw e; }
		finally {
			await utils.setLicenseType(2);
		}
		utils.oneTimeEvent(licMgr.onReady)(() => {}); // cover onReady, random hit in waitForTeIdle
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


    test("Enable SideBar", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.config.registerExplorerEvent + tc.slowTime.commands.focusChangeViews);
        await executeSettingsUpdate("enableSideBar", true, tc.waitTime.config.registerExplorerEvent);
        utils.endRollingCount(this);
    });


	test("Get Maximum # of Tasks in Unlicensed Mode)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((tc.slowTime.licenseMgr.getMaxTasks * 4) + tc.slowTime.storage.secretUpdate);
		await utils.setLicenseType(1);
		expectLicense();
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(licMgrMaxFreeTasks);
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForTaskType);
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(licMgrMaxFreeTasksForScriptType);
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(licMgrMaxFreeTaskFiles);
        utils.endRollingCount(this);
	});


	test("Get Maximum # of Tasks in Trial / Licensed Mode", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((tc.slowTime.licenseMgr.getMaxTasks * 4) + tc.slowTime.storage.secretUpdate);
		await utils.setLicenseType(oAccount.license.type);
		expectLicense(true, false, true, false);
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(Infinity);
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(Infinity);
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(Infinity);
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Validate License in Trial Mode (Refresh Token Needed)", async function()
	{
		if (utils.exitRollingCount(this)) return;
        await validateLicense(this, true, true);
        utils.endRollingCount(this);
	});


	test("Validate License in Trial Mode (No Refresh Token Needed)", async function()
	{
		if (utils.exitRollingCount(this)) return;
        await validateLicense(this, true, true, 1);
        utils.endRollingCount(this);
	});


	test("Open SideBar Views in Trial Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.webview.show.view.taskCount + tc.slowTime.webview.show.view.taskUsage + tc.slowTime.commands.focusChangeViews);
		await showTeWebview(teWrapper.homeView);
		await showTeWebview(teWrapper.taskCountView);
		await showTeWebview(teWrapper.taskUsageView);
        utils.endRollingCount(this);
	});


	test("Open Explorer Tree View in Trial Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews);
		await focusExplorerView(teWrapper);
        utils.endRollingCount(this);
	});


	test("Open License Page in Trial Mode", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.license);
		await showTeWebview(teWrapper.licensePage);
        utils.endRollingCount(this);
	});


	test("View and Close Parsing Report from License Page", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.parsingReportFull + tc.slowTime.webview.closeSync);
		await showTeWebviewByEchoCmd("parsingReport", teWrapper.parsingReportPage, teWrapper.licensePage);
		await closeTeWebviewPanel(teWrapper.parsingReportPage);
        utils.endRollingCount(this);
	});


	test("Request Trial Extension from License Page", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.webview.show.page.license + tc.slowTime.general.closeEditors + 1000);
		await showTeWebview(teWrapper.licensePage, "force");
		await echoWebviewCommand("taskexplorer.extendTrial", teWrapper.licensePage, 500);
		expectLicense(true, false, true, true);
		await closeTeWebviewPanel(teWrapper.licensePage);
        utils.endRollingCount(this);
	});


	test("Open Home View in Trial Extended Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.commands.focusChangeViews);
		await showTeWebview(teWrapper.homeView);
        utils.endRollingCount(this);
	});


	test("License Nag - Purchase License", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.purchaseLicense + tc.slowTime.licenseMgr.nag);
		await setNag();
		utils.overrideNextShowInfoBox("Buy License", true);
		void licMgr.checkLicense("");
		//
		// 3/14/23 - For now, wait for two events, tests run 2 requests to simulate the payment, in succession
		//
		await utils.promiseFromEvent(teWrapper.server.onDidRequestComplete).promise;
		await utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise;
		expectLicense(true, true, false, false);
		await utils.sleep(10); // allow license/subscription events to propagate
        utils.endRollingCount(this);
	});


	test("Open Explorer Tree View in Licensed Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews);
		await focusExplorerView(teWrapper);
        utils.endRollingCount(this);
	});


	test("Open Home View in Licensed Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.view.home);
		await showTeWebview(teWrapper.homeView);
		utils.sleep(10);
        utils.endRollingCount(this);
	});


	test("Re-Open Explorer Tree View", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews);
		await focusExplorerView(teWrapper);
        utils.endRollingCount(this);
	});


	test("Set License Mode to Free / Unlicensed", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await restoreAccount();
		await utils.setLicenseType(1);
		await saveAccount({ ...licMgr.account});
		expectLicense();
        utils.endRollingCount(this);
	});


	test("Open License Page in Unlicensed Mode", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync);
        await showTeWebview(teWrapper.licensePage);
		await closeTeWebviewPanel(teWrapper.licensePage);
        utils.endRollingCount(this);
	});


	test("License Nag in Unlicensed Mode - Info", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync + tc.slowTime.storage.update + tc.slowTime.licenseMgr.nag);
		await setNag();
		utils.overrideNextShowInfoBox("Info", true);
		void licMgr.checkLicense("");
        await utils.promiseFromEvent(teWrapper.licensePage.onDidReceiveReady).promise;
		await closeTeWebviewPanel(teWrapper.licensePage);
        utils.endRollingCount(this);
	});


	test("License Nag in Unlicensed Mode - Not Now", async function()
	{
        if (utils.exitRollingCount(this)) return;
		await setNag();
		utils.overrideNextShowInfoBox("Not Now", true);
		await licMgr.checkLicense("");
        utils.endRollingCount(this);
	});


	test("Open SideBar Views in Unlicensed Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.webview.show.view.taskCount + tc.slowTime.webview.show.view.taskUsage + tc.slowTime.commands.focusChangeViews);
		await showTeWebview(teWrapper.homeView);
		await showTeWebview(teWrapper.taskCountView);
		await showTeWebview(teWrapper.taskUsageView);
		// await focusSidebarView();
		// await utils.sleep(10);
		// if (!teWrapper.homeView.visible) {
		// 	await executeTeCommand("taskexplorer.view.home.toggleVisibility", 5);
		// }
		// if (!teWrapper.taskCountView.visible) {
		// 	await executeTeCommand("taskexplorer.view.taskCount.toggleVisibility", 5);
		// }
		// if (!teWrapper.taskUsageView.visible) {
		// 	await executeTeCommand("taskexplorer.view.taskUsage.toggleVisibility", 5);
		// }
        utils.endRollingCount(this);
	});


	test("Restore Trial Account", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await restoreAccount();
		expectLicense(true, false, true, false);
        utils.endRollingCount(this);
	});


	test("License Nag in Trial Mode - Extend Trial", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.licenseMgr.nag);
		await setNag();
		utils.overrideNextShowInfoBox("Extend Trial", true);
		void licMgr.checkLicense("");
		await utils.promiseFromEvent(teWrapper.server.onDidRequestComplete).promise;
		await utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise;
		expectLicense(true, false, true, true);
        utils.endRollingCount(this);
	});


	test("Extend Trial in Extended Trial Mode (Command Pallette - Denied)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getTrialExtensionDenied);
		utils.overrideNextShowInfoBox(undefined, true);
		await executeTeCommand("extendTrial", tc.waitTime.licenseMgr.request);
		await utils.sleep(10);
		expectLicense(true, false, true, true);
        utils.endRollingCount(this);
	});


	test("License Nag in Extended Trial Mode", async function()
	{
        if (utils.exitRollingCount(this)) return;
		await setNag();
		utils.overrideNextShowInfoBox(undefined, true);
		await licMgr.checkLicense("");
        utils.endRollingCount(this);
	});


	test("Set License to First Time Startup", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.createNewTrial + tc.slowTime.storage.secretUpdate + tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync);
		utils.overrideNextShowInfoBox("More Info", true);
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "", state: 0, period: 0, type: 0 }});
		await saveAccount(licMgr.account);
        await validateLicense(undefined, true, true);
		await utils.sleep(5);
		await closeTeWebviewPanel(teWrapper.licensePage);
		expectLicense(true, false, true, false);
        utils.endRollingCount(this);
	});


	test("Set License Mode to Free / Unlicensed", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await utils.setLicenseType(1);
		expectLicense();
        utils.endRollingCount(this);
	});


	test("Task Limit Reached (Unlicensed Mode)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(Math.round(tc.slowTime.commands.refresh * 0.75));
		licMgr.setTestData({
			maxFreeTasks: 25,
			maxFreeTaskFiles: licMgrMaxFreeTaskFiles,
			maxFreeTasksForTaskType: licMgrMaxFreeTasksForTaskType,
			maxFreeTasksForScriptType: licMgrMaxFreeTasksForScriptType
		});
		setTasks({ tasks: teWrapper.treeManager.getTasks() });
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh();
		expect(teWrapper.treeManager.getTasks().length).to.be.equal(25);
        utils.endRollingCount(this);
	});


	test("Task Type Limit Reached (Unlicensed Mode)", async function()
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
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh();
		expect(teWrapper.treeManager.getTasks().filter((t: Task) => t.source === "gulp").length).to.be.equal(10);
        utils.endRollingCount(this);
	});


	test("Task Script Type Limit Reached (Unlicensed Mode)", async function()
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
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh();
		expect(teWrapper.treeManager.getTasks().filter((t: Task) => t.source === "batch").length).to.be.equal(1);
        utils.endRollingCount(this);
	});


	test("Task File Limit Reached (Unlicensed Mode)", async function()
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
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh();
		await teWrapper.fs.copyDir(outsideWsDir, utils.getWsPath("."), undefined, true); // Cover fileCache.addFolder()
        await utils.waitForTeIdle(tc.waitTime.fs.createFolderEvent);
		await teWrapper.fs.deleteDir(join(utils.getWsPath("."), "testA"));
        await utils.waitForTeIdle(tc.waitTime.fs.deleteFolderEvent);
		await teWrapper.fs.deleteDir(outsideWsDir);
        utils.endRollingCount(this);
	});


	test("Restore Trial Account", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await restoreAccount();
		expectLicense(true, false, true, false);
        utils.endRollingCount(this);
	});


	test("Validate License - Invalid Key", async function()
	{
		if (utils.exitRollingCount(this)) return;
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "some_invalid_key" }});
		await saveAccount(licMgr.account);
        await validateLicense(this, true, false);
        utils.endRollingCount(this);
	});


	test("Validate License - Invalid Account", async function()
	{
		if (utils.exitRollingCount(this)) return;
		Object.assign(licMgr.account, { ...oAccount, ...{ id: 0 }});
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "tests-no-matching-account-key" }});
		await saveAccount(licMgr.account);
        await validateLicense(this, true, false);
        utils.endRollingCount(this);
	});


	test("Validate License - Invalid Account Trial", async function()
	{
		if (utils.exitRollingCount(this)) return;
		Object.assign(licMgr.account, { ...oAccount, ...{ trialId: 0 }});
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "tests-no-matching-trial-key" }});
		await saveAccount(licMgr.account);
        await validateLicense(this, true, false);
        utils.endRollingCount(this);
	});


	test("Restore Trial Account and License Limits", async function()
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
		expectLicense(true, false, true, false);
		await utils.treeUtils.refresh();
        utils.endRollingCount(this);
	});

});


const expectLicense = (isLic?: boolean, isPaid?: boolean, isTrial?: boolean, isTrialExt?: boolean) =>
{
	expect(licMgr.isLicensed).to.be.equal(!!isLic);
	expect(licMgr.isPaid).to.be.equal(!!isPaid);
	expect(licMgr.isTrial).to.be.equal(!!isTrial);
	expect(licMgr.isTrialExtended).to.be.equal(!!isTrialExt);
};

const restoreAccount = async() => {
	if (oAccount) {
		Object.assign(licMgr.account, JSON.parse(JSON.stringify(oAccount)));
		await teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(oAccount));
	}
};

const saveAccount = (account: ITeAccount) => teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(account));

const setNag = (v?: number) => teWrapper.storage.update(teWrapper.keys.Storage.LastLicenseNag, v);

const setTasks = (e: any) => { licMgr.setTestData({ callTasksChanged: e }); };

const validateLicense = async (instance: Mocha.Context | undefined, expectNow: boolean, expectAfter: boolean, intervalHrs = 48, setPaid = false) =>
{
	instance?.slow(tc.slowTime.licenseMgr.validateLicense);
	expect(licMgr.isLicensed).to.be.equal(expectNow);
	expect(licMgr.isTrial).to.be.equal(expectNow);
	try {
		licMgr.setTestData({ sessionInterval: 1000 * 60 * 60 * intervalHrs, setPaid });
		await licMgr.checkLicense("");
		await utils.sleep(250);
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.request);
	} catch {}
	finally {
		licMgr.setTestData({ sessionInterval: undefined, setPaid: false });
	}
	expect(licMgr.isLicensed).to.be.equal(expectAfter);
	expect(licMgr.isTrial).to.be.equal(expectAfter);
};
