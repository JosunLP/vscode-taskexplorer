/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Task } from "vscode";
import { join } from "path";
import { expect } from "chai";
import * as utils from "../utils/utils";
import { startupFocus } from "../utils/suiteUtils";
import { ITeAccount, ITeLicenseManager, ITeWrapper } from ":types";
import {
	closeTeWebviewPanel, executeSettingsUpdate, executeTeCommand, focusExplorerView, focusSidebarView, showTeWebview,
} from "../utils/commandUtils";

const _LICENSE_SERVER_DISABLED_ = true;

const tc = utils.testControl;

let licMgr: ITeLicenseManager;
let teWrapper: ITeWrapper;
let oAccount: ITeAccount;
let oAccount2: ITeAccount;
let licMgrMaxFreeTasks: number;
let licMgrMaxFreeTaskFiles: number;
let licMgrMaxFreeTasksForTaskType: number;
let licMgrMaxFreeTasksForScriptType: number;


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
        ({ teWrapper } = await utils.activate());
		licMgr = teWrapper.licenseManager;
		if (!_LICENSE_SERVER_DISABLED_)
		{
			expect(licMgr).to.not.be.undefined;
			expect(licMgr.isLicensed).to.be.equal(true);
			expect(licMgr.isPaid).to.be.equal(false);
			expect(licMgr.isTrial).to.be.equal(true);
			expect(licMgr.isTrialExtended).to.be.equal(false);
		}
		oAccount = JSON.parse(JSON.stringify(licMgr.account));
		oAccount2 = JSON.parse(JSON.stringify(licMgr.account));
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
		await expectLicense();
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
		await expectLicense(true, false, true, false);
		expect(licMgr.getMaxNumberOfTasks()).to.be.a("number").that.is.equal(Infinity);
		expect(licMgr.getMaxNumberOfTasks("npm")).to.be.a("number").that.is.equal(Infinity);
		expect(licMgr.getMaxNumberOfTasks("python")).to.be.a("number").that.is.equal(Infinity);
		expect(licMgr.getMaxNumberOfTaskFiles()).to.be.a("number").that.is.equal(Infinity);
        utils.endRollingCount(this);
	});


	test("Validate License in Trial Mode (Refresh Token Needed)", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.validateLicense);
        await validateLicense(this, true, true);
        utils.endRollingCount(this);
	});


	test("Validate License in Trial Mode (No Refresh Token Needed)", async function()
	{
		if (utils.exitRollingCount(this)) return;
        await validateLicense(this, true, true);
        utils.endRollingCount(this);
	});


	test("Open SideBar Views in Trial Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.webview.show.view.taskCount +
				  tc.slowTime.webview.show.view.taskUsage + tc.slowTime.commands.focusChangeViews);
		void focusSidebarView();
        await Promise.all([
            utils.waitForWebviewReadyEvent(teWrapper.homeView, tc.slowTime.webview.show.view.home * 2),
            utils.waitForWebviewReadyEvent(teWrapper.taskCountView, tc.slowTime.webview.show.view.taskCount * 2),
            utils.waitForWebviewReadyEvent(teWrapper.taskUsageView, tc.slowTime.webview.show.view.taskUsage * 2),
        ]);
        utils.endRollingCount(this);
	});


	test("Open Explorer Tree View in Trial Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews);
		void focusExplorerView(teWrapper);
		utils.waitForEvent(teWrapper.treeManager.views.taskExplorer.tree.onDidLoadTreeData, tc.slowTime.commands.focusChangeViews * 2);
        utils.endRollingCount(this);
	});


	test("Register from License Page", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.submitRegistration + tc.slowTime.webview.show.page.license +
				  tc.slowTime.webview.roundTripMessage + tc.slowTime.webview.closeSync + 100);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			void executeTeCommand("taskexplorer.register", 1);
			await showTeWebview(teWrapper.licensePage, "waitOnly");
			await utils.sleep(10);
			const echoCmd = { method: "echo/account/register", overwriteable: false };
			void teWrapper.licensePage.postMessage(echoCmd, { firstName: "John", lastName: "Doe", email: "buyer@example.com", emailAlt: "" });
			await utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise;
			await expectLicense(true, false, true, false, true);
			await closeTeWebviewPanel(teWrapper.licensePage);
		}
        utils.endRollingCount(this);
	});


	test("License Nag in Trial Mode - Extend Trial", async function()
	{
		let timeout = false;
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.licenseMgr.nag);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			await setNag();
			utils.overrideNextShowInfoBox("Extend Trial", true);
			void licMgr.checkLicense("");
			await Promise.race([
				utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise,
				new Promise<void>(resolve => setTimeout(() => {timeout = true; resolve(); }, 6000))
			]);
			if (timeout) {
				try {
					await expectLicense(true, false, true, true, true);
				}
				catch {
					utils.overrideNextShowInfoBox("Extend Trial", true);
					void licMgr.checkLicense("");
					await Promise.race([
						utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise,
						new Promise<void>(resolve => setTimeout(resolve, 9000))
					]);
					await expectLicense(true, false, true, true, true);
				}
			}
			else {
				await expectLicense(true, false, true, true, true);
			}
		}
		utils.endRollingCount(this);
	});


	test("Open Home View in Trial Extended Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.view.home + tc.slowTime.commands.focusChangeViews);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			void  executeTeCommand("taskexplorer.view.home.focus", 1);
			await Promise.all([
				utils.waitForWebviewReadyEvent(teWrapper.homeView, tc.slowTime.webview.show.view.home * 2),
				utils.waitForWebviewReadyEvent(teWrapper.taskCountView, tc.slowTime.webview.show.view.taskCount * 2),
				utils.waitForWebviewReadyEvent(teWrapper.taskUsageView, tc.slowTime.webview.show.view.taskUsage * 2),
			]);
		}
        utils.endRollingCount(this);
	});


	test("License Nag in Extended Trial Mode", async function()
	{
        if (utils.exitRollingCount(this)) return;
		await setNag();
		utils.overrideNextShowInfoBox(undefined, true);
		await licMgr.checkLicense("");
		await utils.sleep(1);
        utils.endRollingCount(this);
	});


	test("Extend Trial in Extended Trial Mode (Command Pallette - Denied)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.getTrialExtensionDenied + 20);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			utils.overrideNextShowInfoBox(undefined, true);
			await executeTeCommand("extendTrial", tc.waitTime.licenseMgr.request);
			await utils.sleep(10);
			await expectLicense(true, false, true, true, true);
		}
        utils.endRollingCount(this);
	});


	test("License Nag - Purchase License", async function()
	{   //
		// Tests run 2 server requests to simulate a payment process, in succession
		//
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.purchaseLicense + tc.slowTime.licenseMgr.validateLicense +
				  tc.slowTime.licenseMgr.nag + tc.slowTime.webview.show.view.home + 200);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			await setNag();
			utils.overrideNextShowInfoBox("Buy License", true);
			void licMgr.checkLicense("");
			await utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise;
			// License change will refresh home view
			await utils.waitForWebviewReadyEvent(teWrapper.homeView, tc.slowTime.webview.show.view.home * 2);
			await expectLicense(true, true, false, false);
		}
        utils.endRollingCount(this);
	});


	test("Open Explorer Tree View in Licensed Mode", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.focusChangeViews + 200);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			void focusExplorerView(teWrapper);
			utils.waitForEvent(teWrapper.treeManager.views.taskExplorer.tree.onDidLoadTreeData, tc.slowTime.commands.focusChangeViews * 2);
		}
        utils.endRollingCount(this);
	});


	test("Open License Page in Licensed Mode", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync + 50);
        await showTeWebview(teWrapper.licensePage);
		await utils.sleep(25);
		await closeTeWebviewPanel(teWrapper.licensePage);
        utils.endRollingCount(this);
	});


	test("Set License to First Time Startup", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.createNewTrial + tc.slowTime.storage.secretUpdate + tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync + 100);
		utils.overrideNextShowInfoBox("More Info", true);
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "", state: 0, period: 0, type: 0 }});
		await saveAccount({ ...licMgr.account});
        await validateLicense(undefined, true, true);
		await expectLicense(true, false, true, false);
        utils.endRollingCount(this);
	});


	test("Set License Mode to Free / Unlicensed", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await restoreAccount();
		await utils.setLicenseType(1);
		await saveAccount({ ...licMgr.account});
		await utils.waitForWebviewsIdle();
		await expectLicense();
        utils.endRollingCount(this);
	});


	test("Open License Page in Unlicensed Mode and Copy Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync + tc.slowTime.webview.postMessage + 200);
        await showTeWebview(teWrapper.licensePage);
		await utils.waitForWebviewsIdle();
		utils.overrideNextShowInfoBox(undefined);
		if (!(await teWrapper.licensePage.postMessage({ method: "echo/message/show", overwriteable: false }, {}))) {
			await utils.sleep(50);
			void teWrapper.licensePage.postMessage({ method: "echo/message/show", overwriteable: false }, {});
		}
		await utils.promiseFromEvent<string, string>(teWrapper.licensePage.onDidReceiveMessage).promise;
        utils.endRollingCount(this);
	});


	test("License Nag in Unlicensed Mode - Info", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.license + tc.slowTime.webview.closeSync + tc.slowTime.storage.update + tc.slowTime.licenseMgr.nag);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			await setNag();
			utils.overrideNextShowInfoBox("Info", true);
			void licMgr.checkLicense("");
			await utils.promiseFromEvent(teWrapper.licensePage.onDidReceiveReady).promise;
		}
        utils.endRollingCount(this);
	});


	test("License Nag in Unlicensed Mode - Not Now", async function()
	{
        if (utils.exitRollingCount(this)) return;
		if (!_LICENSE_SERVER_DISABLED_)
		{
			await setNag();
			utils.overrideNextShowInfoBox("Not Now", true);
			await licMgr.checkLicense("");
		}
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
		setTasks({ tasks: teWrapper.treeManager.tasks });
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh(teWrapper);
		expect(teWrapper.treeManager.tasks.length).to.be.equal(25);
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
		setTasks({ tasks: teWrapper.treeManager.tasks, task: {source: "gulp" }});
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh(teWrapper);
		expect(teWrapper.treeManager.tasks.filter((t: Task) => t.source === "gulp").length).to.be.equal(10);
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
		setTasks({ tasks: teWrapper.treeManager.tasks, task: {source: "batch" }});
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh(teWrapper);
		expect(teWrapper.treeManager.tasks.filter((t: Task) => t.source === "batch").length).to.be.equal(1);
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
		setTasks({ tasks: teWrapper.treeManager.tasks, task: {source: "grunt" }});
		utils.overrideNextShowInfoBox(undefined, true);
		await utils.treeUtils.refresh(teWrapper);
		await teWrapper.fs.copyDir(outsideWsDir, utils.getWsPath("."), undefined, true); // Cover fileCache.addFolder()
        await utils.waitForTeIdle(tc.waitTime.fs.createFolderEvent);
		await teWrapper.fs.deleteDir(join(utils.getWsPath("."), "testA"));
        await utils.waitForTeIdle(tc.waitTime.fs.deleteFolderEvent);
		await teWrapper.fs.deleteDir(outsideWsDir);
        utils.endRollingCount(this);
	});


	test("Close License Page", async function()
	{
        if (utils.exitRollingCount(this)) return;
        await closeTeWebviewPanel(teWrapper.licensePage);
        utils.endRollingCount(this);
	});


	test("Restore Trial Account", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await restoreAccount();
		await expectLicense(true, false, true, false);
        utils.endRollingCount(this);
	});


	test("Validate License - Invalid Key", async function()
	{
		if (utils.exitRollingCount(this)) return;
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "some_invalid_key" }});
		Object.assign(licMgr.account.session, { ...oAccount.session, ...{ expires: Date.now() - (1000 * 60 * 60 * 4) - 1000 }});
		await saveAccount(licMgr.account);
        await validateLicense(this, true, false);
        utils.endRollingCount(this);
	});


	test("Validate License - Invalid Account", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.validateLicense + 100);
		Object.assign(licMgr.account, { ...oAccount, ...{ id: 0 }});
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "tests-no-matching-account-key" }});
		Object.assign(licMgr.account.session, { ...oAccount.session, ...{ expires: Date.now() - (1000 * 60 * 60 * 4) - 1000 }});
		await saveAccount(licMgr.account);
        await validateLicense(this, true, false);
        utils.endRollingCount(this);
	});


	test("Validate License - Invalid Account Trial", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.validateLicense + 100);
		Object.assign(licMgr.account, { ...oAccount, ...{ trialId: 0 }});
		Object.assign(licMgr.account.license, { ...oAccount.license, ...{ key: "tests-no-matching-trial-key" }});
		Object.assign(licMgr.account.session, { ...oAccount.session, ...{ expires: Date.now() - (1000 * 60 * 60 * 4) - 1000 }});
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
		await expectLicense(true, false, true, false);
		await utils.treeUtils.refresh(teWrapper);
        utils.endRollingCount(this);
	});


	test("Refresh Session", async function()
	{
		if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.validateLicense + 100);
		if (!_LICENSE_SERVER_DISABLED_)
		{
			void executeTeCommand("taskexplorer.refreshSession");
			await utils.promiseFromEvent(teWrapper.licenseManager.onDidSessionChange).promise;
			await expectLicense(true, true, false, false, true);
		}
        utils.endRollingCount(this);
	});

});


const expectLicense = async (isLic?: boolean, isPaid?: boolean, isTrial?: boolean, isTrialExt?: boolean, isRegistered?: boolean) =>
{
	if (!_LICENSE_SERVER_DISABLED_)
	{
		expect(licMgr.isLicensed).to.be.equal(!!isLic);
		expect(licMgr.isPaid).to.be.equal(!!isPaid);
		expect(licMgr.isTrial).to.be.equal(!!isTrial);
		expect(licMgr.isTrialExtended).to.be.equal(!!isTrialExt);
		if (isRegistered !== undefined) {
			expect(licMgr.isRegistered).to.be.equal(!!isRegistered);
		}
	}
	await utils.waitForWebviewsIdle();
};

const restoreAccount = async() => {
	if (oAccount2) {
		Object.assign(licMgr.account, JSON.parse(JSON.stringify(oAccount2)));
		await teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(oAccount2));
	}
};

const saveAccount = (account: ITeAccount) => teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(account));

const setNag = (v?: number) => teWrapper.storage.update(teWrapper.keys.Storage.LastLicenseNag, v);

const setTasks = (e: any) => { licMgr.setTestData({ callTasksChanged: e }); };

const validateLicense = async (instance: Mocha.Context | undefined, expectNow: boolean, expectAfter: boolean) =>
{
	instance?.slow(tc.slowTime.licenseMgr.validateLicense);
	if (!_LICENSE_SERVER_DISABLED_)
	{
		expect(licMgr.isLicensed).to.be.equal(expectNow);
		expect(licMgr.isTrial).to.be.equal(expectNow);
		try {
			await licMgr.checkLicense("");
			await utils.sleep(250);
			await utils.waitForTeIdle(tc.waitTime.licenseMgr.request);
		} catch {}
		finally {
			licMgr.setTestData({ sessionInterval: undefined, setPaid: false });
		}
		expect(licMgr.isLicensed).to.be.equal(expectAfter);
		expect(licMgr.isTrial).to.be.equal(expectAfter);
	}
	else {
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.request);
	}
};
