#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [[ "$OSTYPE" == "darwin"* ]]; then
    platform=darwin-aarch64
else
    platform=linux-x64
fi

if [ ! -e "$SCRIPT_DIR/bun-$platform/bun" ]; then
  pushd "$SCRIPT_DIR"
  unzip "bun-$platform.zip"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    xattr -dr com.apple.quarantine "bun-$platform/bun"
  fi
  popd
fi

PATH="$SCRIPT_DIR/bun-$platform:$PATH" "$SCRIPT_DIR/bun-$platform/bun" "$@"
