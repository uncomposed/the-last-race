#!/bin/zsh
# usage: strun.sh NAME START COUNT MODE STEPS  -> raw/st-NAME.json (merged), 8 parallel chunks of 50 seeds
cd ${0:a:h}; mkdir -p raw/tmp
n=$1; s=$2; c=$3; m=$4; st=$5
seq $s 50 $((s+c-1)) | xargs -P 8 -I{} node sighttrap.mjs {} 50 raw/tmp/st-$n.{}.json $m $st
node -e "const fs=require('fs');const fs2=fs.readdirSync('raw/tmp').filter(f=>f.startsWith('st-$n.'));const o={enc:[],races:[]};for(const f of fs2){const d=JSON.parse(fs.readFileSync('raw/tmp/'+f));o.enc.push(...d.enc);o.races.push(...d.races);fs.unlinkSync('raw/tmp/'+f);}fs.writeFileSync('raw/st-$n.json',JSON.stringify(o));console.log('$n',o.enc.length,o.races.length)"
