"""Trace truth reads (other labs' hidden state, self.unk, frontier_deployed) inside decision functions."""
import sys, collections, core
HIDDEN = {"C","S","K","cash","pipeline","deployed_C","revenue","train_frac","_serveK","capex","raised_ema","safety_gain","rep"}
DECISION = {"score_template","join_value","maybe_open_weights","government_decide","maybe_consolidate",
            "covert_ops","labs_decide","believed_bloc_best","believed_exposure","diplomacy","internalize",
            "softmax_pick","hz_frac","train_gain","capital_market","accounting"}
hits = collections.Counter()
orig = core.Lab.__getattribute__
def ga(self, attr):
    if attr in HIDDEN:
        f = sys._getframe(1)
        if f.f_code.co_name in DECISION or (f.f_back and f.f_back.f_code.co_name in DECISION and f.f_code.co_name=="<lambda>"):
            fn = f.f_code.co_name; ln = f.f_lineno
            if fn == "<lambda>": fn, ln = f.f_back.f_code.co_name + "/lambda", ln
            # who is deciding? look for local 'lab' or 'who' in caller frames
            loc = f.f_locals
            dec = None
            for fr in (f, f.f_back):
                if fr is None: continue
                if "lab" in fr.f_locals and isinstance(fr.f_locals["lab"], core.Lab): dec = fr.f_locals["lab"].name; break
                if "who" in fr.f_locals: dec = fr.f_locals["who"]; break
            name = orig(self, "name")
            rel = "self" if dec == name else "other"
            hits[(fn, ln, attr, rel)] += 1
    return orig(self, attr)
core.Lab.__getattribute__ = ga
class UD(dict):
    def __getitem__(self, k):
        f = sys._getframe(1); hits[(f.f_code.co_name, f.f_lineno, "unk:"+k, "-")] += 1
        return dict.__getitem__(self, k)
    def get(self, k, d=None):
        f = sys._getframe(1); hits[(f.f_code.co_name, f.f_lineno, "unk:"+k, "-")] += 1
        return dict.get(self, k, d)
of = core.World.frontier_deployed
def fd(self):
    f = sys._getframe(1); hits[(f.f_code.co_name, f.f_lineno, "frontier_deployed()", "-")] += 1
    return of(self)
core.World.frontier_deployed = fd
for s in range(60):
    w = core.World(s); w.unk = UD(w.unk); w.run()
for k, v in sorted(hits.items(), key=lambda kv: (kv[0][0], kv[0][1])):
    print(*k, v)
