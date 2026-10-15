import statistics as st, core
class PublicFrontier(core.World):
    def frontier_deployed(self):
        import sys
        if sys._getframe(1).f_code.co_name == "internalize":
            b = [s.value for s in self._new_signals if s.kind == "bench"]
            return max(b) if b else super().frontier_deployed()
        return super().frontier_deployed()
class PrevAdoption(core.World):
    def adoption(self):
        import sys
        if sys._getframe(1).f_code.co_name == "internalize":
            self.t -= 1; a = super().adoption(); self.t += 1; return a
        return super().adoption()
for cls in (core.World, PublicFrontier, PrevAdoption):
    r = []; same = 0; ws = []
    for s in range(300):
        w = cls(s).run(); ws.append(w.outcome["kind"])
        r.append(st.median(B.demand.mean() / w.unk["demand"] for B in w.beliefs.values()))
    if cls is core.World: base = ws
    print(cls.__name__, "median demand belief/truth %.3f" % st.median(r), "outcome same as base: %d/300" % sum(a == b for a, b in zip(base, ws)))
