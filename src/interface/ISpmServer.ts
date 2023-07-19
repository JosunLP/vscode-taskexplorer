
export type SpmApiEndpoint = "license/validate" | "payment/paypal/hook" | "register/account" |
							 "register/trial/start" | "register/trial/extend";

export type SpmServerResource = "app/shared/mappings.wasm" |
								`app/vscode-taskexplorer/v${string}/taskexplorer.js.map`;

export interface ISpmServer
{
    readonly apiServer: string;
	get<T = string>(endpoint: SpmServerResource, raw: boolean, logPad: string): Promise<T>;
    request<T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T>;
}

// interface Error {
//     name: string;
//     message: string;
//     stack?: string;
// }

// interface SpmServerErrorErrorConstructor {
//     new(message?: string): Error;
//     (message?: string): Error;
//     readonly prototype: Error;
// }

// declare var SpmServerError: SpmServerErrorConstructor;

// export interface ISpmServerError extends Error
// {
// 	body: { raw: string; jso: Record<string, any>};
// 	status: number;
// 	success: boolean;
// }

export class SpmServerError extends Error // implements ISpmServerError
{
	private _status: number;
	private _success: boolean;
	private _timestamp: number;
	private _body: { raw: string; jso: Record<string, any> };
	constructor(status: number | undefined, body: string | undefined, cause?: string | Error)
	{
		super(cause instanceof Error ? cause.message : cause);
		this.name = "SpmServerError";
		this._status = status || 500;
		this._success = this._status <= 299;
	  	this._timestamp = Date.now();
		// let jso = { message: rspData };
		this._body = {
			raw: body || "",
			jso: JSON.parse(body || "{}")
		};
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SpmServerError);
		}
	}
	get body() { return this._body; }
	get status() { return this._status; }
	get success() { return this._success; }
	get timestamp() { return this._timestamp; }
	override toString() { return this.message; }
	toJSON() { return { message: this.message, body: this._body, status: this._status }; }
}
