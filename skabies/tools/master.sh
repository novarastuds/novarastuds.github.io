#!/bin/sh
# Master without mux.sh (which needs ffmpeg 7): two-pass loudnorm on the WAV alone (−14 LUFS, TP −1.5), check the
# length did not change, then mux with the picture copied. Usage: sh tools/master.sh video.mp4 mix.wav out.mp4
set -e
V=$1; A=$2; O=$3; T=$(dirname "$O")/.master.$$; mkdir -p "$T"
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -loglevel error -y -i "$A" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s24le "$T/n.wav"
la=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$A"); lb=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/n.wav")
echo "audio length in $la s, out $lb s"
awk -v a="$la" -v b="$lb" 'BEGIN{d=a-b; if (d<0) d=-d; exit !(d<0.2)}' || { echo "length changed: refusing"; rm -rf "$T"; exit 1; }
ffmpeg -hide_banner -loglevel error -y -i "$V" -i "$T/n.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$T/o.mp4"
mv "$T/o.mp4" "$O"; rm -rf "$T"
ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -A12 'Summary' | grep -E 'I:|Peak:'
