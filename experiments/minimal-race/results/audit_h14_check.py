import os,sys,collections
H=os.path.dirname(os.path.abspath(__file__));R=os.path.dirname(H);sys.path.insert(0,R)
import run
mod=run.load_variant(os.path.join(R,"variants","h14_consolidation.py"))
into=collections.Counter();gaps=[];hzs=[];bw=collections.Counter();bb=collections.Counter();bloc_uni=collections.Counter()
for s in range(300):
    w=run.build(mod,s).run(); b=run.build(None,s).run() if hasattr(run,'build') else None
    for e in w.events:
        if e["kind"]=="consolidate": into[e["into"]]+=1;gaps.append(e["gap"]);hzs.append(e["hazard"])
    bw[w.outcome["bloc"]]+=1; bb[b.outcome["bloc"]]+=1
    for ww,tag in ((w,"v"),(b,"b")):
        if ww.outcome["kind"]=="unipolar": bloc_uni[(tag,ww.outcome["bloc"])]+=1
print("into",into);print("gap<-1 share",sum(g< -1 for g in gaps)/len(gaps),"hz>.5 share",sum(h>.5 for h in hzs)/len(hzs))
print("median gap",sorted(gaps)[len(gaps)//2],"median hz",sorted(hzs)[len(hzs)//2])
print("winner bloc var",bw,"base",bb);print("unipolar by bloc",bloc_uni)
