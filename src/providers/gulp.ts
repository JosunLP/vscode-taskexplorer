
import * as path from "path";
import * as util from "../common/utils";
import * as log from "../common/log";
import { configuration } from "../common/configuration";
import { execSync } from "child_process";
import { TaskExplorerProvider } from "./provider";
import { TaskExplorerDefinition } from "../interface/taskDefinition";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


export class GulpTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor() { super("gulp"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def = this.getDefaultDefinition(target, folder, uri);
        const cwd = path.dirname(uri.fsPath);
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
        if (idx === -1) {
            idx = this.getDocumentPositionLine("exports[", scriptName, documentText);
        }
        if (idx === -1) {
            idx = this.getDocumentPositionLine("exports.", scriptName, documentText, 0, 0, true);
        }
        return idx;
    }


    private findTargets(fsPath: string, logPad: string): string[]
    {
        let scripts: string[] = [];

        log.methodStart("find gulp targets", 1, logPad, true, [[ "path", fsPath ]]);
        //
        // Try running 'gulp' itself to get the targets.  If fail, just custom parse
        //
        // Sample Output of gulp --tasks :
        //
        //     [13:17:46] Tasks for C:\Projects\vscode-taskexplorer\test-files\gulpfile.js
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

        /* istanbul ignore if */
        if (configuration.get("useGulp") === true)
        {
            let stdout: Buffer | undefined;
            try {
                stdout = execSync("npx gulp --tasks", {
                    cwd: path.dirname(fsPath)
                });
            }
            catch (e: any) { log.error(e); }
            //
            // Loop through all the lines and extract the task names
            //
            const contents = stdout?.toString().split("\n");
            if (contents) {
                for (const c of contents)
                {
                    const line = c.match(/(\[[\w\W][^\]]+\][ ](├─┬|├──|└──|└─┬) )([\w\-]+)/i);
                    if (line && line.length > 3 && line[3])
                    {
                        log.value("   Found target (gulp --tasks)", line[3], 3, logPad);
                        scripts.push(line[3].toString());
                    }
                }
            }
        }
        else {
            scripts = this.parseGulpTasks(fsPath);
        }

        log.methodDone("find gulp targets", 1, logPad, true);

        return scripts;
    }


    private getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): TaskExplorerDefinition
    {
        const def: TaskExplorerDefinition = {
            type: "gulp",
            script: target,
            target,
            path: util.getRelativePath(folder, uri),
            fileName: path.basename(uri.path),
            uri
        };
        return def;
    }


    private parseGulpTasks(fsPath: string): string[]
    {
        const scripts: string[] = [];
        const contents = util.readFileSync(fsPath);
        let idx = 0;
        let eol = contents.indexOf("\n", 0);

        while (eol !== -1)
        {
            let tgtName: string | undefined;
            const line = contents.substring(idx, eol).trim();

            if (line.length > 0)
            {
                if (line.toLowerCase().trimLeft().startsWith("exports"))
                {
                    tgtName = this.parseGulpExport(line);
                }
                else if (line.toLowerCase().trimLeft().startsWith("gulp.task"))
                {
                    tgtName = this.parseGulpTask(line, contents, eol);
                }
                if (tgtName) {
                    scripts.push(tgtName);
                    log.write("   found gulp target");
                    log.value("      name", tgtName);
                }
            }

            idx = eol + 1;
            eol = contents.indexOf("\n", idx);
        }

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

        log.methodStart("read gulp file uri task", 1, logPad, true, [[ "path", uri.fsPath ], [ "project folder", folder.name ]]);

        const scripts = this.findTargets(uri.fsPath, logPad + "   ");
        for (const s of scripts)
        {
            const task = this.createTask(s, s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        log.methodDone("read gulp file uri tasks", 1, logPad, true);
        return result;
    }

}
