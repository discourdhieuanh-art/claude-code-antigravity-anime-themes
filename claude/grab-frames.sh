#!/usr/bin/env bash
# Cat khung hinh goc tu cac video Antigravity cho make_stills.py.
# Usage: ./grab-frames.sh <thu muc video, vd ~/.local/share/antigravity-theme-mod/themes/assets>
set -euo pipefail
A="${1:?Usage: $0 <folder with the Antigravity theme videos>}"
F="$(cd "$(dirname "$0")" && pwd)/frames"; mkdir -p "$F"
grab() { # video, vi tri (0..1), ten anh
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$A/$1.mp4")
  ffmpeg -v error -y -ss "$(python3 -c "print($d*$2)")" -i "$A/$1.mp4" -frames:v 1 "$F/$3.png"
}
for v in wallpapergeminichan whale-moon-loop whale-underwater-loop furina-bg boot-claude-loop boot-antigravity-loop; do
  grab "$v" 0.4 "full-$v"
done
grab whale-moon-loop 0.6 whale-single
ls "$F"
