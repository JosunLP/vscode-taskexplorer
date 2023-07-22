/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from "chai";
import { startupFocus } from "../../utils/suiteUtils";
import { ITaskExplorerApi, ITeWrapper } from ":types";
import { activate, endRollingCount, exitRollingCount, suiteFinished } from "../../utils/utils";

let teApi: ITaskExplorerApi;
let teWrapper: ITeWrapper;


suite("Wrapper Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate());
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Access Getter Properties", async function()
    {
        if (exitRollingCount(this)) return;
        expect(teWrapper.env).to.equal("tests");
        expect(teWrapper.taskManager).to.not.be.undefined;
        expect(teWrapper.taskUsageView).to.not.be.undefined;
        expect(teWrapper.dev).to.equal(false);
        expect(teWrapper.production).to.equal(false);
        expect(teWrapper.tests).to.equal(true);
        expect(teWrapper.keys.Storage).to.not.be.undefined;
        expect(teWrapper.keys.Config).to.not.be.undefined;
        expect(teWrapper.keys.Strings).to.not.be.undefined;
        expect(teWrapper.keys.Globs).to.not.be.undefined;
        expect(teWrapper.storage).to.not.be.undefined;
        expect(teWrapper.licensePage).to.not.be.undefined;
        expect(teWrapper.parsingReportPage).to.not.be.undefined;
        expect(teWrapper.releaseNotesPage).to.not.be.undefined;
        expect(teWrapper.licenseManager).to.not.be.undefined;
        expect(teWrapper.treeManager).to.not.be.undefined;
        expect(teWrapper.homeView).to.not.be.undefined;
        expect(teWrapper.taskCountView).to.not.be.undefined;
        expect(teWrapper.promiseUtils).to.not.be.undefined;
        expect(teWrapper.extensionName).to.not.be.undefined;
        expect(teWrapper.extensionNameShort).to.not.be.undefined;
        expect(teWrapper.extensionTitle).to.not.be.undefined;
        expect(teWrapper.extensionTitleShort).to.not.be.undefined;
        endRollingCount(this);
    });


    test("Access API Getter Properties", async function()
    {
        if (exitRollingCount(this)) return;
        expect(teWrapper.explorer).to.not.be.undefined;
        expect(teWrapper.explorerView).to.not.be.undefined;
        expect(teWrapper.sidebar).to.not.be.undefined;
        expect(teWrapper.sidebarView).to.not.be.undefined;
        expect(teWrapper.licenseManager.isLicensed).to.be.oneOf([ true, false ]);
        expect(teWrapper.busy).to.be.oneOf([ true, false ]);
        expect(teWrapper.tests).to.be.equal(true);
        endRollingCount(this);
    });


    test("Status Bar", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(290);
        teWrapper.statusBar.update("test");
        teWrapper.statusBar.update("test2");
        expect(teWrapper.statusBar.text).to.be.a("string").that.includes("test2");
        teWrapper.statusBar.update("");
        teWrapper.statusBar.update("");
        teWrapper.statusBar.update("test");
        teWrapper.statusBar.update("test");
        teWrapper.statusBar.update("test test test with text longer than max characters and will get truncated");
        teWrapper.statusBar.update("");
        teWrapper.statusBar.showTimed({ text: "Test" });
        await teWrapper.utils.sleep(5);
        teWrapper.statusBar.show({ text: "Test2" });
        await teWrapper.utils.sleep(5);
        teWrapper.statusBar.showTimed({ text: "Test" });
        await teWrapper.utils.sleep(5);
        teWrapper.statusBar.show({ text: "Test2" });
        teWrapper.statusBar.showTimed({ text: "Test" }, undefined, 15);
        await teWrapper.utils.sleep(35);
        teWrapper.statusBar.update("");
        teWrapper.statusBar.hide();
        teWrapper.statusBar.showTimed({ text: "Test" }, undefined, 15);
        await teWrapper.utils.sleep(35);
        await teWrapper.statusBar.runWithProgress(async (u, s) =>
        {
            await u.sleep(1);
            s.updateRunProgress("test", "project1", 99);
            await u.sleep(1);
            s.hide();
            await u.sleep(1);
        }, teWrapper.utils, teWrapper.statusBar);
        endRollingCount(this);
    });

});
