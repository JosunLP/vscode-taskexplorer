/* eslint-disable import/no-extraneous-dependencies */
// export default {};

import { parse } from "url";
import { env } from "process";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { configuration } from "../../configuration";

export type { BodyInit, RequestInit, Response, RequestInfo } from "node-fetch";
export { fetch, getProxyAgent };


type HttpProxySupportType = "off" | "on" | "override" | "fallback";


const getProxyAgent = (strictSSL?: boolean): HttpsProxyAgent | undefined =>
{
	let proxyUrl: string | undefined;
	const proxySupport = configuration.get<HttpProxySupportType>("http.proxySupport", "off");
	/* istanbul ignore else */
	if (proxySupport === "off") {
		strictSSL = strictSSL ?? true;
	}
	else {
		strictSSL = strictSSL ?? configuration.get<boolean>("http.proxyStrictSSL", true);
		proxyUrl = configuration.get<string>("http.proxy") || env.HTTPS_PROXY || env.HTTP_PROXY;
	}
	/* istanbul ignore if */
	if (proxyUrl) {
		return new HttpsProxyAgent({ ...parse(proxyUrl), rejectUnauthorized: strictSSL });
	}
	/* istanbul ignore if */
	if (strictSSL === false) {
		return new HttpsProxyAgent({ rejectUnauthorized: false });
	}
	return undefined;
};
