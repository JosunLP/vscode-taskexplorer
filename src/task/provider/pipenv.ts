
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace, ShellExecutionOptions } from "vscode";


/**
 * Parses [scripts] from the pipenv Python package manager's Pipfile.
 */
export class PipenvTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "pipenv"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const pipenv = this.wrapper.config.get<string>("pathToPrograms.pipenv", "pipenv");
        let pythonPath = pipenv;
        this.wrapper.utils.execIf(pipenv === "pipenv", () =>
        {   //
            // If the user didn't explicitly set a pathToPrograms.pipenv (meaning it is the default value),
            // then use the python path from the environment to run pipenv as a module. This way it
            // has the best chance of using the correct Python environment (virtual, global,...)
            //
            pythonPath = workspace.getConfiguration("python").get("pythonPath", "python");
        }, this);
        const def = this.getDefaultDefinition(target, folder, uri),
              cwd = dirname(uri.fsPath),
              args = [ "run", target ];
        //
        // If using python path, run pipenv as a module
        //
        this.wrapper.utils.execIf(pythonPath, () => args.unshift(...[ "-m", "pipenv" ]), this);
        const options: ShellExecutionOptions = { cwd },
              execution = new ShellExecution(pythonPath, args, options);

        return new Task(def, folder, target, "pipenv", execution, "$msCompile");
    }


    private async findTargets(fsPath: string, logPad: string)
    {   //
        // 2023 - pre v3 release - Dumped the garbage/overweight @sgarciac/bombadil package.  So this may need some work.
        //
        this.wrapper.log.methodStart("find pipenv Pipfile targets", 4, logPad, false, [[ "path", fsPath ]], this.logQueueId);
        const scripts: string[] = [],
              contents = await this.wrapper.fs.readFileAsync(fsPath),
              idx = contents.indexOf("[scripts]");
        if (idx !== -1)
        {
            let idx2;
            if (contents.includes("\r\n")) {
                idx2 = contents.indexOf("\r\n\r\n", idx);
            }
            else {
                idx2 = contents.indexOf("\n\n", idx);
            }
            if (idx2 === -1) {
                idx2 = contents.length;
            }
            if (idx2 === -1) {
                idx2 = contents.length;
            }
            let match: RegExpExecArray | null;
            const regex = /\s*(.+)\s*\=\s*["']?(.+)["'$\r\n]/gi,
                  scriptsText = contents.substring(idx, idx2);
            while ((match = regex.exec(scriptsText)) !== null)
            {
                const [ _, scriptName, _scriptCmd ] = match;
                scripts.push(scriptName);
                this.wrapper.log.value("   found pipenv pipfile task", scriptName, 4, logPad, this.logQueueId);
            }
        }
        this.wrapper.log.methodDone("find pipenv Pipfile targets", 4, logPad, undefined, this.logQueueId);
        return scripts;
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


    public getDocumentPosition(taskName: string | undefined, documentText: string | undefined): number
    {
        if (!taskName || !documentText) {
            return 0;
        }
        return this.getDocumentPositionLine("", taskName, documentText, 0 , 0, true);
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        this.wrapper.log.methodStart("read pipenv Pipfile file uri tasks", 3, logPad, false, [
            [ "path", uri.fsPath ], [ "project folder", folder.name ]
        ], this.logQueueId);

        const scripts = await this.findTargets(uri.fsPath, logPad + "   ");
        for (const s of scripts)
        {
            const task = this.createTask(s, s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        this.wrapper.log.methodDone("read pipenv Pipfile file uri tasks", 3, logPad, [[ "#of tasks found", result.length ]], this.logQueueId);
        return result;
    }
}
