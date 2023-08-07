/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-redeclare */

export type SpmApiEndpoint = "license/validate" | "payment/paypal/hook" | "register/account" |
							 "register/trial/start" | "register/trial/extend";

export type SpmServerResource = `res/app/${string}/v${string}/${string}.${"js"|"js.map"|"wasm"}`;

export interface SpmServerError extends Error {
	body: any;
	status: number;
	success: boolean;
	timestamp: number;
	toJSON: () => { message: string; body: any; status: number };
}

export interface SpmServerErrorConstructor extends ErrorConstructor
{
	new(status: number | undefined, body: string | undefined, cause?: string | Error): SpmServerError;
    (status: number | undefined, body: string | undefined, cause?: string | Error): SpmServerError;
    readonly prototype: SpmServerError;
}

// export declare const SpmServerError: SpmServerErrorConstructor;
export const SpmServerError = function(this: SpmServerError, status: number | undefined, body: string | undefined, cause: string | Error)
{
	let jso;
	this.name = "SpmServerError";
	this.status = status || 500;
	this.timestamp = Date.now();
	this.success = this.status <= 299;
	this.message = cause instanceof Error ? cause.message : cause;
	try {
		jso = JSON.parse(body || "{}");
	}
	catch {
		jso = { message: this.message };
	}
	this.body = { raw: body || "", jso };
	try {
		Error.captureStackTrace(this, this.constructor);
	} catch {}
	this.toString = () => {
		return this.message;
	};
	this.toJSON = () => {
		return { message: this.message, body: this.body, status: this.status };
	};
} as unknown /* as any */ as SpmServerErrorConstructor; // Note the trust-me casting


/*
export class SpmServerError extends Error implements SpmServerErrorConstructor
{
	constructor(status: number | undefined, body: string | undefined, cause?: string | Error)
	constructor(status: number | undefined, body: string | undefined, cause?: string | Error | undefined)
	{
		super(cause instanceof Error ? cause.message : cause);
		this.name = this.constructor.name;
		this.status = status || 500;
		this.success = this.status <= 299;
		this.timestamp = Date.now();
		let jso;
		try { jso = JSON.parse(body || "{}"); } catch { jso = { message: this.message }; }
		this.body = { raw: body || "", jso };
		try { Error.captureStackTrace(this, this.constructor); } catch {}
	}
	get [Symbol.toStringTag]() { return this.constructor.name; }
	toJSON = () => { return { message: this.message, body: this.body, status: this.status }; };
}
*/
export interface ISpmServer
{
    readonly apiServer: string;
	createError(status: number | undefined, body: string | undefined, cause?: string | Error): SpmServerError;
	// get<T = string | ArrayBuffer | Record<string, any>>(endpoint: SpmServerResource, raw: boolean, logPad: string): Promise<T>;
	get(ep: SpmServerResource, logPad?: string): Promise<ArrayBuffer>;
    request<T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T>;
}
