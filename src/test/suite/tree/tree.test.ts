/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from "chai";
import * as utils from "../../utils/utils";
import { startupFocus } from "../../utils/suiteUtils";
import { ITaskFile, ITaskFolder, ITaskItem, ITeWrapper, OneOf } from ":types";
import { executeSettingsUpdate, executeTeCommand, executeTeCommand2 } from "../../utils/commandUtils";
import { WorkspaceFolder, Uri, ThemeIcon, MarkdownString, Command, TreeItemCollapsibleState, AccessibilityInformation } from "vscode";

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
        const taskMap = teWrapper.treeManager.taskMap;
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
		await executeTeCommand2("taskexplorer.setPinned", [ ant[0], "favorites" ]);
		await executeTeCommand2("taskexplorer.setPinned", [ batch[1], "favorites" ]);
        teWrapper.explorer.getParent(ant[0]);
        teWrapper.explorer.getParent(batch[1]);
        utils.endRollingCount(this);
    });


    test("Add / Remove  Custom Label 1", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.standard * 2);
        const taskTree = teWrapper.treeManager.taskFolders;
        if (taskTree)
        {
            const sFolder: any = taskTree[0].label === "Favorites" ? taskTree[0] :
                            (taskTree[1].label === "Favorites" ? taskTree[1] : null);
            if (sFolder)
            {
                cstItem1 = sFolder.treeNodes.find((t: any) => sFolder.getTaskItemId(t.id) === batch[0].id);
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
        const taskTree = teWrapper.treeManager.taskFolders;
        if (taskTree)
        {
            const sFolder: any = taskTree[0].label === "Favorites" ? taskTree[0] :
                            (taskTree[1].label === "Favorites" ? taskTree[1] : null);
            if (sFolder)
            {
                cstItem2 = sFolder.treeNodes.find((t: any) => sFolder.getTaskItemId(t.id) === batch[1].id);
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
        const taskTree = teWrapper.treeManager.taskFolders;
        if (taskTree)
        {
            const sFolder: any = taskTree[0].label === "Favorites" ? taskTree[0] :
                            (taskTree[1].label === "Favorites" ? taskTree[1] : null);
            if (sFolder)
            {
                cstItem3 = sFolder.treeNodes.find((t: any) => sFolder.getTaskItemId(t.id) === bash[0].id);
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
        const taskTree = teWrapper.treeManager.taskFolders;
        if (taskTree)
        {
            const sFolder: any = taskTree[0].label === "Favorites" ? taskTree[0] :
                            (taskTree[1].label === "Favorites" ? taskTree[1] : null);
            if (sFolder)
            {
                cstItem4 = sFolder.treeNodes.find((t: any) => sFolder.getTaskItemId(t.id) === ant[0].id);
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
        const taskTree = teWrapper.treeManager.taskFolders as any[];
        expect(teWrapper.explorer.getParent(taskTree[0])).to.be.null; // Last Tasks
        expect(teWrapper.explorer.getParent(taskTree[1])).to.be.null; // Favorites
        teWrapper.explorer.getParent(taskTree[1].treeNodes[0]);
        teWrapper.explorer.getParent(taskTree[0].treeNodes[0]);
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
            console.log(`    ${teWrapper.log.symbols.color.warning} ${teWrapper.log.withColor(msg, teWrapper.log.colors.grey)}`);
            console.log(`    ${teWrapper.log.symbols.color.warning} ${teWrapper.log.withColor("Trying again in 100ms...", teWrapper.log.colors.grey)}`);
            await utils.sleep(100);
            try {
                await reveal();
            }
            catch {
                console.log(`    ${teWrapper.log.symbols.blue.warning} ${teWrapper.log.withColor("Trying again in 100ms...", teWrapper.log.colors.grey)}`);
                await utils.sleep(100);
                await reveal();
            }
        }
        const taskTree = teWrapper.treeManager.taskFolders as any[];
        expect(teWrapper.explorer.getParent(taskTree[2])).to.be.null; // Project Folder
        expect(teWrapper.explorer.getParent(batch[0])).to.not.be.null;
        expect(teWrapper.explorer.getParent(batch[0].taskFile)).to.not.be.null;
        expect(await teWrapper.explorer?.getChildren(taskTree[2].treeNodes[0])).to.not.be.null;
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
        let map: DumbFolder[] = [
            new DumbFolder("frank"),
            new DumbFolder("richard face"),
            new DumbFolder("bob"),
            new DumbFolder("maurice"),
            new DumbFolder("Favorites"),
            new DumbFolder("chris"),
            new DumbFolder("maurice"),
            new DumbFolder("User Tasks"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("peter"),
            new DumbFolder("larry"),
            new DumbFolder("maurice")
        ];
        teWrapper.treeManager.sorter.sortFolders(map);
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("User Tasks"),
            new DumbFolder("if i was"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("Favorites"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze"),
        ],
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder("Favorites"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze"),
            new DumbFolder("User Tasks")
        ];
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder("User Tasks"),
            new DumbFolder("Favorites"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze")
        ];
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder("Favorites"),
            new DumbFolder("User Tasks"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze")
        ];
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder("Favorites"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("User Tasks"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze")
        ];
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("Favorites"),
            new DumbFolder("User Tasks"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze")
        ];
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder("User Tasks"),
            new DumbFolder("Last Tasks"),
            new DumbFolder("Favorites"),
            new DumbFolder("tasks4"),
            new DumbFolder("tasks5"),
            new DumbFolder("Christmas"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze")
        ];
        teWrapper.treeManager.sorter.sortFolders(map),
        map = [
            new DumbFolder("Last Tasks"),
            new DumbFolder("onetwothree"),
            new DumbFolder("if i was"),
            new DumbFolder(""),
            new DumbFolder("Favorites"),
            new DumbFolder("tasks5"),
            new DumbFolder(""),
            new DumbFolder("User Tasks"),
            new DumbFolder("what"),
            new DumbFolder("tired1"),
            new DumbFolder("tired2"),
            new DumbFolder("doze")
        ];
        teWrapper.treeManager.sorter.sortFolders(map);
        utils.endRollingCount(this);
    });


    test("Trigger Busy State", async function()
	{
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh * 2);
        void executeTeCommand("refresh", 0);
        await executeTeCommand("refresh", 0);
        await utils.waitForTeIdle(10);
        utils.endRollingCount(this);
	});

});

class DumbFolder implements ITaskFolder
{
    public label: string;
    constructor(lbl: string) { this.label = lbl; this.uri = undefined; }
    id = "";
    isSpecial = false;
    treeNodes: (ITaskItem | ITaskFile)[] = [];
    workspaceFolder: WorkspaceFolder | undefined;
    iconPath?: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon | undefined;
    description?: string | boolean | undefined;
    uri: Uri | undefined;
    tooltip?: string | MarkdownString | undefined;
    command?: Command | undefined;
    collapsibleState?: TreeItemCollapsibleState | undefined;
    contextValue?: string | undefined;
    accessibilityInformation?: AccessibilityInformation | undefined;
    addChild<T extends (ITaskFile | ITaskItem)>(node: T, index?: number): OneOf<T, [ ITaskFile, ITaskItem ]>;
    addChild(taskFile: ITaskItem | ITaskFile, idx = 0): ITaskFile | ITaskItem { return taskFile; }
    removeChild(taskFile: ITaskItem | ITaskFile, logPad: string): void {}
}
