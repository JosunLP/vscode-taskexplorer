
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
// eslint-disable-next-line import/no-extraneous-dependencies
import { runTests } from "@vscode/test-electron";

interface IDictionary<TValue>
{
    [id: string]: TValue;
}

const getTaskTypes = () =>
{
    return [
        "ant", "apppublisher", "bash", "batch", "composer",  "gradle", "grunt", "gulp", "jenkins", "make",
        "maven", "npm", "nsis", "perl", "powershell", "python", "pipenv", "ruby", "tsc", "webpack",  "Workspace"
    ];
};

const getTaskTypeRealName = (taskType: string) =>
{
    taskType = taskType.toLowerCase();
    if (taskType === "workspace") {
        return "Workspace";
    }
    return taskType;
};

const getWsPath = (p: string) => path.normalize(path.resolve(__dirname, "..", "..", "test-fixture", "project1", p));


const createDefaultSettings = async() =>
{   //
    // Enabled / disabled task defaults
    //
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..",  ".." , "package.json")).toString());
    const enabledTasks: IDictionary<boolean> = {};
    getTaskTypes().map(t => getTaskTypeRealName(t)).forEach(t => {
        enabledTasks[t] = packageJson.contributes.configuration[1].properties["taskexplorer.enabledTasks"].default[t];
    });

    return {
        "terminal.integrated.shell.windows": undefined,
        "taskexplorer.enableExplorerView": true,
        "taskexplorer.enableSideBar": true,
        "taskexplorer.enablePersistentFileCaching": false,
        "taskexplorer.enabledTasks": enabledTasks,
        "taskexplorer.pathToPrograms":
        {
            ant: getWsPath("..\\tools\\ant\\bin\\ant.bat"),
            ansicon: getWsPath("..\\tools\\ansicon\\x64\\ansicon.exe"),
            bash: "bash",
            composer: "composer",
            curl: "curl",
            gradle: "c:\\Code\\gradle\\bin\\gradle.bat",
            jenkins: "",
            make: "C:\\Code\\compilers\\c_c++\\9.0\\VC\\bin\\nmake.exe",
            maven: "mvn",
            nsis: "c:\\Code\\nsis\\makensis.exe",
            perl: "perl",
            pipenv: "pipenv",
            powershell: "powershell",
            python: "c:\\Code\\python\\python.exe",
            ruby: "ruby"
        },
        "taskexplorer.logging.enable": false,
        "taskexplorer.logging.level": 1,
        "taskexplorer.logging.enableFile": false,
        "taskexplorer.logging.enableFileSymbols": false,
        "taskexplorer.logging.enableOutputWindow": false,
        "taskexplorer.specialFolders.numLastTasks": 10,
        "taskexplorer.specialFolders.showFavorites": true,
        "taskexplorer.specialFolders.showLastTasks": true,
        "taskexplorer.specialFolders.showUserTasks": true,
        "taskexplorer.specialFolders.folderState": {
            favorites: "Expanded",
            lastTasks: "Expanded",
            userTasks: "Expanded"
        },
        "taskexplorer.taskButtons.clickAction": "Open",
        "taskexplorer.taskButtons.showFavoritesButton": true,
        "taskexplorer.taskButtons.showExecuteWithArgumentsButton": false,
        "taskexplorer.taskButtons.showExecuteWithNoTerminalButton": false,
        "taskexplorer.visual.disableAnimatedIcons": true,
        "taskexplorer.enableAnsiconForAnt": false,
        "taskexplorer.groupMaxLevel": 1,
        "taskexplorer.groupSeparator": "-",
        "taskexplorer.groupWithSeparator": true,
        "taskexplorer.groupStripTaskLabel": true,
        "taskexplorer.exclude": [],
        "taskexplorer.includeAnt": [], // Deprecated, use `globPatternsAnt`
        "taskexplorer.globPatternsAnt": [ "**/test.xml", "**/emptytarget.xml", "**/emptyproject.xml", "**/hello.xml" ],
        "taskexplorer.keepTermOnStop": false,
        "taskexplorer.showHiddenWsTasks": true,
        "taskexplorer.showRunningTask": true,
        "taskexplorer.useGulp": false,
        "taskexplorer.useAnt": false,
        "taskexplorer.taskMonitor.timerMode": "MM:SS:MS",
        "taskexplorer.taskMonitor.trackStats": true,
        "taskexplorer.trackUsage": true
    };
};

const main = async(args: string[]) =>
{
    let failed = false;
    let multiRoot = false;

    const extensionDevelopmentPath = path.resolve(__dirname, "../../"), // The folder containing the Extension Manifest package.json
          extensionTestsPath = path.resolve(__dirname, "./suite"),        // The path to test runner - Passed to --extensionTestsPath
          distPath = path.join(extensionDevelopmentPath, "dist"),
          testWorkspaceSingleRoot = path.resolve(__dirname, path.join("..", "..", "test-fixture", "project1")),
          testWorkspaceMultiRoot = path.resolve(__dirname, path.join("..", "..", "test-fixture")),
          vscodeTestUserDataPath = path.join(extensionDevelopmentPath, ".vscode-test", "user-data"),
          project1Path = testWorkspaceSingleRoot,
          // project2Path = path.join(testWorkspaceMultiRoot, "project2"),
          pkgJsonPath = path.resolve(__dirname, path.join(extensionDevelopmentPath, "package.json")),
          pkgJson = fs.readFileSync(pkgJsonPath, "utf8"),
          pkgJso = JSON.parse(pkgJson),
          vsCodeTestVersion = pkgJso.engines.vscode.replace(/[^0-9a-z\-\.]/g, ""),
          projectSettingsFile = path.join(project1Path, ".vscode", "settings.json"),
          multiRootWsFile = path.join(testWorkspaceMultiRoot, "tests.code-workspace"),
          isWebpackBuild = fs.existsSync(path.join(distPath, "vendor.js")),
          defaultSettings = await createDefaultSettings();

    const mwsConfig: IDictionary<any> = {
        folders: [
        {
            name: "project1",
            path: "project1"
        },
        {
            name: "project2",
            path: "project2"
        }],
        settings: defaultSettings
    };

    try
    {
        const xArgs: string[] = [],
              testsArgs: string[] = [];
        if (args && args.length > 0)
        {
            console.log("Arguments: " + args.toString());
            args.forEach((a) =>
            {
                if (a.startsWith("-"))
                {
                    xArgs.push(a);
                    if (a === "--multi-root") {
                        multiRoot = true;
                    }
                }
                else {
                    testsArgs.push(a);
                }
            });
        }
        else {
            console.log("Arguments: None");
        }

        console.log("clear package.json activation event");
        execSync("sh ./enable-full-coverage.sh", { cwd: "script" });
        if (!isWebpackBuild) {
            // execSync("sh ./set-main-entry.sh", { cwd: "script" });
        }

        //
        // Clear workspace settings file if it exists
        //
        // let settingsJsonOrig: string | undefined;
        if (!multiRoot) {
            fs.writeFileSync(projectSettingsFile, JSON.stringify(defaultSettings));
        }
        else {
            fs.writeFileSync(multiRootWsFile, JSON.stringify(mwsConfig, null, 4));
        }

        //
        // Copy a "User Tasks" file
        //
        if (!fs.existsSync(path.join(vscodeTestUserDataPath, "User"))) {
            fs.mkdirSync(path.join(vscodeTestUserDataPath, "User"));
        }
        fs.copyFileSync(path.join(testWorkspaceMultiRoot, "user-tasks.json"), path.join(vscodeTestUserDataPath, "User", "tasks.json"));

        //
        // const runCfg = await runConfig();

        // //
        // // Install ExtJS extension
        // //
        // const vscodeExecutablePath = await downloadAndUnzipVSCode("1.35.0")
		// const [ cli, ...args ] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
		// spawnSync(cli, [ ...args, "--install-extension", "spmeesseman.vscode-extjs" ], {
		// 	encoding: "utf-8",
		// 	stdio: "inherit"
		// });

        // if (process.platform === "win32") {
		// 	await runTests({
		// 		extensionDevelopmentPath,
		// 		extensionTestsPath,
		// 		version: "1.40.0",
		// 		platform: "win32-x64-archive"
		// 	});
		// }

        //
        // Download VS Code, unzip it and run the integration test
        //
        const testsWorkspace = !multiRoot ? testWorkspaceSingleRoot : multiRootWsFile;
        await runTests(
        {
            version: vsCodeTestVersion,
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                testsWorkspace,
                "--disable-extensions",
                "--disable-workspace-trust"
            ],
            extensionTestsEnv: {
                xArgs: JSON.stringify(xArgs),
                testArgs: JSON.stringify(testsArgs),
                vsCodeTestVersion,
                testsMachineId: process.env.VSC_TESTS_MACHINEID
            }
        }); // --upload-logs could be interesting (for prod).  look at it sometime.
    }
    catch (err: any) {
        console.error(`Failed to run tests: ${err}\n${err.stack ?? "No call stack details found"}`);
        failed = true;
    }
    finally
    {   try //
        {   // Log file - whats a good way to open it in the active vscode instance???
            //
            // let logFile: string | undefined;
            // if (testControl.log.enabled && testControl.log.file && testControl.log.openFileOnFinish)
            // {
            //     let lastDateModified: Date | undefined;
            //     const tzOffset = (new Date()).getTimezoneOffset() * 60000,
            //         dateTag = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1).split("T")[0].replace(/[\-]/g, ""),
            //         vscodeLogPath = path.join(vscodeTestUserDataPath, "logs");
            //     const paths = await findFiles(`**/spmeesseman.vscode-taskexplorer/taskexplorer-${dateTag}.log`,
            //     {
            //         nocase: false,
            //         ignore: "**/node_modules/**",
            //         cwd: vscodeLogPath
            //     });
            //     for (const relPath of paths)
            //     {
            //         const fullPath = path.join(vscodeLogPath, relPath),
            //             dateModified = await getDateModified(fullPath);
            //         if (dateModified && (!lastDateModified || dateModified.getTime() > lastDateModified.getTime()))
            //         {
            //             logFile = fullPath;
            //             lastDateModified = dateModified;
            //         }
            //     }
            //     if (logFile) {
            //         const code = path.join(process.env.CODE_HOME || "c:\\Code", "Code.exe");
            //         // execSync(`cmd /c ${code} "${logFile}" --reuse-window`, { cwd: extensionDevelopmentPath, stdio: "ignore" });//.unref();
            //     }
            // }
            //
            // Restore
            //
            console.log("restore package.json activation event");
            // execSync(`enable-full-coverage.sh --off${logFile ? ` --logfile "${logFile}` : ""}"`, { cwd: "script" });
            execSync("sh ./enable-full-coverage.sh --off", { cwd: "script" });
            if (!isWebpackBuild) {
                // execSync("sh ./set-main-entry.sh --off", { cwd: "script" });
            }
            // if (settingsJsonOrig && !testControl.keepSettingsFileChanges) {
            // if (!testControl.keepSettingsFileChanges)
            // {
                console.log("restore tests workspace settings file settings.json");
                if (!multiRoot)
                {
                    fs.writeFileSync(projectSettingsFile, JSON.stringify(
                    {
                        "taskexplorer.exclude": [
                            "**/tasks_test_ignore_/**",
                        ],
                        "taskexplorer.globPatternsAnt": [
                            "**/hello.xml"
                        ]
                    }, null, 4));
                }
                else
                {
                    mwsConfig.settings = {
                        "taskexplorer.exclude": [
                            "**/tasks_test_ignore_/**",
                        ],
                        "taskexplorer.globPatternsAnt": [
                            "**/hello.xml"
                        ]
                    };
                    fs.writeFileSync(multiRootWsFile, JSON.stringify(mwsConfig, null, 4));
                }
            // }
            console.log("delete any leftover temporary files and/or directories");
            fs.rmSync(path.join(project1Path, "tasks_test_"), { recursive: true });
            fs.rmSync(path.join(project1Path, "tasks_test_ignore_"), { recursive: true });
        }
        catch {}

        if (failed) {
            process.exit(1);
        }
    }
};

main(process.argv.slice(2));
