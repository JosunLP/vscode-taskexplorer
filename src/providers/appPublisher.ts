
import { basename, dirname } from "path";
import { TeWrapper } from "../lib/wrapper";
import { ITaskDefinition } from "../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, WorkspaceFolder, ShellExecution, Uri, workspace, ShellExecutionOptions } from "vscode";


export class AppPublisherTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "apppublisher"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri, xArgs: string[]): Task | undefined
    {
        return undefined;
        // const cwd = dirname(uri.fsPath);
        // const defaultDef = this.getDefaultDefinition(undefined, folder, uri),
        //       options: ShellExecutionOptions = { cwd },
        //       tasks: Task[] = [],
        //       taskDefs: any = [];
        // let apFmtLabel = "";
        // if (apLabel) {
        //     apFmtLabel = ` (${apLabel.toLowerCase()})`;
        //     def.cmdLine += ` --config-name ${apLabel}`;
        // }
        // const exec = new ShellExecution(def.cmdLine, options);
        // return new Task(this._getKind(def.cmdLine, defaultDef), folder,
        //                 `${def.label}${apFmtLabel}`, "apppublisher", exec, undefined);
    }


    private getDefaultDefinition(target: string | undefined, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: "apppublisher",
            script: target,
            target,
            fileName: basename(uri.fsPath),
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            cmdLine: "npx app-publisher --no-ci",
            takesArgs: false,
            uri
        };
        return def;
    }


    public getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        return 0;
    }


    private _getKind(cmdLine: string, defaultDef: ITaskDefinition): ITaskDefinition
    {
        return { ...defaultDef, ...{ cmdLine } };
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const cwd = dirname(uri.fsPath),
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder,
              groupSeparator = this.wrapper.config.get<string>("groupSeparator");

        this.wrapper.log.methodStart("read app-publisher file uri task", 3, logPad, false, [
            [ "path", uri.fsPath ], [ "project folder", folder.name ]
        ], this.logQueueId);

        try { // Validate JSON
            await this.wrapper.fs.readJsonAsync(uri.fsPath);
        }
        catch (e: any)
        {
            this.wrapper.log.error(e, undefined, this.logQueueId);
            this.wrapper.log.methodDone("read app-publisher file uri tasks", 3, logPad, undefined, this.logQueueId);
            return [];
        }

        const defaultDef = this.getDefaultDefinition(undefined, folder, uri),
              options: ShellExecutionOptions = { cwd },
              tasks: Task[] = [],
              taskDefs: any = [];

        //
        // For ap files in the same dir, nsamed with a tag, e.g.:
        //    .publishrc.spm.json
        //
        let apLabel = "";
        const match = uri.fsPath.match(/\.publishrc\.(.+)\.(?:js(?:on)?|ya?ml)$/i);
        if (match && match.length > 1 && match[1])
        {
            apLabel =  match[1];
        }

        taskDefs.push({
            label: "general" + groupSeparator + "config",
            cmdLine: "npx app-publisher --version"
        });

        taskDefs.push({
            label: "general" + groupSeparator + "help",
            cmdLine: "npx app-publisher --help"
        });

        taskDefs.push({
            label: "general" + groupSeparator + "version",
            cmdLine: "npx app-publisher --version"
        });

        taskDefs.push({
            label: "release" + groupSeparator + "dry" + groupSeparator + "publish",
            cmdLine: "npx app-publisher --no-ci --dry-run"
        });

        taskDefs.push({
            label: "release" + groupSeparator + "dry" + groupSeparator + "publish (prompt version)",
            cmdLine: "npx app-publisher --no-ci --dry-run --prompt-version Y"
        });

        taskDefs.push({
            label: "release" + groupSeparator + "publish",
            cmdLine: "npx app-publisher --no-ci"
        });

        taskDefs.push({
            label: "release" + groupSeparator + "publish (prompt version)",
            cmdLine: "npx app-publisher --no-ci --prompt-version Y"
        });

        taskDefs.push({
            label: "release" + groupSeparator + "publish (write log)",
            cmdLine: "npx app-publisher --no-ci --write-log"
        });

        taskDefs.push({
            label: "release" + groupSeparator + "republish",
            cmdLine: "npx app-publisher --no-ci --republish"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "changelog " + groupSeparator + "edit pending",
            cmdLine: "npx app-publisher --no-ci --task-changelog"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "changelog " + groupSeparator + "view pending",
            cmdLine: "npx app-publisher --no-ci --task-changelog-view"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "changelog " + groupSeparator + "write pending to file",
            cmdLine: "npx app-publisher --no-ci --task-changelog-file changethis.wrapper.log.txt"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "ci" + groupSeparator + "environment info",
            cmdLine: "npx app-publisher --no-ci --task-ci-env"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "ci" + groupSeparator + "build info",
            cmdLine: "npx app-publisher --no-ci --task-ci-env-info"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "release" + groupSeparator + "mantis",
            cmdLine: "npx app-publisher --no-ci --task-mantisbt-release"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "release" + groupSeparator + "email",
            cmdLine: "npx app-publisher --no-ci --task-email"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "version" + groupSeparator + "current",
            cmdLine: "npx app-publisher --no-ci --task-version-current"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "version" + groupSeparator + "info",
            cmdLine: "npx app-publisher --no-ci --task-version-info"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "version" + groupSeparator + "next",
            cmdLine: "npx app-publisher --no-ci --task-version-next"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "version" + groupSeparator + "touch",
            cmdLine: "npx app-publisher --no-ci --task-touch-versions"
        });

        taskDefs.push({
            label: "tasks" + groupSeparator + "version" + groupSeparator + "touch and commit",
            cmdLine: "npx app-publisher --no-ci --task-touch-versions-commit"
        });

        //
        // Create the shell execution objects
        //
        taskDefs.forEach((def: any) => {
            let apFmtLabel = "";
            if (apLabel) {
                apFmtLabel = ` (${apLabel.toLowerCase()})`;
                def.cmdLine += ` --config-name ${apLabel}`;
            }
            const exec = new ShellExecution(def.cmdLine, options);
            tasks.push(new Task(this._getKind(def.cmdLine, defaultDef), folder,
                                `${def.label}${apFmtLabel}`, "apppublisher", exec, undefined));
        });

        this.wrapper.log.methodDone("read app-publisher file uri tasks", 4, logPad, [[ "# of tasks found", tasks.length ]], this.logQueueId);

        return tasks;
    }

}
