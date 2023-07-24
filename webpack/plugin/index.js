// @ts-check

const analyze = require("./analyze");
const asset = require("./asset");
const banner = require("./banner");
const build = require("./build");
const clean = require("./clean");
const copy = require("./copy");
const hookSteps = require("./plugins");
const ignore = require("./ignore");
const optimization = require("./optimization");
const progress = require("./progress");
const sourcemaps = require("./sourcemaps");
const tscheck = require("./tscheck");
const upload = require("./upload");
const { hash, prehash } = require("../plugin/hash");
const { cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps } = require("./html");

module.exports = {
    analyze,
    asset,
    banner,
    build,
    clean,
    copy,
    cssextract,
    hash,
    htmlcsp,
    htmlinlinechunks,
	ignore,
    imageminimizer,
    hookSteps,
    optimization,
    prehash,
    progress,
    sourcemaps,
    tscheck,
    upload,
    webviewapps
};
