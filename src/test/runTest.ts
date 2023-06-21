/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */

import * as fs from "fs";
import * as path from "path";

let cd: string | undefined;
const extensionDevelopmentPath = path.resolve(__dirname, "../../");
if (process.cwd() !== extensionDevelopmentPath) {
    cd = process.cwd();
    process.chdir(extensionDevelopmentPath);
}

import { execSync } from "child_process";
import { runTests } from "@vscode/test-electron";


const main = async () =>
{
    if (!process.env.VSC_TESTS_MACHINEID)
    {
        consoleWrite("The environment variable VSC_TESTS_MACHINEID was not found", figures.color.warning);
        consoleWrite("   Ensure it is set in the System Environment to the development machine's VSCode.machineID", figures.color.warning);
        consoleWrite("   All instances of VSCode must be closed and then re-opened to pick up any new or changed env var", figures.color.warning);
        consoleWrite("Exiting", figures.color.warning);
        process.exit(1);
    }

    consoleWrite(logSep);
    consoleWrite("Test Runner Initializing");
    consoleWrite(`   extension development path  : ${extensionDevelopmentPath}`);
    if (cd) {
        consoleWrite(`   previous working directory  : ${process.cwd()}`);
    }

    let failed = false,
        multiRoot = false;

    const extensionTestsPath = path.resolve(__dirname, "./run"),
          distPath = path.join(extensionDevelopmentPath, "dist"),
          testWorkspaceSingleRoot = path.resolve(__dirname, path.join("..", "..", "test-fixture", "project1")),
          testWorkspaceMultiRoot = path.resolve(__dirname, path.join("..", "..", "test-fixture")),
          vscodeTestUserDataPath = path.join(extensionDevelopmentPath, ".vscode-test", "user-data"),
          project1Path = testWorkspaceSingleRoot,
          project2Path = path.join(testWorkspaceMultiRoot, "project2"),
          pkgJsonPath = path.resolve(__dirname, path.join(extensionDevelopmentPath, "package.json")),
          pkgJson = fs.readFileSync(pkgJsonPath, "utf8"),
          pkgJso = JSON.parse(pkgJson),
          vsCodeTestVersion = pkgJso.engines.vscode.replace(/[^0-9a-z\-\.]/g, ""),
          projectSettingsFile = path.join(project1Path, ".vscode", "settings.json"),
          multiRootWsFile = path.join(testWorkspaceMultiRoot, "tests.code-workspace"),
          isWebpackBuild = fs.existsSync(path.join(distPath, "vendor.js")),
          defaultSettings = await createDefaultSettings(pkgJso);


    consoleWrite(logSep);
    consoleWrite("Runtime parameters");
    consoleWrite(`   vscode test version     : ${vsCodeTestVersion}`);
    consoleWrite(`   single root             : ${testWorkspaceSingleRoot}`);
    consoleWrite(`   multi root              : ${testWorkspaceMultiRoot}`);
    consoleWrite(`   extension tests path    : ${extensionTestsPath}`);
    consoleWrite(`   user data path          : ${vscodeTestUserDataPath}`);
    consoleWrite(`   project 1 path          : ${project1Path}`);
    consoleWrite(`   project 2 path          : ${project2Path}`);
    consoleWrite(`   dist path               : ${distPath}`);
    consoleWrite(`   project settings file   : ${projectSettingsFile}`);
    consoleWrite(`   multi-root ws file      : ${multiRootWsFile}`);
    consoleWrite(logSep);

    const mwsConfig: Record<string, any> =
    {
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
        const args = process.argv.slice(2),
              xArgs: string[] = [],
              testsArgs: string[] = [];
        if (args && args.length > 0)
        {
            consoleWrite("   arguments                   : " + args.join(", "));
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
            consoleWrite("   xargs                       : " + xArgs.join(", "));
            consoleWrite("   testargs                    : " + testsArgs.join(", "));
        }
        else {
            consoleWrite("   arguments                   : none");
        }

        consoleWrite("clear package.json activation event");
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

        consoleWrite(logSep);

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
        consoleWrite(`Failed to run tests: ${err}\n${err.stack ?? "No call stack details found"}`, figures.color.error);
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
            consoleWrite("restore package.json activation event");
            // execSync(`enable-full-coverage.sh --off${logFile ? ` --logfile "${logFile}` : ""}"`, { cwd: "script" });
            execSync("sh ./enable-full-coverage.sh --off", { cwd: "script" });
            if (!isWebpackBuild) {
                // execSync("sh ./set-main-entry.sh --off", { cwd: "script" });
            }
            // if (settingsJsonOrig && !testControl.keepSettingsFileChanges) {
            // if (!testControl.keepSettingsFileChanges)
            // {
                consoleWrite("restore tests workspace settings file settings.json");
                if (!multiRoot)
                {
                    fs.writeFileSync(projectSettingsFile, JSON.stringify(
                    {
                        "taskexplorer.exclude": [
                            "**/tasks_test_ignore_/**",
                            "**/dbg/**"
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
                            "**/dbg/**"
                        ],
                        "taskexplorer.globPatternsAnt": [
                            "**/hello.xml"
                        ]
                    };
                    fs.writeFileSync(multiRootWsFile, JSON.stringify(mwsConfig, null, 4));
                }
            // }
            consoleWrite("delete any leftover temporary files and/or directories");
            fs.rmSync(path.join(project1Path, "tasks_test_"), { recursive: true });
            fs.rmSync(path.join(project1Path, "tasks_test_ignore_"), { recursive: true });
        }
        catch {}

        if (failed) {
            process.exit(1);
        }
    }
};

const colors = {
    white: [ 37, 39 ],
    grey: [ 90, 39 ],
    blue: [ 34, 39 ],
    cyan: [ 36, 39 ],
    green: [ 32, 39 ],
    magenta: [ 35, 39 ],
    red: [ 31, 39 ],
    yellow: [ 33, 39 ]
};

const withColor = (msg: string, color: number[]) => "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m";

const figures =
{
    withColor,
    success: "✔",
    info: "ℹ",
	warning: "⚠",
	error: "✘",
    color:
    {
        success: withColor("✔", colors.green),
        successBlue: withColor("✔", colors.blue),
        info: withColor("ℹ", colors.magenta),
        infoTask: withColor("ℹ", colors.blue),
        warning: withColor("⚠", colors.yellow),
        warningTests: withColor("⚠", colors.blue),
        error: withColor("✘", colors.red),
        errorTests: withColor("✘", colors.blue)
    }
};

const logSep = "----------------------------------------------------------------------------------------------------";

const consoleWrite = (msg: string, icon?: string, pad = "") =>
    console.log(`     ${pad}${icon || figures.color.info}${msg ? " " + figures.withColor(msg, colors.grey) : ""}`);

const getTaskTypes = () =>
{
    return [
        "ant", "apppublisher", "bash", "batch", "composer",  "gradle", "grunt", "gulp", "jenkins", "make",
        "maven", "node", "npm", "nsis", "perl", "powershell", "python", "pipenv", "ruby", "tsc", "webpack",  "Workspace"
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

const createDefaultSettings = async(packageJson: any) =>
{   //
    // Enabled / disabled task defaults
    //
    const enabledTasks: Record<string, boolean> = {};
    getTaskTypes().map(t => getTaskTypeRealName(t)).forEach(t => {
        enabledTasks[t] = packageJson.contributes.configuration[1].properties["taskexplorer.enabledTasks"].default[t];
    });

    const exclude = [ ...packageJson.contributes.configuration[2].properties["taskexplorer.exclude"].default ];
    exclude.slice().reverse().forEach((item, index, object) =>
    {
        if (item.includes("test")) {
            exclude.splice(object.length - 1 - index, 1);
        }
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
        "taskexplorer.exclude": exclude,
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

main().catch((e: any) => { try { console.error(e.message); } catch (_) {}  process.exit(1); });
