#!/usr/bin/env bash
cd "$(dirname "$0")"

./esbuild main.ts --bundle --outfile=../game.js --tsconfig=./tsconfig.json --sourcemap "$@"
