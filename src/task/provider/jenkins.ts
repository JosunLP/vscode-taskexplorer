
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, WorkspaceFolder, ShellExecution, Uri, workspace, ShellExecutionOptions } from "vscode";


export class JenkinsTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "jenkins"); }


    public createTask(pathToJenkins: string, pathToCurl: string, folder: WorkspaceFolder, uri: Uri, xArgs: string[]): Task
    {
        const args = [
            "-X",
            "POST",
            "-L",
            "-H",
            "Authorization: basic " + xArgs[0],
            "-F",
            "jenkinsfile=<Jenkinsfile",
            pathToJenkins + "/pipeline-model-converter/validate"
        ];

        // const shellW32 = configuration.getVs<string>("terminal.integrated.shell.windows"),
        //       shellLnx = configuration.getVs<string>("terminal.integrated.shell.linux"),
        //       shellOsx = configuration.getVs<string>("terminal.integrated.shell.osx");

        const options: ShellExecutionOptions = { cwd: dirname(uri.fsPath) };
        /* istanbul ignore else */
        if (process.platform === "win32")
        {
            Object.assign(options, {
                executable: "cmd.exe",
                shellArgs: [ "/c" ],
                // type: "process",
            });
        }

        const definition: ITaskDefinition =
        {
            type: this.providerName,
            script: undefined,
            target: undefined,
            fileName: basename(uri.fsPath),
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            uri
        };

        const exec = new ShellExecution(pathToCurl, args, options);
        return new Task(definition, folder, "Validate Jenkinsfile", "jenkins", exec, "$msCompile");
    }


    public getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        return 0;
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const tasks: Task[] = [],
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder,
              pathToCurl = this.wrapper.config.get<string>("pathToPrograms.curl"),
              pathToJenkins = this.wrapper.config.get<string>("pathToPrograms.jenkins"),
              envVariable = this.wrapper.config.get<string>("environment.jenkinsApiToken", "JENKINS_API_TOKEN");

        this.wrapper.log.methodStart("read jenkinsfile uri task", 3, logPad, false, [
            [ "project folder", folder.name ], [ "path", uri.fsPath ], [ "path to curl", pathToCurl ],
            [ "path to jenkins", pathToJenkins ], [ "token env variable", envVariable ]
        ], this.logQueueId);

        if (pathToJenkins && pathToCurl && process.env[envVariable])
        {
            tasks.push(this.createTask(pathToJenkins, pathToCurl, folder, uri, [ envVariable ]));
        }

        this.wrapper.log.methodDone("read jenkinsfile uri tasks", 4, logPad, [[ "# of tasks found", tasks.length ]], this.logQueueId);
        return tasks;
    }

}
