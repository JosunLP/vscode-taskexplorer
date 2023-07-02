// @ts-check

const context = require("./context");
const devtool = require("./devtool");
const entry = require("./entry");
const externals = require("./externals");
const ignorewarnings = require("./ignorewarnings");
const minification = require("./minification");
const mode = require("./mode");
const optimization = require("./optimization");
const plugins = require("./plugins");
const output = require("./output");
const resolve = require("./resolve");
const rules = require("./rules");
const stats = require("./stats");
const target = require("./target");
const watch = require("./watch");

module.exports = {
    context,
    devtool,
	entry,
    externals,
    ignorewarnings,
    minification,
    mode,
    optimization,
    plugins,
    output,
    resolve,
    rules,
    stats,
    target,
    watch
};
