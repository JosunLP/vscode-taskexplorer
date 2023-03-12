/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { join } from "path";
import { expect } from "chai";
import * as utils from "../utils/utils";
import { env as environment } from "process";
import { env, Task, WebviewPanel } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeTeCommand } from "../utils/commandUtils";
import { ITeAccount, ITeLicenseManager, ITeWrapper, TeLicenseType } from "@spmeesseman/vscode-taskexplorer-types";

const tc = utils.testControl;
const invalidKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik";
const paidKey = environment.VSCODE_TASKEXPLORER_TESTS_VALID_KEY as string;
const trialKey = environment.VSCODE_TASKEXPLORER_TESTS_VALID_TRIAL_KEY as string;

let licMgr: ITeLicenseManager;
let teWrapper: ITeWrapper;
let randomMachineId: string;
let oMachineId: string;
let oAccount: ITeAccount;
let validKey: string;
let licMgrMaxFreeTasks: number;
let licMgrMaxFreeTaskFiles: number;
let licMgrMaxFreeTasksForTaskType: number;
let licMgrMaxFreeTasksForScriptType: number;

const restoreAccount = () => teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(oAccount));
const setNag = (v?: number) => teWrapper.storage.update(teWrapper.keys.Storage.LastLicenseNag, v);
const saveAccount  = (account: ITeAccount) => teWrapper.storage.updateSecret(teWrapper.keys.Storage.Account, JSON.stringify(account));
const setTasks = (e: any) => { licMgr.setTestData({ callTasksChanged: e }); };

const setLicensed = async (valid?: boolean, opts?: any) =>
{
    const licMgr = teWrapper.licenseManager;
	if (opts && opts.machineId) {
		licMgr.setTestData({ machineId: opts.machineId });
		delete opts.machineId;
		// setMachineId = true;
	}

	await saveAccount(
	{ ...{
		id: 52,
		created: Date.now(),
		email: "",
		firstName: "",
		lastName: "",
		name: "",
		orgId: 0,
		trialId: 52,
		verified: false,
		verificationPending: false,
		session: {
			expires: valid ? Infinity : 0,
			issued: Date.now(),
			token: valid ? licMgr.account.session.token : "",
			scopes: [ "te-explorer", "te-sidebar", valid ? "te-monitor" : "te-monitor-free" ],
		},
		license: {
			id: valid ? 6 : 0,
			expired: !valid,
			expires: valid ? Infinity : 0,
			issued: Date.now(),
			key: valid ? validKey : "",
			paid: valid,
			period: valid ? 0 : 2,
			state: valid ? 2 : 1, // Paid : Free
			type: valid ? 4 : 1   // Standard : Free
		}
	}, ...(opts || {}) });

    await licMgr.checkLicense("");
};

const validTrialAccount = {
	id: 2,
	email: null,
	firstName: null,
	lastName: null,
	created: "2023-03-05T04:35:54.000Z",
	name: "null null",
	orgId: 0,
	trialId: 2,
	verified: false,
	verificationPending: false,
	session: {
	   expires: 1678680464887,
	   issued: 1678597664887,
	   token: {},
	   scopes: [
		  "te-explorer",
		  "te-sidebar",
		  "te-monitor"
	   ]
	},
	license: {
	   id: 2,
	   expired: false,
	   expires: 0,
	   issued: 1678597664887,
	   key: trialKey,
	   paid: false,
	   period: 1,
	   state: 0,
	   type: 2
	}
};


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
		oMachineId = env.machineId;
		oAccount = { ...licMgr.account };
		validKey = oAccount.license.key;
		licMgrMaxFreeTasks = licMgr.getMaxNumberOfTasks();
		licMgrMaxFreeTaskFiles = licMgr.getMaxNumberOfTaskFiles();
		licMgrMaxFreeTasksForTaskType = licMgr.getMaxNumberOfTasks("npm");
		licMgrMaxFreeTasksForScriptType = licMgr.getMaxNumberOfTasks("batch");
		randomMachineId = "te-tests-machine-id-" + teWrapper.utils.getRandomNumber();
		licMgr.setTestData({
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
		await utils.closeEditors();
		if (oAccount) { await restoreAccount(); }
		licMgr?.setTestData({
			machineId: oMachineId,
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


	test("Set License Mode - UNLICENSED", async function()
	{
		if (utils.exitRollingCount(this)) return;
		await utils.setLicenseType(TeLicenseType.Free);
		expect(licMgr.isLicensed).to.be.equal(false);
		expect(licMgr.isTrial).to.be.equal(false);
        utils.endRollingCount(this);
	});


	test("Open License Info Page - View Parsing Report", async function()
	{   //
		// Run test in  UNLICENSED MODE - Set license type to TeLicenseType.Free
		//
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.viewReport + tc.slowTime.licenseMgr.pageWithDetail + 20);
		await teWrapper.licensePage.show();
        await utils.promiseFromEvent(teWrapper.licensePage.onReadyReceived).promise;
		await teWrapper.licensePage.view?.webview.postMessage({ command: "showParsingReport" });
        await utils.promiseFromEvent(teWrapper.parsingReportPage.onReadyReceived).promise;
        utils.endRollingCount(this);
	});


	test("License Info Page - Enter Invalid Key From Webview", async function()
	{   //
		// Run test in  UNLICENSED MODE - License type is TeLicenseType.Free at this point,
		// and license page is currently open
		//
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense + tc.slowTime.storageUpdate + 1000);
		utils.overrideNextShowInputBox(invalidKey);
		await teWrapper.licensePage.view?.webview.postMessage({ command: "enterLicense" });
		await utils.waitForTeIdle(500);
		expect(licMgr.isLicensed).to.be.equal(false);
		expect(licMgr.isTrial).to.be.equal(false);
        utils.endRollingCount(this);
	});


	test("License Info Page - Enter Valid Key From Webview", async function()
	{   //
		// Run test in  UNLICENSED MODE - License type is TeLicenseType.Free at this point,
		// and license page is currently open
		//
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense + tc.slowTime.storageUpdate + 1000);
		utils.overrideNextShowInputBox(paidKey);
		await teWrapper.licensePage.view?.webview.postMessage({ command: "enterLicense" });
		await utils.waitForTeIdle(500);
		await utils.closeEditors(); // Close license page
		expect(licMgr.isLicensed).to.be.equal(true);
		expect(licMgr.isTrial).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("License Prompt - Enter Valid Key", async function()
	{   //
		// Run test in  UNLICENSED MODE
		// License should be valid/paid at this point, set type back to TeLicenseType.Free
		//
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.checkLicense + tc.slowTime.storageUpdate + 300);
		await utils.setLicenseType(TeLicenseType.Free, true);
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox(paidKey);
		utils.overrideNextShowInfoBox(undefined);
		await licMgr.checkLicense(""); // auto-pop prompt
		await utils.waitForTeIdle(150);
        utils.endRollingCount(this);
	});


	test("License Prompt - Enter Invalid Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.enterKey + tc.slowTime.storageUpdate + 500);
		await setNag(Date.now() - ((1000 * 60 * 60 * 24) * 45));
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox(invalidKey);
		utils.overrideNextShowInfoBox(undefined);
		setTasks({ tasks: teWrapper.treeManager.getTasks() });
		await utils.sleep(250);
		await utils.waitForTeIdle(150);
        utils.endRollingCount(this);
	});


	test("License Prompt - Extend Trial", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.enterKey + tc.slowTime.storageUpdate + 500);
		await setNag();
		utils.clearOverrideShowInfoBox();
		utils.overrideNextShowInfoBox("Extend Trial");
		await setLicensed(false, {
			id: 51,
			trialId: 51,
			license: {
				id: 5,
				state: 0,
				period: 1,
				type: 2
			}
		});
		await utils.sleep(250);
		await utils.waitForTeIdle(150);
        utils.endRollingCount(this);
	});


	test("License Prompt - Enter Invalid Key Length", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.enterKey + tc.slowTime.storageUpdate + 500);
		await teWrapper.storage.delete(teWrapper.keys.Storage.LastLicenseNag);
		utils.clearOverrideShowInfoBox();
		utils.clearOverrideShowInputBox();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1234");
		utils.overrideNextShowInfoBox(undefined);
		setTasks({ tasks: teWrapper.treeManager.getTasks() });
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Page w/ No License Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.checkLicense + 500);
		await setLicensed(false);
		await utils.waitForTeIdle(150);
		await teWrapper.licensePage.show();
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Page w/ Set License Key", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.setLicenseCmd + tc.slowTime.licenseMgr.checkLicense + 500);
		await setLicensed(true);
		await utils.waitForTeIdle(150);
		await teWrapper.licensePage.show();
		await utils.waitForTeIdle(150);
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
		await setNag();
		utils.clearOverrideShowInfoBox();
		utils.overrideNextShowInfoBox("Info");
		await setLicensed(false);
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("License Not Now", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		utils.clearOverrideShowInfoBox();
		utils.overrideNextShowInfoBox("Not Now");
		await setLicensed(false);
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});



	test("License Cancel", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd + 500);
		await setNag();
		utils.overrideNextShowInfoBox(undefined);
		await setLicensed(false);
		await utils.waitForTeIdle(150);
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Enter License Key on Startup", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((tc.slowTime.licenseMgr.enterKey * 2) + 1000);
		await setNag();
		await setLicensed(false);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1111-2222-3333-4444-5555");
		await executeTeCommand("enterLicense");
		await utils.waitForTeIdle(150);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("");
		await executeTeCommand("enterLicense");
		await utils.waitForTeIdle(150);
        utils.endRollingCount(this);
	});


	test("Enter License Key by Command Palette", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.enterKey * 3);
		await setNag();
		await setLicensed(false);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("1234-5678-9098-7654321");
		await executeTeCommand("enterLicense", tc.waitTime.command * 2);
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("");
		await executeTeCommand("enterLicense", tc.waitTime.command * 2, 1100, "   ");
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox("");
		await executeTeCommand("enterLicense", tc.waitTime.command * 2, 1100, "   ", 1);
		await utils.waitForTeIdle(150);
        utils.endRollingCount(this);
	});


	test("Enter License Key on Startup (1st Time)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.licenseMgr.checkLicense + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd);
		await setLicensed();
        utils.endRollingCount(this);
	});


	test("New Account / First Time Startup", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.closeEditors + tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.storageSecretUpdate);
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(false);
		await setLicensed(false, {
			id: 0,
			trialId: 0,
			machineId: randomMachineId,
			license: {
				id: 0,
				state: 0,
				period: 0,
				type: 0
			}
		});
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.getTrialExtension);
		await utils.closeEditors();
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(true);
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


	test("Request Trial Extension (From Webview)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.licenseMgr.page + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.getTrialExtension +
				  tc.slowTime.storageSecretRead + tc.slowTime.closeEditors + 1100);
		await setLicensed(false, {
			id: licMgr.account.id,
			trialId: licMgr.account.trialId,
			machineId: randomMachineId,
			license: {
				id: licMgr.account.license.id,
				state: 0,
				period: 1,
				type: 2
			}
		});
		await teWrapper.licensePage.show();
		await utils.sleep(50);
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(true);
		const result = await teWrapper.licensePage.view?.webview.postMessage({ command: "extendTrial" });
		await utils.sleep(500);
		expect(result).to.be.equal(true);
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.getTrialExtension);
		await utils.closeEditors();
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("New Account / First Time Startup", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.closeEditors + tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.storageSecretUpdate);
		randomMachineId = "te-tests-machine-id2-" + teWrapper.utils.getRandomNumber();
		await setLicensed(false, {
			id: 0,
			trialId: 0,
			machineId: randomMachineId,
			license: {
				state: 0,
				period: 0,
				type: 0
			}
		});
		await utils.waitForTeIdle(tc.waitTime.licenseMgr.getTrialExtension);
		await utils.closeEditors();
		expect(teWrapper.licenseManager.isLicensed).to.be.equal(true);
        utils.endRollingCount(this);
	});


	test("Request Trial Extension (From Command Palette)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.closeEditors + tc.slowTime.licenseMgr.getTrialExtension + tc.slowTime.storageSecretUpdate);
		await setLicensed(false, {
			id: licMgr.account.id,
			trialId: licMgr.account.trialId,
			machineId: randomMachineId,
			license: {
				id: licMgr.account.license.id,
				state: 0,
				period: 1,
				type: 2
			}
		});
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
		await setLicensed(false, {
			id: licMgr.account.id,
			trialId: licMgr.account.trialId,
			machineId: randomMachineId,
			license: {
				id: licMgr.account.license.id,
				state: 0,
				period: 2,
				type: 2
			}
		});
		await executeTeCommand<{ panel: any; newKey: any }>("extendTrial");
		await utils.closeEditors();
        utils.endRollingCount(this);
	});


	test("Task Limit Reached (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow((Math.round(tc.slowTime.commands.refresh * 0.75)) + tc.slowTime.storageUpdate + tc.slowTime.licenseMgr.setLicenseCmd);
		await setLicensed(false);
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


	test("Enter Valid License Key After Max Task Count Reached", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.refresh);
		// await teWrapper.storage.updateSecret(StorageKeys.Account, JSON.stringify(account));
		await setLicensed(false, { checkLicense: false });
		await setNag();
		utils.overrideNextShowInfoBox("Enter License Key");
		utils.overrideNextShowInputBox(validKey);
		utils.overrideNextShowInfoBox(undefined);
		await executeTeCommand("enterLicense");
        utils.endRollingCount(this);
	});


	test("Reset Max Limits (Non-Licensed)", async function()
	{
        if (utils.exitRollingCount(this)) return;
		this.slow(tc.slowTime.commands.refresh);
		await setLicensed(true);
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
