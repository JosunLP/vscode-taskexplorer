
export type SpmApiEndpoint = "license/validate" | "payment/paypal/hook" |
							  "register/account" | "register/trial/start" | "register/trial/extend";

export type SpmServerResource = "app/log/mappings.wasm" | "app/vscode-taskexplorer/taskexplorer.js.map";

export interface ISpmServerError
{
	name?: string;
	body?: string;
	message: string;
	status: number | undefined;
	success: false;
}

export interface ISpmServer
{
    readonly apiServer: string;
	get<T>(ep: SpmServerResource, logPad: string): Promise<T>;
    request<T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T>;
}

export class SpmServerError extends Error
{
	date: Date;
	timestamp: number;

	constructor(readonly status: number | undefined, readonly body: string | undefined, ...params: any[])
	{	//
		// Pass remaining arguments (including vendor specific ones) to parent constructor
		//
		super(...params);
		//
		// Maintains proper stack trace for where our error was thrown (only available on V8)
		//
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SpmServerError);
		}
		this.name = "SpmServerError";
	  	this.date = new Date();
	  	this.timestamp = Date.now();
	}
}