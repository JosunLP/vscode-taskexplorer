/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from "chai";
import { TreeItem } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { executeSettingsUpdate } from "../utils/commandUtils";
import { IDictionary, ITaskExplorerApi, ITeWrapper } from ":types";
import {
    activate, endRollingCount, exitRollingCount, suiteFinished, testControl as tc, verifyTaskCount, waitForTeIdle
} from "../utils/utils";

let didDisableTasks = false;
let didResetEnabledTasks = false;
let showFavorites = false;
let showLastTasks = false;
let showUserTasks = false;
let enabledTasks: IDictionary<boolean>;
const antStartCount = 3;
const gruntStartCount = 7;
const gulpStartCount = 17;
const pythonStartCount = 5;

let teWrapper: ITeWrapper;


suite("NoScripts TreeItem Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate());
        showFavorites = teWrapper.config.get<boolean>("specialFolders.showFavorites");
        showLastTasks = teWrapper.config.get<boolean>("specialFolders.showLastTasks");
        showUserTasks = teWrapper.config.get<boolean>("specialFolders.showUserTasks");
        enabledTasks = { ...teWrapper.config.get<IDictionary<boolean>>("enabledTasks") };
        if (showUserTasks) {
            await executeSettingsUpdate("specialFolders.showFavorites", false, tc.waitTime.config.showHideSpecialFolder);
        }
        if (showLastTasks) {
            await executeSettingsUpdate("specialFolders.showLastTasks", false, tc.waitTime.config.showHideSpecialFolder);
        }
        if (showUserTasks) {
            await executeSettingsUpdate("specialFolders.showUserTasks", false, tc.waitTime.config.showHideSpecialFolder);
        }
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        if (didDisableTasks && !didResetEnabledTasks) {
            await executeSettingsUpdate("enabledTasks", enabledTasks, tc.waitTime.refreshCommand);
        }
        await executeSettingsUpdate("specialFolders.showFavorites", showFavorites, tc.waitTime.config.showHideSpecialFolder);
        await executeSettingsUpdate("specialFolders.showLastTasks", showLastTasks, tc.waitTime.config.showHideSpecialFolder);
        await executeSettingsUpdate("specialFolders.showUserTasks", showUserTasks, tc.waitTime.config.showHideSpecialFolder);
        suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Disable All Task Types", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh + (tc.slowTime.tasks.count.verify * 4));
        await teWrapper.config.updateWs("enabledTasks",
        {
            ant: false,
            apppublisher: false,
            bash: false,
            batch: false,
            composer: false,
            gradle: false,
            grunt: false,
            gulp: false,
            jenkins: false,
            make: false,
            maven: false,
            npm: false,
            nsis: false,
            perl: false,
            pipenv: false,
            powershell: false,
            python: false,
            ruby: false,
            tsc: false,
            webpack: false,
            workspace: false
        });
        didDisableTasks = true;
        await waitForTeIdle(tc.waitTime.refreshCommand);
        const treeTasks = teWrapper.treeManager.taskFolders as TreeItem[];
        expect(treeTasks).to.be.an("array").with.lengthOf(0);
        await verifyTaskCount("ant", 0);
        await verifyTaskCount("grunt", 0);
        await verifyTaskCount("gulp", 0);
        await verifyTaskCount("python", 0);
        endRollingCount(this);
    });


    test("Re-enable Task Types", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh + (tc.slowTime.tasks.count.verify * 4));
        await executeSettingsUpdate("enabledTasks", enabledTasks, tc.waitTime.refreshCommand);
        didResetEnabledTasks = true;
        const treeTasks = teWrapper.treeManager.tasks;
        const treeFolders = teWrapper.treeManager.taskFolders as TreeItem[];
        expect(treeTasks).to.be.an("array");
        expect(treeFolders.length).to.be.equal(tc.isMultiRootWorkspace ? 2 : 1);
        expect(treeTasks.length).to.be.greaterThan(antStartCount + gruntStartCount + gulpStartCount + pythonStartCount);
        await verifyTaskCount("ant", antStartCount);
        await verifyTaskCount("grunt", gruntStartCount);
        await verifyTaskCount("gulp", gulpStartCount);
        await verifyTaskCount("python", pythonStartCount);
        endRollingCount(this);
    });

});

