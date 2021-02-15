
import {
    Task, TaskGroup, WorkspaceFolder, RelativePattern, ShellExecution, Uri,
    workspace, TaskProvider, TaskDefinition
} from "vscode";
import * as path from "path";
import * as util from "./util";
import { configuration } from "./common/configuration";
import { filesCache } from "./cache";
import { TaskExplorerProvider } from "./taskProvider";
import { TaskExplorerDefinition } from "./taskDefinition";


export class GruntTaskProvider implements TaskExplorerProvider
{
    private cachedTasks: Task[];
    private invalidating = false;


    constructor() {}


    public async provideTasks()
    {
        util.log("");
        util.log("provide grunt tasks");
        if (!this.cachedTasks) {
            this.cachedTasks = await this.detectGruntfiles();
        }
        return this.cachedTasks;
    }


    public resolveTask(_task: Task): Task | undefined
    {
        return undefined;
    }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const getCommand = (folder: WorkspaceFolder, cmd: string): string =>
        {
            // let grunt = 'folder.uri.fsPath + "/node_modules/.bin/grunt";
            const grunt = "grunt";
            // if (process.platform === 'win32') {
            //     grunt = folder.uri.fsPath + "\\node_modules\\.bin\\grunt.cmd";
            // }
            // if (workspace.getConfiguration('taskExplorer').get('pathToGrunt')) {
            //     grunt = workspace.getConfiguration('taskExplorer').get('pathToGrunt');
            // }
            return grunt;
        };

        const def = this.getDefaultDefinition(target, folder, uri);
        const cwd = path.dirname(uri.fsPath);
        const args = [ getCommand(folder, cmd), target ];
        const options = { cwd };
        const execution = new ShellExecution("npx", args, options);

        return new Task(def, folder, target, "grunt", execution, "$msCompile");
    }


    private async detectGruntfiles(): Promise<Task[]>
    {
        util.log("");
        util.log("detectGruntfiles");

        const allTasks: Task[] = [];
        const visitedFiles: Set<string> = new Set();
        const paths = filesCache.get("grunt");

        if (workspace.workspaceFolders && paths)
        {
            for (const fobj of paths)
            {
                if (!util.isExcluded(fobj.uri.path) && !visitedFiles.has(fobj.uri.fsPath)) {
                    visitedFiles.add(fobj.uri.fsPath);
                    const tasks = await this.readGruntfile(fobj.uri);
                    allTasks.push(...tasks);
                }
            }
        }

        util.logValue("   # of tasks", allTasks.length, 2);
        return allTasks;
    }


    private async findTargets(fsPath: string): Promise<string[]>
    {
        const scripts: string[] = [];

        util.log("");
        util.log("Find gruntfile targets");

        const contents = await util.readFile(fsPath);
        let idx = 0;
        let eol = contents.indexOf("\n", 0);

        while (eol !== -1)
        {
            let line: string = contents.substring(idx, eol).trim();
            if (line.length > 0 && line.toLowerCase().trimLeft().startsWith("grunt.registertask"))
            {
                let idx1 = line.indexOf("'");
                if (idx1 === -1) {
                    idx1 = line.indexOf('"');
                }

                if (idx1 === -1) // check next line for task name
                {
                    let eol2 = eol + 1;
                    eol2 = contents.indexOf("\n", eol2);
                    line = contents.substring(eol + 1, eol2).trim();
                    if (line.startsWith("'") || line.startsWith('"'))
                    {
                        idx1 = line.indexOf("'");
                        if (idx1 === -1) {
                            idx1 = line.indexOf('"');
                        }
                        if (idx1 !== -1) {
                            eol = eol2;
                        }
                    }
                }

                if (idx1 !== -1)
                {
                    idx1++;
                    let idx2 = line.indexOf("'", idx1);
                    if (idx2 === -1) {
                        idx2 = line.indexOf('"', idx1);
                    }
                    if (idx2 !== -1)
                    {
                        const tgtName = line.substring(idx1, idx2).trim();
                        if (tgtName) {
                            scripts.push(tgtName);
                            util.log("   found target");
                            util.logValue("      name", tgtName);
                        }
                    }
                }
            }

            idx = eol + 1;
            eol = contents.indexOf("\n", idx);
        }

        util.log("   done");

        return scripts;
    }


    public getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): TaskExplorerDefinition
    {
        const def: TaskExplorerDefinition = {
            type: "grunt",
            script: target,
            target,
            path: util.getRelativePath(folder, uri),
            fileName: path.basename(uri.path),
            uri
        };
        return def;
    }


    public async invalidateTasksCache(opt?: Uri): Promise<void>
    {
        util.log("");
        util.log("invalidate grunt tasks cache");
        util.logValue("   uri", opt?.path, 2);
        util.logValue("   has cached tasks", !!this.cachedTasks, 2);

        await this.wait();
        this.invalidating = true;

        if (opt && this.cachedTasks)
        {
            const rmvTasks: Task[] = [];

            await util.forEachAsync(this.cachedTasks, (each: Task) => {
                const cstDef: TaskExplorerDefinition = each.definition;
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
                    const tasks = await this.readGruntfile(opt);
                    this.cachedTasks?.push(...tasks);
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


    private async readGruntfile(uri: Uri): Promise<Task[]>
    {
        const result: Task[] = [];
        const folder = workspace.getWorkspaceFolder(uri);

        if (folder)
        {
            const scripts = await this.findTargets(uri.fsPath);
            if (scripts)
            {
                scripts.forEach(each => {
                    const task = this.createTask(each, each, folder, uri);
                    task.group = TaskGroup.Build;
                    result.push(task);
                });
            }
        }

        return result;
    }


    private async wait()
    {
        while (this.invalidating === true) {
            util.log("   waiting for current invalidation to finish...");
            await util.timeout(100);
        }
    }

}
