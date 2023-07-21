
import { isObject } from "./utils/typeUtils";
import { IConfiguration } from "../interface/IConfiguration";
import {
    ConfigurationChangeEvent, workspace, WorkspaceConfiguration, ConfigurationTarget,
    ExtensionContext, ExtensionMode, Event, EventEmitter, Disposable
} from "vscode";


class Configuration implements IConfiguration, Disposable
{
    private _isDev = false;
    private _isTests = false;
    private _pkgJsonCfgProps: any;
    private configuration: WorkspaceConfiguration;
    private configurationGlobal: WorkspaceConfiguration;

    private readonly _disposables: Disposable[];
    private readonly _baseConfigSection = "taskexplorer";
    private readonly _onDidChange = new EventEmitter<ConfigurationChangeEvent>();
    // private readonly _onDidChangeHighPriority: EventEmitter<ConfigurationChangeEvent>;


    constructor()
    {
        this._pkgJsonCfgProps = {};
        this._onDidChange = new EventEmitter<ConfigurationChangeEvent>();
        // this._onDidChangeHighPriority = new EventEmitter<ConfigurationChangeEvent>();
        this.configuration = workspace.getConfiguration(this._baseConfigSection);
        this.configurationGlobal = workspace.getConfiguration();
        this._disposables = [
            this._onDidChange
            // this._onDidChangeHighPriority
        ];
    }


    dispose = () => this._disposables.splice(0).forEach(d => d.dispose());

	get onDidChange(): Event<ConfigurationChangeEvent> {
		return this._onDidChange.event;
	}

	// get onDidChangeHighPriority(): Event<ConfigurationChangeEvent> {
	// 	return this._onDidChange.event;
	// }


    public initialize(context: ExtensionContext)
    {
        this._isTests = context.extensionMode === ExtensionMode.Test;
        this._isDev = context.extensionMode === ExtensionMode.Development;
        const pkgJsonConfiguration = context.extension.packageJSON.contributes.configuration;
        pkgJsonConfiguration.forEach((c: any) => Object.assign(this._pkgJsonCfgProps, c.properties));
        this._disposables.push(
            workspace.onDidChangeConfiguration(this.onConfigurationChanged, this)
        );
        context.subscriptions.push(this);
    }


    private onConfigurationChanged(e: ConfigurationChangeEvent)
    {
        if (e.affectsConfiguration(this._baseConfigSection))
        {
            this.configuration = workspace.getConfiguration(this._baseConfigSection);
            this.configurationGlobal = workspace.getConfiguration();
            // this._onDidChangeHighPriority.fire(e);
            this._onDidChange.fire(e);
        }
    }


    affectsConfiguration = (e: ConfigurationChangeEvent, ...settings: string[]) =>
        !!settings.find(s => e.affectsConfiguration(`${this._baseConfigSection}.${s.replace(`${this._baseConfigSection}.`, "")}`));


    get = <T>(key: string, defaultValue?: T) => this.configuration.get<T>(key, defaultValue!);


    private getSettingKeys(key: string)
    {
        let propertyKey = key,
            valueKey = key,
            isObject = false;
        if (!this._pkgJsonCfgProps[propertyKey] && key.includes("."))
        {
            let propsKey = "";
            const keys = key.split(".");
            for (let i = 0; i < keys.length - 1; i++) {
                propsKey += ((i > 0 ? "." : "") + keys[i]);
            }
            const pkgJsonPropsKey = this._baseConfigSection + "." + propsKey;
            if (this._pkgJsonCfgProps[pkgJsonPropsKey] && this._pkgJsonCfgProps[pkgJsonPropsKey].type === "object")
            {
                isObject = true;
                propertyKey = propsKey;
                valueKey = keys[keys.length - 1];
            }
        }
        return {
            isObject,
            pKey: propertyKey,
            vKey: valueKey
        };
    }


    /**
     * Include entire settings key.  This is just workspace.getConfiguration().
     * Example:
     *     getGlobal<string>("terminal.integrated.shell.windows", "")
     */
    getVs = <T>(key: string, defaultValue?: T) => this.configurationGlobal.get<T>(key, defaultValue!);


    updateVs = (key: string, value: any): Thenable<void> => this.configurationGlobal.update(key, value, ConfigurationTarget.Global);


    updateVsWs = (key: string, value: any): Thenable<void> => this.configurationGlobal.update(key, value, ConfigurationTarget.Workspace);


    update = (key: string, value: any): Thenable<void> =>
        this._update(key, value, this._isDev || this._isTests ? ConfigurationTarget.Workspace : /* istanbul ignore next */ConfigurationTarget.Global);


    updateWs = (key: string, value: any): Thenable<void> => this._update(key, value, ConfigurationTarget.Workspace);


    // public updateWsf(section: string, value: any, uri?: Uri): Thenable<void>
    // {
    //     uri = uri || (workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : undefined);
    //     return workspace.getConfiguration(_baseConfigSection, uri).update(section, value, ConfigurationTarget.WorkspaceFolder);
    // }


    // public inspect(section: string)
    // {
    //     return this.configuration.inspect(section);
    // }


    private _update = (key: string, value: any, target: ConfigurationTarget) =>
    {
        let v = value;
        const settingKeys = this.getSettingKeys(key);
        if (settingKeys.isObject)
        {
            v = this.get<Record<string, any>>(settingKeys.pKey, value);
            // if (value !== undefined) {
                v[settingKeys.vKey] = value;
            // }
            // else {
            //     delete v[settingKeys.vKey];
            // }
        }
        else if (isObject(value))
        {
            v = Object.assign(this.get<Record<string, any>>(settingKeys.pKey, {}), value);
           // Object.keys(v).filter(k => v[k] === undefined).forEach(k => delete v[k]);
        }
        return this.configuration.update(settingKeys.pKey, v, target);
    };

}

export const configuration = new Configuration();


export const initConfiguration = (context: ExtensionContext) => configuration.initialize(context);
