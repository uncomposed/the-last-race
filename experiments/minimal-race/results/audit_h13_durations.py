import sys, statistics as st
sys.path.insert(0, ".")
import run
def stats(mod):
    durs=[]; ends={"break":0,"expire":0,"open_at_end":0}; cat_pact=[]; cat_nopact=[]; forms=0
    for s in range(300):
        w=run.build(mod,s).run()
        ev=w.events; start=None
        for e in ev:
            if e["kind"]=="pact_form": start=e["t"]; forms+=1
            elif e["kind"] in ("pact_break","pact_expire") and start is not None:
                durs.append(e["t"]-start); ends["break" if e["kind"]=="pact_break" else "expire"]+=1; start=None
        if start is not None: durs.append(w.t-start); ends["open_at_end"]+=1
        cat = 1 if w.outcome["kind"].startswith("catastrophe") else 0
        (cat_pact if any(e["kind"]=="pact_form" for e in ev) else cat_nopact).append(cat)
    return dict(forms=forms, mean_dur=round(st.mean(durs),2) if durs else None, med_dur=st.median(durs) if durs else None,
                ends=ends, cat_given_pact=(round(st.mean(cat_pact),3), len(cat_pact)),
                cat_given_nopact=(round(st.mean(cat_nopact),3), len(cat_nopact)))
print("baseline", stats(None))
print("v2", stats(run.load_variant("variants/h13_frontier_coverage_pact_v2.py")))
