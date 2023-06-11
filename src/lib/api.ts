
import { Disposable } from "vscode";
import { TeWrapper } from "./wrapper";
import { IExternalProvider, ITaskExplorerApi } from "../interface";
import { executeCommand, registerCommand } from "./command/command";


export class TeApi implements ITaskExplorerApi, Disposable
{
    private _tests: boolean;
    private _disposables: Disposable[] = [];


    constructor(private readonly wrapper: TeWrapper)
    {
        this._tests = this.wrapper.tests;
        /* istanbul ignore else */
        if (this._tests) {
            void wrapper.contextTe.setContext(wrapper.keys.Context.Tests, true);
        }
        this._disposables.push(registerCommand(wrapper.keys.Commands.GetApi, () => this, this));
    }

    dispose = () => this._disposables.splice(0).forEach(d => d.dispose());


    get providers() {
        return this.wrapper.providers;
    }


    refreshExternalProvider = async(providerName: string) =>
    {
        if (this.providers[providerName])
        {
            await executeCommand(this.wrapper.keys.Commands.Refresh, providerName);
        }
    };


    register = async(providerName: string, provider: IExternalProvider, logPad: string) =>
    {
        this.providers[providerName] = provider;
        await executeCommand(this.wrapper.keys.Commands.Refresh, providerName, undefined, logPad);
    };


    unregister = async(providerName: string, logPad: string) =>
    {
        delete this.providers[providerName];
        await executeCommand(this.wrapper.keys.Commands.Refresh, providerName, undefined, logPad);
    };

}
