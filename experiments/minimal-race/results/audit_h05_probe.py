import os,sys,statistics as st
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,ROOT)
import run
mod=run.load_variant(os.path.join(ROOT,"variants","h05_leverage_bubble.py"))
callseeds=[];bk_b=bk_v=0;bk_after_call=0;maxdebt=[];minsent=[];borrow_q=[]
for s in range(300):
    b=run.build(None,s).run(); v=run.build(mod,s).run()
    bb=sum(e["kind"]=="bankrupt" for e in b.events); vb=sum(e["kind"]=="bankrupt" for e in v.events)
    bk_b+=bb;bk_v+=vb
    calls=[e for e in v.events if e["kind"]=="debt_call"]
    if calls:
        callseeds.append((s,len(calls),bb,vb,round(v.unk["demand"],2),b.outcome["kind"],v.outcome["kind"]))
        labs={e["lab"] for e in calls}
        if any(e["kind"]=="bankrupt" and e["lab"] in labs for e in v.events): bk_after_call+=1
    bq=[e["t"] for e in v.events if e["kind"]=="borrow"]
    borrow_q+=bq
    minsent.append(min(h["sentiment"] for h in b.history))
print("bankrupt events base/var",bk_b,bk_v)
print("call seeds",len(callseeds),"called lab later bankrupt",bk_after_call)
for c in callseeds: print(c)
print("borrow quarter quantiles",st.quantiles(borrow_q,n=10))
print("share seeds base min sentiment<0.8",sum(m<0.8 for m in minsent)/300)
