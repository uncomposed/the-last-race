import os,sys,math
H=os.path.dirname(os.path.abspath(__file__));R=os.path.dirname(H);sys.path.insert(0,R)
import run
mod=run.load_variant(os.path.join(R,"variants","h14_consolidation.py"))
d1=[];d2=[];d3=[];g0=[]
for s in range(300):
    w=run.build(mod,s).run(); b=run.build(None,s).run()
    f=lambda x:(x.outcome["bloc"]=="B", x.outcome["bloc"]=="B" and x.outcome["kind"]=="unipolar", x.outcome["kind"]=="unipolar")
    a,c=f(w),f(b); d1.append(a[0]-c[0]); d2.append(a[1]-c[1]); d3.append(a[2]-c[2])
    if s<3:
        B=b.beliefs["govB"]; g0.append(None)
def ms(d): m=sum(d)/len(d); return round(m,4), round(math.sqrt(sum((x-m)**2 for x in d)/(len(d)-1)/len(d)),4)
print("Bwin",ms(d1),"Bunipolar",ms(d2),"unipolar any",ms(d3))
