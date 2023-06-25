// @ts-check

const entry = require("./entry");
const externals = require("./externals");
const plugins = require("./plugins");
const output = require("./output");
const rules = require("./rules");

module.exports = {
	entry,
    externals,
    plugins,
    output,
    rules
};
