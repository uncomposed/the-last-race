import sys, os, statistics as st
sys.path.insert(0, os.getcwd())
import run, core
mod = run.load_variant("variants/h17_learn_automation.py")
VW = mod.VariantWorld
recs=[]
orig = VW.resolve_rnd
def patched(self):
    # record true no-boost gain and the variant's g_base
    info={}
    for l in self.live_labs():
        b,tr,sa,se=self.templates[l.template]; tot=tr+sa+se
        reg=self.gov_policy[l.bloc]["regulate"]; tK=l.K*tr/tot*(1-0.5*reg)
        x=max(0.0,l.C/self.cfg["C_AUTO"]-1)
        if tK>0 and x>0:
            c=self.cfg
            true_nob = c["train_k"]*tK**self.unk["scaling"]/max(1.0,l.C/15)**0.3
            gb = self.train_gain(l,tK,believed=True)/(1+0.3*x)
            info[l.name]=(true_nob,gb,self.auto_belief[l.name].mean(),x,l.C)
    front=self.frontier_deployed()
    orig(self)
    for n,(t,g,mu,x,C) in info.items():
        recs.append((self.unk["automation"],t,g,mu,x,front-C))
VW.resolve_rnd=patched
fin=[]
for s in range(60):
    w=run.build(mod,s).run()
    for n,b in w.auto_belief.items():
        fin.append((w.unk["automation"], b.mean()))
ratios=[g/t for a,t,g,mu,x,p in recs]
print("n",len(recs),"g_base/true_noboost: mean",round(st.mean(ratios),3),"min",round(min(ratios),3),"max",round(max(ratios),3))
pos=sum(1 for r in recs if r[5]>0); print("records where true deployed front > lab C (pull present):",pos)
hi=[(a,m) for a,m in fin if a>0.8]; lo=[(a,m) for a,m in fin if a<0.2]
print("final belief means, a>0.8:",round(st.mean(m for a,m in hi),3),"true",round(st.mean(a for a,m in hi),3))
print("final belief means, a<0.2:",round(st.mean(m for a,m in lo),3),"true",round(st.mean(a for a,m in lo),3))
