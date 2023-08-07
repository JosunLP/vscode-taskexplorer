/* eslint-disable @typescript-eslint/naming-convention */

import { join } from "path";
import { Log } from "../../utils/log";
import { TeWrapper } from "../../wrapper";
import { executeCommand, registerCommand } from "../../command/command";
import { window, ConfigurationChangeEvent, Disposable, ExtensionMode } from "vscode";
import {
    Commands, ConfigKeys, VsCodeCommands, ILog, LogLevel, ILogConfig, ILogControl, ILogPackageJson,
    ILogOutputChannel, CallbackOptions, LogHttpGetFn, __WPBUILD__
} from "../../../interface";


/**
 * @class TeLog
 * @since 3.0.0
 */
export class TeLog extends Log implements ILog, Disposable
{

    private readonly _disposables: Disposable[];


    constructor(private readonly wrapper: TeWrapper)
    {
        super(TeLog.getConfig(wrapper), TeLog.getControl(wrapper));
        this._disposables = [
            registerCommand(Commands.ShowOutputWindow, (show: boolean) => this.showOutput(show, this.config.outputChannel!), this),
            registerCommand(Commands.ShowErrorOutputWindow, (show: boolean) => this.showOutput(show, this.config.errorChannel!), this),
            wrapper.config.onDidChange(this.onConfigChange, this)
        ];
    }

    override dispose = () => { this._disposables.splice(0).forEach(d => d.dispose()); super.dispose(); };


    private static getConfig = (wrapper: TeWrapper): ILogConfig =>
    {
        const pkgJson = <ILogPackageJson>wrapper.context.extension.packageJSON,
              oChannel = window.createOutputChannel(wrapper.context.extension.packageJSON.displayName),
              eChannel = window.createOutputChannel(`${wrapper.context.extension.packageJSON.displayName} (Errors)`);
        return {
            app: pkgJson.name,
            env: wrapper.env,
            errorChannel: {
                clear: eChannel.clear,
                dispose: eChannel.dispose,
                hide: eChannel.hide,
                write: eChannel.appendLine,
                show: eChannel.show
            },
            httpGetFn: <LogHttpGetFn>wrapper.server.get,
            installDirectory: wrapper.context.extensionUri.fsPath,
            isTests: wrapper.context.extensionMode === ExtensionMode.Test,
            logDirectory: wrapper.context.logUri.fsPath,
            moduleHash: {
                "taskexplorer": __WPBUILD__.contentHash.taskexplorer,
                "taskexplorer.debug": __WPBUILD__.contentHash["taskexplorer.debug"],
                "runtime": __WPBUILD__.contentHash.runtime,
                "vendor": __WPBUILD__.contentHash.vendor
            },
            outputChannel: {
                clear: oChannel.clear,
                dispose: oChannel.dispose,
                hide: eChannel.hide,
                write: oChannel.appendLine,
                show: eChannel.show
            },
            promptRestartFn: wrapper.utils.promptRestart,
            storageDirectory: wrapper.context.globalStorageUri.fsPath
        };
    };


    private static getControl = (wrapper: TeWrapper): ILogControl =>
    {
        return {
            blockScaryColors: wrapper.context.extensionMode === ExtensionMode.Test,
            enable: wrapper.config.get<boolean>(ConfigKeys.LogEnable, false),
            enableOutputWindow: wrapper.config.get<boolean>(ConfigKeys.LogEnableOutputWindow, true),
            enableFile: wrapper.config.get<boolean>(ConfigKeys.LogEnableFile, false),
            enableModuleReload: wrapper.config.get<boolean>(ConfigKeys.LogEnableModuleReload, false),
            level: wrapper.config.get<LogLevel>(ConfigKeys.LogLevel, 1),
            trace: false,
            valueWhiteSpace: 45,
            writeToConsole: false,
            writeToConsoleLevel: 2
        };
    };


	init = async (): Promise<void> =>
	{
        const w = this.wrapper,
              clean = w.versionChanged,
              prompt = w.utils.promptRestart,
              httpGet = <LogHttpGetFn>w.server.get;
		let sb: any = { dispose: w.utils.emptyFn, hide: w.utils.emptyFn };
		const wrapOpts: CallbackOptions = [
			/* catch   */window.showErrorMessage,
			/* finally */() => { sb.hide(); sb.dispose(); },
			/* err msg */"Unable to install debug logging support files"
		];
		w.utils.execIf(w.versionChanged, () =>
		{
			sb = window.createStatusBarItem(1, 100);
			sb.text = `$(loading~spin) ${w.extensionTitleShort}: Installing debug support files`;
			sb.tooltip = "Downloading a few support files for enhanced logging and error tracing";
			sb.show();
		});
		await w.utils.wrap(this.initBase, wrapOpts, this, clean, httpGet, prompt);
	};


    private onConfigChange = async (e: ConfigurationChangeEvent) =>
    {
        let cfgChanged = false;
        const cfgBaseKey = this.wrapper.config.baseSection,
              cfgKeys = this.wrapper.keys.Config;
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnable}`))
        {
            cfgChanged = true;
            this.control.enable = this.wrapper.config.get<boolean>(cfgKeys.LogEnable, false);
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnableOutputWindow}`))
        {
            cfgChanged = true;
            this.control.enableOutputWindow = this.wrapper.config.get<boolean>(cfgKeys.LogEnableOutputWindow, true);
            if (this.control.enableOutputWindow && !this.control.enable) {
                await this.wrapper.config.update(cfgKeys.LogEnable, this.control.enableOutputWindow);
            }
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnableFile}`))
        {
            cfgChanged = true;
            this.control.enableFile = this.wrapper.config.get<boolean>(cfgKeys.LogEnableFile, false);
            if (this.control.enableFile)
            {
                window.showInformationMessage("Log file location: " + this.state.fileName);
                if (!this.control.enable) {
                    await this.wrapper.config.update(cfgKeys.LogEnable, this.control.enableFile);
                }
            }
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogEnableModuleReload}`))
        {
            this.control.enableModuleReload = this.wrapper.config.get<boolean>(cfgKeys.LogEnableModuleReload, false);
        }
        if (e.affectsConfiguration(`${cfgBaseKey}.${cfgKeys.LogLevel}`))
        {
            this.control.level = this.wrapper.config.get<LogLevel>(cfgKeys.LogLevel, 1);
        }
        //
        // Call super function `reset` after config changes
        //
        if (cfgChanged) {
            this.reset();
        }
    };


    setWriteToConsole = (set: boolean, level = 2) =>
    {
        this.control.writeToConsole = set;
        this.control.writeToConsoleLevel = level;
    };


    private showOutput = async(show: boolean, channel: ILogOutputChannel) =>
    {
        if (show) {
            await executeCommand(VsCodeCommands.FocusOutputWindowPanel);
            (<() => any>channel.show)();
        }
        else {
            (<() => any>channel.hide)();
        }
    };

}
