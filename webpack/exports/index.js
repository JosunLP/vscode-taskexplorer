// @ts-check

const entry = require("./entry");
const externals = require("./externals");
const minification = require("./minification");
const mode = require("./mode");
const optimization = require("./optimization");
const plugins = require("./plugins");
const output = require("./output");
const resolve = require("./resolve");
const rules = require("./rules");
const stats = require("./stats");
const target = require("./rules");

module.exports = {
	entry,
    externals,
    minification,
    mode,
    optimization,
    plugins,
    output,
    resolve,
    rules,
    stats,
    target
};
