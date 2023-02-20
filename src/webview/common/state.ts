
import { AuthenticationSession } from "vscode";
import { ISessionToken } from "../../interface/IAuthentication";

export interface State extends BaseState
{
	seconds?: number;
	taskType?: string;
}

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
