#!/bin/sh
# Check the live page against this list, by hand, from anywhere.
# Fetches each file from line.gaugepack.com, hashes it, and looks the hash
# up in HASHES.txt. Prints one line per file. Needs curl and shasum.
cd "$(dirname "$0")"
for f in index.html line.js strings.js qrcode.js line.css sw.js manifest.webmanifest vendor/lame.min.js buy.html buy.js doors.html doors.js terms.html privacy.html code.html code.js status.html status.js; do
  h=$(curl -s "https://line.gaugepack.com/$f" | shasum -a 256 | cut -d' ' -f1)
  if grep -q " $f $h " HASHES.txt; then echo "published   $f $h"; else echo "NOT ON LIST $f $h"; fi
done
