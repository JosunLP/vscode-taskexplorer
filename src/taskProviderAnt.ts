
import {
    Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, window, workspace, TaskDefinition
} from "vscode";
import * as path from "path";
import * as util from "./util";
import { parseStringPromise } from "xml2js";
import { configuration } from "./common/configuration";
import { filesCache } from "./cache";
import { execSync } from "child_process";
import { TaskExplorerProvider } from "./taskProvider";
import { TaskExplorerDefinition } from "./taskDefinition";


interface StringMap { [s: string]: string }


export class AntTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor() { super("ant"); }


    public createTask(target: string, cmdName: string, folder: WorkspaceFolder, uri: Uri, xArgs?: string[]): Task
    {
        const cwd = path.dirname(uri.fsPath),
              def = this.getDefaultDefinition(target, folder, uri);
        let args = [ target ],
            options: any = {  cwd };

        //
        // Ansicon for Windows
        //
        if (process.platform === "win32" && configuration.get("enableAnsiconForAnt") === true)
        {
            let ansicon = "ansicon.exe";
            const ansiPath: string = configuration.get("pathToAnsicon");
            if (ansiPath && util.pathExists(ansiPath)) {
                ansicon = ansiPath;
                if (!ansicon.endsWith("ansicon.exe") && !ansicon.endsWith("\\")) {
                    ansicon = path.join(ansicon, "ansicon.exe");
                }
                else if (!ansicon.endsWith("ansicon.exe")) {
                    ansicon += "ansicon.exe";
                }
            }

            args = [ "-logger", "org.apache.tools.ant.listener.AnsiColorLogger", target ];
            options = {
                cwd,
                executable: ansicon
            };
        }

        if (def.fileName?.toLowerCase() !== "build.xml")
        {
            args.push("-f");
            args.push(def.fileName);
        }

        const execution = new ShellExecution(this.getCommand(), args, options);

        return new Task(def, folder, cmdName ? cmdName : target, "ant", execution, undefined);
    }


    public async readTasks(): Promise<Task[]>
    {
        util.logBlank(1);
        util.log("detect ant scripts", 1);

        const allTasks: Task[] = [];
        const visitedFiles: Set<string> = new Set();
        const paths = filesCache.get("ant");

        if (workspace.workspaceFolders && paths)
        {
            for (const fobj of paths)
            {
                if (!util.isExcluded(fobj.uri.path) && !visitedFiles.has(fobj.uri.fsPath)) {
                    visitedFiles.add(fobj.uri.fsPath);
                    const tasks = await this.readUriTasks(fobj.uri);
                    allTasks.push(...tasks);
                }
            }
        }

        util.logValue("   # of tasks", allTasks.length, 2);
        return allTasks;
    }


    private async findAllAntScripts(path: string): Promise<StringMap>
    {
        const scripts: StringMap = {};
        const useAnt = configuration.get<boolean>("useAnt");

        util.logBlank(1);
        util.log("find all ant targets", 1);
        util.logValue("   use ant", useAnt, 2);

        //
        // Try running 'ant' itself to get the targets.  If fail, just custom parse
        //
        if (useAnt === true)
        {
            this.findTasksWithAnt(scripts);
        }
        else {
            await this.findTasksWithXml2Js(path, scripts);
        }

        return scripts;
    }


    private findTasksWithAnt(scripts: StringMap)
    {
        let stdout: Buffer;

        //
        // Execute 'ant'/'ant.bat' to find defined tasks (ant targets)
        //
        // Sample Output of ant -p :
        //
        //     Buildfile: C:\Projects\.....\build.xml
        //
        //     Main targets:
        //
        //     Other targets:
        //
        //      Clean
        //      G32ProductionSQLServer
        //      G32SQLServer
        //      G64
        //      G64AspNetCore
        //      G64Production
        //      G64ProductionSQLServer
        //      G64SQLServer
        //      init
        //
        //     Default target: G64
        //
        try {
            stdout = execSync(this.getCommand() + " -f " + path + " -p");
        }
        catch (ex) {
            this.logException(ex);
            return;
        }

        if (stdout)
        {
            let text: any = stdout.toString();
            //
            // First get the default, use 2nd capturing group (returned arr-idx 2):
            //
            let defaultTask = text.match(/(Default target: )([\w\-]+)/i);
            if (defaultTask && defaultTask.length > 2) {
                defaultTask = defaultTask[2];
                defaultTask = defaultTask.trim();
            }
            //
            // Loop through all the lines and extract the task names, if it's a task
            //
            text = text.split("\n");
            for (const i in text)
            {
                if (text.hasOwnProperty(i)) { // skip over properties inherited by prototype
                    const line: string = text[i].trim();
                    if (!line || line.match(/(target[s]{0,1}:|Buildfile:)/i)) {
                        continue;
                    }
                    util.logValue("   Found target (ant -p)", line);
                    scripts[defaultTask === line ? line + " - Default" : line] = line;
                }
            }
        }
    }


    private logException(ex: any)
    {
        util.logError([ "*** Error running/executing ant!!", "Check to ensure the path to ant/ant.bat is correct", ex?.toString() ]);
        window.showInformationMessage("Error running/executing ant!!  Check to ensure the path to ant/ant.bat is correct");
    }


    private async findTasksWithXml2Js(path: string, scripts: StringMap)
    {
        const buffer = await util.readFile(path);
        //
        // Convert to JSON with Xml2Js parseString()
        //
        const text = await parseStringPromise(buffer);
        //
        // We should have a main 'project' object and a 'project.target' array
        //
        if (text && text.project && text.project.target)
        {
            const defaultTask = text.project.$.default; // Is default task?  It's always defined on the main project node
            const targets = text.project.target;
            for (const tgt in targets)                  // Check .$ and .$.name (xml2js output format)
            {
                if (targets[tgt].$ && targets[tgt].$.name) {
                    util.logValue("   Found target (cst.)", targets[tgt].$.name);
                    scripts[defaultTask === targets[tgt].$.name ? targets[tgt].$.name + " - Default" : targets[tgt].$.name] = targets[tgt].$.name;
                }
            }
        }
    }


    private getCommand(): string
    {
        let ant = "ant";
        if (process.platform === "win32") {
            ant = "ant.bat";
        }
        if (configuration.get("pathToAnt"))
        {
            ant = configuration.get("pathToAnt");
            if (process.platform === "win32" && ant.endsWith("\\ant")) {
                ant += ".bat";
            }
        }
        return ant;
    }


    public getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): TaskExplorerDefinition
    {
        const def: TaskExplorerDefinition = {
            type: "ant",
            script: target,
            target,
            path: util.getRelativePath(folder, uri),
            fileName: path.basename(uri.path),
            uri
        };
        return def;
    }


    public async readUriTasks(uri: Uri, wsFolder?: WorkspaceFolder): Promise<Task[]>
    {
        const result: Task[] = [];
        const folder = wsFolder || workspace.getWorkspaceFolder(uri);

        util.logBlank(1);
        util.log("read ant file", 1);
        util.logValue("   file", uri.fsPath, 2);
        util.logValue("   project folder", folder.name, 2);

        if (folder)
        {
            const scripts = await this.findAllAntScripts(uri.fsPath);
            if (scripts)
            {
                await util.forEachAsync(Object.keys(scripts), (k: string) => {
                    const task = this.createTask(scripts[k] ? scripts[k] : k, k, folder, uri);
                    task.group = TaskGroup.Build;
                    result.push(task);
                });
            }
        }

        return result;
    }

}
