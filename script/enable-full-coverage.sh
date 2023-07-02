#!/bin/bash

cd "$(dirname ${BASH_SOURCE[0]})"
cd ..

ENABLE=1
if [ ! -z $1 ] ; then
    ENABLE=0
fi

if [ $ENABLE = 1 ]; then
  sed -i ':a;N;$!ba;s/"activationEvents": \[[ \r\n\t]*"\*"/"activationEvents": []/g' package.json
  sed -i ':a;N;$!ba;s/]\n[ ]*],/],/g' package.json
fi

if [ $ENABLE = 0 ]; then
  TABS=$(find . -maxdepth 1 -name "package.json"| xargs egrep ".*\t{2,}")
  if [ -z "$TABS" ]; then
    sed -i 's/"activationEvents": \[]/"activationEvents": [\n        "*"\n    ]/g' package.json
  fi
  if [ ! -z "$TABS" ]; then
    sed -i 's/"activationEvents": \[]/"activationEvents": [\n\t\t"*"\n\t]/g' package.json
  fi
fi
