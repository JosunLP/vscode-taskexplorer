#!/usr/bin/env node

//
// Creates 'icons' section in src/webview/common/fontawesome.ts from src/webview/app/common/scss/fa/_variables.scss
//

const copyFolderRecursiveSync = (source, target, filter) =>
{
    var files = [];

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }
    if (fs.lstatSync(source).isDirectory())
    {
        files = fs.readdirSync(source);
        files.filter(f => !filter || f.match(filter)).forEach(function(file)
        {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory())
            {
                copyFolderRecursiveSync(curSource, target);
            }
            else {
                fs.copyFileSync(curSource, path.join(target, path.basename(curSource)));
            }
        });
    }
};

const fs = require("fs"),
      path = require("path"),
      execSync = require("child_process").execSync

const iconDefs = {},
      iconVars = [],
      faZipPath = path.join(__dirname, "Subset.zip"),
      faFontSrcPath = path.resolve(__dirname, "..", "res", "font"),
      faTsModulePath =path.resolve(__dirname, "..", "src", "webview", "common", "fontawesome.ts"),
      scssSrcPath = path.resolve(__dirname, "..", "src", "webview", "app", "common", "scss"),
      faScssSrcPath = path.join(scssSrcPath, "fa"),
      faScssVarsPath = path.join(faScssSrcPath, "_variables.scss"),
      faExtractedDirName = path.join(__dirname, "fontawesome-subset"),
      regex = /(?:^\$fa\-var\-)([a-z0-9\-]*?): *(\\[0-9a-f]{1,4});/gmi,
      regex2 = / +icons:\s*(\{[^]+\}) as IDictionary<string>/gmi,
      doExtractFromFaZip = (process.argv.includes("-x") || process.argv.includes("--extract")) && fs.existsSync(faZipPath);

if (doExtractFromFaZip)
{
    if (fs.existsSync(faExtractedDirName)) {
        fs.rmSync(faExtractedDirName, { recursive: true });
    }
    execSync(`7za.exe e -r -spf Subset.zip -o${__dirname}`, { cwd: __dirname });
    copyFolderRecursiveSync(path.join(faExtractedDirName, "scss"), faScssSrcPath);
    copyFolderRecursiveSync(path.join(faExtractedDirName, "webfonts"), faFontSrcPath, /\.woff2/);

}

let match;
let fa_ts = fs.readFileSync(faTsModulePath).toString();
const faVars_scss = fs.readFileSync(faScssVarsPath).toString();
fs.writeFileSync(faScssVarsPath, faVars_scss.replace("../webfonts", "../font"));

while ((match = regex.exec(faVars_scss)) !== null) { iconVars.push({ a: match[1], b: match[2] }) }

iconVars.sort((a, b) => a.a < b.a ? -1 : 1);
iconVars.forEach(p => iconDefs[p.a] = p.b);

if ((match = regex2.exec(fa_ts)) !== null)
{
    fa_ts = fa_ts.replace(match[1], JSON.stringify(iconDefs, null, 8).slice(0, -1) + "    }");
    fs.writeFileSync(faTsModulePath, fa_ts);
}

if (doExtractFromFaZip)
{
    fs.unlinkSync(faZipPath);
    if (fs.existsSync(faExtractedDirName)) {
        fs.rmSync(faExtractedDirName, { recursive: true });
    }
}
