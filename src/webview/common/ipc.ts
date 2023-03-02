/* eslint-disable @typescript-eslint/naming-convention */
/**
 * A nice little set of definitions for communication between webview<->extension, most credit
 * gotta to the author of the GitLens extension, who has several nice little ideas in his project
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

export interface IpcMessage {
	id: string;
	method: string;
	params?: unknown;
	completionId?: string;
}

abstract class IpcMessageType<Params = void>
{
	_?: Params; // Required for type inferencing to work properly
	constructor(public readonly method: string, public readonly overwriteable: boolean = false) {}
}

export type IpcMessageParams<T> = T extends IpcMessageType<infer P> ? P : never;


/**
 * @class IpcCommandType
 * @since 3.0.0
 * Commands Types:  Webview -> Extension
 */
export class IpcCommandType<Params = void> extends IpcMessageType<Params> {}


/**
 * @class IpcNotificationType
 * @since 3.0.0
 * Notification Types: Extension -> Webview
 */
export class IpcNotificationType<Params = void> extends IpcMessageType<Params> {}


export const onIpc = <T extends IpcMessageType<any>>(type: T, msg: IpcMessage, fn: (params: IpcMessageParams<T>, type: T) => unknown) =>
{
	// if (type.method === msg.method) {
		fn(msg.params as IpcMessageParams<T>, type);
	// }
};


export const WebviewReadyCommandType = new IpcCommandType("webview/ready");

/**
 * IPC COMMAND TYPES : Webview -> Extension
 */

export interface WebviewFocusChangedParams
{
	focused: boolean;
	inputFocused: boolean;
}
export const WebviewFocusChangedCommandType = new IpcCommandType<WebviewFocusChangedParams>("webview/focus");

export interface ExecuteCommandParams
{
	command: string;
	args?: any[];
}
export const ExecuteCommandType = new IpcCommandType<ExecuteCommandParams>("command/execute");
export const ExecuteCustomCommandType = new IpcCommandType<ExecuteCommandParams>("command/custom/execute");

export interface UpdateConfigCommandTypeParams
{
	key: string;
	value?: any;
}
export const UpdateConfigCommandType = new IpcCommandType<UpdateConfigCommandTypeParams>("config/update");

export interface LogWriteCommandTypeParams
{
	message: string;
	value?: any;
}
export const LogWriteCommandType = new IpcCommandType<LogWriteCommandTypeParams>("command/log");

/**
 * IPC NOTIFICATION TYPES : Extension -> Webview
 */

export interface DidChangeStateParams extends State {};

export interface DidChangeEnabledParams
{
	enabled: boolean;
}

export interface DidChangeLicenseParams {
	license?: ISessionToken;
	session?: AuthenticationSession;
	isLicensed: boolean;
}

export interface DidChangeConfigurationParams
{
	timerMode: IMonitorAppTimerMode;
}

export const DidChangeEnabledType = new IpcNotificationType<DidChangeEnabledParams>("enabled/change");
export const DidChangeConfigurationType = new IpcNotificationType<DidChangeConfigurationParams>("configuration/change");
export const EchoCommandRequestType = new IpcNotificationType<ExecuteCommandParams>("command/echo");
export const EchoCustomCommandRequestType = new IpcNotificationType<ExecuteCommandParams>("command/custom/echo");
export const DidChangeLicenseType = new IpcNotificationType<DidChangeLicenseParams>("license/change");
export const DidChangeStateType = new IpcNotificationType<DidChangeStateParams>("state/change");

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

export interface DidChangeTaskStatusParams
{
	task: IIpcTask;
};

export interface DidChangeTaskParams
{
	tasks: IIpcTask[];
};

export const DidChangeAllTasksType = new IpcNotificationType<DidChangeTaskParams>("tasks/change");
export const DidChangeFamousTasksType = new IpcNotificationType<DidChangeTaskParams>("tasks/change/famous");
export const DidChangeLastTasksType = new IpcNotificationType<DidChangeTaskParams>("tasks/change/lasttasks");
export const DidChangeTaskStatusType = new IpcNotificationType<DidChangeTaskStatusParams>("tasks/change/status");
export const DidChangeFavoriteTasksType = new IpcNotificationType<DidChangeTaskParams>("tasks/change/favorites");
export const DidChangeRunningTasksType = new IpcNotificationType<DidChangeTaskParams>("tasks/change/runningtasks");

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
