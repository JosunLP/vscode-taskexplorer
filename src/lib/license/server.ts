/* eslint-disable @typescript-eslint/naming-convention */

import { env } from "vscode";
import { request } from "https";
// import fetch from ":env/fetch";
import { IDictionary } from ":types";
import { TeWrapper } from "../wrapper";
import { IncomingMessage } from "http";
import { figures } from "../utils/figures";
import { TeRuntimeEnvironment } from "../../interface";

// const TLS_REJECT = "0"; // "0" to turn off tls rejection

export interface ServerError
{
	body?: string;
	message: string;
	status: number | undefined;
	success: false;
}
/*
class ServerError2 extends Error
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
			Error.captureStackTrace(this, ServerError2);
		}
		this.name = "ServerError2";
	  	this.date = new Date();
	  	this.timestamp = Date.now();
	}
}
*/

export type ITeApiEndpoint = "license/validate" | "payment/paypal/hook" |
							 "register/account" | "register/trial/start" | "register/trial/extend";

export class TeServer
{
	private readonly _spmApiPort = 443;
	private readonly _spmApiVersion = 1;
	private readonly _requestTimeout = 7500;
	private readonly _spmApiServer = "license.spmeesseman.com";
	private readonly _publicToken: Record<TeRuntimeEnvironment, string> = {
		dev: "1Ac4qiBjXsNQP82FqmeJ5k0/oMEmjR6Dx9fw1ojUO9//Z4MS6gdHvmzPYY+tuhp3UV/xILD301dQZpeAt+YZzQCPupLbkKIlGhNm+bkKFbIicWdOxSuNtZW+cubqvhfid2YdEZ7Ndt3lqREaifvLPQ==",
		tests: "hkL89/b3ETjox/jZ+cPq5satV193yZUISaopzfpJKSHrh4ZzFkTXjJqawRNQFYWcOBrbGCpyITCp0Wm19f8gdI1hNJttkARO5Unac4LA2g7RmT/kdXSsz64zNjB9FrvrzHe97tLBHRGorwcOx/K/hQ==",
		production: "1Ac4qiBjXsNQP82FqmeJ5qMMv9GdCsyTifVKI1MvX7GD2Wu/Ao1j5tJdleYcfG+VpMzyZOvrCohb/9PFbNw9d/pSj0Tv1UFgaFeKajtOCDiIPDYfjmqL130ghjFrjTBfE3qUge2hCg55PGtBp/20aA=="
	};


    constructor(private readonly wrapper: TeWrapper) {}


	private get productName() {
		return `${this.wrapper.extensionName}-${this.wrapper.env}`.replace("-production", "");
	};

	private get publicToken(): string {
		return this._publicToken[this.wrapper.env];
	}


	private getApiPath = (ep: ITeApiEndpoint) => `${ep !== "payment/paypal/hook" ? "/api" : ""}/${ep}/${this.productName}/v${this._spmApiVersion}`;


	private getServerOptions = (apiEndpoint: ITeApiEndpoint, token?: string) =>
	{
		const server = this._spmApiServer;
		const options = {
			hostname: server,
			method: "POST",
			path: this.getApiPath(apiEndpoint),
			port: this._spmApiPort,
			//
			// TODO - Request timeouts don't work
			// Timeout don't work worth a s***.  So do a promise race in request() for now.
			//
			timeout: this._requestTimeout,
			headers: <IDictionary<string>> {
				"token": this.publicToken,
				"user-agent": this.wrapper.extensionId,
				"content-type": "application/json"
			}
		};
		if (token) {
			options.headers.authorization = "Bearer " + token;
		}
		return options;
	};


	private log = (msg: string, logPad?: string, value?: any, symbol?: string) =>
	{
		if (!value && value !== false) {
			console.log(`       ${symbol || figures.color.infoTask} ${figures.withColor(msg.toString(), figures.colors.grey)}`);
		}
		else {
			const valuePad = 18, diff = valuePad - msg.length;
			for (let i = 0; i < diff; i++) {
				msg += " ";
			}
			console.log(`       ${symbol || figures.color.infoTask} ${figures.withColor(msg + " : " + value, figures.colors.grey)}`);
		}
		if (!value) {
			this.wrapper.log.write(msg, 1, logPad);
		}
		else {
			this.wrapper.log.value(msg, value, 1, logPad);
		}
	};


	private logServerResponse = (res: IncomingMessage, jso: any, logPad: string) =>
	{
		this.log("   response received start", logPad);
		this.log("      status code", logPad, res.statusCode);
		this.log("      message", logPad, jso.message);
		this.log("   response received end", logPad);
		this.log("server request completed", logPad);
	};


	/* istanbul ignore next*/
	private onServerError = (e: any, logPad: string, rspData?: string) =>
	{
		this.log(e, "", undefined, figures.color.errorTests);
		this.wrapper.log.error(e);
		if (rspData) {
			console.log(`       ${figures.color.errorTests} ${figures.withColor(rspData, figures.colors.grey)}`);
		}
		this.log("   the license server is down, offline, or there is a connection issue", logPad, undefined, figures.color.errorTests);
		this.log("   licensed mode will be automatically enabled", logPad, undefined, figures.color.errorTests);
		this.log("server request completed w/ a failure", logPad + "   ", undefined, figures.color.errorTests);
		this.wrapper.log.methodDone("server request", 1, logPad);
	};


	request = async <T>(endpoint: ITeApiEndpoint, token: string | undefined, logPad: string, params: any) =>
	{
		return Promise.race<T>(
		[
			this._request<T>(endpoint, token, logPad, params),
			new Promise<T>((_resolve, reject) => {
				setTimeout(reject, this._requestTimeout, <ServerError>{ message: "Timed out", status: 408 });
			})
		]);
	};


    private _request = <T>(endpoint: ITeApiEndpoint, token: string | undefined, logPad: string, params: any): Promise<T> =>
	{

		return new Promise<T>((resolve, reject) =>
		{
			let rspData = "";
			let errorState = false;

			const options = this.getServerOptions(endpoint, token);

			this.wrapper.log.methodStart("server request", 1, logPad, false, [
				[ "host", options.hostname ], [ "port", options.port ], [ "endpoint", endpoint ]
			]);
			this.log("starting https request to license server", logPad + "   ");
			this.log("   endpoint", logPad + "   ", endpoint);

			const req = request(options, (res) =>
			{
				res.on("data", (chunk) => { rspData += chunk; });
				res.on("end", () =>
				{
					this.log("   response stream read: eState: " + errorState);
					let jso = null;
					try {
						jso = JSON.parse(rspData);
					}
					catch { /* istanbul ignore next */ jso = { message: rspData }; }
					try
					{
						this.logServerResponse(res, jso, logPad);
						if (!res.statusCode || res.statusCode > 299)
						{
							reject(<ServerError>{ message: res.statusMessage, status: res.statusCode, body: jso });
						}
						else {
							resolve(jso as T);
						}
					}
					catch (e) {
						/* istanbul ignore next */
						reject(<ServerError>{ message: e.message, status: res.statusCode, body: jso });
					}
				});
			});

			/* istanbul ignore next*/
			req.on("error", (e) =>
			{   // Not going to fail unless i birth a bug
				this.onServerError(e, logPad);
				errorState = true;
				reject(e);
			});

			const machineId = !this.wrapper.tests ? /* istanbul ignore next */env.machineId : process.env.testsMachineId,
				  payload = JSON.stringify({ ...{ machineId, dev: this.wrapper.dev, tests: this.wrapper.tests }, ...params });

			req.write(payload, () =>
            {
				this.log("   request stream written", logPad);
				req.end();
			});
		});
	};

    // 'Fetch' examples, in case I ever decide to go to fetch, which will also be built in in Node 18
    //
    // private async getUserInfo(_token: string): Promise<{ name: string; email: string }>
    // {
    //     const response = await fetch(`https://license.spmeesseman.com/...`, {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         }
    //     });
    //     return response.json() as Promise<{ name: string; email: string }>;
    //     return { name: "Test", email: "test@spmeesseman.com" };
    // }
	//
	// private validateLicenseFetch = async(licenseKey: string, logPad: string) =>
	// {
	// 	const res = await fetch(Uri.joinPath(this.host, this.authApiEndpoint).toString(),
	// 	{
	// 		method: "POST",
	// 		agent: getProxyAgent(),
	// 		headers: {
	// 			"Authorization": `Bearer ${this.token}`,
	// 			"User-Agent": "vscode-taskexplorer",
	// 			"Content-Type": "application/json",
	// 		},
	// 		body: JSON.stringify(
	// 		{
	// 			licensekey: licenseKey,
	// 			appid: env.machineId,
	// 			appname: "vscode-taskexplorer-prod",
	// 			ip: "*"
	// 		}),
	// 	});
	// };

}
