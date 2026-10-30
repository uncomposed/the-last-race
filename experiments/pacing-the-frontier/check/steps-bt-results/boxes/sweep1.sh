for m in peak chill; do
 node feasrun.mjs s1-base-$m cal '{}' '{}' $m &
 for v in 0 0.6 1.2; do node feasrun.mjs s1-floor$v-$m cal '{}' "{\"RISEFLOOR\":$v}" $m & done; wait
 for v in 1 2.2 3; do node feasrun.mjs s1-pow$v-$m cal '{}' "{\"RISEPOW\":$v}" $m & done
 for v in 0.85 0.9; do node feasrun.mjs s1-rmax$v-$m cal '{}' "{\"RISEMAX\":$v}" $m & done; wait
 for v in 45 75 90; do node feasrun.mjs s1-stepV$v-$m cal "{\"stepV\":$v}" '{}' $m & done
 for v in 85 120; do node feasrun.mjs s1-fit$v-$m cal "{\"stepFit\":$v}" '{}' $m & done; wait
 for v in 85 115; do node feasrun.mjs s1-rs$v-$m cal "{\"riseScale\":$v}" '{}' $m & done
 for v in 60 150; do node feasrun.mjs s1-stepW$v-$m cal "{\"stepW\":$v}" '{}' $m & done; wait
done
