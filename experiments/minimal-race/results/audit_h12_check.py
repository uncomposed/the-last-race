import os,sys
sys.path.insert(0,os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import run
mod=run.load_variant("variants/h12_intergov_treaty.py")
active_end=0; defect_in_treaty=0; defect_other=0; ends=0; forms=0; exits=0; preempt_possible=0
for s in range(300):
    w=run.build(mod,s).run()
    forms+=sum(e["kind"]=="treaty_form" for e in w.events)
    exits+=sum(e["kind"]=="treaty_exit" for e in w.events)
    if w.treaty: active_end+=1
    tq=set()
    cur=None
    for e in w.events:
        if e["kind"]=="treaty_form": cur=e["t"]
        if e["kind"]=="treaty_exit": tq|=set(range(cur,e["t"])); cur=None
    if cur is not None: tq|=set(range(cur,w.t+1))
    for e in w.events:
        if e["kind"]=="defect":
            if e["t"] in tq: defect_in_treaty+=1
            else: defect_other+=1
print("forms",forms,"exits",exits,"treaty active at end",active_end)
print("defect events in treaty quarters",defect_in_treaty,"outside",defect_other)
