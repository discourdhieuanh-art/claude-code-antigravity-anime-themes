#!/usr/bin/env bash
# Tai cac video nen tu kho goc cua tac gia, chuyen sang H.264 1080p khong tieng, tao anh poster.
# Download the background videos from their authors' repositories, convert to H.264 1080p, make posters.
# Usage: ./fetch-videos.sh <thu muc themes/assets cua antigravity-custom-theme-mod>
set -euo pipefail
A="${1:?Usage: $0 <path to antigravity-custom-theme-mod/themes/assets>}"
mkdir -p "$A"; TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
command -v ffmpeg >/dev/null || { echo "Can ffmpeg: sudo apt install ffmpeg"; exit 1; }

# name | source URL | mode (copy = giu nguyen hinh, h264 = chuyen ma 1080p)
LIST=(
  "whale-fantasy-loop|https://raw.githubusercontent.com/1745761934/dsh-skin-whale-fantasy/main/assets/whale-fantasy-loop.mp4|copy"
  "whale-moon-loop|https://raw.githubusercontent.com/kingOfSoySauce/dsh-boot-animation/main/assets/screensaver/%E5%B1%8F%E4%BF%9D6.mp4|copy"
  "whale-underwater-loop|https://raw.githubusercontent.com/kingOfSoySauce/dsh-boot-animation/main/assets/videos/3.mp4|copy"
  "boot-claude-loop|https://raw.githubusercontent.com/wynneceles/ai-boot-animations/main/claude/assets/loop.mp4|h264"
  "boot-antigravity-loop|https://raw.githubusercontent.com/wynneceles/ai-boot-animations/main/antigravity/assets/loop.mp4|h264"
)
for row in "${LIST[@]}"; do
  IFS='|' read -r n url mode <<<"$row"
  if [ -f "$A/$n.mp4" ]; then echo "co roi: $n"; continue; fi
  echo "tai: $n"; curl -sSfL -o "$TMP/$n.src" "$url"
  if [ "$mode" = copy ]; then
    ffmpeg -v error -y -i "$TMP/$n.src" -an -c copy -movflags +faststart "$A/$n.mp4"
  else
    ffmpeg -v error -y -i "$TMP/$n.src" -an -c:v libx264 -crf 20 -vf scale=-2:1080 -pix_fmt yuv420p -movflags +faststart "$A/$n.mp4"
  fi
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$A/$n.mp4")
  ffmpeg -v error -y -ss "$(python3 -c "print($d*0.6)")" -i "$A/$n.mp4" -frames:v 1 -q:v 4 "$A/${n%-loop}-poster.jpg"
done
echo "Xong. Gemini-chan va Furina co san trong antigravity-custom-theme-mod."
