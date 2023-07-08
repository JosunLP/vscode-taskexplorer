/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */

import { IDictionary } from ":types";
import { Disposable, commands } from "vscode";
import { SupportedCommands } from "../../interface/ICommand";


export const registerCommand = (command: SupportedCommands, callback: (...args: any[]) => any, thisArg?: any): Disposable =>
{
	return commands.registerCommand(
		command,
		function (this: any, ...args) {
			void (this.usage || this.wrapper.usage).track(`command:${command}`);
			return callback.call(this, ...args);
		},
		thisArg
	);
};

export function executeCommand<U = any>(command: SupportedCommands): Thenable<U>;
export function executeCommand<T = unknown, U = any>(command: SupportedCommands, arg: T): Thenable<U>;
export function executeCommand<T extends [...unknown[]] = [], U = any>(command: SupportedCommands, ...args: T): Thenable<U>;
export function executeCommand<T extends [...unknown[]] = [], U = any>(command: SupportedCommands, ...args: T): Thenable<U>
{   //
	// TODO - Telemetry
	//
	// this.wrapper.telemetry.sendEvent("command/taskexplorer", { command: command });
	return commands.executeCommand<U>(command, ...args);
}

const _debounceDict: IDictionary<IDebounceParams> = {};
interface IDebounceParams { fn: (...args: any[]) => any; args: any[]; scope: any; timer?: NodeJS.Timeout }

export const debounceCommand = (key: string, fn: (...args: any[]) => any, wait: number, thisArg: any, ...args: any[]) =>
{
	const dKey = `${key}:${fn.name}`;
	if (!_debounceDict[dKey])
	{
		_debounceDict[dKey] = { fn, scope: thisArg, args: [ ...args ] };
	}
	else {
		clearTimeout(_debounceDict[dKey].timer as NodeJS.Timeout);
		Object.assign(_debounceDict[dKey], { args: [ ...args ] });
	}
	_debounceDict[dKey].timer = setTimeout((p: IDebounceParams) =>
	{
		p.fn.call(p.scope, ...p.args);
		delete _debounceDict[dKey];
	},
	wait, _debounceDict[dKey]);
};
