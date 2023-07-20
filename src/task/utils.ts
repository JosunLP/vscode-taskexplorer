
import { dirname, join } from "path";
import { TeWrapper } from "../lib/wrapper";
import { TeTaskSource } from "../interface";
import { ConfigurationChangeEvent, Disposable, Task } from "vscode";

const JSON5 = require("json5/dist/index.js");


export class TaskUtils implements Disposable
{
    private _showUserTasks: boolean;
    private _showHiddenWsTasks: boolean;
    private _useIntNpmProvider: boolean;
    private _fileExRegexes: string[];
    private _enabledProviders: Record<string, boolean>;

    private readonly _disposables: Disposable[];


    constructor(private readonly wrapper: TeWrapper)
    {
        this._useIntNpmProvider = wrapper.config.get<boolean>(wrapper.keys.Config.UseNpmProvider, false);
        this._showHiddenWsTasks = wrapper.config.get<boolean>(wrapper.keys.Config.ShowHiddenVSCodeWsTasks, true);
        this._showUserTasks = wrapper.config.get<boolean>(wrapper.keys.Config.SpecialFoldersShowUserTasks, false);
        this._enabledProviders = wrapper.config.get<Record<string, boolean>>(wrapper.keys.Config.EnabledTasks, {});
        this._fileExRegexes = wrapper.config.get<string[]>(wrapper.keys.Config.ExcludeTaskRegexes, []).filter(et => wrapper.typeUtils.isString(et, true), this);
        this._disposables = [
            wrapper.config.onDidChange(this.processConfigChanges, this)
        ];
    }


    dispose = () => this._disposables.splice(0).forEach(d => d.dispose());


    get useNpmProvider() { return this._useIntNpmProvider; }


    isTaskIncluded = (task: Task, logPad: string, logQueueId?: string) =>
    {
        this.wrapper.log.methodStart(`Check task '${task.source}/${task.name}' against excludes`, 4, logPad, false, undefined, logQueueId);
        //
        // We have our own provider for Gulp and Grunt tasks...
        // Ignore VSCode provided gulp and grunt tasks, which are always and only from a gulp/gruntfile
        // in a workspace folder root directory.  All internally provided tasks will have the 'uri' property
        // set in its task definition, VSCode provided Grunt/Gulp tasks will not
        //
        const isScopeWsFolder = this.wrapper.typeUtils.isWorkspaceFolder(task.scope),
              isVsCodeGruntOrGulpTaskSource = !task.definition.uri && (task.source === "grunt" || task.source === "gulp");
        if (isVsCodeGruntOrGulpTaskSource)
        {
            this.wrapper.log.write(`   skipping vscode provided ${task.source} task`, 4, logPad, logQueueId);
            return false;
        }
        //
        // External tasks registered via Task Explorer API
        //
        const providers = this.wrapper.providers;
        if (providers[task.source] && providers[task.source].isExternal)
        {
            // this.wrapper.log.write("   skipping this task (external)", 4, logPad, logQueueId);
            return !!task.definition && !!task.name && !!task.execution;
        }
        //
        // *** VSCode internal task providers s***.  I mean, come on.  Add a package.json to a folder, see
        // the tasks provided by the engine, all good.  But delete the folder, and keep seeing the tasks
        // provided by the engine.  SO check to make sure the task uri actually exists
        //
        const absolutePath = this.wrapper.pathUtils.getTaskAbsoluteUri(task, true).fsPath;
        if (/* !providers[task.source].isExternal && */!this.wrapper.fs.pathExistsSync(absolutePath))
        {
            this.wrapper.log.write("   skipping this task (file does not exist)", 4, logPad, logQueueId);
            return false;
        }
        //
        // NPM tasks might be provided by VSCode or internally.  Check type, and excludes if VSCode provided.
        // We would want the user to turn off the VSCode NPM provider if using the internal provider, but we
        // should assume that they haven't, and we'll still be receiving them on fetch()
        //
        const isNpmTaskSource = isScopeWsFolder && task.source === "npm" && task.definition.type === "npm",
              isVsCodeNpmTaskSource = !task.definition.uri && isNpmTaskSource;
        if (isVsCodeNpmTaskSource)
        {
            if (this._useIntNpmProvider || this.wrapper.utils.isExcluded(dirname(absolutePath), this.wrapper.log))
            {
                this.wrapper.log.write("   skipping vscode provided npm task", 4, logPad, logQueueId);
                return false;
            }
        }
        //
        // Check task excludes array.  Uses REGEX, not GLOB
        //
        for (const rgxPattern of this._fileExRegexes)
        {
            if ((new RegExp(rgxPattern)).test(task.name))
            {
                this.wrapper.log.write("   skipping this task (by 'excludeTask' setting)", 4, logPad, logQueueId);
                this.wrapper.log.methodDone("Check task exclusion", 4, logPad, undefined, logQueueId);
                return false;
            }
        }
        //
        // Check enabled and npm install task.  This will ignore tasks from other providers as well,
        // unless it has registered as an external provider via Task Explorer API
        //
        const srcEnabled = this._enabledProviders[task.source.toLowerCase()];
        this.wrapper.log.value("   is enabled in settings", srcEnabled, 4, logPad, logQueueId);
        if (!srcEnabled)
        {
            this.wrapper.log.write(`   skipping this task (${task.source} disabled in settings)`, 4, logPad, logQueueId);
            return false;
        }
        //
        // Check VSCode /workspace tasks for 'hide' property and whether it's a workspace or user task
        //
        if (task.source === "Workspace")
        {
            if (isScopeWsFolder)
            {
                if (!this._showHiddenWsTasks) // && task.definition.hide === true)
                {   //
                    // Note: VSCode workspace task provider does not publish the 'hide' property anywhere
                    // in the task,, it's definition, detail, anywhere.  Stupid. So we have to JSON parse
                    // the tasks.json file to see if the hideproperty is set.
                    //
                    const tasksFile = join(task.scope.uri.fsPath, ".vscode", "tasks.json");
                    const result = !!this.wrapper.utils.wrap(() =>
                    {
                        const jsonc = this.wrapper.fs.readFileSync(tasksFile).toString(),
                              tasksJso = JSON5.parse(jsonc), // json5 needed for comments allowed in tasks.json
                              wsTask = tasksJso.tasks.find((t: any) => t.label === task.name || t.script === task.name);
                        return !(wsTask && wsTask.hide === true);
                    }, [ this.wrapper.log.error ], this);
                    if (!result)
                    {
                        this.wrapper.log.write("   skipping hidden workspace task (disabled in settings)", 4, logPad, logQueueId);
                        return false;
                    }
                }
            }
            else if (!this._showUserTasks) {
                this.wrapper.log.write("   skipping user task (disabled in settings)", 4, logPad, logQueueId);
                return false;
            }
        }
        this.wrapper.log.write("   task is included", 4, logPad, logQueueId);
        this.wrapper.log.methodDone("Check task exclusion", 4, logPad, undefined, logQueueId);
        return true;
    };


    isTaskTypeEnabled = (source: TeTaskSource) => !!this._enabledProviders[source.toLowerCase()];


    private processConfigChanges = (e: ConfigurationChangeEvent) =>
    {
        const cfgKeys = this.wrapper.keys.Config;
        if (this.wrapper.config.affectsConfiguration(e, cfgKeys.EnabledTasks, cfgKeys.SpecialFoldersShowUserTasks, cfgKeys.ShowHiddenVSCodeWsTasks, cfgKeys.UseNpmProvider, cfgKeys.ExcludeTaskRegexes))
        {
            this._useIntNpmProvider = this.wrapper.config.get<boolean>(cfgKeys.UseNpmProvider, false);
            this._showHiddenWsTasks = this.wrapper.config.get<boolean>(cfgKeys.ShowHiddenVSCodeWsTasks, true);
            this._showUserTasks = this.wrapper.config.get<boolean>(cfgKeys.SpecialFoldersShowUserTasks, false);
            this._enabledProviders = this.wrapper.config.get<Record<string, boolean>>(cfgKeys.EnabledTasks, {});
            this._fileExRegexes = this.wrapper.config.get<string[]>(cfgKeys.ExcludeTaskRegexes, []).filter(et => this.wrapper.typeUtils.isString(et, true), this);
        }
    };

}
