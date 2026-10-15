import os,sys,collections
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,ROOT)
import run
mod=run.load_variant(os.path.join(ROOT,"variants","h15_power_constraint.py"))
for name,m in (("base",None),("var",mod)):
    c=collections.Counter(); bindfrac=[]
    for s in range(300):
        w=run.build(m,s).run(); c[w.outcome.get("bloc")]+=1
        if m: bindfrac.append(len([e for e in w.events if e["kind"]=="power_bind" and e["bloc"]=="A"])/max(1,w.outcome["t"]))
    print(name,{k:v/300 for k,v in c.items()}, (sum(bindfrac)/len(bindfrac)) if bindfrac else "")
