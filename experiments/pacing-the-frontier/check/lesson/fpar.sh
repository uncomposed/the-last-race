#!/bin/zsh
cd "$(dirname $0)"; lo=$1; hi=$2; tot=$((hi-lo+1)); chunk=$(( (tot+7)/8 ))
for k in 0 1 2 3 4 5 6 7; do a=$((lo+k*chunk)); b=$((a+chunk-1)); [ $b -gt $hi ] && b=$hi; [ $a -le $hi ] && node follow.mjs $a-$b $3 $4 fr_$5_$k.jsonl & done; wait
cat fr_$5_?.jsonl > fall_$5.jsonl; rm fr_$5_?.jsonl; wc -l fall_$5.jsonl
