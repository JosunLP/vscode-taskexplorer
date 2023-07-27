
#!/bin/bash

cd "$(dirname ${BASH_SOURCE[0]})"

$DEST=../../vscode-extjs

cp ../webpack.config.json 

cp ../webpack/console.js $DEST/webpack
cp ../webpack/global.js $DEST/webpack
cp ../webpack/utils.js $DEST/webpack

cp ../webpack/types/*.*  $DEST/webpack/types

# cp ../webpack/exports/context.js $DEST/webpack/exports
cp ../webpack/exports/devtool.js $DEST/webpack/exports
# cp ../webpack/exports/entry.js $DEST/webpack/exports
# cp ../webpack/exports/externals.js $DEST/webpack/exports
cp ../webpack/exports/ignorewarnings.js $DEST/webpack/exports
cp ../webpack/exports/index.js $DEST/webpack/exports
cp ../webpack/exports/minification.js $DEST/webpack/exports
cp ../webpack/exports/mode.js $DEST/webpack/exports
cp ../webpack/exports/name.js $DEST/webpack/exports
# cp ../webpack/exports/optimization.js $DEST/webpack/exports
# cp ../webpack/exports/output.js $DEST/webpack/exports
cp ../webpack/exports/plugins.js $DEST/webpack/exports
# cp ../webpack/exports/resolve.js $DEST/webpack/exports
# cp ../webpack/exports/rules.js $DEST/webpack/exports
cp ../webpack/exports/stats.js $DEST/webpack/exports
cp ../webpack/exports/target.js $DEST/webpack/exports
cp ../webpack/exports/watch.js $DEST/webpack/exports

cp ../webpack/plugin/analyze.js $DEST/webpack/plugin
# cp ../webpack/plugin/asset.js $DEST/webpack/plugin
cp ../webpack/plugin/banner.js $DEST/webpack/plugin
# cp ../webpack/plugin/build.js $DEST/webpack/plugin
# cp ../webpack/plugin/clean.js $DEST/webpack/plugin
# cp ../webpack/plugin/compile.js $DEST/webpack/plugin
# cp ../webpack/plugin/copy.js $DEST/webpack/plugin
cp ../webpack/plugin/finalize.js $DEST/webpack/plugin
# cp ../webpack/plugin/hash.js $DEST/webpack/plugin
# cp ../webpack/plugin/html.js $DEST/webpack/plugin
# cp ../webpack/plugin/ignore.js $DEST/webpack/plugin
cp ../webpack/plugin/index.js $DEST/webpack/plugin
cp ../webpack/plugin/optimization.js $DEST/webpack/plugin
# cp ../webpack/plugin/plugins.js $DEST/webpack/plugin
cp ../webpack/plugin/progress.js $DEST/webpack/plugin
cp ../webpack/plugin/sourcemaps.js $DEST/webpack/plugin
# cp ../webpack/plugin/tscheck.js $DEST/webpack/plugin
cp ../webpack/plugin/upload.js $DEST/webpack/plugin
