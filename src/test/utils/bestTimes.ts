

import { testControl as tc } from "../control";
import { teWrapper } from "./utils";

const tct = tc.tests;
const timeSep = "----------------------------------------------------------------------------------------------------";

const properCase = (name: string | undefined, removeSpaces?: boolean) =>
{
    if (!name) {
      return "";
    }
    return name.replace(/(?:^\w|[A-Z]|\b\w)/g, (ltr) => ltr.toUpperCase()).replace(/[ ]+/g, !removeSpaces ? " " : "");
};

const lowerCaseFirstChar = (s: string, removeSpaces: boolean) =>
{
    let fs = "";
    if (s)
    {
        fs = s[0].toString().toLowerCase();
        if (s.length > 1) {
            fs += s.substring(1);
        }
        if (removeSpaces) {
            fs = fs.replace(/ /g, "");
        }
    }
    return fs;
};



const clearProcessTimeStorage = async (storageKey: string, numTests: number) =>
{
    const _clr = async () => {
        await teWrapper.storage.update2(storageKey, undefined);
        await teWrapper.storage.update2(storageKey + "Fmt", undefined);
        await teWrapper.storage.update2(storageKey + "NumTests", undefined);
    };
    if (tct.clearBestTime || tct.clearAllBestTimes)
    {
        await _clr();
    }
    else if (tct.clearBestTimesOnTestCountChange)
    {
        const prevNumTests = await teWrapper.storage.get2<number>(storageKey + "NumTests", 0);
        if (prevNumTests < numTests) {
            await _clr();
        }
    }
};


const getStorageKey = (baseKey: string) => baseKey + (tc.isMultiRootWorkspace ? "MWS" : "");


export const getSuiteFriendlyName = (suiteName: string) => suiteName.replace(" Tests", "");


export const getSuiteKey = (suiteName: string, preKey = "") =>
{
    if (preKey) {
        return preKey + properCase(suiteName.replace(" Tests", "")).replace(/[ \W]/g, "");
    }
    return lowerCaseFirstChar(properCase(suiteName.replace(" Tests", "")), true).replace(/\W/g, "");
};


const getTimeElapsedFmt = (timeElapsed: number) =>
{
    const m = Math.floor(timeElapsed / 1000 / 60),
          s = Math.floor(timeElapsed / 1000 % 60),
          ms = Math.round(timeElapsed % 1000);
    return `${m} minutes, ${s} seconds, ${ms} milliseconds`;
};


const logBestTime = async (title: string, storageKey: string, timeElapsedFmt: string) =>
{
    let msg: string;
    let wsTypeMsg = tc.isMultiRootWorkspace ? "multi-root" : "single-root";
    const prevBestTimeElapsedFmt = await teWrapper.storage.get2<string>(storageKey + "Fmt", ""),
          prevMsg = ` The previous fastest time recorded for a ${wsTypeMsg} workspace was ${prevBestTimeElapsedFmt}`,
          preMsg = `    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("!!!", teWrapper.figures.colors.cyan)}`;
    wsTypeMsg = tc.isMultiRootWorkspace ? "Multi-Root" : "Single-Root";
    if (title)
    {
        if (title.includes("Logging")) {
            msg = ` New Fastest Time with ${title} (${wsTypeMsg} workspace) ${teWrapper.figures.withColor(timeElapsedFmt, teWrapper.figures.colors.cyan)}`;
        }
        else {
            if (tct.numSuites > 1) {
                msg = ` New Fastest Time for Suite '${title}' (${wsTypeMsg} workspace) ${teWrapper.figures.withColor(timeElapsedFmt, teWrapper.figures.colors.cyan)}`;
            }
            else {
                msg = ` New Fastest Time for Suite '${title}' (Single Test)(${wsTypeMsg} workspace) ${teWrapper.figures.withColor(timeElapsedFmt, teWrapper.figures.colors.cyan)}`;
            }
        }
    }
    else {
        msg = ` New Fastest Time for 'All Tests' (${wsTypeMsg} workspace) ${teWrapper.figures.withColor(timeElapsedFmt, teWrapper.figures.colors.cyan)}`;
    }
    // console.log(preMsg);
    console.log(preMsg + teWrapper.figures.withColor(msg, teWrapper.figures.colors.grey));
    console.log(preMsg + teWrapper.figures.withColor(prevMsg, teWrapper.figures.colors.grey));
    // console.log(preMsg);
};


const processBestTime = async (logTitle: string, storageKey: string, timeElapsed: number, numTests: number) =>
{
    const title = !logTitle || logTitle.includes("Logging") ? "All Tests " + logTitle : logTitle,
          msg = (teWrapper.figures.withColor("-- ", teWrapper.figures.colors.magenta) +
                 teWrapper.figures.withColor(title.toUpperCase(), teWrapper.figures.colors.white) +
                 teWrapper.figures.withColor(` ${timeSep.substring(0, timeSep.length - title.length - 4)}`, teWrapper.figures.colors.magenta));
    console.log(`    ${teWrapper.figures.color.info} ${msg}`);

    await clearProcessTimeStorage(storageKey, numTests);

    let bestTimeElapsed = await teWrapper.storage.get2<number>(storageKey, 0);
    if (bestTimeElapsed === 0) {
        bestTimeElapsed = timeElapsed + 1;
    }

    const timeElapsedFmt = getTimeElapsedFmt(timeElapsed);
    if (timeElapsed > 0 && timeElapsed < bestTimeElapsed)
    {
        await logBestTime(logTitle, storageKey, timeElapsedFmt);
        await saveProcessTimeToStorage(storageKey, timeElapsed, timeElapsedFmt, numTests);
    }
    else {
        const wsTypeMsg = tc.isMultiRootWorkspace ? "multi-root" : "single-root";
        const bestTimeElapsedFmt = await teWrapper.storage.get2<string>(storageKey + "Fmt", ""),
              msg1 = `The time elapsed was ${timeElapsedFmt}`,
              msg2 = timeElapsed > 0 ? `The fastest time recorded for a ${wsTypeMsg} workspace is ${bestTimeElapsedFmt}` :
                                       "Best time tracking not available for tests running at 0 ms";
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor(msg1, teWrapper.figures.colors.grey)}`);
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor(msg2, teWrapper.figures.colors.grey)}`);
    }
};


const processSuiteTimes = async () =>
{
    const suiteResults = Object.values(tct.suiteResults).filter(v => v.suiteName !== "Deactivate Extension");
    for (const suiteResult of suiteResults)
    {
        const typeKey = tct.numSuites === 1 ? "Single" : "",
              storageKey = getSuiteKey(suiteResult.suiteName, getStorageKey("bestTimeElapsedSuite" + typeKey));
        if (tct.clearAllBestTimes) {
            await clearProcessTimeStorage(storageKey, tct.numTests);
        }
        if (suiteResult.timeFinished && suiteResult.timeStarted)
        {
            const timeElapsed = suiteResult.timeFinished - suiteResult.timeStarted;
            await processBestTime(suiteResult.suiteName, storageKey, timeElapsed, tct.numTests);
        }
    }
};


const processTimesWithLogEnabled = async (timeElapsed: number) =>
{
    if (tct.clearAllBestTimes)
    {
        await clearProcessTimeStorage(getStorageKey("bestTimeElapsedWithLogging"), tct.numTests);
        await clearProcessTimeStorage(getStorageKey("bestTimeElapsedWithLoggingFile"), tct.numTests);
        await clearProcessTimeStorage(getStorageKey("bestTimeElapsedWithLoggingOutput"), tct.numTests);
        await clearProcessTimeStorage(getStorageKey("bestTimeElapsedWithLoggingConsole"), tct.numTests);
    }
    if (tc.log.enabled)
    {
        await processBestTime("Logging Enabled", getStorageKey("bestTimeElapsedWithLogging"), timeElapsed, tct.numTests);
        if (tc.log.file)
        {
            await processBestTime("File Logging Enabled", getStorageKey("bestTimeElapsedWithLoggingFile"), timeElapsed, tct.numTests);
        }
        if (tc.log.output)
        {
            await processBestTime("Output Window Logging Enabled", getStorageKey("bestTimeElapsedWithLoggingOutput"), timeElapsed, tct.numTests);
        }
        if (tc.log.console)
        {
            await processBestTime("Console Logging Enabled", getStorageKey("bestTimeElapsedWithLoggingConsole"), timeElapsed, tct.numTests);
        }
    }
};


export const processTimes = async (timeStarted: number, hadRollingCountError: boolean) =>
{
    const timeFinished = Date.now(),
          timeElapsed = timeFinished - timeStarted,
          tzOffset = (new Date()).getTimezoneOffset() * 60000,
          timeFinishedFmt = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1).replace("T", " ").replace(/[\-]/g, "/");

    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Time Finished: " + timeFinishedFmt, teWrapper.figures.colors.grey)}`);
    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor("Time Elapsed: " + getTimeElapsedFmt(timeElapsed), teWrapper.figures.colors.grey)}`);

    if (tct.numTestsFail === 0 && !hadRollingCountError)
    {
        if (tct.numSuites > 3)  { // > 3, sometimes i string the single test together with a few others temp
            await processBestTime("", getStorageKey("bestTimeElapsed"), timeElapsed, tct.numTests);
            await processTimesWithLogEnabled(timeElapsed);
        }
        await processSuiteTimes();
    }
    else {
        const skipMsg = tct.numTestsFail > 0 ?
                            `There were ${tct.numTestsFail} failed tests, best time processing skipped` :
                            "There was a rolling count failure, best time processing skipped";
        console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor(skipMsg, teWrapper.figures.colors.grey)}`);
    }

    console.log(`    ${teWrapper.figures.color.info} ${teWrapper.figures.withColor(timeSep, teWrapper.figures.colors.magenta)}`);
};


const saveProcessTimeToStorage = async (key: string, timeElapsed: number, timeElapseFmt: string, numTests: number) =>
{
    await teWrapper.storage.update2(key, timeElapsed);
    await teWrapper.storage.update2(key + "Fmt", timeElapseFmt);
    await teWrapper.storage.update2(key + "NumTests", numTests);
};

