
import { AuthenticationSession } from "vscode";
import { ISessionToken } from "../../interface/IAuthentication";

export interface State extends BaseState
{
	seconds?: number;
	taskType?: string;
}

export interface BaseState
{
	enabled: boolean;
	nonce?: string;
	pinned: boolean;
	webroot?: string;
	isLicensed: boolean;
	license?: ISessionToken;
	session?: AuthenticationSession;
}
