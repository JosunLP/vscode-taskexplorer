
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


export class GruntTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "grunt"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const def = this.getDefaultDefinition(target, folder, uri),
              cwd = dirname(uri.fsPath),
              args = [ "grunt", target ],
              options = { cwd },
              execution = new ShellExecution("npx", args, options);

        return new Task(def, folder, target, "grunt", execution, "$msCompile");
    }


    private async findTargets(fsPath: string, logPad: string)
    {
        const scripts: string[] = [];

        this.wrapper.log.methodStart("find grunt targets", 4, logPad, false, [[ "path", fsPath ]], this.logQueueId);

        const contents = await this.wrapper.fs.readFileAsync(fsPath);
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
                        const tgtName = line.substring(idx1, idx2).trim();
                        /* istanbul ignore else */
                        if (tgtName) {
                            scripts.push(tgtName);
                            this.wrapper.log.value("   found grunt task", tgtName, 4, logPad, this.logQueueId);
                        }
                    }
                }
            }

            idx = eol + 1;
            eol = contents.indexOf("\n", idx);
        }

        this.wrapper.log.methodDone("find grunt targets", 4, logPad, undefined, this.logQueueId);

        return scripts;
    }


    private getDefaultDefinition(target: string, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: "grunt",
            script: target,
            target,
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            fileName: basename(uri.path),
            uri
        };
        return def;
    }


    public getDocumentPosition(taskName: string | undefined, documentText: string | undefined): number
    {
        if (!taskName || !documentText) {
            return 0;
        }
        return this.getDocumentPositionLine("grunt.registerTask(", taskName, documentText);
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        this.wrapper.log.methodStart("read grunt file uri task", 3, logPad, false, [
            [ "path", uri.fsPath ], [ "project folder", folder.name ]
        ], this.logQueueId);

        const scripts = await this.findTargets(uri.fsPath, logPad + "   ");
        for (const s of scripts)
        {
            const task = this.createTask(s, s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        this.wrapper.log.methodDone("read grunt file uri tasks", 3, logPad, [[ "#of tasks found", result.length ]], this.logQueueId);
        return result;
    }

}
