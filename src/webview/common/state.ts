
import { AuthenticationSession, Task } from "vscode";
import { ISessionToken } from "../../interface/IAuthentication";

export interface BaseState
{
	isEnabled: boolean;
	isLicensed: boolean;
	license?: ISessionToken;
	nonce?: string;
	param1?: any;
	param2?: any;
	param3?: any;
	pinned: boolean;
	session?: AuthenticationSession;
	webroot?: string;
}

export interface State extends BaseState {}

export interface AppState extends State {}

export interface AppMonitorState extends AppState
{
	seconds: number;
	tasks: ITask[];
	taskType: string; // temp for testing
}

export interface ITask
{
	name: string;
	definition: any;
	source: string;
}
