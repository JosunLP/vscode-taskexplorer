/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */

import { request } from "https";
// import fetch from "@env/fetch";
// import fetch from "node-fetch";
import { TeWrapper } from "./wrapper";
import { IncomingMessage } from "http";
import { figures } from "./utils/figures";
import { env } from "vscode";

const USE_LOCAL_SERVER = true;

export interface ServerError
{
	body?: string;
	message: string;
	status: number | undefined;
	success: false;
}

export type ITeApiEndpoint = "license/validate" | "login" | "register" | "register/trial/start" | "register/trial/extend";


export class TeServer
{
	private _busy = false;
	private readonly _maxConnectionTime = 7500;


    constructor(private readonly wrapper: TeWrapper)
	{
		if (USE_LOCAL_SERVER)
		{   //
			// The IIS Express localhost certificate is rejected by VScode / NodeJS HTTPS
			// Justdisable TLS rejection when using localhost, no big deal.
			//
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}
	}


	get isBusy() {
		return this._busy;
	}

	get apiClientId()
	{
		if (USE_LOCAL_SERVER) {
			return "3N0wTENSyQNF1t3Opi2Ke+UiJe4Jhb3b1WOKIS6I0mICPQ7O+iOUaUQUsQrda/gUnBRjJNjCs+1vc78lgDEdOsSELTG7jXakfbgPLj61YtKftBdzrvekagM9CZ+9zRx1";
		}
		return "1Ac4qiBjXsNQP82FqmeJ5iH7IIw3Bou7eibskqg+Jg0U6rYJ0QhvoWZ+5RpH/Kq0EbIrZ9874fDG9u7bnrQP3zYf69DFkOSnOmz3lCMwEA85ZDn79P+fbRubTS+eDrbinnOdPe/BBQhVW7pYHxeK28tYuvcJuj0mOjIOz+3ZgTY=";
	};

	private get apiPort()
	{
		switch (this.wrapper.env)
		{
			case "dev":
			case "tests":
				return USE_LOCAL_SERVER ? 485 : 443;
			case "production":
				return 443;
		}
	};

	private get apiServer()
	{
		switch (this.wrapper.env)
		{
			case "dev":
			case "tests":
				return USE_LOCAL_SERVER ? "localhost" : "license.spmeesseman.com";
			case "production":
				return "license.spmeesseman.com"; // "app.spmeesseman.com"
		}
	};

	private get authService()
	{
		switch (this.wrapper.env)
		{
			case "dev":
			case "tests":
				return USE_LOCAL_SERVER ? "vscode-taskexplorer" : "vscode-taskexplorer-prod";
			case "production":
				return "vscode-taskexplorer-prod";
		}
	};


	private getApiPath = (ep: ITeApiEndpoint) => `/api/${ep}/v1`;


	private getDefaultServerOptions = (apiEndpoint: ITeApiEndpoint) =>
	{
		const server = this.apiServer;
		return {
			hostname: server,
			method: "POST",
			path: this.getApiPath(apiEndpoint),
			port: this.apiPort,
			//
			// TODO - Request timeouts don't work
			// Timeout don't work worth a s***.  So do a promise race in request() for now.
			//
			timeout: server !== "localhost" ? 4000 : /* istanbul ignore next*/1250,
			headers: {
				"token": this.apiClientId,
				"User-Agent": "vscode-taskexplorer",
				"Content-Type": "application/json"
			}
		};
	};


	private log = (msg: any, logPad?: string, value?: any, symbol?: string) =>
	{
		/* istanbul ignore next */
		if (this.wrapper.tests)
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
		}
		/* istanbul ignore else */
		if (this.wrapper.utils.isString(msg))
		{
			if (!value) {
				this.wrapper.log.write(msg, 1, logPad);
			}
			else {
				this.wrapper.log.value(msg, value, 1, logPad);
			}
		}
		else {
			this.wrapper.log.error(msg);
		}
	};


	private logServerResponse = (res: IncomingMessage, jso: any, rspData: string, logPad: string) =>
	{
		this.log("   response received", logPad);
		this.log("      status code", logPad, res.statusCode);
		this.log("      length", logPad, rspData.length);
		this.log("      success", logPad, jso.success);
		this.log("      message", logPad, jso.message);
	};


	/* istanbul ignore next*/
	private onServerError = (e: any, logPad: string, fn: string, rspData?: string) =>
	{
		this.log(e, "", undefined, figures.color.errorTests);
		if (rspData) {
			this.log(rspData, "", undefined, figures.color.errorTests);
		}
		this.log("   the license server is down, offline, or there is a connection issue", logPad, undefined, figures.color.errorTests);
		this.log("   licensed mode will be automatically enabled", logPad, undefined, figures.color.errorTests);
		this.log("request to license server completed w/ a failure", logPad + "   ", undefined, figures.color.errorTests);
		this.wrapper.log.methodDone(fn + " license", 1, logPad);
	};


	request = async <T>(endpoint: ITeApiEndpoint, logPad: string, params?: any) =>
	{
		return Promise.race<T>(
		[
			this._request<T>(endpoint, logPad, params),
			new Promise<T>(reject => setTimeout(reject, this._maxConnectionTime, <ServerError>{ message: "Timed out", status: 408 }))
		]);
	};


    private _request = <T>(endpoint: ITeApiEndpoint, logPad: string, params?: any): Promise<T> =>
	{
		this._busy = true;

		return new Promise<T>((resolve, reject) =>
		{
			let rspData = "";
			let errorState = false;
			const options = this.getDefaultServerOptions(endpoint);
			this.wrapper.log.methodStart("request license", 1, logPad, false, [[ "host", options.hostname ], [ "port", options.port ]]);
			this.log("starting https request to license server", logPad + "   ");

			const req = request(options, (res) =>
			{
				res.on("data", (chunk) => { rspData += chunk; });
				res.on("end", async() =>
				{
					try
					{   if (!res.statusCode || res.statusCode > 299) {
							reject(<ServerError>{ message: res.statusMessage, status: res.statusCode, body: rspData });
						}
						else {
							const jso = JSON.parse(rspData);
							this.logServerResponse(res, jso, rspData, logPad);
							resolve(jso as T);
						}
					}
					catch (e){
						reject(<ServerError>{ message: e.message, status: res.statusCode, body: rspData });
					}
					finally {
						this._busy = false;
					}
				});
			});

			/* istanbul ignore next*/
			req.on("error", (e) =>
			{   // Not going to fail unless i birth a bug
				this.onServerError(e, "request", logPad);
				this._busy = false;
				errorState = true;
				reject(e);
			});

			const payload = JSON.stringify({ ...(params || {}), appName: this.authService, machineId: env.machineId });
			req.write(payload, () =>
            {
				if (!errorState) {
					this.log("   output stream written, ending request and waiting for response...", logPad);
				}
				req.end();
			});
		});
	};

    //
    // 'Fetch' examples, in case I ever decide to go to fetch, which will also be built in in Node 18
    //

    // /* istanbul ignore next */
    // private async getUserInfo(_token: string): Promise<{ name: string; email: string }>
    // {
    //     const response = await fetch(`https://${TEAUTH_DOMAIN}/userinfo`, {
    //         headers: {
    //             // eslint-disable-next-line @typescript-eslint/naming-convention
    //             Authorization: `Bearer ${token}`
    //         }
    //     });
    //     return response.json() as Promise<{ name: string; email: string }>;
    //     return { name: "Test", email: "test@spmeesseman.com" };
    // }

	// private validateLicenseFetch = async(licenseKey: string, logPad: string) =>
	// {
	// 	const res = await fetch(Uri.joinPath(this.host, this.authApiEndpoint).toString(),
	// 	{
	// 		method: "POST",
	// 		agent: getProxyAgent(),
	// 		headers: {
	// 			// "Authorization": `Bearer ${session.token}`,
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

	// 	let licensed = true;
	// 	try
	// 	{   const jso = JSON.parse(res.body);
	// 		licensed = res.ok && jso.success && jso.message === "Success";
	// 		this.logServerResponse(res, jso, res.data, logPad);
	// 		jso.token = licenseKey;
	// 		await this.setLicenseKeyFromRsp(licensed, jso, logPad);
	// 	}
	// 	catch (e) {
	// 		/* istanbul ignore next*/
	// 		this.onServerError(e, "validate", logPad, res.data);
	// 	}
	// 	finally {
	// 		this.busy = false;
	// 	}
	// 	log.methodDone("validate license", 1, logPad, [[ "is valid license", licensed ]]);
	// };

}
