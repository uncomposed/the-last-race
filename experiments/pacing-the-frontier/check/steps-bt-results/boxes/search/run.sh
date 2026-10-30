#!/bin/zsh
# lesson-seed search, held-out seeds (daily offsets 400-599). prop: proposed generator + step-day twists; cur: shipped generator and twists
cd "${0:A:h}/.."
export PF_PAGE=$PWD/proto-patched.html
PT='{"Wider Gaps":{"gapScale":110},"Wider Singularity":{"singGap":115},"Rivals Copy You More":{"shareRiv":80}}'
for k in barrier strike race gap shadow singularity; do
  STEPTW=$PT node lesson.mjs search $k 400 200 search/prop-$k.json '{"stepW":110}' '{"BOXU":0.25}' u25 > search/prop-$k.log 2>&1 &
  node lesson.mjs search $k 400 200 search/cur-$k.json '{"stepFit":103}' '{"BOXFIT":0}' peak > search/cur-$k.log 2>&1 &
  if [[ $k == strike || $k == shadow ]]; then wait; fi
done
wait
