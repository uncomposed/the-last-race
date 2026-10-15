import sys, importlib.util, statistics as st
sys.path.insert(0, '.')
import core
spec = importlib.util.spec_from_file_location('v', 'variants/h04_talent_market.py'); v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
names = list(core.ROLES)
peak = {n: [] for n in names}; mid = {n: [] for n in names}
inc_out, noinc_out = [], []
lc_v, lc_b = [], []
def leaders(w):
    out=[]
    for h in w.history:
        al=[n for n in names if h['alive'][n]]
        out.append(max(al, key=lambda n: h['C'][n]) if al else None)
    return sum(1 for a,b in zip(out,out[1:]) if a!=b)
for s in range(300):
    w = v.VariantWorld(s).run(); b = core.World(s).run()
    lc_v.append(leaders(w)); lc_b.append(leaders(b))
    for n in names:
        peak[n].append(max(h['talent'][n] for h in w.history))
        k = min(len(w.history)-1, 12); mid[n].append(w.history[k]['talent'][n])
    pub = {(e['t'], e['lab']) for e in w.events if e['kind']=='incident' and e['public']}
    for i in range(1, len(w.history)):
        for n in names:
            d = w.history[i]['talent'][n] - w.history[i-1]['talent'][n]
            if w.history[i]['alive'][n]:
                (inc_out if (i, n) in pub else noinc_out).append(d)
print('talent share at Q12 mean:', {n: round(st.mean(mid[n]),3) for n in names})
print('peak share mean:', {n: round(st.mean(peak[n]),3) for n in names})
print('dTalent quarter of public incident vs not:', round(st.mean(inc_out),4), len(inc_out), round(st.mean(noinc_out),4))
d=[a-b for a,b in zip(lc_v,lc_b)]
print('truth-C leader changes V,B,delta,se:', round(st.mean(lc_v),3), round(st.mean(lc_b),3), round(st.mean(d),3), round(st.stdev(d)/len(d)**.5,3))
