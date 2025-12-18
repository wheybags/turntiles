#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ ! -e "$SCRIPT_DIR/bun-linux-x64/bun" ]; then
  pushd "$SCRIPT_DIR"
  unzip bun-linux-x64.zip
  popd
fi

PATH="$SCRIPT_DIR/bun-linux-x64:$PATH" "$SCRIPT_DIR/bun-linux-x64/bun" "$@"
