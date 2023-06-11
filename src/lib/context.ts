/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/naming-convention */

import { ITeContext, IDictionary, AllContextKeys, VsCodeCommands, IContextChangeEvent } from "../interface";
import { commands, Disposable, EventEmitter } from "vscode";


export class TeContext implements ITeContext, Disposable
{
	private _disposables: Disposable[] = [];
	private contextStorage: IDictionary<unknown> = {};
	private _onDidChangeContext: EventEmitter<IContextChangeEvent>;


	constructor()
	{
		this._onDidChangeContext = new EventEmitter<IContextChangeEvent>();
		this._disposables.push(this._onDidChangeContext);
	}


    dispose = () => this._disposables.forEach(d => d.dispose());


	get onDidChangeContext() {
		return this._onDidChangeContext.event;
	}


	getContext = <T>(key: AllContextKeys, defaultValue?: T) =>
		this.contextStorage[key] as T | undefined || (!defaultValue && this.contextStorage[key] === false ? false as unknown as T : defaultValue);


	setContext = async(key: AllContextKeys, value: unknown): Promise<void> =>
	{
		if (this.contextStorage[key] !== value)
		{
			this.contextStorage[key] = value;
			void (await commands.executeCommand(VsCodeCommands.SetContext, key, value));
			this._onDidChangeContext.fire({ key, value });
		}
	};

}
