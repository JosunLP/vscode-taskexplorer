/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from "chai";
import * as utils from "../utils/utils";
import { startupFocus } from "../utils/suiteUtils";
import { IDictionary, ITaskFile, ITaskFolder, ITaskItem, ITeWrapper } from ":types";
import { executeSettingsUpdate, executeTeCommand, executeTeCommand2 } from "../utils/commandUtils";

let teWrapper: ITeWrapper;
const tc = utils.testControl;
let ant: ITaskItem[];
let bash: ITaskItem[];
let batch: ITaskItem[];
let cstItem1: ITaskItem | undefined;
let cstItem2: ITaskItem | undefined;
let cstItem3: ITaskItem | undefined;
let cstItem4: ITaskItem | undefined;


suite("Tree Tests", () =>
{

    suiteSetup(async function()
    {
        if (utils.exitRollingCount(this, true)) return;
        ({ teWrapper } = await utils.activate());
        utils.endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
        utils.suiteFinished(this);
    });


    test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Show Last Tasks w/ Missing Stored Task", async function()
    {
        if (utils.exitRollingCount(this)) return;
        if (teWrapper.config.get<boolean>("specialFolders.showLastTasks")) {
            this.slow(tc.slowTime.config.showHideSpecialFolder * 2);
            void teWrapper.config.updateWs("specialFolders.showLastTasks", false); // Reload last tasks folder
            await utils.promiseFromEvent(teWrapper.treeManager.onDidLastTasksChange).promise;
        }
        else {
            this.slow(tc.slowTime.config.showHideSpecialFolder);
        }
        const taskMap = teWrapper.treeManager.getTaskMap();
        const tmp = { ...taskMap };
        try {
            Object.keys(tmp).forEach(k => {
                delete taskMap[k];
            });
            void teWrapper.config.updateWs("specialFolders.showLastTasks", true);
            await utils.promiseFromEvent(teWrapper.treeManager.onDidLastTasksChange).promise;
        }
        finally //
        {      // Last tasks folder will get reloaded on hide / show tests below
            Object.assign(taskMap, tmp);
        }
        utils.endRollingCount(this);
    });


    test("Add/Remove from Favorites", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.showHideSpecialFolder + (tc.slowTime.commands.standard * 8) + (tc.slowTime.tasks.getTreeTasks * 4));
        await executeSettingsUpdate("specialFolders.showFavorites", true);
        ant = await utils.treeUtils.getTreeTasks(teWrapper, "ant", 3);
        bash = await utils.treeUtils.getTreeTasks(teWrapper, "bash", 1);
        batch = await utils.treeUtils.getTreeTasks(teWrapper, "batch", 2);
        await executeTeCommand2("addRemoveFavorite", [ batch[0] ]);
        await executeTeCommand2("addRemoveFavorite", [ ant[0] ]);
        let removed = await executeTeCommand2("addRemoveFavorite", [ batch[0] ]);
        if (removed) {
            await executeTeCommand2("addRemoveFavorite", [ batch[0] ]);
        }
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, false); // to cover usage.onFavoriteTasksChanged
        removed = await executeTeCommand2("addRemoveFavorite", [ batch[1] ]);
        if (removed) {
            await executeTeCommand2("addRemoveFavorite", [ batch[1] ]);
        }
        removed = await executeTeCommand2("addRemoveFavorite", [ ant[0] ]);
        if (removed) {
            await executeTeCommand2("addRemoveFavorite", [ ant[0] ]);
        }
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, true); // to cover usage.onFavoriteTasksChanged
        removed = await executeTeCommand2("addRemoveFavorite", [ bash[0] ]);
        if (removed) {
            await executeTeCommand2("addRemoveFavorite", [ bash[0] ]);
        }
        utils.endRollingCount(this);
    });


    test("Add / Remove  Custom Label 1", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.standard * 2);
        const taskTree = teWrapper.treeManager.getTaskTree();
        if (taskTree)
        {
            const sFolder = taskTree[0].label === "Favorites" ? taskTree[0] as any :
                            (taskTree[1].label === "Favorites" ? taskTree[1] as any : null);
            if (sFolder)
            {
                cstItem1 = sFolder.taskFiles.find((t: any) => sFolder.getTaskItemId(t.id) === batch[0].id);
                if (cstItem1)
                {
                    utils.overrideNextShowInputBox("Label 1");
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem1 ]);
                    await utils.sleep(1);
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem1 ]);
                }
            }
        }
        utils.endRollingCount(this);
    });


    test("Add / Remove  Custom Label 2", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.standard);
        const taskTree = teWrapper.treeManager.getTaskTree();
        if (taskTree)
        {
            const sFolder = taskTree[0].label === "Favorites" ? taskTree[0] as any :
                            (taskTree[1].label === "Favorites" ? taskTree[1] as any : null);
            if (sFolder)
            {
                cstItem2 = sFolder.taskFiles.find((t: any) => sFolder.getTaskItemId(t.id) === batch[1].id);
                if (cstItem2)
                {
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem2 ]);
                    await utils.sleep(1);
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem2 ]);
                }
            }
        }
        utils.endRollingCount(this);
    });


    test("Add / Remove  Custom Label 3", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.standard * 2);
        const taskTree = teWrapper.treeManager.getTaskTree();
        if (taskTree)
        {
            const sFolder = taskTree[0].label === "Favorites" ? taskTree[0] as any :
                            (taskTree[1].label === "Favorites" ? taskTree[1] as any : null);
            if (sFolder)
            {
                cstItem3 = sFolder.taskFiles.find((t: any) => sFolder.getTaskItemId(t.id) === bash[0].id);
                if (cstItem3)
                {
                    utils.overrideNextShowInputBox("Label 3");
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem3 ]);
                    await utils.sleep(1);
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem3 ]);
                }
            }
        }
        utils.endRollingCount(this);
    });


    test("Add / Remove Custom Label 4", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.standard * 2);
        const taskTree = teWrapper.treeManager.getTaskTree();
        if (taskTree)
        {
            const sFolder = taskTree[0].label === "Favorites" ? taskTree[0] as any :
                            (taskTree[1].label === "Favorites" ? taskTree[1] as any : null);
            if (sFolder)
            {
                cstItem4 = sFolder.taskFiles.find((t: any) => sFolder.getTaskItemId(t.id) === ant[0].id);
                if (cstItem4)
                {
                    utils.overrideNextShowInputBox("Label 6");
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem4 ]);
                    await utils.sleep(1);
                    await executeTeCommand2("addRemoveCustomLabel", [ cstItem4 ]);
                }
            }
        }
        utils.endRollingCount(this);
    });


    test("Cancel Add Custom Label", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.commands.standard * 3) + (tc.waitTime.command * 3));
        utils.overrideNextShowInputBox(undefined);
        await executeTeCommand2("addRemoveCustomLabel", [ cstItem1 ]);
        await utils.sleep(1);
        utils.clearOverrideShowInputBox();
        utils.overrideNextShowInputBox(undefined);
        await executeTeCommand2("addRemoveCustomLabel", [ cstItem2 ]);
        utils.endRollingCount(this);
    });


    test("Show / Hide Favorite and Last Tasks", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.showHideSpecialFolder * 4);
        void teWrapper.config.updateWs("specialFolders.showLastTasks", false);
        await utils.promiseFromEvent(teWrapper.treeManager.onDidLastTasksChange).promise;
        void teWrapper.config.updateWs("specialFolders.showFavorites", false);
        await utils.promiseFromEvent(teWrapper.treeManager.onDidFavoriteTasksChange).promise;
        void teWrapper.config.updateWs("specialFolders.showFavorites", true);
        await utils.promiseFromEvent(teWrapper.treeManager.onDidFavoriteTasksChange).promise;
        void teWrapper.config.updateWs("specialFolders.showLastTasks", true);
        await utils.promiseFromEvent(teWrapper.treeManager.onDidLastTasksChange).promise;
        utils.endRollingCount(this);
    });


    test("Hide User tasks", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.showHideUserTasks);
        await executeSettingsUpdate("specialFolders.showUserTasks", false, tc.waitTime.config.showHideUserTasks);
        utils.endRollingCount(this);
    });


    test("Clear Special Folders", async function()
    {
        if (utils.exitRollingCount(this)) return;
        utils.clearOverrideShowInfoBox();
        this.slow((tc.slowTime.commands.standard * 6) + 50);
        utils.overrideNextShowInfoBox("Cancel");
        await executeTeCommand("clearLastTasks");
        utils.overrideNextShowInfoBox("Cancel");
        await executeTeCommand("clearFavorites");
        utils.overrideNextShowInfoBox("Workspace");
        await executeTeCommand("clearLastTasks");
        utils.overrideNextShowInfoBox("Workspace");
        await executeTeCommand("clearFavorites");
        utils.overrideNextShowInfoBox("Global");
        await executeTeCommand("clearLastTasks");
        utils.overrideNextShowInfoBox("Global");
        await executeTeCommand("clearFavorites");
        await utils.sleep(25);
        utils.endRollingCount(this);
    });


    test("Reveal API", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.tasks.getTreeTasks * 2) + (tc.slowTime.webview.revealTreeNode * 6) + 230);
        await utils.waitForTeIdle(50);
        const reveal = async() => {
            bash = await utils.treeUtils.getTreeTasks(teWrapper, "bash", 1);
            batch = await utils.treeUtils.getTreeTasks(teWrapper, "batch", 2);
            await utils.waitForTeIdle(50);
            await teWrapper.treeManager.views.taskExplorer.view.reveal(batch[0], { select: true });
            await utils.waitForTeIdle(5);
            await teWrapper.treeManager.views.taskExplorer.view.reveal(bash[0], { select: true });
            await utils.waitForTeIdle(5);
            await teWrapper.treeManager.views.taskExplorer.view.reveal(batch[0], { select: false });
            await utils.waitForTeIdle(5);
            await teWrapper.treeManager.views.taskExplorer.view.reveal(bash[0], { select: false });
        };
        try {
            await reveal();
        }
        catch (e) {
            const msg = "Reveal API failed: " + e;
            console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor(msg, teWrapper.figures.colors.grey)}`);
            console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor("Trying again in 100ms...", teWrapper.figures.colors.grey)}`);
            await utils.sleep(100);
            try {
                await reveal();
            }
            catch {
                console.log(`    ${teWrapper.figures.color.warningTests} ${teWrapper.figures.withColor("Trying again in 100ms...", teWrapper.figures.colors.grey)}`);
                await utils.sleep(100);
                await reveal();
            }
        }
        const taskTree = teWrapper.treeManager.getTaskTree() as any[];
        expect(teWrapper.explorer?.getParent(taskTree[0])).to.be.null; // Last Tasks
        expect(teWrapper.explorer?.getParent(taskTree[1])).to.be.null; // Last Tasks
        expect(teWrapper.explorer?.getParent(taskTree[2])).to.be.null; // Project Folder
        expect(teWrapper.explorer?.getParent(batch[0])).to.not.be.null;
        expect(teWrapper.explorer?.getParent(batch[0].taskFile)).to.not.be.null;
        expect(await teWrapper.explorer?.getChildren(taskTree[2].taskFiles[0])).to.not.be.null;
        expect(await teWrapper.explorer?.getChildren(taskTree[2].taskFiles[1])).to.not.be.null;
        expect(teWrapper.explorer?.getName()).to.be.oneOf([ "taskTreeExplorer", "taskTreeSideBar" ]);
        utils.endRollingCount(this);
    });


    test("Project Folder State Collapsed", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.folderState * 2) + tc.slowTime.commands.refreshNoChanges);
        await executeSettingsUpdate("specialFolders.folderState.project1", "Collapsed");
		await teWrapper.storage.delete("taskexplorer.pinned.last");
        await teWrapper.treeManager.refresh(undefined, undefined, "");
        await executeSettingsUpdate("specialFolders.folderState.project1", "Expanded");
        utils.endRollingCount(this);
    });


    test("Folder Sort Type Explorer Order", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.sortingEvent + (tc.slowTime.config.event * 8));
        await executeTeCommand2("setPinned", [ batch[0] ]);
        await executeTeCommand2("setPinned", [ batch[1] ]);
        await executeTeCommand2("setPinned", [ bash[0] ]);
        await executeTeCommand2("setPinned", [ ant[1] ]);
        await executeSettingsUpdate(teWrapper.keys.Config.SortProjectFoldersAlphabetically, false, tc.waitTime.config.sortingEvent);
        await executeTeCommand2("setPinned", [ batch[0] ]);
		await executeTeCommand2("setPinned", [ batch[0], "last" ]);
        await executeTeCommand2("setPinned", [ batch[1] ]);
        await executeTeCommand2("setPinned", [ bash[0] ]);
        await executeTeCommand2("setPinned", [ ant[1] ]);
        utils.endRollingCount(this);
    });


    test("Folder Sort Type Alphabetic Order", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.sortingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.SortProjectFoldersAlphabetically, true, tc.waitTime.config.sortingEvent);
        utils.endRollingCount(this);
    });

    test("Misc Sort Folders", function()
    {
        if (utils.exitRollingCount(this)) return;
        let map: IDictionary<DumbFolder> = {};
        map.frank = new DumbFolder("frank");
        map["richard face"] = new DumbFolder("richard face");
        map.bob = new DumbFolder("bob");
        map.scott = new DumbFolder("maurice");
        map.Favorites = new DumbFolder("Favorites");
        map.chris = new DumbFolder("chris");
        map.maurice = new DumbFolder("maurice");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map.peter = new DumbFolder("peter");
        map.larry = new DumbFolder("larry");
        map.mike = new DumbFolder("maurice");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map.OMG = new DumbFolder("if i was");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map.Favorites = new DumbFolder("Favorites");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map.Favorites = new DumbFolder("Favorites");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        map["User Tasks"] = new DumbFolder("User Tasks");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map.Favorites = new DumbFolder("Favorites");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map.Favorites = new DumbFolder("Favorites");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map.Favorites = new DumbFolder("Favorites");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map.Favorites = new DumbFolder("Favorites");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map.Zoo = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map.Favorites = new DumbFolder("Favorites");
        map["Andrew was here"] = new DumbFolder("tasks4");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("Christmas");
        map["change folder"] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        map = {};
        map["Last Tasks"] = new DumbFolder("Last Tasks");
        map[""] = new DumbFolder("onetwothree");
        map.OMG = new DumbFolder("if i was");
        map["Andrew was here"] = new DumbFolder("");
        map.Favorites = new DumbFolder("Favorites");
        map["maya and sierra"] = new DumbFolder("tasks5");
        map["front DOOR"] = new DumbFolder("");
        map["User Tasks"] = new DumbFolder("User Tasks");
        map[""] = new DumbFolder("what");
        map["extremely tired"] = new DumbFolder("tired1");
        map.tired = new DumbFolder("tired2");
        map["dozing off"] = new DumbFolder("doze");
        teWrapper.sorters.sortFolders(map);
        utils.endRollingCount(this);
    });

});

class DumbFolder implements ITaskFolder
{
    public label: string;
    constructor(lbl: string) { this.label = lbl; }
    addChild(taskFile: ITaskItem | ITaskFile, idx = 0): void {}
    removeChild(taskFile: ITaskItem | ITaskFile, logPad: string): void {}
}
