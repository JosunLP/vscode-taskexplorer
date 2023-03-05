
import { ConfigurationChangeEvent, Event } from "vscode";

export interface IConfiguration
{
    onDidChange: Event<ConfigurationChangeEvent>;
    affectsConfiguration(e: ConfigurationChangeEvent, ...settings: string[]): boolean;
    get<T>(key: string, defaultValue?: T): T;
    getVs<T>(key: string, defaultValue?: T): T;
    update(key: string, value: any): Thenable<void>;
    updateVs(key: string, value: any): Thenable<void>;
    updateVsWs(key: string, value: any): Thenable<void>;
    updateWs(key: string, value: any): Thenable<void>;
}
