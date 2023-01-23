
// eslint-disable-next-line import/no-extraneous-dependencies
import { IDictionary } from "@spmeesseman/vscode-taskexplorer-types";

export const testControl: ITestControl =
{   //
    // KEEP SETTINGS FILE CHANGES (@ test-files/.vscode/workspace.json)
    //
    keepSettingsFileChanges: false,
    //
    // Global settings that will get set/unset
    //
    vsCodeAutoDetectGrunt: "off",
    vsCodeAutoDetectGulp: "off",
    //
    // Default command shell to use
    //
    defaultWindowsShell: undefined,
    // defaultWindowsShell: "C:\\Windows\\System32\\cmd.exe",
    //
    // LOGGING DEFAULTS
    //
    log: {
        level: 2,
        enabled: false,
        errors: false,           // print errors to console regardless if logging is enabled or not
        console: false,
        consoleLevel: 1,
        file: false,
        fileSymbols: false,
        output: false,          // enabled automatically if enabled is `true` and all 3 output flags are `false`
        openFileOnFinish: true, // nope. not yet
        blockScaryColors: true
    },
    //
    // Rolling success count and failure flag
    //
    tests: {
        clearAllBestTimes: false,
        clearBestTime: false,
        clearBestTimesOnTestCountChange: false,
        numSuites: 0,
        numSuitesFail: 0,
        numSuitesSuccess: 0,
        numTests: 0,
        numTestsFail: 0,
        numTestsSuccess: 0,
        suiteResults: {}
    },
    //
    // These 2 properties are for using update() for coverage, see helper.initSettings
    //
    user: {
        logLevel: 1,
        pathToAnt: "c:\\Code\\ant\\bin\\ant.bat",
        pathToAnsicon: "c:\\Code\\ansicon\\x64\\ansicon.exe"
    },
    //
    // SLOW TIMES (TESTS MARKED RED WHEN EXCEEDED)
    // Slow times are generally 2x the amount of time the command "should" take.  Mocha
    // considers slow at 50% of MochaContext.slow() for each test instance, and coverage
    // markers significantly reduce the overall speed of everything.
    //
    slowTime: {
        addWorkspaceFolder: 3200,
        buildTreeNoTasks: 295,
        cache: {
            build: 600,
            buildCancel: 290,
            rebuild: 4700,
            rebuildCancel: 490,
            rebuildNoChanges: 900,
        },
        closeActiveDocument: 20,
        command: 680,
        commandFast: 265,
        config: {
            event: 270,
            eventFast: 90,
            registerExplorerEvent: 390,
            disableEvent: 1125,
            enableEvent: 1860,
            enableEventWorkspace: 1950,
            excludesEvent: 1915,
            excludeTasksEvent: 2820,
            globEvent: 1140,
            groupingEvent: 1000,
            pathToProgramsEvent: 700,
            showHideSpecialFolder: 340,
            showHideUserTasks: 1030,
            readEvent: 25,
            sortingEvent: 700
        },
        excludeCommand: 1500,
        explorerViewStartup: 7575,
        fetchTasksCommand: 1880,
        fileCachePersist: 275,
        findTaskPosition: 440,
        findTaskPositionDocOpen: 50,
        focusCommand: 2340,
        focusCommandAlreadyFocused: 320,
        focusCommandChangeViews: 90,
        fs: {
            createEvent: 1600,
            createEventTsc: 1750,
            createFolderEvent: 1650,
            deleteEvent: 1340,
            deleteEventTsc: 1630,
            deleteFolderEvent: 1440,
            modifyEvent: 960,
        },
        getTreeTasks: 195,
        getTreeTasksNpm: 520, // npm task provider is slower than shit on a turtle
        licenseMgr: {
            page: 150,
            pageWithDetail: 325,
            downCheck: 350,
            enterKey: 845,
            localCheck: 1825,
            localStartServer: 1195,
            remoteCheck: 2315,
            remoteStartServer: 3625,
            serverDownHostUp: 14100,
            setLicenseCmd: 210
        },
        min: 50,
        refreshCommand: 7720,
        refreshCommandNoChanges: 250,
        removeWorkspaceFolder: 2500,
        runCommand: 4900,
        runPauseCommand: 3255,
        runStopCommand: 3510,
        storageRead: 55,
        storageUpdate: 60,
        storageSecretRead: 90,
        storageSecretUpdate: 195,
        taskCommand: 1250,
        taskCommandStartupMax: 3700,
        taskProviderReadUri: 90,
        tasks: {
            antParser: 710,
            antTask: 5340,
            antTaskWithAnsicon: 5390,
            bashScript: 3025,
            batchScriptBat: 4250,
            batchScriptCmd: 5250,
            gulpParser: 3875,
            npmCommand: 12300,
            npmCommandPkg: 9700,
            npmInstallCommand: 12900
        },
        taskCount: {
            verify: 530,
            verifyByTree: 580,
            verifyFirstCall: 840,
            verifyNpm: 1900, // internal vscode npm task provider is slower than shit wtf
            verifyWorkspace: 2200,
        },
        viewReport: 410
    },
    //
    // WAIT TIMES (MAX TIME IS USUALLY ~ SLOW TIME, OR waitTime.max)
    //
    waitTime:
    {   //
        // MINIMUM WAIT TIMES
        //
        addWorkspaceFolder: 145,
        command: 70,
        commandFast: 45,
        config: {
            event: 75,
            eventFast: 40,
            excludesEvent: 95,
            excludeTasksEvent: 145,
            disableEvent: 105,
            enableEvent: 125,
            globEvent: 105,
            groupingEvent: 95,
            registerExplorerEvent: 130,
            showHideSpecialFolder: 95,
            showHideUserTasks: 105,
            sortingEvent: 95
        },
        explorerViewStartup: 2000,
        focusCommand: 220,
        fs: {
            createEvent: 180,
            createFolderEvent: 195,
            deleteEvent: 175,
            deleteFolderEvent: 185,
            modifyEvent: 170
        },
        getTreeMin: 170,
        getTreeTasks: 50,
        min: 35,
        npmCommandMin: 1200,
        refreshCommand: 140,
        refreshCommandNoChanges: 75,
        refreshTaskTypeCommand: 125,
        removeWorkspaceFolder: 115,
        runCommandMin: 500,
        taskCommand: 450,
        verifyTaskCountRetry: 70,
        verifyTaskCountRetryInterval: 100,
        viewReport: 80,
        //
        // MAXIMUM WAIT TIMES
        //
        max: 15000,
        runCommandMax: 3400,
        waitTimeForNpmCommandMax: 12000
    }
};


interface ISuiteResults extends IDictionary<any>
{
    timeStarted: number;
    numTests: number;
    successCount: number;
    suiteName: string;
    success: boolean;
    timeFinished: number;
    numTestsFailed: number;
}


export interface ITestControl
{   //
    // KEEP SETTINGS FILE CHANGES (@ test-files/.vscode/workspace.json)
    //
    keepSettingsFileChanges: boolean;
    //
    // Global settings that will get set/unset
    //
    vsCodeAutoDetectGrunt: "on" | "off";
    vsCodeAutoDetectGulp: "on" | "off";
    //
    //
    //
    defaultWindowsShell: string | undefined;
    //
    // LOGGING DEFAULTS
    //
    log: {
        level: 1 | 2 | 3 | 4 | 5;
        enabled: boolean;
        errors: boolean;
        console: boolean;
        consoleLevel: 1 | 2 | 3 | 4 | 5;
        file: boolean;
        fileSymbols: boolean;
        output: boolean;
        openFileOnFinish: boolean; // not yet
        blockScaryColors: boolean;
    };
    //
    // Rolling success count and failure flag
    //
    tests: {
        clearAllBestTimes: boolean;
        clearBestTime: boolean;
        clearBestTimesOnTestCountChange: boolean;
        numSuites: number;
        numSuitesFail: number;
        numSuitesSuccess: number;
        numTests: number;
        numTestsFail: number;
        numTestsSuccess: number;
        suiteResults: IDictionary<ISuiteResults>;
    };
    //
    // These 2 properties are for using update() for coverage; see helper.initSettings
    //
    user: {
        logLevel: number;
        pathToAnt: string;
        pathToAnsicon: string;
    };
    //
    // SLOW TIMES (TESTS MARKED RED WHEN EXCEEDED)s
    //
    slowTime: {
        addWorkspaceFolder: number;
        buildTreeNoTasks: number;
        cache: {
            build: number;
            buildCancel: number;
            rebuild: number;
            rebuildCancel: number;
            rebuildNoChanges: number;
        };
        closeActiveDocument: number;
        command: number;
        commandFast: number;
        config: {
            event: number;
            eventFast: number;
            registerExplorerEvent: number;
            disableEvent: number;
            enableEvent: number;
            enableEventWorkspace: number;
            excludesEvent: number;
            excludeTasksEvent: number;
            globEvent: number;
            groupingEvent: number;
            pathToProgramsEvent: number;
            readEvent: number;
            showHideSpecialFolder: number;
            showHideUserTasks: number;
            sortingEvent: number;
        };
        excludeCommand: number;
        explorerViewStartup: number;
        fetchTasksCommand: number;
        fileCachePersist: number;
        findTaskPosition: number;
        findTaskPositionDocOpen: number;
        focusCommand: number;
        focusCommandAlreadyFocused: number;
        focusCommandChangeViews: number;
        fs: {
            createEvent: number;
            createEventTsc: number;
            createFolderEvent: number;
            deleteEvent: number;
            deleteEventTsc: number;
            deleteFolderEvent: number;
            modifyEvent: number;
        };
        getTreeTasks: number;
        getTreeTasksNpm: number; // npm task provider is slower than shit on a turtle
        licenseMgr: {
            page: number;
            pageWithDetail: number;
            downCheck: number;
            enterKey: number;
            localCheck: number;
            localStartServer: number;
            remoteCheck: number;
            remoteStartServer: number;
            serverDownHostUp: number;
            setLicenseCmd: number;
        };
        min: number;
        refreshCommand: number;
        refreshCommandNoChanges: number;
        removeWorkspaceFolder: number;
        runCommand: number;
        runPauseCommand: number;
        runStopCommand: number;
        storageRead: number;
        storageUpdate: number;
        storageSecretRead: number;
        storageSecretUpdate: number;
        taskCommand: number;
        taskCommandStartupMax: number;
        taskProviderReadUri: number;
        tasks: {
            antParser: number;
            antTask: number;
            antTaskWithAnsicon: number;
            bashScript: number;
            batchScriptBat: number;
            batchScriptCmd: number;
            gulpParser: number;
            npmCommand: number;
            npmCommandPkg: number;
            npmInstallCommand: number;
        };
        taskCount: {
            verify: number;
            verifyByTree: number;
            verifyFirstCall: number;
            verifyNpm: number; // internal vscode npm task provider is slower than shit wtf
            verifyWorkspace: number;
        };
        viewReport: number;
    };
    //
    // WAIT TIMES (MAX TIME IS USUALLY ~ SLOW TIME; OR waitTime.max)
    //
    waitTime:
    {   //
        // MINIMUM WAIT TIMES
        //
        addWorkspaceFolder: number;
        command: number;
        commandFast: number;
        config: {
            event: number;
            eventFast: number;
            disableEvent: number;
            enableEvent: number;
            excludesEvent: number;
            excludeTasksEvent: number;
            globEvent: number;
            groupingEvent: number;
            registerExplorerEvent: number;
            showHideSpecialFolder: number;
            showHideUserTasks: number;
            sortingEvent: number;
        };
        explorerViewStartup: number;
        focusCommand: number;
        fs: {
            createEvent: number;
            createFolderEvent: number;
            deleteEvent: number;
            deleteFolderEvent: number;
            modifyEvent: number;
        };
        getTreeMin: number;
        getTreeTasks: number;
        min: number;
        npmCommandMin: number;
        refreshCommand: number;
        refreshCommandNoChanges: number;
        refreshTaskTypeCommand: number;
        removeWorkspaceFolder: number;
        runCommandMin: number;
        taskCommand: number;
        verifyTaskCountRetry: number;
        verifyTaskCountRetryInterval: number;
        viewReport: number;
        //
        // MAXIMUM WAIT TIMES
        //
        max: number;
        runCommandMax: number;
        waitTimeForNpmCommandMax: number;
    };
};
