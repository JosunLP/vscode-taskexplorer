/* eslint-disable @typescript-eslint/naming-convention */
/**
 * @module ipc
 * @since 3.0.0
 *
 * A nice little set of definitions for communication between webview<->extension, most credit
 * gotta to the author of the GitLens extension, who has several nice little ideas in his project
 *
 * This module is included in both the extension and `webview app` web-based builds, and
 * includes all of the data structures used in the messaging protocol between them.
 */

import { AuthenticationSession } from "vscode";
import { IDictionary, ITeTask, TeTaskListType, ISessionToken } from "../../../types/lib";

export interface BaseState
{
	isEnabled: boolean;
	isLicensed: boolean;
	license?: ISessionToken;
	nonce: string;
	session?: AuthenticationSession;
	webroot: string;
}

export interface State extends BaseState {};

export interface IIpcMessage {
	id: string;
	method: string;
	params?: unknown;
	completionId?: string;
}

abstract class IpcMessage<Params = void>
{
	_?: Params; // Required for type inferencing to work properly
	constructor(public readonly method: string, public readonly overwriteable: boolean = false) {}
}

export type IpcMessageParams<T> = T extends IpcMessage<infer P> ? P : never;

/**
 * @class IpcCommand
 * Commands Types:  Webview -> Extension
 */
export class IpcCommand<Params = void> extends IpcMessage<Params> {}

/**
 * @class IpcNotification
 * Notification Types: Extension -> Webview
 */
export class IpcNotification<Params = void> extends IpcMessage<Params> {}

export const onIpc = <T extends IpcMessage<any>>(type: T, msg: IIpcMessage, fn: (params: IpcMessageParams<T>, type: T) => unknown) =>
	fn(msg.params as IpcMessageParams<T>, type);

/**
 * IPC COMMAND TYPES : Webview -> Extension
 */

export interface IpcWvFocusChangedParams
{
	focused: boolean;
	inputFocused: boolean;
}

export interface IpcExecCommandParams
{
	command: string;
	args?: any[];
}

export interface IpcUpdateConfigCommandParams
{
	key: string;
	value?: any;
}

export interface IpcLogWriteCommandParams
{
	message: string;
	value?: any;
}

export const IpcReadyCommand = new IpcCommand("webview/ready");
export const IpcFocusChangedCommand = new IpcCommand<IpcWvFocusChangedParams>("webview/focus");
export const IpcExecCommand = new IpcCommand<IpcExecCommandParams>("command/execute");
export const IpcExecCustomCommand = new IpcCommand<IpcExecCommandParams>("command/custom/execute");
export const IpcUpdateConfigCommand = new IpcCommand<IpcUpdateConfigCommandParams>("config/update");
export const IpcLogWriteCommand = new IpcCommand<IpcLogWriteCommandParams>("log/write");

/**
 * IPC NOTIFICATION TYPES : Extension -> Webview
 */

export interface IpcStateChangedParams extends State {};

export interface IpcEnabledChangedParams
{
	enabled: boolean;
}

export interface IpcLicenseChangedParams {
	license?: ISessionToken;
	session?: AuthenticationSession;
	isLicensed: boolean;
}

export interface IpcConfigChangedParams
{
	timerMode: IMonitorAppTimerMode;
}

export const IpcEnabledChangedMsg = new IpcNotification<IpcEnabledChangedParams>("enabled/change");
export const IpcConfigChangedMsg = new IpcNotification<IpcConfigChangedParams>("configuration/change");
export const IpcEchoCommandRequest = new IpcNotification<IpcExecCommandParams>("command/echo");
export const IpcEchoCustomCommandRequest = new IpcNotification<IpcExecCommandParams>("command/custom/echo");
export const IpcLicenseChangedMsg = new IpcNotification<IpcLicenseChangedParams>("license/change");
export const IpcStateChangedMsg = new IpcNotification<IpcStateChangedParams>("state/change");

//
// TASK MONITOR APP
//

export interface IIpcTask extends ITeTask {};
export type IIpcTaskListType = TeTaskListType;
export interface IIpcDictionary<T> extends IDictionary<T> {};
export type IMonitorAppTimerMode = "Hide" | "MM:SS" | "MM:SS:MS"  | "MM:SS:MSS";

export interface MonitorAppState extends State
{
	famous: IIpcTask[];
	favorites: IIpcTask[];
	last: IIpcTask[];
	menuVisible?: boolean;
	running: IIpcTask[];
	tasks: IIpcTask[];
	timerMode: IMonitorAppTimerMode;
	pinned: {
		last: IIpcTask[];
		favorites: IIpcTask[];
		famous: IIpcTask[];
		running: IIpcTask[];
	};
}

export interface MonitorAppSerializedState extends MonitorAppState {}

export interface IpcTaskChangedParams { task: IIpcTask; list?: IIpcTaskListType };
export interface IpcTasksChangedParams { tasks: IIpcTask[]; list: IIpcTaskListType };

export const IpcTasksChangedMsg = new IpcNotification<IpcTasksChangedParams>("tasks/change");
export const IpcTaskChangedMsg = new IpcNotification<IpcTaskChangedParams>("tasks/change/status");

interface IDebounceParams { fn: (...args: any[]) => any; start: number; args: any[] }
const _debounceDict: IIpcDictionary<IDebounceParams> = {};
export const debounce = <T>(fn: (...args: any[]) => T, wait: number, ...args: any[]) => new Promise<T|void>(async(resolve) =>
{
	if (!_debounceDict[fn.name])
	{
		_debounceDict[fn.name] = { fn, start: Date.now(), args };
		setTimeout((p: IDebounceParams) =>
		{
			resolve(p.fn.call(this, ...p.args));
			delete _debounceDict[fn.name];
		},
		wait, _debounceDict[fn.name]);
	}
	else {
		Object.assign(_debounceDict[fn.name], { args });
		setTimeout(() => resolve(), Date.now() - _debounceDict[fn.name].start);
	}
});
