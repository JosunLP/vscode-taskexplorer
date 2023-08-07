// @ts-check

const analyze = require("./analyze");
const banner = require("./banner");
const clean = require("./clean");
const copy = require("./copy");
const dispose = require("./dispose");
const runtimevars = require("./runtimevars");
const environment = require("./environment");
const istanbul = require("./istanbul");
const licensefiles = require("./licensefiles");
const ignore = require("./ignore");
const optimization = require("./optimization");
const loghooks = require("./loghooks");
const progress = require("./progress");
const scm = require("./scm");
const sourcemaps = require("./sourcemaps");
const testsuite = require("./testsuite");
const tscheck = require("./tscheck");
const upload = require("./upload");
const vendormod = require("./vendormod");
const { cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps } = require("./html");

module.exports = {
    analyze, banner, clean, copy, cssextract, dispose, environment, htmlcsp, htmlinlinechunks,
    ignore, imageminimizer, istanbul, licensefiles, loghooks, optimization, progress,
    runtimevars, scm, sourcemaps, testsuite, tscheck, upload, vendormod, webviewapps
};
