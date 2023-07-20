/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-redeclare */

export type SpmApiEndpoint = "license/validate" | "payment/paypal/hook" | "register/account" |
							 "register/trial/start" | "register/trial/extend";

export type SpmServerResource = "app/shared/mappings.wasm" |
								`app/${string}/v${string}/${string}.js.map`;

export interface SpmServerError extends Error {
	body: any;
	status: number;
	success: boolean;
	timestamp: number;
	toJSON: () => { message: string; body: any; status: number };
}

interface SpmServerErrorConstructor extends ErrorConstructor
{
	new(status: number | undefined, body: string | undefined, cause?: string | Error): SpmServerError;
}

export const SpmServerError = function(this: SpmServerError, status: number | undefined, body: string | undefined, cause: string | Error)
{
	// private _status: number;
	// private _success: boolean;
	// private _timestamp: number;
	// private _body: { raw: string; jso: Record<string, any> };
	// constructor(status: number | undefined, body: string | undefined, cause?: string | Error)
	// constructor(status: number | undefined, body: string | undefined, cause?: string | Error | undefined)
	// {
		// super(cause instanceof Error ? cause.message : cause);
		this.name = this.constructor.name;
		this.message = cause instanceof Error ? cause.message : cause;
		this.status = status || 500;
		this.success = this.status <= 299;
		this.timestamp = Date.now();
		let jso;
		try { jso = JSON.parse(body || "{}"); } catch { jso = { message: this.message }; }
		this.body = { raw: body || "", jso };
		try { Error.captureStackTrace(this, this.constructor); } catch {}
	// }
	// get body() { return this._body; }
	// get status() { return this._status; }
	// get success() { return this._success; }
	// get timestamp() { return this._timestamp; }
	// get [Symbol.toStringTag]() { return this.constructor.name; }
	this.toString = () => { return this.constructor.name; };
	this.toJSON = () => { return { message: this.message, body: this.body, status: this.status }; };
} as unknown /* as any */ as SpmServerErrorConstructor; // Note the trust-me casting

export interface ISpmServer
{
    readonly apiServer: string;
	// get<T = string | ArrayBuffer | Record<string, any>>(endpoint: SpmServerResource, raw: boolean, logPad: string): Promise<T>;
	get(ep: SpmServerResource, logPad?: string): Promise<ArrayBuffer>;
    request<T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T>;
}
