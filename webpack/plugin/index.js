// @ts-check

const analyze = require("./analyze");
const asset = require("./asset");
const banner = require("./banner");
const build = require("./build");
const clean = require("./clean");
const compile = require("./compile");
const copy = require("./copy");
const finalize = require("./finalize");
const { hash, prehash } = require("./hash");
const ignore = require("./ignore");
const optimization = require("./optimization");
const hookSteps = require("./plugins");
const progress = require("./progress");
const sourcemaps = require("./sourcemaps");
const tscheck = require("./tscheck");
const upload = require("./upload");
const { cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps } = require("./html");

module.exports = {
    analyze,
    asset,
    banner,
    build,
    clean,
    compile,
    copy,
    cssextract,
    finalize,
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
