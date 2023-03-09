
import { TeWrapper } from "./wrapper";
import { ContextKeys } from "./context";
import { IExternalProvider, ITaskExplorerApi } from "../interface";
import { executeCommand, registerCommand, Commands } from "./command/command";
import { Disposable } from "vscode";


export class TeApi implements ITaskExplorerApi, Disposable
{
    private _tests: boolean;
    private _disposables: Disposable[] = [];

    constructor(private readonly wrapper: TeWrapper)
    {
        this._tests = this.wrapper.tests;
        /* istanbul ignore else */
        if (this._tests) {
            void wrapper.contextTe.setContext(ContextKeys.Tests, true);
        }
        this._disposables.push(registerCommand("taskexplorer.getApi", () => this, this));
    }


    dispose()
    {
        this._disposables.forEach(d => d.dispose());
        this._disposables.splice(0);
    }


    get providers() {
        return this.wrapper.providers;
    }


    refreshExternalProvider = async(providerName: string) =>
    {
        if (this.providers[providerName])
        {
            await executeCommand(Commands.Refresh, providerName);
        }
    };


    register = async(providerName: string, provider: IExternalProvider, logPad: string) =>
    {
        this.providers[providerName] = provider;
        await executeCommand(Commands.Refresh, providerName, undefined, logPad);
    };


    unregister = async(providerName: string, logPad: string) =>
    {
        delete this.providers[providerName];
        await executeCommand(Commands.Refresh, providerName, undefined, logPad);
    };

}
