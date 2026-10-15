import sys, collections, statistics as st
sys.path.insert(0, '.')
import run, core, metrics
mod = run.load_variant('variants/h10_espionage_theft.py')
seeds = range(300)
# firing stats
cnt = collections.Counter(); seedsets = collections.defaultdict(set); thief=collections.Counter()
ec_pre = 0; det_n = 0; ec_by_theft = 0; gains=[]; safety_q = [0,0]
for s in seeds:
    w = run.build(mod, s).run()
    ec_t = min([e['t'] for e in w.events if e['kind']=='export_controls'] or [999])
    for e in w.events:
        k = e['kind']
        if k.startswith('theft'):
            cnt[k]+=1; seedsets[k].add(s)
        if k=='theft_attempt': thief[e['thief']]+=1
        if k=='theft_success': gains.append(e['C_after']-e['C_before'])
        if k=='theft_detected':
            det_n+=1; ec_pre += ec_t < e['t']
        if k=='export_controls' and e.get('reason')=='theft': ec_by_theft+=1
print({k:(v,len(seedsets[k])) for k,v in cnt.items()}, dict(thief))
print('detections with EC already on', ec_pre, '/', det_n, 'EC set by theft', ec_by_theft)
print('success C gain mean', round(st.mean(gains),3), 'zero-gain frac', round(sum(g<=1e-9 for g in gains)/len(gains),3))
