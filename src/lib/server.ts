
import { request } from "https";
// import fetch from "@env/fetch";
import { TeWrapper } from "./wrapper";
import { IncomingMessage } from "http";
import { figures } from "./utils/figures";
import { Disposable, env, Event, EventEmitter } from "vscode";

const TLS_REJECT = "1"; // "0" to turn off tls rejection
const REQUEST_TIMEOUT = 7500;
const SPM_API_VERSION = 1;
const SPM_API_PORT = 443;
const SPM_API_SERVER = "license.spmeesseman.com";
const SPM_API_CLIENTID = "1Ac4qiBjXsNQP82FqmeJ5iH7IIw3Bou7eibskqg+Jg0U6rYJ0QhvoWZ+5RpH/Kq0EbIrZ9874fDG9u7bnrQP3zYf69DFkOSnOmz3lCMwEA85ZDn79P+fbRubTS+eDrbinnOdPe/BBQhVW7pYHxeK28tYuvcJuj0mOjIOz+3ZgTY=";
// const SPM_API_CLIENTID = "3N0wTENSyQNF1t3Opi2Ke+UiJe4Jhb3b1WOKIS6I0mICPQ7O+iOUaUQUsQrda/gUnBRjJNjCs+1vc78lgDEdOsSELTG7jXakfbgPLj61YtKftBdzrvekagM9CZ+9zRx1";

export interface ServerError
{
	body?: string;
	message: string;
	status: number | undefined;
	success: false;
}

export type ITeApiEndpoint = "license/validate" | "payment/paypal/hook" |
							 "register/account" | "register/trial/start" | "register/trial/extend";

export class TeServer implements Disposable
{
	private _busy = false;
    private readonly _onRequestComplete: EventEmitter<void>;


    constructor(private readonly wrapper: TeWrapper)
	{
		this._onRequestComplete = new EventEmitter<void>();
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = TLS_REJECT;
	}

	dispose = () => this._onRequestComplete.dispose();


	get isBusy() {
		return this._busy;
	}

	private get productName() {
		return `${this.wrapper.extensionId}-${this.wrapper.env}`.replace("-production", "");
	};

    get onDidRequestComplete(): Event<void> {
        return this._onRequestComplete.event;
    }


	private getApiPath = (ep: ITeApiEndpoint) => `${ep !== "payment/paypal/hook" ? "/api" : ""}/${ep}/${this.productName}/v${SPM_API_VERSION}`;


	private getServerOptions = (apiEndpoint: ITeApiEndpoint, token?: string) =>
	{
		const server = SPM_API_SERVER;
		const options = {
			hostname: server,
			method: "POST",
			path: this.getApiPath(apiEndpoint),
			port: SPM_API_PORT,
			//
			// TODO - Request timeouts don't work
			// Timeout don't work worth a s***.  So do a promise race in request() for now.
			//
			timeout: 5000,
			headers: <{[id: string]: string}>{
				"token": SPM_API_CLIENTID,
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
				this._busy = false;
				setTimeout(reject, REQUEST_TIMEOUT, <ServerError>{ message: "Timed out", status: 408 });
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
					finally {
						this._busy = false;
						queueMicrotask(() => this._onRequestComplete.fire());
					}
				});
			});

			/* istanbul ignore next*/
			req.on("error", (e) =>
			{   // Not going to fail unless i birth a bug
				this.onServerError(e, logPad);
				errorState = true;
				this._busy = false;
				queueMicrotask(() => this._onRequestComplete.fire());
				reject(e);
			});

			const payload = JSON.stringify(
			{
				...{ machineId: env.machineId, dev: this.wrapper.env === "dev", tests: this.wrapper.tests },
				...params
			});
			// this.log("   payload", logPad + "   ", payload); // For testing only, logs machineId to user console

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
