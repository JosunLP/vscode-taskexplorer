/* eslint-disable prefer-arrow/prefer-arrow-functions */

/**
 * @class TeConfigWatcher
 * @since 2.0.0
 *
 * Watches all configuration parameters that can cause a a tree refresh
 */

import { IDictionary } from ":types";
import { TeWrapper } from "../lib/wrapper";
import { executeCommand } from "../lib/command/command";
import { ITeTreeConfigWatcher } from "../interface";
import { getScriptTaskTypes, getTaskTypeRealName } from "../lib/utils/taskUtils";
import { ConfigurationChangeEvent, window, Disposable, Event, EventEmitter, workspace } from "vscode";


export class TeTreeConfigWatcher implements ITeTreeConfigWatcher, Disposable
{
    private _disposables: Disposable[];
    private _watcherEnabled = true;
    private _processingConfigEvent = false;
    private _enabledTasks: IDictionary<boolean>;
    private _pathToPrograms: IDictionary<string>;
    private readonly _onReady: EventEmitter<void>;


    constructor(private readonly wrapper: TeWrapper)
    {
		this._onReady = new EventEmitter<void>();
        this._enabledTasks = wrapper.config.get<IDictionary<boolean>>("enabledTasks", {});
        this._pathToPrograms = wrapper.config.get<IDictionary<string>>("pathToPrograms", {});
        this._disposables = [
            this._onReady,
            workspace.onDidChangeConfiguration(this.processConfigChanges, this)
        ];
    }

    dispose = () => this._disposables.forEach(d => d.dispose());


    get isBusy(): boolean {
        return this._processingConfigEvent;
    }

    get onReady(): Event<void> {
        return this._onReady.event;
    }


    enableConfigWatcher = (enable: boolean) => this._watcherEnabled = enable;


    private processConfigChanges = async(e: ConfigurationChangeEvent) =>
    {
        const w = this.wrapper;
        //
        // if the application has called 'enableConfigWatcher' to disable, then there's nothing to do
        //
        if (!this._watcherEnabled)
        {
            w.log.methodEvent("treemgr", "process config changes - disabled", 1);
            return;
        }

        w.log.methodStart("process config changes", 1, "", true);

        // context = ctx;
        let refresh = false,
            refresh2 = false, // Uses 1st param 'false' in refresh(), for cases where task files have not changed
            explorerTreeEnabled: boolean | undefined,
            sidebarEnabled: boolean | undefined;
        const cfgKeys = w.keys.Config,
              refreshTaskTypes: string[] = [];

        const registerChange = (taskType: string) => w.utils.pushIfNotExists(refreshTaskTypes, taskType);

        this._processingConfigEvent = true;

        //
        // Explorer Tree / SideBar View
        //
        if (w.config.affectsConfiguration(e, "enableExplorerView"))
        {
            explorerTreeEnabled = w.config.get<boolean>("enableExplorerView");
            w.log.write("   the 'enableExplorerView' setting has changed", 1);
            w.log.value("      new value", explorerTreeEnabled, 1);
        }
        if (w.config.affectsConfiguration(e, "enableSideBar"))
        {
            sidebarEnabled = w.config.get<boolean>("enableSideBar");
            w.log.write("   the 'enableSideBar' setting has changed", 1);
            w.log.value("      new value", sidebarEnabled, 1);
        }
        if (sidebarEnabled !== undefined || explorerTreeEnabled !== undefined)
        {
            const enabled  = w.utils.isTeEnabled();
            setTimeout((e) => void w.contextTe.setContext(w.keys.Context.Enabled, e), 50, enabled); this._processingConfigEvent = false;
            if (!enabled) {
                this._processingConfigEvent = false;
                this._onReady.fire();
                return;
            }
        }

        //
        // Main excludes list changes requires global refresh
        //
        if (w.config.affectsConfiguration(e, cfgKeys.ExcludeGlobs, cfgKeys.ExcludeTaskRegexes))
        {
            w.log.write(`   the '${cfgKeys.ExcludeGlobs}/${cfgKeys.ExcludeTaskRegexes}' setting has changed`, 1);
            w.log.value(`      ${cfgKeys.ExcludeGlobs} changed`, e.affectsConfiguration(cfgKeys.ExcludeGlobs), 1);
            w.log.value(`      ${cfgKeys.ExcludeTaskRegexes} changed`, e.affectsConfiguration(cfgKeys.ExcludeTaskRegexes), 1);
            refresh = true;
        }

        //
        // User Tasks / specialFolders.showUserTasks
        // Other specialFolder config events are process in tree/folderCache module
        //
        if (w.config.affectsConfiguration(e, cfgKeys.SpecialFoldersShowUserTasks))
        {
            w.log.write(`   the '${cfgKeys.SpecialFoldersShowUserTasks}' setting has changed`, 1);
            w.log.value("      new value", w.config.get<boolean>(cfgKeys.SpecialFoldersShowUserTasks), 1);
            refresh = true;
        }

        //
        // Path changes to task programs require task executions to be re-set up
        //
        if (!refresh)
        {   //
            // Task Types
            //
            if (w.config.affectsConfiguration(e, "enabledTasks"))
            {
                const newEnabledTasks = w.config.get<IDictionary<boolean>>("enabledTasks", {});
                for (const p of Object.keys(this._enabledTasks))
                {
                    const taskType = getTaskTypeRealName(p),
                        oldValue = this._enabledTasks[p],
                        newValue = newEnabledTasks[p];
                    if (newValue !== oldValue)
                    {
                        w.log.write(`   the 'enabledTasks.${taskType}' setting has changed`, 1);
                        w.log.value("      new value", newValue, 1);
                        await w.fileWatcher.registerFileWatcher(taskType, false, newValue, "   ");
                        registerChange(taskType);
                    }
                }
                Object.assign(this._enabledTasks, newEnabledTasks);
            }

            //
            // Groupings changes require global refresh
            //
            if (w.config.affectsConfiguration(e, cfgKeys.GroupWithSeperator, cfgKeys.GroupSeparator, cfgKeys.GroupMaxLevel, cfgKeys.GroupStripTaskLabel, cfgKeys.GroupScripts, cfgKeys.GroupStripScriptLabel))
            {
                w.log.write("   A tree grouping setting has changed", 1);
                w.log.value(`      ${cfgKeys.GroupWithSeperator} changed`, w.config.get<boolean>(cfgKeys.GroupWithSeperator), 1);
                w.log.value(`      ${cfgKeys.GroupSeparator} changed`, w.config.get<boolean>(cfgKeys.GroupSeparator), 1);
                w.log.value(`      ${cfgKeys.GroupMaxLevel} changed`, w.config.get<boolean>(cfgKeys.GroupMaxLevel), 1);
                w.log.value(`      ${cfgKeys.GroupScripts} changed`, w.config.get<boolean>(cfgKeys.GroupScripts), 1);
                w.log.value(`      ${cfgKeys.GroupStripScriptLabel} changed`, w.config.get<boolean>(cfgKeys.GroupStripScriptLabel), 1);
                w.log.value(`      ${cfgKeys.GroupStripTaskLabel} changed`, w.config.get<boolean>(cfgKeys.GroupStripTaskLabel), 1);
                refresh2 = true; // refresh2 will rebuild the tree but won't trigger a file cache build and/or task provider invalidation
            }

            //
            // Workspace/project folder sorting
            //
            if (w.config.affectsConfiguration(e, cfgKeys.SortProjectFoldersAlphabetically))
            {
                w.log.write(`   the '${cfgKeys.SortProjectFoldersAlphabetically}' setting has changed`, 1);
                w.log.value("      new value", w.config.get<boolean>(cfgKeys.SortProjectFoldersAlphabetically), 1);
                refresh2 = true; // refresh2 will rebuild the tree but won't trigger a file cache build and/or task provider invalidation
            }

            //
            // Program paths
            //
            if (w.config.affectsConfiguration(e, "pathToPrograms"))
            {
                const newPathToPrograms = w.config.get<IDictionary<string>>("pathToPrograms", {});
                for (const p of Object.keys(this._pathToPrograms))
                {
                    const taskType = getTaskTypeRealName(p),
                        oldValue = this._pathToPrograms[p],
                        newValue = newPathToPrograms[p];
                    if (newValue !== oldValue)
                    {
                        w.log.write(`   the 'pathToPrograms.${taskType}' setting has changed`, 1);
                        w.log.value("      new value", newValue, 1);
                        if (<string>taskType !== "ansicon" && <string>taskType !== "curl") {// these paths are ont 'task types'
                            registerChange(taskType);
                        }
                        else if (<string>taskType === "curl") {
                            registerChange("jenkins");
                        }
                        else { registerChange("ant"); }
                    }
                }
                Object.assign(this._pathToPrograms, newPathToPrograms);
            }

            //
            // Extra Bash Globs (for extensionless script files)
            //
            if (w.config.affectsConfiguration(e, "globPatternsBash") && !refreshTaskTypes.includes("bash"))
            {
                w.log.write("   the 'globPatternsBash' setting has changed", 1);
                await w.fileWatcher.registerFileWatcher("bash", false, w.config.get<boolean>("enabledTasks.bash", false), "   ");
                registerChange("bash");
            }

            //
            // Extra Apache Ant Globs (for non- build.xml files)s
            //
            if (w.config.affectsConfiguration(e, "includeAnt", "globPatternsAnt") && !refreshTaskTypes.includes("ant"))
            {
                w.log.write("   the 'globPatternsAnt' setting has changed", 1);
                await w.fileWatcher.registerFileWatcher("ant", false, w.config.get<boolean>("enabledTasks.ant", false), "   ");
                registerChange("ant");
            }

            //
            // Whether or not to use 'ansicon'when running 'ant' tasks
            //
            if (w.config.affectsConfiguration(e, "enableAnsiconForAnt"))
            {
                const newValue = w.config.get<boolean>("enableAnsiconForAnt");
                w.log.write("   the '.enableAnsiconForAnt' setting has changed", 1);
                w.log.value("      new value", newValue, 1);
                if (newValue) {
                    window.showInformationMessage("For Ant/Ansicon configuration change to take effect, close all open terminals");
                }
                registerChange("ant");
            }

            //
            // Whether or not to use the 'ant' program to detect ant tasks (default is xml2js parser)
            //
            if (w.config.affectsConfiguration(e, "useAnt"))
            {
                w.log.write("   the 'useAnt' setting has changed", 1);
                w.log.value("      new value", w.config.get<boolean>("useAnt"), 1);
                registerChange("ant");
            }

            //
            // Whether or not to use the 'gulp' program to detect gulp tasks (default is custom parser)
            //
            if (w.config.affectsConfiguration(e, "useGulp"))
            {
                w.log.write("   the 'useGulp' setting has changed", 1);
                w.log.value("      new value", w.config.get<boolean>("useGulp"), 1);
                registerChange("gulp");
            }

            //
            // NPM Package Manager change (NPM / Yarn)
            // Do a global refresh since we don't provide the npm tasks, VSCode itself does
            //
            if (e.affectsConfiguration("npm.packageManager"))
            {
                w.log.write("   the 'npm.packageManager' setting has changed", 1);
                w.log.value("      new value", w.config.getVs<boolean>("npm.packageManager"), 1);
                registerChange("npm");
            }

            //
            // Hidden VSCode workspace tasks.  tasks.json task definitions can be marked with the `hiddem`
            // flag but the flag is not visible via the Task API Task definition, the file must be read
            // and parsed by the application to locate the value.
            //
            if (w.config.affectsConfiguration(e, cfgKeys.ShowHiddenVSCodeWsTasks))
            {
                w.log.write(`   the '${cfgKeys.ShowHiddenVSCodeWsTasks}' setting has changed`, 1);
                w.log.value("      new value", w.config.get<boolean>(cfgKeys.ShowHiddenVSCodeWsTasks), 1);
                registerChange("Workspace");
            }

            //
            // Integrated shell.  This should bethe last check in this if() block, since it
            // is the only change in the block that can set 'refresh'.
            //
            if (e.affectsConfiguration("terminal.integrated.shell.windows") || e.affectsConfiguration("terminal.integrated.shell.linux") ||
                e.affectsConfiguration("terminal.integrated.shell.osx"))
            {   //
                // Script type task defs will change with terminal change
                //
                w.log.write("   a terminal shell setting has changed", 1);
                w.log.value("      windows shell", w.config.getVs<boolean>("terminal.integrated.shell.windows"), 2);
                w.log.value("      linux shell", w.config.getVs<boolean>("terminal.integrated.shell.linux"), 2);
                w.log.value("      osx shell", w.config.getVs<boolean>("terminal.integrated.shell.osx"), 2);
                getScriptTaskTypes().forEach(t => { if (this._enabledTasks[t]) registerChange(t); });
            }
        }

        //
        // Refresh tree depending on specific settings changes
        //
        await w.utils.wrap(async () =>
        {
            if (refresh || refreshTaskTypes.length > 3)
            {
                await executeCommand(w.keys.Commands.Refresh, undefined, false, "   ");
            }
            else if (refreshTaskTypes.length > 0)
            {
                for (const t of refreshTaskTypes) {
                    await executeCommand(w.keys.Commands.Refresh, t, undefined, "   ");
                }
            }
            else if (refresh2) {
                await executeCommand(w.keys.Commands.Refresh, false, undefined, "   ");
            }
            else {
                w.log.write("   current changes require no processing", 1);
            }
        }, [ w.log.error ], this);

        this._processingConfigEvent = false;
        this._onReady.fire();

        w.log.methodDone("process config changes", 1);
    };

}
