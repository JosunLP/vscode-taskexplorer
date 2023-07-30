// @ts-check

const analyze = require("./analyze");
const banner = require("./banner");
const build = require("./build");
const clean = require("./clean");
const compilation = require("./compilation");
const copy = require("./copy");
const customize = require("./customize");
const define = require("./define");
const environment = require("./environment");
const finalize = require("./finalize");
const { hash, prehash } = require("./hash");
const ignore = require("./ignore");
const instrument = require("./instrument");
const optimization = require("./optimization");
const loghooks = require("./loghooks");
const progress = require("./progress");
const scm = require("./scm");
const sourcemaps = require("./sourcemaps");
const tscheck = require("./tscheck");
const upload = require("./upload");
const { cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps } = require("./html");

module.exports = {
    analyze,
    banner,
    build,
    clean,
    compilation,
    copy,
    cssextract,
    customize,
    define,
    environment,
    finalize,
    hash,
    htmlcsp,
    htmlinlinechunks,
	ignore,
    imageminimizer,
    instrument,
    loghooks,
    optimization,
    prehash,
    progress,
    scm,
    sourcemaps,
    tscheck,
    upload,
    webviewapps
};
