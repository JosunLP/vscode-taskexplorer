/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-redeclare */

export type SpmApiEndpoint = "license/validate" | "payment/paypal/hook" | "register/account" |
							 "register/trial/start" | "register/trial/extend";

export type SpmServerResource = "app/shared/mappings.wasm" |
								`app/${string}/v${string}/${string}.js.map`;

export interface ISpmServer
{
    readonly apiServer: string;
	createError(status: number | undefined, body: string | undefined, cause?: string | Error): ISpmServerError;
	get<T = string>(endpoint: SpmServerResource, raw: boolean, logPad: string): Promise<T>;
    request<T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T>;
}

export interface ISpmServerError extends Error {
    body: any;
	status: number;
	success: boolean;
	timestamp: number;
	toJSON: () => { message: string; body: any; status: number };
}
