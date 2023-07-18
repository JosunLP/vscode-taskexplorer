/* eslint-disable @typescript-eslint/naming-convention */

import { env } from "vscode";
import { request } from "https";
import { TeWrapper } from "../wrapper";
import { IncomingMessage } from "http";
import { figures } from "../utils/figures";
import { fetch, getProxyAgent, RequestInfo, RequestInit } from ":env/fetch";
import {
	SpmApiEndpoint, ISpmServer, SpmServerResource, TeRuntimeEnvironment, SpmServerError
} from "../../interface";

// const TLS_REJECT = "0"; // "0" to turn off tls rejection

/* TEMP */ /* istanbul ignore next */
export class TeServer implements ISpmServer
{
	private readonly _spmApiPort = 443;
	private readonly _spmApiVersion = 1;
	private readonly _requestTimeout = 7500;
	private readonly _spmApiServer = "license.spmeesseman.com";
	private readonly _publicToken: Record<TeRuntimeEnvironment, string> = {
		dev: "1Ac4qiBjXsNQP82FqmeJ5k0/oMEmjR6Dx9fw1ojUO9//Z4MS6gdHvmzPYY+tuhp3UV/xILD301dQZpeAt+YZzY+Lnh8DlVCPjc0B4pdP84XazzZ+c3JN0vNN4cIfa+fsyPAEDzcsFUWf3z04kMyDXktZU7EiJ4vBU89qAbjOX9I=",
		tests: "hkL89/b3ETjox/jZ+cPq5satV193yZUISaopzfpJKSHrh4ZzFkTXjJqawRNQFYWcOBrbGCpyITCp0Wm19f8gdI1hNJttkARO5Unac4LA2g7RmT/kdXSsz64zNjB9FrvrzHe97tLBHRGorwcOx/K/hQ==",
		production: "1Ac4qiBjXsNQP82FqmeJ5qMMv9GdCsyTifVKI1MvX7GD2Wu/Ao1j5tJdleYcfG+VAQowzMb8rivzViBQgqkR+3Ub5PUoXcS0pnupIaknMjJOjlrYCBnlpfEu54RTU/noeLfHvolDC4sBhNYYKsVcQA=="
	};


    constructor(private readonly wrapper: TeWrapper) {}


	private get productName() {
		return `${this.wrapper.extensionName}-${this.wrapper.env}`.replace("-production", "");
	};

	private get publicToken(): string {
		return this._publicToken[this.wrapper.env];
	}

	get apiServer() { return this._spmApiServer; }


	private getApiPath = (ep: SpmApiEndpoint) => `${ep !== "payment/paypal/hook" ? "/api" : ""}/${ep}/${this.productName}/v${this._spmApiVersion}`;


	private getResourcPath = (ep: SpmServerResource) => `https://${this._spmApiServer}/static/${ep}`;


	get = async <T = string>(ep: SpmServerResource, raw: boolean, logPad: string) =>
	{
		return Promise.race<T>(
		[
			this._get(ep, logPad).then<T>(r => this.wrapper.utils.wrap(r => (!raw ? JSON.parse(r) : r) as T, [ (r) => r, r ], this, r)),
			new Promise<T>((_, reject) => {
				setTimeout(reject, this._requestTimeout, <SpmServerError>{ message: "Timed out", status: 408 });
			})
		]);
	};


	private _get = async (ep: SpmServerResource, logPad: string) =>
	{
		this.wrapper.log.methodStart("server resource request", 1, logPad, false, [[ "endpoint", ep ]]);
		const response = await this.wrapFetch(
			this.getResourcPath(ep),
			{
				agent: getProxyAgent(),
				hostname: this._spmApiServer,
				method: "GET",
				port: 443,
				headers: {
					"token": this.publicToken,
					"user-agent": this.wrapper.extensionId,
					"content-type": "text/plain"
				}
			}
		);
		const rspBody = await response.text();
		this.wrapper.log.methodDone("server resource request", 1, logPad, [
			[ "response status", response.status ], [ "response body length", rspBody.length ]
		]);
		if (response.status > 299) {
			throw new SpmServerError(response.status, rspBody, response.statusText);
		}
		return rspBody;
	};


	private getServerOptions = (apiEndpoint: SpmApiEndpoint, token?: string) =>
	{
		const options = {
			hostname: this._spmApiServer,
			method: "POST",
			path: this.getApiPath(apiEndpoint),
			port: this._spmApiPort,
			//
			// TODO - Request timeouts don't work
			// Timeout don't work worth a s***.  So do a promise race in request() for now.
			//
			timeout: this._requestTimeout,
			headers: <Record<string, string>> {
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
	private onSpmServerError = (e: any, logPad: string, rspData?: string) =>
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


	request = async <T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>) =>
	{
		return Promise.race<T>(
		[
			this._request<T>(endpoint, token, logPad, params),
			new Promise<T>((_resolve, reject) => {
				setTimeout(reject, this._requestTimeout, <SpmServerError>{ message: "Timed out", status: 408 });
			})
		]);
	};


    private _request = <T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T> =>
	{
		return new Promise<T>((resolve, reject) =>
		{
			let rspData = "",
			    errorState = false;
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
					let jso = { message: rspData };
					this.wrapper.utils.wrap(() => { jso = JSON.parse(rspData); });
					this.wrapper.utils.wrap((r) =>
					{
						this.logServerResponse(r, jso, logPad);
						if (r.statusCode && r.statusCode <= 299)
						{
							resolve(<T>jso);
						}
						else {
							reject(new SpmServerError(r.statusCode, JSON.stringify(jso), r.statusMessage));
						}
					}, [ reject ], this, res);
				});
			});

			/* istanbul ignore next*/
			req.on("error", (e) =>
			{   // Not going to fail unless i birth a bug
				this.onSpmServerError(e, logPad);
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


	private wrapFetch = async (url: URL | RequestInfo, init?: RequestInit) =>
	{
		const previousRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED,
			  strict = !this.wrapper.tests && this.wrapper.config.get<boolean>("http.strictSSL", true);
		if (!strict) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}
		try {
			return await fetch(url, init);
		}
		finally {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousRejectUnauthorized;
		}
	};

}
