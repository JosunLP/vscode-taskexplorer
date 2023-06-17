
// eslint-disable-next-line import/no-extraneous-dependencies
import { IDictionary } from "@spmeesseman/vscode-taskexplorer-types";

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

export const testControl =
{
    // apiServer: "localhost",
    apiServer: "license.spmeesseman.com",
    //
    // Is multi-root workspace - Populated by initSettings() on startup
    //
    isMultiRootWorkspace: false,
    //
    // Is single suite test - Populated by utils.activate()
    //
    isSingleSuiteTest: false,
    //
    // KEEP SETTINGS FILE CHANGES (@ test-fixture/project1/.vscode/workspace.json)
    //
    keepSettingsFileChanges: false,
    //
    // Control for waitForTeIdle
    //
    waitForTeIdle: {
        iterations1: 3,
        iterations2: 2,
        sleep: 20,
    },
    //
    // LOGGING DEFAULTS
    //
    log: {
        blockScaryColors: true,
        console: false,
        consoleLevel: 1,
        enabled: false,
        errors: false,          // print errors to console regardless if logging is enabled or not
        file: false,
        fileSymbols: false,
        level: 2,
        openFileOnFinish: true, // not yet. got it working opening a separate vscode instance but not existing one
        output: false,          // enabled automatically if enabled is `true` and all 3 output flags are `false`
        taskExecutionSteps: false,
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
        suiteResults: <ISuiteResults>{},
    },
    //
    // These 2 properties are for using update() for coverage, see helper.initSettings
    //
    user: {
        logLevel: 1,
        pathToAnt: "c:\\Code\\ant\\bin\\ant.bat",
        pathToAnsicon: "c:\\Code\\ansicon\\x64\\ansicon.exe",
    },
    defaultWindowsShell: undefined,
    vsCodeAutoDetectGrunt: false,
    vsCodeAutoDetectGulp: false,
    //
    // SLOW TIMES (TESTS MARKED RED WHEN EXCEEDED)
    // Slow times are generally 2x the amount of time the command "should" take.  Mocha
    // considers slow at 50% of MochaContext.slow() for each test instance, and coverage
    // markers significantly reduce the overall speed of everything.
    //
    //
    // SLOW TIMES (TESTS MARKED RED WHEN EXCEEDED)s
    //
    slowTime:
    {
        cache: {
            build: 485,
            buildCancel: 375,
            persist: 245,
            rebuild: 3825,
            rebuildCancel: 695,
            rebuildNoChanges: 880,
        },
        commands: {
            exclude: 1350,
            fast: 250,
            fetchTasks: 350,
            focus: 2330,
            focusAlreadyFocused: 375,
            focusChangeViews: 815,
            focusSideBarFirstTime: 7670,
            openUrl: 1680,
            refresh: 6250,
            refreshNoChanges: 310,
            run: 4770,
            runPause: 3100,
            runStop: 3420,
            showOutput: 880,
            standard: 660,
        },
        config: {
            event: 270,
            eventFast: 90,
            disableEvent: 1000,
            enableEvent: 1725,
            enableEventWorkspace: 1825,
            excludesEvent: 1775,
            excludeTasksEvent: 2750,
            folderState: 820,
            globEvent: 1125,
            groupingEvent: 1025,
            pathToProgramsEvent: 710,
            readEvent: 25,
            registerExplorerEvent: 535,
            shellChange: 1325,
            showHideSpecialFolder: 550,
            showHideUserTasks: 1855,
            sortingEvent: 815,
            terminalEvent: 250,
            trackingEvent: 510
        },
        fs: {
            createEvent: 1560,
            createEventTsc: 1885,
            createFolderEvent: 1600,
            deleteEvent: 1325,
            deleteEventTsc: 1780,
            deleteFolderEvent: 1400,
            modifyEvent: 1140,
            modifyEventAnt: 1200,
            modifyEventTsc: 1220,
        },
        general: {
            cleanup: 475,
            closeEditors: 95,
            min: 50
        },
        licenseMgr: {
            createNewTrial: 3220,
            getTrialExtension: 2175,
            getTrialExtensionDenied: 910,
            getMaxTasks: 365,
            nag: 100,
            purchaseLicense: 2075,
            submitRegistration: 2085,
            validateLicense: 2175
        },
        storage: {
            read: 15,
            update: 25,
            secretRead: 35,
            secretUpdate: 45
        },
        tasks: {
            antParser: 2135,
            antTask: 3300,
            antTaskWithAnsicon: 3375,
            bashScript: 3075,
            batchScriptBat: 4180,
            batchScriptCmd: 5180,
            command: 950,
            findPosition: 285,
            findPositionDocOpen: 35,
            getTreeTasks: 245,
            getTreeTasksNpm: 470, // npm task provider is slower than shit on a turtle
            gulpParser: 3870,
            gulpTask: 3370,
            npmCommand: 8000,
            npmCommandPkg: 7000,
            npmInstallCommand: 8600,
            providerReadUri: 90,
            count: {
                verify: 385,
                verifyNpmVsCodeProvided: 710,
                verifyByTree: 425,
                verifyFirstCall: 550
            }
        },
        usage: {
            query: 100,
            reset: 385
        },
        webview: {
            closeSync: 390,
            expandView: 1370,
            postMessage: 300,
            revealTreeNode: 55,
            roundTripMessage: 2625,
            show: {
                view: {
                    home: 2610,
                    taskCount: 2460,
                    taskUsage: 2370
                },
                page: {
                    license: 3240,
                    releaseNotes: 2990,
                    taskDetailsScript: 2865,
                    taskDetailsNonScript: 3575,
                    taskMonitor: 3115,
                    parsingReport: 2690,
                    parsingReportFull: 3720,
                    welcome: 1225
                }
            }
        },
        wsFolder: {
            add: 1710,      // bumped for multi-root ws in utils/initSettings
            addEmpty: 1610,
            remove: 600,
            removeEmpty: 525,
            reorder: 590,   // bumped for multi-root ws in utils/initSettings
        },
    },
    //
    // WAIT TIMES (MAX TIME IS USUALLY ~ SLOW TIME, OR waitTime.max)
    //
    waitTime:
    {   //
        // MINIMUM WAIT TIMES
        //
        addWorkspaceFolder: 220,
        blurCommand: 225,
        command: 70,
        commandFast: 45,
        config: {
            event: 75,
            eventFast: 40,
            excludesEvent: 90,
            excludeTasksEvent: 160,
            disableEvent: 100,
            enableEvent: 120,
            globEvent: 105,
            groupingEvent: 95,
            pathToProgramsEvent: 115,
            registerExplorerEvent: 125,
            shellChange: 95,
            showHideSpecialFolder: 95,
            showHideUserTasks: 100,
            sortingEvent: 95,
        },
        focusCommand: 210,
        fs: {
            createEvent: 205,
            createFolderEvent: 270,
            createEventTsc: 275,
            deleteEvent: 200,
            deleteEventTsc: 280,
            deleteFolderEvent: 220,
            modifyEvent: 190,
            modifyEventTsc: 260,
        },
        getTreeTasks: 50,
        licenseMgr: {
            request: 375,
        },
        max: 12000,
        min: 35,
        npmCommandMax: 10000,
        npmCommandMin: 1000,
        refreshCommand: 135,
        refreshCommandNoChanges: 75,
        refreshTaskTypeCommand: 120,
        removeWorkspaceFolder: 185,
        reorderWorkspaceFolders: 100,
        runCommandMin: 425,
        taskCommand: 375,
        viewWebviewPage: 80,
        viewTaskMonitor: 200
    },
};
