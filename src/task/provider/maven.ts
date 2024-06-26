
import { basename, dirname } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { parseStringPromise } from "xml2js";
import { ITaskDefinition } from "../../interface";
import { TaskExplorerProvider } from "./provider";
import { Task, WorkspaceFolder, ShellExecution, Uri, workspace, ShellExecutionOptions } from "vscode";


export class MavenTaskProvider extends TaskExplorerProvider implements TaskExplorerProvider
{

    constructor(wrapper: TeWrapper) { super(wrapper, "maven"); }


    public createTask(target: string, cmd: string, folder: WorkspaceFolder, uri: Uri, xArgs: string[]): Task | undefined
    {
        return undefined;
    }


    private getDefaultDefinition(target: string | undefined, folder: WorkspaceFolder, uri: Uri): ITaskDefinition
    {
        const def: ITaskDefinition = {
            type: this.providerName,
            script: target,
            target,
            fileName: basename(uri.fsPath),
            path: this.wrapper.pathUtils.getRelativePath(folder, uri),
            cmdLine: "mvn",
            takesArgs: false,
            uri
        };
        return def;
    }


    public getDocumentPosition(scriptName: string | undefined, documentText: string | undefined): number
    {
        return 0;
    }


    private getCommand(): string
    {
        return this.wrapper.config.get<string>("pathToPrograms.maven", "mvn");
    }


    public async readUriTasks(uri: Uri, logPad: string): Promise<Task[]>
    {
        const cwd = dirname(uri.fsPath),
              folder = workspace.getWorkspaceFolder(uri) as WorkspaceFolder,
              defaultDef = this.getDefaultDefinition(undefined, folder, uri),
              options: ShellExecutionOptions = { cwd };

        this.wrapper.log.methodStart("read maven file uri task", 3, logPad, false, [
            [ "path", uri.fsPath ], [ "project folder", folder.name ]
        ], this.logQueueId);

        //
        // Validate XML with xml2js
        //
        try {
            const buffer = await this.wrapper.fs.readFileAsync(uri.fsPath);
            await parseStringPromise(buffer);
        }
        catch (e: any) {
            this.wrapper.log.error(e, undefined, this.logQueueId);
            this.wrapper.log.methodDone("read maven file uri tasks", 3, logPad, [[ "# of tasks found", 0 ]], this.logQueueId);
            return [];
        }

        const kindClean: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " clean -f " + defaultDef.fileName
            }
        };

        const kindCompile: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " compile -f " + defaultDef.fileName
            }
        };

        const kindDeploy: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " deploy -f " + defaultDef.fileName
            }
        };

        const kindInstall: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " install -f " + defaultDef.fileName,
            }
        };

        const kindPackage: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " package -f " + defaultDef.fileName,
            }
        };

        const kindTest: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " test -f " + defaultDef.fileName,
            }
        };

        const kindValidate: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " validate -f " + defaultDef.fileName,
            }
        };

        const kindVerify: ITaskDefinition = {
            ...defaultDef,
            ...{
                cmdLine: this.getCommand() + " verify -f " + defaultDef.fileName,
            }
        };

        //
        // Create the shell execution objects
        //
        const executionClean = new ShellExecution(kindClean.cmdLine as string, options);
        const executionCompile = new ShellExecution(kindCompile.cmdLine as string, options);
        const executionDeploy = new ShellExecution(kindDeploy.cmdLine as string, options);
        const executionInstall = new ShellExecution(kindInstall.cmdLine as string, options);
        const executionPackage = new ShellExecution(kindPackage.cmdLine as string, options);
        const executionTest = new ShellExecution(kindTest.cmdLine as string, options);
        const executionValidate = new ShellExecution(kindValidate.cmdLine as string, options);
        const executionVerify = new ShellExecution(kindVerify.cmdLine as string, options);

        this.wrapper.log.methodDone("read maven file uri tasks", 4, logPad, [[ "# of tasks found", 8 ]], this.logQueueId);

        return [ new Task(kindClean, folder, "Clean", "maven", executionClean, undefined),
                 new Task(kindCompile, folder, "Compile", "maven", executionCompile, undefined),
                 new Task(kindDeploy, folder, "Deploy", "maven", executionDeploy, undefined),
                 new Task(kindInstall, folder, "Install", "maven", executionInstall, undefined),
                 new Task(kindPackage, folder, "Package", "maven", executionPackage, undefined),
                 new Task(kindTest, folder, "Test", "maven", executionTest, undefined),
                 new Task(kindValidate, folder, "Validate", "maven", executionValidate, undefined),
                 new Task(kindVerify, folder, "Verify", "maven", executionVerify, undefined) ];
    }

}
