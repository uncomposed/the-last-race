#!/bin/zsh
# usage: par.sh lo hi nzStart nzCount tag [rosters]   splits seeds lo..hi across 8 processes
cd "$(dirname $0)"; lo=$1; hi=$2; tot=$((hi-lo+1)); chunk=$(( (tot+7)/8 ))
for k in 0 1 2 3 4 5 6 7; do a=$((lo+k*chunk)); b=$((a+chunk-1)); [ $b -gt $hi ] && b=$hi; [ $a -le $hi ] && node eval.mjs $a-$b $3 $4 raw_$5_$k.jsonl $6 & done; wait
cat raw_$5_?.jsonl > all_$5.jsonl; rm raw_$5_?.jsonl; wc -l all_$5.jsonl
