/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/html.js
 * @author Scott Meesseman
 */

const { posix } = require("path");
const HtmlPlugin = require("html-webpack-plugin");
const CspHtmlPlugin = require("csp-html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param { string } name
 * @param {WpBuildEnvironment} env
 * @returns {HtmlPlugin | undefined}
 */
const html = (name, env) =>
{
    let plugin;
    if (env.app.plugins.html !== false && env.build === "webview")
    {
        const wwwName = name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
		plugin = new HtmlPlugin(
		{
			chunks: [ name, wwwName ],
			filename: posix.join(env.paths.build, "res", "page", `${wwwName}.html`),
			inject: true,
			inlineSource: env.wpc.mode === "production" ? ".css$" : undefined,
			// inlineSource: undefined,
			scriptLoading: "module",
			template: posix.join(name, `${wwwName}.html`),
			minify: env.wpc.mode !== "production" ? false :
			{
				removeComments: true,
				collapseWhitespace: true,
				removeRedundantAttributes: false,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				keepClosingSlash: true,
				minifyCSS: true,
			}
		});
    }
    return plugin;
};


/**
 * @param {WpBuildEnvironment} env
 * @returns {MiniCssExtractPlugin}
 */
const cssextract = (env) =>
{
    return new MiniCssExtractPlugin(
    {
        filename: (pathData, assetInfo) =>
        {
            let name = "[name]";
            if (pathData.chunk?.name) {
                name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
            }
            return `css/${name}.css`;
        }
    });
};


/**
 * @param {WpBuildEnvironment} env
 * @returns {CspHtmlPlugin}
 */
const htmlcsp = (env) =>
{
    const plugin = new CspHtmlPlugin(
    {
        // "connect-src":
        // env.wpc.mode !== 'production'
        // 		 ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.sandbox.paypal.com", "https://www.paypal.com" ]
        // 		 : [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.paypal.com" ],
        "default-src": "'none'",
        "font-src": [ "#{cspSource}" ],
        // "frame-src":
        // env.wpc.mode !== 'production'
        // 		 ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.sandbox.paypal.com", "https://www.paypal.com" ]
        // 		 : [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.paypal.com" ],
        "img-src": [ "#{cspSource}", "https:", "data:" ],
        "script-src":
        env.wpc.mode !== "production"
                ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "'unsafe-eval'" ]
                : [ "#{cspSource}", "'nonce-#{cspNonce}'" ],
        "style-src":
        env.wpc.mode === "production"
                ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "'unsafe-hashes'" ]
                : [ "#{cspSource}", "'unsafe-hashes'", "'unsafe-inline'" ]
    },
    {
        enabled: true,
        hashingMethod: "sha256",
        hashEnabled: {
            "script-src": true,
            "style-src": env.wpc.mode === "production",
        },
        nonceEnabled: {
            "script-src": true,
            "style-src": env.wpc.mode === "production",
        }
    });
    //
    // Override the nonce creation so it can be dynamically generated at runtime
    // @ts-ignore
    plugin.createNonce = () => "#{cspNonce}";
    return plugin;
};


/**
 * @param {WpBuildEnvironment} env
 * @returns {InlineChunkHtmlPlugin | undefined}
 */
const htmlinlinechunks = (env) =>
{
    let plugin;
    if (env.build === "webview")
    {
        // plugin = new InlineChunkHtmlPlugin(HtmlPlugin, env.wpc.mode === "production" ? ["\\.css$"] : []);
        plugin = new InlineChunkHtmlPlugin(HtmlPlugin, []);
    }
    return plugin;
};


/**
 * @param {WpBuildEnvironment} env
 * @returns {ImageMinimizerPlugin | undefined}
 */
const imageminimizer = (env) =>
{
    let plugin;
    if (env.build === "webview" && env.wpc.mode !== "production")
    {
        // plugin = new ImageMinimizerPlugin({
        // 	deleteOriginalAssets: true,
        // 	generator: [ imgConfig(env, wpConfig) ]
        // });
    }
    return plugin;
};


/**
 * @param {string[]} apps
 * @param {WpBuildEnvironment} env
 * @returns {HtmlPlugin[]}
 */
const webviewapps = (apps, env) =>
{
    const plugins = [];
    if (env.build === "webview")
    {
        apps.forEach(k => plugins.push(html(k, env)));
    }
    return plugins;
};


class InlineChunkHtmlPlugin
{
	constructor(htmlPlugin, patterns)
	{
		this.htmlPlugin = htmlPlugin;
		this.patterns = patterns;
	}

	getInlinedTag(publicPath, assets, tag)
	{
		if (
			(tag.tagName !== "script" || !(tag.attributes && tag.attributes.src)) &&
			(tag.tagName !== "link" || !(tag.attributes && tag.attributes.href))
		) {
			return tag;
		}

		let chunkName = tag.tagName === "link" ? tag.attributes.href : tag.attributes.src;
		if (publicPath) {
			chunkName = chunkName.replace(publicPath, "");
		}
		if (!this.patterns.some(pattern => chunkName.match(pattern))) {
			return tag;
		}

		const asset = assets[chunkName];
		if (!asset) {
			return tag;
		}

		return { tagName: tag.tagName === "link" ? "style" : tag.tagName, innerHTML: asset.source(), closeTag: true };
	}

	apply(compiler)
	{
		let publicPath = compiler.options.output.publicPath || "";
		if (publicPath && !publicPath.endsWith("/")) {
			publicPath += "/";
		}

		compiler.hooks.compilation.tap("InlineChunkHtmlPlugin", compilation => {
			const getInlinedTagFn = tag => this.getInlinedTag(publicPath, compilation.assets, tag);
			const sortFn = (a, b) => (a.tagName === "script" ? 1 : -1) - (b.tagName === "script" ? 1 : -1);
			this.htmlPlugin.getHooks(compilation).alterAssetTagGroups.tap("InlineChunkHtmlPlugin", assets => {
				assets.headTags = assets.headTags.map(getInlinedTagFn).sort(sortFn);
				assets.bodyTags = assets.bodyTags.map(getInlinedTagFn).sort(sortFn);
			});
		});
	}
}


// /**
//  * @param {WpBuildEnvironment} env
//  * @param {WebpackConfig} wpConfig Webpack config object
//  * @returns { ImageMinimizerPlugin.Generator<any> }
//  */
// const imgConfig = (env, wpConfig) =>
// {
// 	// @ts-ignore
// 	return env.imageOpt ?
// 	{
// 		type: "asset",
// 		implementation: ImageMinimizerPlugin.sharpGenerate,
// 		options: {
// 			encodeOptions: {
// 				webp: {
// 					lossless: true,
// 				},
// 			},
// 		},
// 	} :
// 	{
// 		type: "asset",
// 		implementation: ImageMinimizerPlugin.imageminGenerate,
// 		options: {
// 			plugins: [
// 			[
// 				"imagemin-webp",
// 				{
// 					lossless: true,
// 					nearLossless: 0,
// 					quality: 100,
// 					method: env.wpc.mode === "production" ? 4 : 0,
// 				}
// 			]]
// 		}
// 	};
// };


module.exports = { cssextract, htmlcsp, htmlinlinechunks, imageminimizer, webviewapps };
