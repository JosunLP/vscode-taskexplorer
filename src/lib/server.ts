/* eslint-disable @typescript-eslint/naming-convention */

import { TeWrapper } from "./wrapper";
import { IncomingMessage } from "http";
import { request as httpsRequest } from "https";
import { fetch, getProxyAgent } from ":env/fetch";
import { Disposable, env, EventEmitter } from "vscode";
import { SpmApiEndpoint, ISpmServer, SpmServerResource, TeRuntimeEnvironment, SpmServerError } from "../interface";


/* TEMP */ /* istanbul ignore next */
export class TeServer implements ISpmServer, Disposable
{
	private readonly _spmApiPort = 443;
	private readonly _spmApiVersion = 1;
	private readonly _requestTimeout = 7500;
	private readonly _disposables: Disposable[];
	private readonly _spmApiServer = "license.spmeesseman.com";
	private readonly _spmResourceServer = "app1.spmeesseman.com";
    private readonly _onRequestCancel = new EventEmitter<void>();
	private readonly _publicToken: Record<TeRuntimeEnvironment, string> = {
		dev: "1Ac4qiBjXsNQP82FqmeJ5k0/oMEmjR6Dx9fw1ojUO9//Z4MS6gdHvmzPYY+tuhp3UV/xILD301dQZpeAt+YZzY+Lnh8DlVCPjc0B4pdP84XazzZ+c3JN0vNN4cIfa+fsyPAEDzcsFUWf3z04kMyDXktZU7EiJ4vBU89qAbjOX9I=",
		test: "hkL89/b3ETjox/jZ+cPq5satV193yZUISaopzfpJKSHrh4ZzFkTXjJqawRNQFYWcOBrbGCpyITCp0Wm19f8gdI1hNJttkARO5Unac4LA2g7RmT/kdXSsz64zNjB9FrvrzHe97tLBHRGorwcOx/K/hQ==",
		prod: "1Ac4qiBjXsNQP82FqmeJ5qMMv9GdCsyTifVKI1MvX7GD2Wu/Ao1j5tJdleYcfG+VAQowzMb8rivzViBQgqkR+3Ub5PUoXcS0pnupIaknMjJOjlrYCBnlpfEu54RTU/noeLfHvolDC4sBhNYYKsVcQA=="
	};


    constructor(private readonly wrapper: TeWrapper)
	{
		this._onRequestCancel = new EventEmitter<void>();
		this._disposables = [
			this._onRequestCancel
		];
	}

	dispose = async () =>
	{
		this._onRequestCancel.fire();
		this._disposables.splice(0).forEach(d => d.dispose());
	};


	private get productName(): string { return `${this.wrapper.extensionName}-${this.wrapper.env}`.replace("-prod", ""); };
	private get publicToken(): string { return this._publicToken[this.wrapper.env]; }

	get apiServer() { return this._spmApiServer; }


	createError = (status: number | undefined, body: string | undefined, cause?: string | Error) => new SpmServerError(status, body, cause);


	private getApiPath = (ep: SpmApiEndpoint) => `${ep !== "payment/paypal/hook" ? "/api" : ""}/${ep}/${this.productName}/v${this._spmApiVersion}`;


	private getResourcePath = (ep: SpmServerResource) => `https://${this._spmResourceServer}/${ep}`;


	// get = async <T = string | ArrayBuffer | Record<string, any>>(ep: SpmServerResource, raw: boolean, logPad: string) =>
	get = async(ep: SpmServerResource, logPad = ""): Promise<ArrayBuffer> =>
	{
	    return Promise.race<ArrayBuffer>(
		[
			this._get(ep, logPad),
			this.wrapper.promiseUtils.promiseFromEvent<void, ArrayBuffer>(this._onRequestCancel.event).promise,
			new Promise<ArrayBuffer>((_, r) => setTimeout(r, this._requestTimeout, new SpmServerError(408, undefined, "Timeout")))
		]);
	};


	private _get = async (ep: SpmServerResource, logPad: string): Promise<ArrayBuffer> =>
	{
		let rspBody: ArrayBuffer = new ArrayBuffer(0);
		this.wrapper.log.methodStart("server resource request", 1, logPad, false, [[ "endpoint", ep ]]);
		const rsp = await this.wrapRequest(() => fetch(this.getResourcePath(ep),
		{
			agent: getProxyAgent(),
			hostname: this._spmResourceServer,
			method: "GET",
			port: 443,
			headers: {
				"token": this.publicToken,
				"user-agent": this.wrapper.extensionId,
				"content-type": "text/plain"
			}
		}));
		switch (rsp.headers.get("content-type"))
		{   //
			// case "text/html":
			// case "text/plain":
			// 	rspBody = await rsp.text();
			// 	break;
			// case "application/json":
			// 	rspBody = await rsp.json() as Record<string, any>;
			// 	break;
			default:
				// rspBody =  await rsp.blob();
				rspBody = await rsp.arrayBuffer();
				break;
		}
		this.wrapper.log.methodDone("server resource request", 1, logPad, [
			[ "response status", rsp.status ], [ "response size", rsp.size ]
		]);
		this.wrapper.utils.throwIf(
			rsp.status > 299, SpmServerError, rsp.status, rspBody,
			`Received HTTP status ${rsp.status} (${rsp.statusText})` +
			(rspBody ? `\n${Buffer.from(rspBody).toString().trim()}` : "Response body is 0 bytes")
		);
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
		const w = this.wrapper;
		if (!value && value !== false) {
			console.log(`       ${symbol || w.log.symbols.blue.info} ${w.log.withColor(msg.toString(), w.log.colors.grey)}`);
		}
		else {
			const valuePad = 18, diff = valuePad - msg.length;
			for (let i = 0; i < diff; i++) {
				msg += " ";
			}
			console.log(`       ${symbol || w.log.symbols.blue.info} ${w.log.withColor(msg + " : " + value, w.log.colors.grey)}`);
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
		const w = this.wrapper;
		this.log(e, "", undefined, w.log.symbols.blue.error);
		this.wrapper.log.error(e);
		if (rspData) {
			console.log(`       ${w.log.symbols.blue.error} ${w.log.withColor(rspData, w.log.colors.grey)}`);
		}
		this.log("   the license server is down, offline, or there is a connection issue", logPad, undefined, w.log.symbols.blue.error);
		this.log("   licensed mode will be automatically enabled", logPad, undefined, w.log.symbols.blue.error);
		this.log("server request completed w/ a failure", logPad + "   ", undefined, w.log.symbols.blue.error);
		this.wrapper.log.methodDone("server request", 1, logPad);
	};


	request = async <T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>) =>
	{
		return Promise.race<T>(
		[
			this._request<T>(endpoint, token, logPad, params),
			this.wrapper.promiseUtils.promiseFromEvent<void, T>(this._onRequestCancel.event).promise,
			new Promise<T>((_resolve, reject) => {
				setTimeout(reject, this._requestTimeout, <SpmServerError>{ message: "Timed out", status: 408 });
			})
		]);
	};


    private _request = <T>(endpoint: SpmApiEndpoint, token: string | undefined, logPad: string, params: Record<string, any>): Promise<T> =>
	{
		return this.wrapRequest(() => new Promise<T>((resolve, reject) =>
		{
			let rspData = "",
			    errorState = false;
			const options = this.getServerOptions(endpoint, token);

			this.wrapper.log.methodStart("server request", 1, logPad, false, [
				[ "host", options.hostname ], [ "port", options.port ], [ "endpoint", endpoint ]
			]);
			this.log("starting https request to license server", logPad + "   ");
			this.log("   endpoint", logPad + "   ", endpoint);

			const req = httpsRequest(options, (res) =>
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
							reject(new SpmServerError(r.statusCode, rspData, r.statusMessage));
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
		}));
	};


	private wrapRequest = async <T, A>(fn: (...args: A[]) => Promise<T>, ...args: A[]): Promise<T> =>
	{   //
		// There may be several cases where SSL may need to be disabled, but the most common reason:
		//
		// The LetsEncrypt certificate is rejected by VSCode/Electron Test Suite (?).
		// See https://github.com/electron/electron/issues/31212. Expiry of DST Root CA X3.
		// Works fine when debugging, works fine when the extension is installed, just fails in the
		// tests with the "certificate is expired" error as explained in the link above.  For tests,
		// and until this is resolved in vscode/test-electron (I think that's wherethe problem is?)
		//
		const previousRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED,
			  strict = !this.wrapper.tests && this.wrapper.config.get<boolean>("http.strictSSL", true);
		if (!strict) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}
		try {
			return await fn(...args);
		}
		finally {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousRejectUnauthorized;
		}
	};

}
