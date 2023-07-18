/* eslint-disable import/no-extraneous-dependencies */
// export default {};

// import * as url from "url";
import fetch from "node-fetch";
// import * as process from "process";
// import { HttpsProxyAgent } from "https-proxy-agent";
// import { configuration } from "../../configuration";

export { fetch };
export type { BodyInit, RequestInit, Response } from "node-fetch";

/*
export const getProxyAgent = (strictSSL?: boolean): HttpsProxyAgent | undefined =>
{
	let proxyUrl: string | undefined;

	const proxy = configuration.get<any>("proxy");
	if (!proxy)
	{
		proxyUrl = proxy.url ?? undefined;
		strictSSL = strictSSL ?? proxy.strictSSL;
	}
	else {
		const proxySupport = configuration.get<"off" | "on" | "override" | "fallback">(
			"http.proxySupport",
			"override",
		);

		if (proxySupport === "off") {
			strictSSL = strictSSL ?? true;
		} else {
			strictSSL = strictSSL ?? configuration.get<boolean>("http.proxyStrictSSL", true);
			proxyUrl = configuration.get<string>("http.proxy") || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
		}
	}

	if (proxyUrl) {
		return new HttpsProxyAgent({
			...url.parse(proxyUrl),
			rejectUnauthorized: strictSSL,
		});
	}

	if (strictSSL === false) {
		return new HttpsProxyAgent({
			rejectUnauthorized: false,
		});
	}

	return undefined;
};


export  const wrapForForcedInsecureSSL = async<T>(ignoreSSLErrors: boolean | "force", fetchFn: () => Promise<T> | Thenable<T>): Promise<T> =>
{
	if (ignoreSSLErrors !== "force") return fetchFn();

	const previousRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	try {
		return await fetchFn();
	} finally {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousRejectUnauthorized;
	}
};
*/
