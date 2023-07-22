
import { isPrimitive } from "./utils/typeUtils";
import { commands, Disposable, EventEmitter, workspace } from "vscode";
import { ITeContext, AllContextKeys, ContextKeys, VsCodeCommands, IContextChangeEvent } from "../interface";


export class TeContext implements ITeContext, Disposable
{
	private _disposables: Disposable[] = [];
	private _contextStorage: Record<string, unknown> = {};
	private _onDidChangeContext: EventEmitter<IContextChangeEvent>;


	constructor()
	{
		this._onDidChangeContext = new EventEmitter<IContextChangeEvent>();
		this._disposables.push(
			this._onDidChangeContext,
			workspace.onDidGrantWorkspaceTrust(this.onWorkspaceTrustChange, this)
		);
	}

    dispose = () => this._disposables.forEach(d => d.dispose());


	get onDidChangeContext() { return this._onDidChangeContext.event; }


	getContext = <T>(key: AllContextKeys, defaultValue?: T) =>
		(this._contextStorage[key] || isPrimitive(this._contextStorage[key]) ? <T>this._contextStorage[key] : defaultValue);


	/* istanbul ignore next */
	private onWorkspaceTrustChange = () => this.setContext(ContextKeys.Untrusted, undefined);


	setContext = async (key: AllContextKeys, value: unknown): Promise<void> =>
	{
		if (this._contextStorage[key] !== value)
		{
			this._contextStorage[key] = value;
			void (await commands.executeCommand(VsCodeCommands.SetContext, key, value));
			this._onDidChangeContext.fire({ key, value });
		}
	};

}
