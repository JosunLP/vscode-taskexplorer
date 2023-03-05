
import { promisify } from "util";
import { exec } from "child_process";
import { basename, dirname } from "path";
import { TeWrapper } from "../lib/wrapper";
import { ITaskDefinition } from "../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


export class GulpTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "gulp"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def = this.getDefaultDefinition(target, folder, uri);
        const cwd = dirname(uri.fsPath);
        const args = [ "gulp", target ];
        const options = { cwd };
        const execution = new ShellExecution("npx", args, options);

        return new Task(def, folder, target, "gulp", execution, "$msCompile");
    }


    public getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        if (!scriptName || !documentText) {
            return 0;
        }

        let idx = this.getDocumentPositionLine("gulp.task(", scriptName, documentText);
        if (idx === 0) {
            idx = this.getDocumentPositionLine("exports[", scriptName, documentText);
        }
        if (idx === 0) {
            idx = this.getDocumentPositionLine("exports.", scriptName, documentText, 0, 0, true);
        }
        return idx;
    }


    private async findTargets(fsPath: string, logPad: string)
    {
        let gulpTasks: string[] = [];
        this.wrapper.log.methodStart("find gulp targets", 4, logPad, false, [[ "path", fsPath ]], this.logQueueId);

        if (this.wrapper.config.get<boolean>("useGulp") === true)
        {
            try
            {   const out = await promisify(exec)("npx gulp --tasks -f " + basename(fsPath), { cwd: dirname(fsPath) });
                const stdout = out.stdout;
                await this.wrapper.utils.sleep(10);
                gulpTasks = this.parseGulpStdOut(stdout, logPad + "   ");
            }
            catch (e: any) { /* istanbul ignore next */ this.wrapper.log.error(e, undefined, this.logQueueId); }
            // return new Promise<string[]>(async (resolve) => {
            //     const proc = exec("npx gulp --tasks -f " + basename(fsPath), { cwd: dirname(fsPath) });
            //     let result = "";
            //     proc.stdout?.on("data", (data: string) => { result = data; });
            //     proc.stderr?.on("data", (data: string) => { /* istanbul ignore next */ this.wrapper.log.error(data, undefined, this.logQueueId); });
            //     proc.on("exit", () => {
            //         resolve(this.parseGulpStdOut(result, logPad + "   "));
            //     });
            // });
        }
        else {
            gulpTasks = await this.parseGulpTasks(fsPath, logPad + "   ");
        }

        this.wrapper.log.methodDone("find gulp targets", 4, logPad, undefined, this.logQueueId);
        return gulpTasks;
    }


    private getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: "gulp",
            script: target,
            target,
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            fileName: basename(uri.path),
            uri
        };
        return def;
    }


    private async parseGulpTasks(fsPath: string, logPad: string)
    {
        const scripts: string[] = [];
        const contents = await this.wrapper.fs.readFileAsync(fsPath);
        let idx = 0;
        let eol = contents.indexOf("\n", 0);

        this.wrapper.log.methodStart("parse gulp tasks", 4, logPad, false, [[ "path", fsPath ]], this.logQueueId);

        while (eol !== -1)
        {
            let tgtName: string | undefined;
            const line = contents.substring(idx, eol).trim();

            if (line.length > 0)
            {
                let match: RegExpMatchArray | null;
                if (line.toLowerCase().trimLeft().startsWith("exports"))
                {
                    tgtName = this.parseGulpExport(line);
                }
                else if (/[a-zA-Z0-9_\-]*\.?task *\( */.test(line.trimLeft()))
                {
                    tgtName = this.parseGulpTask(line, contents, eol);
                }
                else if (match = line.match(/export +(?:const|let|var) +([a-zA-Z0-9_\-]+)/))
                {
                    /* istanbul ignore else */
                    if (match && match.length > 1 && match[1]) {
                        tgtName =  match[1];
                    }
                }
                else if (match = line.match(/export +\{ +([a-zA-Z0-9_\-]+)(?: *as *([a-zA-Z0-9_\-]+))? *\}/))
                {
                    if (match && match.length > 2 && match[2]) {
                        tgtName =  match[2];
                    }
                    else /* istanbul ignore else */if (match && match.length > 1 && match[1]) {
                        tgtName =  match[1];
                    }
                }
                if (tgtName) {
                    scripts.push(tgtName);
                    this.wrapper.log.value("   found gulp task", tgtName, 4, logPad, this.logQueueId);
                }
            }

            idx = eol + 1;
            eol = contents.indexOf("\n", idx);
        }

        this.wrapper.log.methodDone("parse gulp tasks", 4, logPad, undefined, this.logQueueId);
        return scripts;
    }


    private parseGulpExport(line: string)
    {
        let idx1: number, idx2: number;
        let tgtName: string | undefined;

        /* istanbul ignore else */
        if (line.toLowerCase().trimLeft().startsWith("exports."))
        {
            idx1 = line.indexOf(".") + 1;
            idx2 = line.indexOf(" ", idx1);
            /* istanbul ignore if */
            if (idx2 === -1) {
                idx2 = line.indexOf("=", idx1);
            }
            /* istanbul ignore else */
            if (idx1 !== -1)
            {
                tgtName = line.substring(idx1, idx2).trim();
            }
        }
        /* istanbul ignore else */
        else if (line.toLowerCase().trimLeft().startsWith("exports["))
        {
            idx1 = line.indexOf("[") + 2; // skip past [ and '/"
            idx2 = line.indexOf("]", idx1) - 1;  // move up to "/'
            /* istanbul ignore else */
            if (idx1 !== -1)
            {
                tgtName = line.substring(idx1, idx2).trim();
            }
        }

        return tgtName;
    }


    private parseGulpStdOut(stdout: string, logPad: string)
    {   //
        // Ran 'gulp' itself to get the targets.
        //
        // Sample Output of gulp --tasks :
        //
        //     [13:17:46] Tasks for C:\Projects\vscode-taskexplorer\test-fixture\project1\gulpfile.js
        //     [13:17:46] ├── hello
        //     [13:17:46] └── build:test
        //
        //     Tasks for C:\Projects\.....\gulpfile.js
        //     [12:28:59] ├─┬ lint
        //     [12:28:59] │ └─┬ <series>
        //     [12:28:59] │   └── lintSCSS
        //     [12:28:59] ├─┬ watch
        //     [12:28:59] │ └─┬ <parallel>
        //     [12:28:59] │   ├── cssWatcher
        //     [12:28:59] │   ├── jsWatcher
        //     [12:28:59] │   └── staticWatcher
        //     [12:28:59] ├── clean
        //     [12:28:59] ├─┬ build
        //     [12:28:59] │ └─┬ <series>
        //     [12:28:59] │   ├── buildCSS
        //     [12:28:59] │   ├── buildStatic
        //     [12:28:59] │   └── buildJS
        //     [12:28:59] ├── init
        //     [12:28:59] ├─┬ dist:copy
        //     [12:28:59] │ └─┬ <series>
        //     [12:28:59] │   ├── cleanDistLibs
        //     [12:28:59] │   └── copyLibs
        //     [12:28:59] ├── dist:normalize
        //     [12:28:59] ├─┬ dev
        //     [12:28:59] │ └─┬ <parallel>
        //     [12:28:59] │   ├─┬ watch
        //     [12:28:59] │   │ └─┬ <parallel>
        //     [12:28:59] │   │   ├── cssWatcher
        //     [12:28:59] │   │   ├── jsWatcher
        //     [12:28:59] │   │   └── staticWatcher
        //     [12:28:59] │   └── devServer
        //     [12:28:59] └─┬ default
        //     [12:28:59]   └─┬ <series>
        //     [12:28:59]     ├─┬ lint
        //     [12:28:59]     │ └─┬ <series>
        //     [12:28:59]     │   └── lintSCSS
        //     [12:28:59]     ├── clean
        //     [12:28:59]     └─┬ build
        //     [12:28:59]       └─┬ <series>
        //     [12:28:59]         ├── buildCSS
        //     [12:28:59]         ├── buildStatic
        //     [12:28:59]         └── buildJS
        //
        const gulpTasks: string[] = [];
        //
        // Loop through all the lines and extract the task names
        //
        const contents = stdout.split("\n");
        // const contents = stdout?.toString().split("\n");
        for (const c of contents)
        {
            const line = c.match(/(\[[\w\W][^\]]+\][ ](├─┬|├──|└──|└─┬) )([\w\-]+)/i);
            if (line && line.length > 3 && line[3])
            {
                gulpTasks.push(line[3].toString());
                this.wrapper.log.write("found gulp task", 4, logPad, this.logQueueId);
                this.wrapper.log.value("   name", line[3].toString(), 4, logPad, this.logQueueId);
            }
        }
        return gulpTasks;
    }


    private parseGulpTask(line: string, contents: string, eol: number)
    {
        let idx1: number;
        let tgtName: string | undefined;

        idx1 = line.indexOf("'");
        if (idx1 === -1) {
            idx1 = line.indexOf('"');
        }

        if (idx1 === -1) // check next line for task name
        {
            let eol2 = eol + 1;
            eol2 = contents.indexOf("\n", eol2);
            line = contents.substring(eol + 1, eol2).trim();
            /* istanbul ignore else */
            if (line.startsWith("'") || line.startsWith('"'))
            {
                idx1 = line.indexOf("'");
                if (idx1 === -1) {
                    idx1 = line.indexOf('"');
                }
                /* istanbul ignore else */
                if (idx1 !== -1) {
                    eol = eol2;
                }
            }
        }

        /* istanbul ignore else */
        if (idx1 !== -1)
        {
            idx1++;
            let idx2 = line.indexOf("'", idx1);
            if (idx2 === -1) {
                idx2 = line.indexOf('"', idx1);
            }
            /* istanbul ignore else */
            if (idx2 !== -1)
            {
                tgtName = line.substring(idx1, idx2).trim();
            }
        }

        return tgtName;
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        this.wrapper.log.methodStart("read gulp file uri tasks", 3, logPad, false, [[ "path", uri.fsPath ], [ "project folder", folder.name ]], this.logQueueId);

        const scripts = await this.findTargets(uri.fsPath, logPad + "   ");
        for (const s of scripts)
        {
            const task = this.createTask(s, s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        this.wrapper.log.methodDone("read gulp file uri tasks", 3, logPad, [[ "#of tasks found", result.length ]], this.logQueueId);
        return result;
    }

}
