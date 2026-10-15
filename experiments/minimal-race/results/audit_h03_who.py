import sys, importlib.util, collections
sys.path.insert(0, '.')
import core
spec = importlib.util.spec_from_file_location("v", "variants/h03_compute_rental.py"); v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
rank_b = collections.Counter(); rank_l = collections.Counter(); n=0; lend_cash=[]; bor_cash=[]
class W(v.VariantWorld):
    def rent_market(self):
        moves = super().rent_market()
        labs = sorted(self.live_labs(), key=lambda l: -l.C)
        r = {l.name: i for i, l in enumerate(labs)}
        for b in {m[1].name for m in moves}: rank_b[r[b]] += 1
        for l in {m[0].name for m in moves}: rank_l[r[l]] += 1
        return moves
for s in range(300):
    W(s).run()
print("borrower C-rank (0=leader):", sorted(rank_b.items()))
print("lender C-rank:", sorted(rank_l.items()))
