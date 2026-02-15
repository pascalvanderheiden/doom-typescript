#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/DOOM/linuxdoom-1.10"
OUT_DIR="$ROOT_DIR/public/engine"

mkdir -p "$OUT_DIR"

SRC_FILES=()
while IFS= read -r file; do
  SRC_FILES+=("$file")
done < <(find "$SRC_DIR" -maxdepth 1 -name '*.c' \
  ! -name 'i_video.c' ! -name 'i_sound.c' ! -name 'i_net.c' \
  ! -name 'i_video_ems.c' ! -name 'i_sound_ems.c' ! -name 'i_net_ems.c')

SRC_FILES+=("$SRC_DIR/i_video_ems.c" "$SRC_DIR/i_sound_ems.c" "$SRC_DIR/i_net_ems.c")

emcc "${SRC_FILES[@]}" \
  -O2 \
  -DNORMALUNIX \
  -s USE_SDL=2 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web \
  -s EXIT_RUNTIME=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s "EXPORTED_RUNTIME_METHODS=['FS','FS_createDataFile','FS_analyzePath','FS_createPath','FS_chdir']" \
  -s FILESYSTEM=1 \
  -o "$OUT_DIR/doom.js"
