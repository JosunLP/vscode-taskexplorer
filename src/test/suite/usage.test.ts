/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { ConfigKeys } from "../../lib/constants";
import { executeSettingsUpdate, executeTeCommand } from "../utils/commandUtils";
import { activate, endRollingCount, exitRollingCount, sleep, suiteFinished, testControl as tc } from "../utils/utils";

let aKey: string;
let teWrapper: ITeWrapper;


suite("Usage / Telemetry Tests", () =>
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


    test("List Usage", async function()
    {
        if (exitRollingCount(this)) return;
        const usage = teWrapper.usage.getAll();
        // try {
        //     console.log(JSON.stringify(usage, null, 3));
        // } catch {}
        Object.keys(usage).forEach((k) => {
            teWrapper.usage.get(k as any);
            aKey = k;
        });
        Object.keys(usage).forEach((k) => {
            teWrapper.usage.getAll(k as any);
        });
        endRollingCount(this);
    });


    test("Set Usage Off / On", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.trackingEvent * 7) + 20);
        await executeSettingsUpdate(ConfigKeys.AllowUsageReporting, true);
        await executeSettingsUpdate(ConfigKeys.AllowUsageReporting, false);
        await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, false);
        await executeSettingsUpdate(ConfigKeys.TrackUsage, false);
        await sleep(10);
        await executeTeCommand("getApi");
        await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, true);
        await executeSettingsUpdate(ConfigKeys.TrackUsage, true);
        endRollingCount(this);
    });


    test("Usage Calls", async function()
    {
        if (exitRollingCount(this)) return;
        teWrapper.usage.getLastRanTaskTime();
        teWrapper.usage.getAvgRunCount ("d", "");
        teWrapper.usage.getAvgRunCount ("w", "");
        endRollingCount(this);
    });


    test("Reset Usage", async function()
    {
        if (exitRollingCount(this)) return;
        const usage = teWrapper.usage.getAll();
        const d = teWrapper.usage.onDidChange(() => {});
        d.dispose();
        await teWrapper.usage.reset(aKey as any);
        await teWrapper.usage.reset();
        await teWrapper.usage.reset();
        await teWrapper.storage.update("usages", usage);
        endRollingCount(this);
    });


    test("Usage Calls After Reset", async function()
    {
        if (exitRollingCount(this)) return;
        teWrapper.usage.getLastRanTaskTime();
        teWrapper.usage.getAvgRunCount ("d", "");
        teWrapper.usage.getAvgRunCount ("w", "");
        endRollingCount(this);
    });

});
