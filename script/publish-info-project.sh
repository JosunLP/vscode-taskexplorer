#!/bin/bash

cd "$(dirname ${BASH_SOURCE[0]})"
cd ../../vscode-taskexplorer-info

if [ ! -z $1 ] ; then
    VERSION=$1
fi

app-publisher --no-ci --changelog-skip --force-release --version-force-next $VERSION
