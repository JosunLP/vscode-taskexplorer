
import {
    Task, WorkspaceFolder, ShellExecution, Uri, workspace, ShellExecutionOptions
} from "vscode";
import * as path from "path";
import * as util from "./util";
import { configuration } from "./common/configuration";
import { filesCache } from "./cache";
import { TaskExplorerProvider } from "./taskProvider";
import { TaskExplorerDefinition } from "./taskDefinition";


export class ScriptTaskProvider implements TaskExplorerProvider
{
    private cachedTasks: Task[];
    private invalidating = false;

    private scriptTable: any = {
        sh: {
            exec: "",
            type: "bash",
            args: [],
            enabled: configuration.get("enableBash")
        },
        py: {
            exec: configuration.get("pathToPython"),
            type: "python",
            args: [],
            enabled: configuration.get("enablePython")
        },
        rb: {
            exec: configuration.get("pathToRuby"),
            type: "ruby",
            args: [],
            enabled: configuration.get("enableRuby")
        },
        ps1: {
            exec: configuration.get("pathToPowershell"),
            type: "powershell",
            args: [],
            enabled: configuration.get("enablePowershell")
        },
        pl: {
            exec: configuration.get("pathToPerl"),
            type: "perl",
            args: [],
            enabled: configuration.get("enablePerl")
        },
        bat: {
            exec: "cmd",
            type: "batch",
            args: ["/c"],
            enabled: configuration.get("enableBatch")
        },
        cmd: {
            exec: "cmd",
            type: "batch",
            args: ["/c"],
            enabled: configuration.get("enableBatch")
        },
        nsi: {
            exec: configuration.get("pathToNsis"),
            type: "nsis",
            args: [],
            enabled: configuration.get("enableNsis")
        }
    };


    constructor() {
    }


    public async provideTasks()
    {
        util.log("");
        util.log("provide scripts tasks");
        if (!this.cachedTasks) {
            this.cachedTasks = await this.detectScriptFiles();
        }
        return this.cachedTasks;
    }


    public resolveTask(_task: Task): Task | undefined {
        return undefined;
    }


    public async invalidateTasksCache(opt?: Uri): Promise<void>
    {
        util.log("");
        util.log("invalidate script tasks cache");
        util.logValue("   uri", opt?.path, 2);
        util.logValue("   has cached tasks", !!this.cachedTasks, 2);

        await this.wait();
        this.invalidating = true;

        if (opt && this.cachedTasks)
        {
            const rmvTasks: Task[] = [];
            const folder = workspace.getWorkspaceFolder(opt);

            await util.forEachAsync(this.cachedTasks, (each) => {
                const cstDef: TaskExplorerDefinition = each.definition as TaskExplorerDefinition;
                if (cstDef.uri.fsPath === opt.fsPath || !util.pathExists(cstDef.uri.fsPath)) {
                    rmvTasks.push(each);
                }
            });

            //
            // TODO - Bug
            // Technically this function can be called back into when waiting for a promise
            // to return on the asncForEach() above, and cachedTask array can be set to undefined,
            // this is happening with a broken await() somewere that I cannot find
            //
            if (this.cachedTasks)
            {
                await util.forEachAsync(rmvTasks, (each) => {
                    util.log("   removing old task " + each.name);
                    util.removeFromArray(this.cachedTasks, each);
                });

                if (util.pathExists(opt.fsPath) && util.existsInArray(configuration.get("exclude"), opt.path) === false)
                {
                    const task = this.createTask(path.extname(opt.fsPath).substring(1), null, folder, opt);
                    this.cachedTasks?.push(task);
                }

                if (this.cachedTasks?.length > 0) {
                    this.invalidating = false;
                    return;
                }
            }
        }

        this.invalidating = false;
        this.cachedTasks = undefined;
    }


    private async detectScriptFiles(): Promise<Task[]>
    {
        util.log("");
        util.log("detectScriptFiles");

        const allTasks: Task[] = [];
        const visitedFiles: Set<string> = new Set();
        const paths = filesCache.get("script");

        if (workspace.workspaceFolders && paths)
        {
            for (const fobj of paths)
            {
                if (!util.isExcluded(fobj.uri.path) && !visitedFiles.has(fobj.uri.fsPath)) {
                    visitedFiles.add(fobj.uri.fsPath);
                    allTasks.push(this.createTask(path.extname(fobj.uri.fsPath).substring(1), null, fobj.folder, fobj.uri));
                    util.log("   found script target");
                    util.logValue("      script file", fobj.uri.fsPath);
                }
            }
        }

        util.logValue("   # of tasks", allTasks.length, 2);
        return allTasks;
    }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri, xArgs?: string[]): Task
    {
        let sep: string = (process.platform === "win32" ? "\\" : "/");
        const scriptDef = this.scriptTable[target?.toLowerCase()],
              cwd = path.dirname(uri.fsPath),
              fileName = path.basename(uri.fsPath),
              def = this.getDefaultDefinition(target, folder, uri),
              options: ShellExecutionOptions = { cwd },
              args: string[] = [];
        let isWinShell = false,
            exec: string = scriptDef.exec;

        if (!scriptDef) {
            return null;
        }

        //
        // If the defualt terminal cmd/powershell?  On linux and darwin, no, on windows, maybe...
        //
        if (process.platform === "win32")
        {
            isWinShell = true;
            const winShell: string = workspace.getConfiguration().get("terminal.integrated.shell.windows");
            if (winShell && winShell.includes("bash.exe")) {
                sep = "/";
                isWinShell = false;
            }
        }

        //
        // Handle bash script on windows - set the shell executable as bash.exe if it isnt the default.
        // This can be set by usernin settings, otherwise Git Bash will be tried in the default install
        // location ("C:\Program Files\Git\bin). Otherwise, use "bash.exe" and assume the command and
        // other shell commands are in PATH
        //
        if (isWinShell)
        {
            if (scriptDef.type === "bash")
            {
                let bash = configuration.get<string>("pathToBash");
                if (!bash) {
                    bash = "C:\\Program Files\\Git\\bin\\bash.exe";
                }
                if (!util.pathExists(bash)) {
                    bash = "bash.exe";
                }
                options.executable = bash;
                sep = "/"; // convert path separator to unix-style
            }
        }

        //
        // Identify the 'executable'
        //
        const fileNamePathPre = "." + sep + fileName;
        if (scriptDef.type === "bash")
        {
            exec = fileNamePathPre;
        }
        else { // All scripts except for 'bash'
            //
            // Add any defined arguments to the command line exec
            //
            if (scriptDef.args) {
                args.push(...scriptDef.args);
            }
            //
            // Add the filename as an argument to the script exe (i.e. 'powershell', 'cmd', etc)
            //
            args.push(scriptDef.type !== "powershell" ? fileName : fileNamePathPre);
        }
        //
        // For python setup.py scripts, use the bdist_egg argument - the egg will be built and stored
        // at dist/PackageName-Version.egg
        //
        if (scriptDef.type === "python") {
            args.push("bdist_egg");
        }

        //
        // Add extra argumants is specified
        //
        if (xArgs) {
            args.push(...xArgs);
        }

        //
        // Make sure there are no windows style slashes in any configured path to an executable
        // if this isnt running in a windows shell
        //
        if (!isWinShell)
        {
            exec = exec.replace(/\\/g, "/");
        }

        //
        // Create the shell execution object and task
        //
        const execution = new ShellExecution(exec, args, options);
        return new Task(def, folder, scriptDef.type !== "python" ? fileName : "build egg", scriptDef.type, execution, "$msCompile");
    }


    public getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): TaskExplorerDefinition
    {
        const tgt = target?.toLowerCase(),
              scriptDef = this.scriptTable[tgt],
              fileName = path.basename(uri.fsPath);

        const def: TaskExplorerDefinition = {
            type: "script",
            script: target?.toLowerCase(),
            target: tgt,
            scriptType: scriptDef?.type || "unknown",
            fileName,
            scriptFile: true, // set scriptFile to true to include all scripts in folder instead of grouped at file
            path: util.getRelativePath(folder, uri),
            takesArgs: false,
            uri
        };

        //
        // Check if this script might need command line arguments
        //
        // TODO:  Other script types
        //
        if (scriptDef.type === "batch")
        {
            const contents = util.readFileSync(uri.fsPath);
            def.takesArgs = (new RegExp("%[1-9]")).test(contents);
        }

        return def;
    }


    private async wait()
    {
        while (this.invalidating === true) {
            util.log("   waiting for current invalidation to finish...");
            await util.timeout(100);
        }
    }

}
