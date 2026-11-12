#!/bin/zsh
cd "$(dirname $0)"; seeds=($(tr ',' ' ' < cand.txt)); n=${#seeds[@]}; per=$(( (n+7)/8 ))
for k in 0 1 2 3 4 5 6 7; do sub=(${seeds[@]:$((k*per)):$per}); [ ${#sub[@]} -gt 0 ] && node eval.mjs ${(j:,:)sub} $1 $2 rawc_$3_$k.jsonl & done; wait
cat rawc_$3_?.jsonl > all_$3.jsonl; rm rawc_$3_?.jsonl; wc -l all_$3.jsonl
