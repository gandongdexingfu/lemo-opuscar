#!/bin/bash
# Review stills at the given seconds → stills/t_<sec>.jpg, tiled into stills/<sheet>.jpg
# Usage: sh tools/stills.sh <sheet-name> <sec> [<sec> …]
cd "$(dirname "$0")/.."
LIB=${LIB:-$(cd ../../.. && pwd)}
name=$1; shift
args=(); files=()
for t in "$@"; do args+=("$t" "stills/t_$t.jpg"); files+=("stills/t_$t.jpg"); done
"$LIB/.venv/bin/python" tools/render.py --still "${args[@]}" > /dev/null
"$LIB/.venv/bin/python" "$LIB/core/render/sheet.py" "stills/$name.jpg" "${files[@]}" --cols 4 --w 480
