import sys; sys.path.insert(0,'.')
import run
seeds=range(300); base=run.run_many(None,seeds)
def sh(rows,k): return round(sum(1 for r in rows if (r['outcome'] or '')==k)/len(rows),3)
for n in ['noboost','nosteal','flatodds']:
    rows=run.run_many(run.load_variant(f'results/audit_h10_v_{n}.py'),seeds)
    pd=run.paired_deltas(base,rows)
    sig={k:(v['mean'],v['se']) for k,v in pd.items() if isinstance(v,dict) and abs(v['mean'])>2*v['se']}
    print(n,'unipolar',sh(rows,'unipolar'),'multi',sh(rows,'multipolar'),'cat',pd['catastrophe_rate'],'lc',pd['lead_changes'],'same',pd['same_outcome_share'])
    print('  sig',sig)
