#!/usr/bin/env node

//
// Creates 'icons' section in src/webview/common/fontawesome.ts from src/webview/app/common/scss/fa/_variables.scss
//

const fs = require("fs"),
      path = require("path"),
      iconDefs = {},
      iconVars = [],
      faTsModulePath =path.resolve(__dirname, "..", "src", "webview", "common", "fontawesome.ts"),
      faScssVarsPath = path.resolve(__dirname, "..", "src", "webview", "app", "common", "scss", "fa", "_variables.scss"),
      faVars_scss = fs.readFileSync(faScssVarsPath).toString(),
      regex = /(?:^\$fa\-var\-)([a-z0-9\-]*?): *(\\[0-9a-f]{1,4});/gmi,
      regex2 = / +icons:\s*(\{[^]+\}) as IDictionary<string>/gmi;

let match;
let fa_ts = fs.readFileSync(faTsModulePath).toString();

while ((match = regex.exec(faVars_scss)) !== null) { iconVars.push({ a: match[1], b: match[2] }) }

iconVars.sort((a, b) => a.a < b.a ? -1 : 1);
iconVars.forEach(p => iconDefs[p.a] = p.b);

if ((match = regex2.exec(fa_ts)) !== null)
{
    fa_ts = fa_ts.replace(match[1], JSON.stringify(iconDefs, null, 8).slice(0, -1) + "    }");
    fs.writeFileSync(faTsModulePath, fa_ts);
}
