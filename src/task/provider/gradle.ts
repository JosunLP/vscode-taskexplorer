
import { IDictionary } from ":types";
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { TaskExplorerProvider } from "./provider";
import { ITaskDefinition } from "../../interface";
import { Task, TaskGroup, WorkspaceFolder, ShellExecution, Uri, workspace } from "vscode";


export class GradleTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{
    private commands: IDictionary<string> = {
        aix: "gradlew",
        darwin: "gradlew",
        freebsd: "gradlew",
        linux: "gradlew",
        openbsd: "gradlew",
        sunos: "gradlew",
        win32: "gradlew.bat"
    };

    constructor(wrapper: TeWrapper) { super(wrapper, "gradle"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri): Task
    {
        const getCommand = (): string => this.wrapper.config.get<string>("pathToPrograms.gradle", this.commands[process.platform]);
        const def = this.getDefaultDefinition(target, folder, uri);
        const cwd = dirname(uri.fsPath);
        const args = [ target ];
        const options = { cwd };
        const execution = new ShellExecution(getCommand(), args, options);
        return new Task(def, folder, target, "gradle", execution, undefined);
    }


    private async findTargets(fsPath: string, logPad: string)
    {
        const scripts: string[] = [];

        this.wrapper.log.methodStart("find gradle targets", 4, logPad, false, [[ "path", fsPath ]], this.logQueueId);

        const contents = await this.wrapper.fs.readFileAsync(fsPath);
        let idx = 0;
        let eol = contents.indexOf("\n", 0);

        while (eol !== -1)
        {
            const line: string = contents.substring(idx, eol).trim();
            if (line.length > 0 && line.toLowerCase().trimLeft().startsWith("task "))
            {
                const idx1 = line.trimLeft().indexOf(" ") + 1;
                let idx2 = line.indexOf("(", idx1);
                if (idx2 === -1) {
                    idx2 = line.indexOf("{", idx1);
                }
                if (idx2 > idx1)
                {
                    const tgtName = line.substring(idx1, idx2).trim();
                    scripts.push(tgtName);
                    this.wrapper.log.value("   found gradle task", tgtName, 4, logPad, this.logQueueId);
                }
            }
            idx = eol + 1;
            eol = contents.indexOf("\n", idx);
        }

        this.wrapper.log.methodDone("Find gradle targets", 4, logPad, undefined, this.logQueueId);
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


    public getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        const idx = documentText?.indexOf("task " + (scriptName || ""));
        return idx && idx !== -1 ? idx : 0;
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const result: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder;

        this.wrapper.log.methodStart("read gradle file uri task", 3, logPad, false, [
            [ "path", uri.fsPath ], [ "project folder", folder.name ]
        ], this.logQueueId);

        const scripts = await this.findTargets(uri.fsPath, logPad + "   ");
        for (const s of scripts)
        {
            const task = this.createTask(s, s, folder, uri);
            task.group = TaskGroup.Build;
            result.push(task);
        }

        this.wrapper.log.methodDone("read gradle file uri task", 3, logPad, [[ "#of tasks found", result.length ]], this.logQueueId);
        return result;
    }

}
