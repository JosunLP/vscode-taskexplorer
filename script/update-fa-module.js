#!/usr/bin/env node

//
// Creates 'icons' section in src/webview/common/fontawesome.ts from src/webview/app/common/scss/fa/_variables.scss
//

const fs = require("fs"),
      path = require("path"),
      iconDefs = {},
      faTsModulePath =path.resolve(__dirname, "..", "src", "webview", "common", "fontawesome.ts"),
      faScssVarsPath = path.resolve(__dirname, "..", "src", "webview", "app", "common", "scss", "fa", "_variables.scss"),
      faVars_scss = fs.readFileSync(faScssVarsPath).toString(),
      regex = /(?:^\$fa\-var\-)([a-z0-9\-]*?): *(\\[0-9a-f]{1,4});/gmi,
      regex2 = / +icons:\s*(\{[^]+\}) as IDictionary<string>/gmi;

let match;
let fa_ts = fs.readFileSync(faTsModulePath).toString();

while ((match = regex.exec(faVars_scss)) !== null) { iconDefs[match[1]] = match[2]; }

if ((match = regex2.exec(fa_ts)) !== null)
{
    fa_ts = fa_ts.replace(match[1], JSON.stringify(iconDefs, null, 8));
    fs.writeFileSync(faTsModulePath, fa_ts);
}
