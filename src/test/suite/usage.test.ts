/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { ITeWrapper } from "../../interface";
import { executeSettingsUpdate, executeTeCommand, focusExplorerView, showTeWebview } from "../utils/commandUtils";
import { activate, endRollingCount, exitRollingCount, sleep, suiteFinished, testControl as tc, waitForWebviewsIdle } from "../utils/utils";

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
        this.slow((tc.slowTime.config.trackingEvent * 7) + 100);
        await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, true);
        await executeSettingsUpdate(teWrapper.keys.Config.AllowUsageReporting, false);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, false);
        await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, false);
        await sleep(50);
        await executeTeCommand("getApi");
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitorTrackStats, true); // will auto-set TrackUsage
        await sleep(50);
        await waitForWebviewsIdle();
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


    test("Open Task Usage View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.webview.show.view.taskUsage + tc.slowTime.commands.focusChangeViews);
        await showTeWebview(teWrapper.taskUsageView);
        endRollingCount(this);
    });


    test("Focus Explorer View", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.focusChangeViews);
        await focusExplorerView(teWrapper);
        endRollingCount(this);
    });


    test("Reset Usage", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.usage.reset);
        const usage = teWrapper.usage.getAll();
        const d = teWrapper.usage.onDidChange(() => {});
        d.dispose();
        await teWrapper.usage.reset(aKey as any);
        await teWrapper.usage.reset();
        await teWrapper.usage.reset();
        await teWrapper.storage.update(teWrapper.keys.Storage.Usage, usage);
        await waitForWebviewsIdle();
        endRollingCount(this);
    });


    test("Usage Calls After Reset", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.usage.query * 2);
        teWrapper.usage.getLastRanTaskTime();
        teWrapper.usage.getAvgRunCount ("d", "");
        teWrapper.usage.getAvgRunCount ("w", "");
        endRollingCount(this);
    });

});
