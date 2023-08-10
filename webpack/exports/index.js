// @ts-check

/**
 * @file exports/index.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */


const cache = require("./cache");
const context = require("./context");
const devtool = require("./devtool");
const entry = require("./entry");
const experiments = require("./experiments");
const externals = require("./externals");
const ignorewarnings = require("./ignorewarnings");
const minification = require("./minification");
const { mode, getMode } = require("./mode");
const name = require("./name");
const optimization = require("./optimization");
const plugins = require("./plugins");
const output = require("./output");
const resolve = require("./resolve");
const rules = require("./rules");
const stats = require("./stats");
const target = require("./target");
const watch = require("./watch");

module.exports = {
    cache,
    context,
    devtool,
	entry,
    experiments,
    externals,
    getMode,
    ignorewarnings,
    minification,
    mode,
    name,
    optimization,
    plugins,
    output,
    resolve,
    rules,
    stats,
    target,
    watch
};
