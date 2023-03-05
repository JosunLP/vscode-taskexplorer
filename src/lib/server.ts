/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */

import { request } from "https";
// import fetch from "@env/fetch";
// import fetch from "node-fetch";
import { TeWrapper } from "./wrapper";
import { IncomingMessage } from "http";
import { figures } from "./utils/figures";
import { env } from "vscode";

const DEV_ENV_USE_LOCAL_SERVER = true;

export interface ServerError extends Error
{
	status: number | undefined;
	success: false;
}
interface ServerErrorConstructor extends ErrorConstructor {
    new(message: string | undefined, status: number | undefined): ServerError;
    (message: string | undefined, status: number | undefined): ServerError;
    readonly prototype: ServerError;
}
export declare const ServerError: ServerErrorConstructor;

export type ITeApiEndpoint = "license/validate" | "login" | "register" | "register/trial/start" | "register/trial/extend";


export class TeServer
{
	private _busy = false;
	private readonly _maxConnectionTime = 7500;


    constructor(private readonly wrapper: TeWrapper) {}


	get isBusy() {
		return this._busy;
	}


	private getApiPath = (ep: ITeApiEndpoint) => `/api/${ep}/v1`;


	private getApiClientId = () =>
	{
		if (this.wrapper.env === "dev" && DEV_ENV_USE_LOCAL_SERVER) {
			return "3N0wTENSyQNF1t3Opi2Ke+UiJe4Jhb3b1WOKIS6I0mICPQ7O+iOUaUQUsQrda/gUnBRjJNjCs+1vc78lgDEdOsSELTG7jXakfbgPLj61YtKftBdzrvekagM9CZ+9zRx1";
		}
		return "1Ac4qiBjXsNQP82FqmeJ5iH7IIw3Bou7eibskqg+Jg0U6rYJ0QhvoWZ+5RpH/Kq0EbIrZ9874fDG9u7bnrQP3zYf69DFkOSnOmz3lCMwEA85ZDn79P+fbRubTS+eDrbinnOdPe/BBQhVW7pYHxeK28tYuvcJuj0mOjIOz+3ZgTY=";
	};


	private getApiPort = () =>
	{
		switch (this.wrapper.env)
		{
			case "dev":
				return DEV_ENV_USE_LOCAL_SERVER ? 485 : 443;
			case "tests":
			case "production":
				return 443;
		}
	};


	private getApiServer = () =>
	{
		switch (this.wrapper.env)
		{
			case "dev":
				return DEV_ENV_USE_LOCAL_SERVER ? "localhost" : "license.spmeesseman.com";
			case "tests":
				return "license.spmeesseman.com"; // "test.spmeesseman.com"
			case "production":
				return "license.spmeesseman.com"; // "app.spmeesseman.com"
		}
	};


	private getAuthService = () =>
	{
		switch (this.wrapper.env)
		{
			case "dev":
				return "vscode-taskexplorer";
			case "tests":
			case "production":
				return "vscode-taskexplorer-prod";
		}
	};


	private getDefaultServerOptions = (apiEndpoint: ITeApiEndpoint) =>
	{
		const server = this.getApiServer();
		return {
			hostname: server,
			method: "POST",
			path: this.getApiPath(apiEndpoint),
			port: this.getApiPort(),
			//
			// TODO - Request timeouts don't work
			// Timeout don't work worth a s***.  So do a promise race in request() for now.
			//
			timeout: server !== "localhost" ? 4000 : /* istanbul ignore next*/1250,
			headers: {
				"token": this.getApiClientId(),
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
			new Promise<T>(reject => setTimeout(reject, this._maxConnectionTime, new ServerError("Timed out", 408)))
		]);
	};


    private _request = <T>(endpoint: ITeApiEndpoint, logPad: string, params?: any) =>
	{
		this._busy = true;

		return new Promise<T>((resolve, reject) =>
		{
			let rspData = "";
			this.wrapper.log.methodStart("request license", 1, logPad, false, [[ "host", this.getApiServer() ], [ "port", this.getApiPort() ]]);
			this.log("starting https request to license server", logPad + "   ");

			const req = request(this.getDefaultServerOptions(endpoint), (res) =>
			{
				res.on("data", (chunk) => { rspData += chunk; });
				res.on("end", async() =>
				{
					if (!res.statusCode || res.statusCode > 299)
					{
						this._busy = false;
						reject(new ServerError(res.statusMessage, res.statusCode));
					}
					else {
						try
						{   const jso = JSON.parse(rspData);
							this.logServerResponse(res, jso, rspData, logPad);
							resolve(jso as T);
						}
						catch (e)
						{
							reject(<ServerError>{
								message: e.message,
								status: undefined,
								success: false
							});
						}
						finally {
							this._busy = false;
						}
					}
				});
			});

			/* istanbul ignore next*/
			req.on("error", (e) =>
			{   // Not going to fail unless i birth a bug
				this.onServerError(e, "request", logPad);
				this._busy = false;
				reject(e);
			});

			const payload = JSON.stringify({ ...(params || {}), appName: this.getAuthService(), machineId: env.machineId });
			req.write(payload, () =>
            {
				this.log("   output stream written, ending request and waiting for response...", logPad);
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
