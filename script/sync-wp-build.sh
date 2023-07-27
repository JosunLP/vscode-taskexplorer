
#!/bin/bash

cd "$(dirname ${BASH_SOURCE[0]})"


function cp_wp_build_file {

    cp "../$3/$2" "../../$1/$3"

    if [[ "$1" == *"@spmeesseman/"* ]]; then
        # TABS=$(find . -maxdepth 1 -name "../../$1/$3/$2" | xargs egrep ".*\t{2,}")
        # if [ -z "$TABS" ]; then
            sed -i ':a;N;$!ba;s/const {\([\r\n\s]*\)/import {\1/g' "../../$1/$3/$2"
            sed -i ':a;N;$!ba;s/\} = require("\([a-z\.\/]*\)");/} from "\1";/g' "../../$1/$3/$2"
        # fi
        # if [ ! -z "$TABS" ]; then
        #     sed -i ':a;N;$!ba;s/const \{[\r\n]/import \{/g' "../../$1/$3/$2"
        #     sed -i ':a;N;$!ba;s/\} = require("\(\w\w*\)");?/} from "\1";/g' "../../$1/$3/$2"
        # fi
        sed -i 's/module\.exports = \(\w\w*\)/export default \1/g' "../../$1/$3/$2"
        sed -i 's/module\.exports = {/export {/g' "../../$1/$3/$2"
        # = require("webpack");
        # sed -i 's/const ([a-zA-Z]+) = require\("([a-zA-Z]+)"\);/import \1 from ""/g' "../../$1/$3/$2"
        sed -i 's/const \(\w\w*\) = require("\([a-z\.\/]*\)");/import \1 from "\2";/g' "../../$1/$3/$2"
    fi
}


function sync_wp_build_files {

    # cp_wp_build_file $1 sync-wp-build.sh script

    # cp_wp_build_file $1 webpack.config.js .

    # cp_wp_build_file $1 .wpbuildrc.json webpack

    cp_wp_build_file $1 console.js webpack
    cp_wp_build_file $1 global.js webpack
    cp_wp_build_file $1 utils.js webpack

    cp_wp_build_file $1 index.d.ts  webpack/types

    # cp_wp_build_file $1 context.js webpack/exports
    cp_wp_build_file $1 devtool.js webpack/exports
    # cp_wp_build_file $1 entry.js webpack/exports
    # cp_wp_build_file $1 externals.js webpack/exports
    cp_wp_build_file $1 ignorewarnings.js webpack/exports
    cp_wp_build_file $1 index.js webpack/exports
    cp_wp_build_file $1 minification.js webpack/exports
    cp_wp_build_file $1 mode.js webpack/exports
    cp_wp_build_file $1 name.js webpack/exports
    # cp_wp_build_file $1 optimization.js webpack/exports
    # cp_wp_build_file $1 output.js webpack/exports
    cp_wp_build_file $1 plugins.js webpack/exports
    # cp_wp_build_file $1 resolve.js webpack/exports
    # cp_wp_build_file $1 rules.js webpack/exports
    cp_wp_build_file $1 stats.js webpack/exports
    cp_wp_build_file $1 target.js webpack/exports
    cp_wp_build_file $1 watch.js webpack/exports

    cp_wp_build_file $1 analyze.js webpack/plugin
    # cp_wp_build_file $1 asset.js webpack/plugin
    cp_wp_build_file $1 banner.js webpack/plugin
    # cp_wp_build_file $1 build.js webpack/plugin
    # cp_wp_build_file $1 clean.js webpack/plugin
    # cp_wp_build_file $1 compile.js webpack/plugin
    # cp_wp_build_file $1 copy.js webpack/plugin
    cp_wp_build_file $1 finalize.js webpack/plugin
    # cp_wp_build_file $1 hash.js webpack/plugin
    # cp_wp_build_file $1 html.js webpack/plugin
    # cp_wp_build_file $1 ignore.js webpack/plugin
    cp_wp_build_file $1 index.js webpack/plugin
    cp_wp_build_file $1 optimization.js webpack/plugin
    # cp_wp_build_file $1 plugins.js webpack/plugin
    cp_wp_build_file $1 progress.js webpack/plugin

    # if [ $1 = "../../vscode-extjs" ] ; then
    #    cp_wp_build_file $1 tscheck.js webpack/plugin
    # fi

    if [ $1 = "vscode-extjs" ] ; then
        cp_wp_build_file $1 upload.js webpack/plugin
    fi

    cp_wp_build_file $1 sourcemaps.js webpack/plugin
    if [ $1 = "vscode-extjs" ] ; then
        sed -i 's/vendor|runtime|tests/vendor|runtime|tests|serverInterface/g' "../../$1/webpack/plugin/sourcemaps.js"
    fi
}

#sync_wp_build_files "vscode-extjs"
#sync_wp_build_files "@spmeesseman/logger"
sync_wp_build_files "@spmeesseman/test-utils"
