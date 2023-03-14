
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
{   //
    // Is multi-root workspace - Populated by initSettings() on startup
    //
    isMultiRootWorkspace: false,
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
            rebuildCancel: 675,
            rebuildNoChanges: 880,
        },
        cleanup: 475,
        closeEditors: 25,
        commands: {
            exclude: 1350,
            fast: 250,
            focus: 2330,
            focusAlreadyFocused: 375,
            focusChangeViews: 795,
            focusSideBarFirstTime: 3920,
            openUrl: 1680,
            refresh: 6250,
            refreshNoChanges: 310,
            run: 4750,
            runPause: 3100,
            runStop: 3400,
            showOutput: 880,
            standard: 660,
        },
        config: {
            event: 270,
            eventFast: 90,
            registerExplorerEvent: 435,
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
            shellChange: 1325,
            showHideSpecialFolder: 530,
            showHideUserTasks: 975,
            sortingEvent: 815,
            terminalEvent: 250,
            trackingEvent: 335
        },
        explorerViewStartup: 9500,
        fetchTasksCommand: 350,
        findTaskPosition: 285,
        findTaskPositionDocOpen: 35,
        fs: {
            createEvent: 1550,
            createEventTsc: 1885,
            createFolderEvent: 1600,
            deleteEvent: 1325,
            deleteEventTsc: 1780,
            deleteFolderEvent: 1400,
            modifyEvent: 1140,
            modifyEventAnt: 1200,
            modifyEventTsc: 1220,
        },
        getTreeTasks: 215,
        getTreeTasksNpm: 470, // npm task provider is slower than shit on a turtle
        licenseMgr: {
            page: 2030,
            getTrialExtension: 2175,
            getTrialExtensionDenied: 775,
            getMaxTasks: 365,
            nag: 100,
            purchaseLicense: 1875,
            validateLicense: 2175
        },
        min: 50,
        revealTreeNode: 55,
        storageRead: 15,
        storageUpdate: 25,
        storageSecretRead: 35,
        storageSecretUpdate: 45,
        taskCommand: 950,
        taskProviderReadUri: 90,
        tasks: {
            antParser: 2135,
            antTask: 3300,
            antTaskWithAnsicon: 3375,
            bashScript: 3075,
            batchScriptBat: 4140,
            batchScriptCmd: 5140,
            gulpParser: 3870,
            gulpTask: 3280,
            npmCommand: 8000,
            npmCommandPkg: 7000,
            npmInstallCommand: 8600,
        },
        taskCount: {
            verify: 375,
            verifyByTree: 425,
            verifyFirstCall: 550,
        },
        webview: {
            notify: 955,
            show: {
                view: {
                    home: 2040,
                    taskCount: 825,
                    taskUsage: 775
                },
                page: {
                    releaseNotes: 840,
                    taskDetails: 1765,
                    taskMonitor: 2150,
                    parsingReport: 1125,
                    parsingReportFull: 1890,
                    welcome: 600
                }
            }
        },
        wsFolder: {
            add: 1650,     // bumped for multi-root ws in utils/initSettings
            addEmpty: 1590,
            remove: 550,
            removeEmpty: 475,
            reorder: 540,   // bumped for multi-root ws in utils/initSettings
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
        explorerViewStartup: 1700,
        focusCommand: 210,
        fs: {
            createEvent: 205,
            createFolderEvent: 250,
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
