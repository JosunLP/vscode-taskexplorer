/* eslint-disable import/no-extraneous-dependencies */

import { ITeWrapper } from "../../interface";
import { executeSettingsUpdate, focusExplorerView } from "../utils/commandUtils";
import {
    activate, endRollingCount, exitRollingCount, getSuccessCount, needsTreeBuild, suiteFinished, testControl as tc
} from "../utils/utils";

let teWrapper: ITeWrapper;


suite("Tree Grouping Tests", () =>
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
        if (getSuccessCount(this) < 10) {
            await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 5, tc.waitTime.config.groupingEvent);
            await executeSettingsUpdate(teWrapper.keys.Config.GroupSeparator, "-", tc.waitTime.config.groupingEvent);
            await executeSettingsUpdate(teWrapper.keys.Config.GroupWithSeperator, true, tc.waitTime.config.groupingEvent);
            await executeSettingsUpdate(teWrapper.keys.Config.GroupStripTaskLabel, true, tc.waitTime.config.groupingEvent);
        }
        suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        if (exitRollingCount(this)) return;
        if (needsTreeBuild(true)) {
            await focusExplorerView(teWrapper, this);
        }
        endRollingCount(this);
	});


    test("Disable Grouping", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupWithSeperator, false, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Enable Grouping Max Level 2", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupWithSeperator, true, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Max Level 2", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 2, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Max Level 4", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 4, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Disable Strip Task Label", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupStripTaskLabel, false, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Max Level 3", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 3, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Max Level 1", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 1, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Enable Strip Task Label", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupStripTaskLabel, true, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Separator", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupSeparator, "_", tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Max Level 3", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 3, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Change Grouping Max Level 4", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 3, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Reset Grouping Separator", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupSeparator, "-", tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });


    test("Reset Grouping Max Level 5", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.groupingEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 5, tc.waitTime.config.groupingEvent);
        endRollingCount(this);
    });

});
