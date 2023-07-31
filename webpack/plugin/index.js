// @ts-check

const analyze = require("./analyze");
const banner = require("./banner");
const build = require("./build");
const clean = require("./clean");
const compile = require("./compile");
const copy = require("./copy");
const customize = require("./customize");
const runtimevars = require("./runtimevars");
const environment = require("./environment");
const licensefiles = require("./licensefiles");
const hash = require("./hash");
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
    analyze, banner, build, clean, compile, copy, cssextract, customize, environment,
    hash, htmlcsp, htmlinlinechunks,ignore, imageminimizer, instrument, licensefiles, loghooks,
    optimization, progress, runtimevars, scm, sourcemaps, tscheck, upload, webviewapps
};
