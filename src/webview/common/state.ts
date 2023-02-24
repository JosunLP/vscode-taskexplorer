
import { AuthenticationSession } from "vscode";
import { ISessionToken } from "../../interface/IAuthentication";

export interface BaseState
{
	isEnabled: boolean;
	isLicensed: boolean;
	license?: ISessionToken;
	nonce: string;
	pinned: boolean;
	session?: AuthenticationSession;
	webroot: string;
}

export interface State extends BaseState {};
