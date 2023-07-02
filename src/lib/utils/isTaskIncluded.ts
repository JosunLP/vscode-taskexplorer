
import { join } from "path";
import { Task } from "vscode";
import { TeWrapper } from "../wrapper";
//
// For JSON5, if I don't specifically import index.js with 'require', then the
// damn mjs module file is included by webpack.  I'm sure there's a way to have
// it import the commonjs module nicely, but couldn't find a way. JSON5 is needed
// to read the VSCode tasks.json file since it allows comments, and VSCode doesn't
// expose the task definition's 'hide' property.
//
const JSON5 = require("json5/dist/index.js");


export const isTaskIncluded = (wrapper: TeWrapper, task: Task, relativePath: string, logPad = "", logQueueId?: string) =>
{
    wrapper.log.methodStart(`Check task '${task.source}/${task.name}' against excludes`, 4, logPad, false, [[ "relative path", relativePath ]], logQueueId);
    //
    // We have our own provider for Gulp and Grunt tasks...
    // Ignore VSCode provided gulp and grunt tasks, which are always and only from a gulp/gruntfile
    // in a workspace folder root directory.  All internally provided tasks will have the 'uri' property
    // set in its task definition, VSCode provided Grunt/Gulp tasks will not
    //
    const isScopeWsFolder = wrapper.typeUtils.isWorkspaceFolder(task.scope),
          isVsCodeGruntOrGulpTaskSource = !task.definition.uri && (task.source === "grunt" || task.source === "gulp");
    if (isVsCodeGruntOrGulpTaskSource)
    {
        wrapper.log.write(`   skipping vscode provided ${task.source} task`, 4, logPad, logQueueId);
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
        const usesIntNpmProvider = wrapper.config.get<boolean>(wrapper.keys.Config.UseNpmProvider);
        if (usesIntNpmProvider || wrapper.utils.isExcluded(wrapper.pathUtils.getTaskAbsolutePath(task)))
        {
            wrapper.log.write("   skipping vscode provided npm task", 4, logPad, logQueueId);
            return false;
        }
    }
    //
    // External tasks registered via Task Explorer API
    //
    const providers = wrapper.providers;
    if (providers[task.source] && providers[task.source].isExternal)
    {
        return !!task.definition && !!task.name && !!task.execution;
    }
    //
    // Check enabled and npm install task
    // This will ignore tasks from other providers as well, unless it has registered
    // as an external provider via Task Explorer API
    //
    const srcEnabled = wrapper.utils.isTaskTypeEnabled(task.source);
    wrapper.log.value("   enabled in settings", srcEnabled, 3, logPad, logQueueId);
    if (!srcEnabled)
    {
        wrapper.log.write(`   skipping this task (${task.source} disabled in settings)`, 4, logPad, logQueueId);
        return false;
    }
    //
    // Check task excludes array.  Uses REGEX, not GLOB
    //
    const exRegexes = wrapper.config.get<string[]>("excludeTask", []),
          fExRegexes = exRegexes.filter(et => !!et && wrapper.typeUtils.isString(et) && et.length > 1);
    for (const rgxPattern of fExRegexes)
    {
        if ((new RegExp(rgxPattern)).test(task.name))
        {
            wrapper.log.write("   skipping this task (by 'excludeTask' setting)", 4, logPad, logQueueId);
            wrapper.log.methodDone("Check task exclusion", 4, logPad, undefined, logQueueId);
            return false;
        }
    }
    //
    // Check VSCode /workspace tasks for 'hide' property
    //
    let result = true;
    if (task.source === "Workspace" && isScopeWsFolder)
    {
        const showHiddenWsTasks = wrapper.config.get<boolean>("showHiddenWsTasks", true);
        if (!showHiddenWsTasks) // && task.definition.hide === true)
        {   //
            // Note: VSCode workspace task provider does not publish the 'hide' property anywhere
            // in the task,, it's definition, detail, anywhere.  Stupid. So we have to JSON parse
            // the tasks.json file to see if the hideproperty is set.
            //
            const tasksFile = join(task.scope.uri.fsPath, ".vscode", "tasks.json");
            result = !!wrapper.utils.wrap((): boolean =>
            {
                const jsonc = wrapper.fs.readFileSync(tasksFile).toString(),
                      tasksJso = JSON5.parse(jsonc), // damn mjs module json5 needed for comments allowed in tasks.json
                      wsTask = tasksJso.tasks.find((t: any) => t.label === task.name || t.script === task.name);
                return !(wsTask && wsTask.hide === true);
            },
            [ wrapper.log.error ], this);
        }
    }
    wrapper.log.write("   task is included", 4, logPad, logQueueId);
    wrapper.log.methodDone("Check task exclusion", 4, logPad, undefined, logQueueId);
    return result;
};
