
import { IDictionary } from ":types";
import { execSync } from "child_process";
import { Globs } from "../../lib/constants";
import { parseStringPromise } from "xml2js";
import { TeWrapper } from "../../lib/wrapper";
import { basename, dirname, join } from "path";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, window, workspace, ShellExecutionOptions } from "vscode";

interface StringMap { [s: string]: string }


export class AntTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{
    private commands: IDictionary<string> = {
        aix: "ant",
        darwin: "ant",
        freebsd: "ant",
        linux: "ant",
        openbsd: "ant",
        sunos: "ant",
        win32: "ant.bat"
    };

    constructor(wrapper: TeWrapper) { super(wrapper, "ant"); }


    public createTask(target: string, cmdName: string, folder: WorkspaceFolder, uri: Uri, xArgs?: string[]): Task
    {
        const cwd = dirname(uri.fsPath),
              def = this.getDefaultDefinition(target, folder, uri);
        let args = [ target ],
            options: ShellExecutionOptions = { cwd };

        //
        // Ansicon for Windows
        //
        if (process.platform === "win32" && this.wrapper.config.get(this.wrapper.keys.Config.EnableAnsiconForAnt) === true)
        {
            let ansicon = "ansicon.exe";
            const ansiPath: string = this.wrapper.config.get(`${this.wrapper.keys.Config.PathToPrograms}.ansicon`);
            if (ansiPath && this.wrapper.fs.pathExistsSync(ansiPath))
            {
                ansicon = ansiPath;
                if (!ansicon.endsWith("ansicon.exe")) {
                    ansicon = join(ansicon, "ansicon.exe");
                }
            }

            args = [ "-logger", "org.apache.tools.ant.listener.AnsiColorLogger", target ];
            options = {
                cwd,
                executable: ansicon
            };
        }

        if (def.fileName && def.fileName.toLowerCase() !== "build.xml")
        {
            args.push("-f");
            args.push(def.fileName);
        }

        const execution = new ShellExecution(this.getCommand(), args, options);

        return new Task(def, folder, cmdName, "ant", execution, undefined);
    }


    private async findAllAntScripts(path: string, logPad: string): Promise<StringMap>
    {
        const scripts: StringMap = {},
              useAnt = this.wrapper.config.get<boolean>("useAnt");
        this.wrapper.log.methodStart("find ant targets", 4, logPad, false, [[ "use ant", useAnt ], [ "path", path ]], this.logQueueId);
        //
        // Try running 'ant' itself to get the targets.  If fail, just custom parse
        //
        try {
            if (useAnt === true)
            {
                this.findTasksWithAnt(path, scripts, logPad + "   ");
            }
            else {
                await this.findTasksWithXml2Js(path, scripts, logPad + "   ");
            }
        }
        catch (ex) {
            this.logException(ex, useAnt ? "ant" : "xml2js");
        }
        this.wrapper.log.methodDone("find ant targets complete", 4, logPad, undefined, this.logQueueId);
        return scripts;
    }


    public getDocumentPosition(taskName: string | undefined, documentText: string | undefined): number
    {
        if (!taskName || !documentText) {
            return 0;
        }
        taskName = taskName.replace(" - Default", "");
        return this.getDocumentPositionLine("name=", taskName, documentText, 6);
    }


    /**
     * Use the ant program to find tasks.  Wrapped by try/catch in findAllAntScripts().
     *
     * @param path Path to the file to parse for tasks
     * @param taskMap The task map to populate
     */
    private findTasksWithAnt(path: string, taskMap: StringMap, logPad: string)
    {
        this.wrapper.log.methodStart("find tasks with ant", 4, logPad, false, [[ "path", path ]], this.logQueueId);
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
        const stdout = execSync(this.getCommand() + " -f " + path + " -p", { stdio: [ "pipe", "pipe", "ignore" ] });
        let text: any = stdout.toString();
        //
        // First get the default, use 2nd capturing group (returned arr-idx 2):
        //
        let defaultTask = text.match(/(Default target: )([\w\-_]+)/i);
        if (defaultTask && defaultTask.length > 2)
        {
            defaultTask = defaultTask[2];
            defaultTask = defaultTask.trim();
        }
        //
        // Loop through all the lines and extract the task names, if it's a task
        //
        text = text.split("\n");
        for (const i of Object.keys(text))
        {
            const line: string = text[i].trim();
            if (!line || line.match(/(target[s]{0,1}:|Buildfile:)/i)) {
                continue;
            }
            this.wrapper.log.value("   Found target (ant -p)", line, 3, logPad);
            taskMap[defaultTask === line ? line + " - Default" : line] = line;
        }

        this.wrapper.log.methodDone("find tasks with ant", 4, logPad, [[ "# of tasks", taskMap.size ]], this.logQueueId);
    }


    private logException(ex: any, prog: string)
    {
        this.wrapper.log.error([
            `Error running/executing ${prog}!!`,
            "Check to ensure the path to ant is correct and that your task/build file id valid XML",
            ex
        ], undefined, this.logQueueId);
        window.showInformationMessage("Error running/executing ant!! Check to ensure the path to ant/ant.bat " +
                                      "is correct and your xml is valid<br><br>Check or enable log for details");
    }


    private async findTasksWithXml2Js(path: string, taskMap: StringMap, logPad: string)
    {
        this.wrapper.log.methodStart("find tasks with xml2js", 4, logPad, false, [[ "path", path ]], this.logQueueId);

        const buffer = await this.wrapper.fs.readFileAsync(path);
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
            for (const tgt of targets)                  // Check .$ and .$.name (xml2js output format)
            {
                if (tgt.$ && tgt.$.name) {
                    taskMap[defaultTask === tgt.$.name ? tgt.$.name + " - Default" : tgt.$.name] = tgt.$.name;
                    this.wrapper.log.value("   found ant task", tgt.$.name, 4, logPad, this.logQueueId);
                }
            }
        }

        this.wrapper.log.methodDone("find tasks with xml2js", 4, logPad, [[ "# of tasks", taskMap.size ]], this.logQueueId);

        // return new Promise((resolve, reject) =>
        // {
        //     this.wrapper.log.methodStart("find tasks with xml2js", 3, logPad, false, [["path", path]]);
        //     const buffer = util.readFileSync(path);
        //
        //     parseString(buffer, (err, text) =>
        //     {
        //         if (err){
        //             this.wrapper.log.methodDone("find tasks with xml2js", 3, logPad, [["error", err.toString()]]);
        //             reject(err);
        //         }
        //         else {
        //             //
        //             // We should have a main 'project' object and a 'project.target' array
        //             //
        //             if (text && text.project && text.project.target)
        //             {
        //                 const defaultTask = text.project.$.default; // Is default task?  It's always defined on the main project node
        //                 const targets = text.project.target;
        //                 for (const tgt of targets)                  // Check .$ and .$.name (xml2js output format)
        //                 {
        //                     if (tgt.$ && tgt.$.name) {
        //                         this.wrapper.log.value("   Found target (cst.)", tgt.$.name);
        //                         taskMap[defaultTask === tgt.$.name ? tgt.$.name + " - Default" : tgt.$.name] = tgt.$.name;
        //                     }
        //                 }
        //             }
        //             this.wrapper.log.methodDone("find tasks with xml2js", 3, logPad, [["# of tasks", taskMap.size]]);
        //             resolve(taskMap);
        //         }
        //     });
        // });
    }


    private getCommand(): string
    {
        return this.wrapper.config.get("pathToPrograms.ant", this.commands[process.platform]);
    }


    private getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: this.providerName,
            script: target,
            target,
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            fileName: basename(uri.path),
            uri
        };
        return def;
    }


    public override getGlobPattern()
    {
        return this.wrapper.utils.getCombinedGlobPattern(Globs.GLOB_ANT,
                                      [ ...this.wrapper.config.get<string[]>("includeAnt", []),
                                        ...this.wrapper.config.get<string[]>("globPatternsAnt", []) ]);
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        this.wrapper.log.methodStart("read ant file uri tasks", 3, logPad, false, [
            [ "path", uri.fsPath ], [ "project folder", folder.name ]
        ], this.logQueueId);

        const scripts = await this.findAllAntScripts(uri.fsPath, logPad + "   ");
        for (const s of Object.keys(scripts))
        {
            const task = this.createTask(scripts[s], s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        this.wrapper.log.methodDone("read ant file uri tasks", 3, logPad, [[ "# of tasks found", result.length ]], this.logQueueId);
        return result;
    }

}
