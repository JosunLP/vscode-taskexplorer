/* eslint-disable @typescript-eslint/naming-convention */
/**
 * A nice little set of definitions for communication between webview<->extension, all credit
 * to the author of the GitLens extension
 */

import { ITeTask } from "../../interface";
import { AuthenticationSession } from "vscode";
import { ISessionToken } from "../../interface/IAuthentication";

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
 * Commands are sent from the webview to the extension
 */
export class IpcCommandType<Params = void> extends IpcMessageType<Params> {}


/**
 * @class IpcNotificationType
 * Notifications are sent from the extension to the webview
 */
export class IpcNotificationType<Params = void> extends IpcMessageType<Params> {}


export const onIpc = <T extends IpcMessageType<any>>(type: T, msg: IpcMessage, fn: (params: IpcMessageParams<T>, type: T) => unknown) =>
{
	// if (type.method === msg.method) {
		fn(msg.params as IpcMessageParams<T>, type);
	// }
};


export const WebviewReadyCommandType = new IpcCommandType("webview/ready");


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

export interface LogWriteCommandTypeParams
{
	message: string;
	value?: any;
}
export const LogWriteCommandType = new IpcCommandType<LogWriteCommandTypeParams>("command/log");


export interface DidChangeEnabledParams
{
	enabled: boolean;
}
export const DidChangeEnabledType = new IpcNotificationType<DidChangeEnabledParams>("enabled/change");


export interface DidChangeConfigurationParams
{
	plusEnabled: boolean;
}
export const DidChangeConfigurationType = new IpcNotificationType<DidChangeConfigurationParams>("configuration/change");


export const EchoCommandRequestType = new IpcNotificationType<ExecuteCommandParams>("command/echo");

export const EchoCustomCommandRequestType = new IpcNotificationType<ExecuteCommandParams>("command/custom/echo");

// export interface DidChangeLicenseParams {
// 	license?: ISessionToken;
// 	session?: AuthenticationSession;
// 	isLicensed: boolean;
// }
// export const DidChangeLicenseType = new IpcNotificationType<DidChangeLicenseParams>("license/change");

export interface DidChangeStateParams extends State {};
export const DidChangeStateType = new IpcNotificationType<DidChangeStateParams>("state/change");

//
// TASK MONITOR APP
//
export interface IIpcTask extends ITeTask {};
export type IMonitorAppTimerMode = "Hide" | "MM:SS" | "MM:SS:MS";
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
