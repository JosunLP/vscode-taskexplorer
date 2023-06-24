/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { expect } from "chai";
import { ITeWrapper } from ":types";
import { executeSettingsUpdate, executeTeCommand2, focusFileExplorer, focusSidebarView, showTeWebview } from "../utils/commandUtils";
import { activate, endRollingCount, exitRollingCount, sleep, suiteFinished, testControl as tc, waitForEvent, waitForWebviewReadyEvent } from "../utils/utils";


let teWrapper: ITeWrapper;


suite("Initialization", () =>
{
    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate(this));
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        suiteFinished(this);
    });


    test("Show/Hide Output Window", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.showOutput * 3);
        await executeTeCommand2("showOutput", [ true ]);
        await sleep(5);
        await executeTeCommand2("showOutput", [ false ]);
        await sleep(5);
        await executeTeCommand2("showOutput", [ tc.log.enabled && tc.log.output ]);
        endRollingCount(this);
    });


    test("Cover Webview Properties (Pre-Show)", async function()
    {
        if (exitRollingCount(this)) return;
        teWrapper.homeView.title = teWrapper.homeView.title;
        teWrapper.releaseNotesPage.title = teWrapper.releaseNotesPage.title;
        expect(teWrapper.releaseNotesPage.visible).to.be.equal(false);
        expect(teWrapper.homeView.visible).to.be.equal(false);
        expect(teWrapper.homeView.originalTitle).to.be.equal(teWrapper.homeView.title);
        endRollingCount(this);
    });


    test("Focus SideBar", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusSideBarFirstTime + tc.slowTime.webview.show.view.home);
        void focusSidebarView();
        await Promise.all([
            waitForWebviewReadyEvent(teWrapper.homeView, tc.slowTime.webview.show.view.home * 2),
            waitForEvent(teWrapper.treeManager.views.taskExplorerSideBar.tree.onDidLoadTreeData, tc.slowTime.commands.refresh)
        ]);
        teWrapper.homeView.title = teWrapper.homeView.title;
        endRollingCount(this);
    });


    test("Expand SideBar Task Usage View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.show.view.taskUsage + tc.slowTime.commands.focusChangeViews + tc.slowTime.webview.expandView);
        await showTeWebview(teWrapper.taskUsageView);
        expect(teWrapper.taskUsageView.visible).to.be.equal(true);
        endRollingCount(this);
    });


    test("Expand SideBar Task Count View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.show.view.taskCount + tc.slowTime.commands.focusChangeViews + tc.slowTime.webview.expandView);
        await showTeWebview(teWrapper.taskCountView);
        expect(teWrapper.taskCountView.visible).to.be.equal(true);
        endRollingCount(this);
    });


    test("Disable Explorer View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableExplorerView", false, tc.waitTime.config.registerExplorerEvent);
        expect(teWrapper.sidebar).to.not.be.undefined;
        expect(teWrapper.sidebarView).to.not.be.undefined;
        expect(teWrapper.explorer).to.not.be.undefined;
        expect(teWrapper.explorerView).to.not.be.undefined;
        expect(teWrapper.views.taskExplorer.enabled).to.be.equal(false);
        expect(teWrapper.views.taskExplorerSideBar.enabled).to.be.equal(true);
        endRollingCount(this);
    });


    test("Refresh SideBar Tree", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh);
        await executeTeCommand2("refresh", [ undefined, undefined, "" ], tc.waitTime.refreshCommand);
        endRollingCount(this);
    });


    test("Disable SideBar View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableSideBar", false, tc.waitTime.config.registerExplorerEvent);
        expect(teWrapper.sidebar).to.not.be.undefined;
        expect(teWrapper.sidebarView).to.not.be.undefined;
        expect(teWrapper.explorer).to.not.be.undefined;
        expect(teWrapper.explorerView).to.not.be.undefined;
        expect(teWrapper.views.taskExplorer.enabled).to.be.equal(false);
        expect(teWrapper.views.taskExplorerSideBar.enabled).to.be.equal(false);
        endRollingCount(this);
    });


    test("Re-enable SideBar View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableSideBar", true, tc.waitTime.config.registerExplorerEvent);
        expect(teWrapper.sidebar).to.not.be.undefined;
        expect(teWrapper.sidebarView).to.not.be.undefined;
        expect(teWrapper.explorer).to.not.be.undefined;
        expect(teWrapper.explorerView).to.not.be.undefined;
        expect(teWrapper.views.taskExplorer.enabled).to.be.equal(false);
        expect(teWrapper.views.taskExplorerSideBar.enabled).to.be.equal(true);
        endRollingCount(this);
    });


    test("Re-enable Explorer View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableExplorerView", true, tc.waitTime.config.registerExplorerEvent);
        expect(teWrapper.sidebar).to.not.be.undefined;
        expect(teWrapper.sidebarView).to.not.be.undefined;
        expect(teWrapper.explorer).to.not.be.undefined;
        expect(teWrapper.explorerView).to.not.be.undefined;
        expect(teWrapper.views.taskExplorer.enabled).to.be.equal(true);
        expect(teWrapper.views.taskExplorerSideBar.enabled).to.be.equal(true);
        endRollingCount(this);
    });


    test("Refresh Trees (Both Views Enabled)", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refreshNoChanges * 2);
        await executeTeCommand2("refresh", [ undefined, false, "" ]);
        endRollingCount(this);
    });


    test("Disable SideBar View", async function()
    {   //
        // Gets re-enabled in license manager test suite, but lets's keep it off for a few test suites...
        //
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.registerExplorerEvent);
        await executeSettingsUpdate("enableSideBar", false, tc.waitTime.config.registerExplorerEvent);
        expect(teWrapper.sidebar).to.not.be.undefined;
        expect(teWrapper.sidebarView).to.not.be.undefined;
        expect(teWrapper.explorer).to.not.be.undefined;
        expect(teWrapper.explorerView).to.not.be.undefined;
        expect(teWrapper.views.taskExplorer.enabled).to.be.equal(true);
        expect(teWrapper.views.taskExplorerSideBar.enabled).to.be.equal(false);
        endRollingCount(this);
    });


    test("Focus FileExplorer View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await focusFileExplorer();
        expect(teWrapper.views.taskExplorer.visible).to.be.equal(false);
        endRollingCount(this);
    });

});
