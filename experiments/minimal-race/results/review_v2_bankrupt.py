import collections, core
tpl = collections.Counter(); bt = collections.Counter(); kk = []
for s in range(300):
    w = core.World(s).run()
    for e in w.events:
        if e["kind"] == "bankrupt":
            n = e["lab"]; bt[n] += 1
            hs = [h for h in w.history if e["t"] - 4 <= h["t"] < e["t"]]
            for h in hs: tpl[h["template"][n]] += 1
            h0 = w.history[e["t"] - 1] if e["t"] >= 1 else w.history[0]
            kk.append((n, h0["K"][n], h0["cash"][n]))
print("bankrupt by lab", dict(bt)); print("templates in 4q before bankruptcy", tpl.most_common())
import statistics as st
print("median K, cash the quarter before:", st.median(k for _, k, _ in kk), st.median(c for *_, c in kk))
