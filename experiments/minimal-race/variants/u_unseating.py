"""Round 3: five ways the frontier lab can be unseated.

Core v2 makes the frontier lab hard to dislodge partly because almost every
shock is bloc-wide (regulation, subsidies, export controls, sentiment), which
preserves the order inside a bloc, and because a lab can only die by
bankruptcy or a merger. These mechanisms add lab-specific shocks and let
actors try to cause them. Each is switchable in cfg["mech"]:

  supply_shock       A leading-edge chip or memory chokepoint fails (natural
                     accident, or a bloc-B blockade). Bloc-A supply is cut for
                     4-12 quarters and recovers over 8. Bloc B mostly runs on
                     domestic, older-node chips, so under export controls it is
                     barely exposed. Inside bloc A, the incumbent has priority
                     allocation from long-term contracts. A blockade is always
                     attributed: sanctions cut bloc B's capital access and bloc
                     A's hostility rises (turnabout).
  targeted_scrutiny  Public incidents raise scrutiny of the lab that caused
                     them. Investors discount scrutinized labs, protests target
                     them, and a government can impose a lab-specific consent
                     decree (training cut) unless it is protecting a national
                     champion in a close race.
  seizure            A public near miss (severe incident at a capable lab) can
                     lead its government to nationalize the lab (keeps the
                     capacity under state control, preferred when the race is
                     believed close) or dissolve it (staff and compute scatter
                     to domestic rivals, preferred when comfortably ahead).
  governance         Staff tension builds when a lab trains hard on a large
                     unsafety gap while staff fear the hazard (staff do not
                     share leadership's motivated discount). A crisis is either
                     an exodus (talent moves to the most safety-minded domestic
                     lab, and staff may blow the whistle on private incidents)
                     or a board ouster (investor shock, leadership turns
                     cautious).
  king               Labs that believe the leader is about to win try to bring
                     it down: leak its private incidents, lobby their
                     government for a decree on it, or poach its staff. A
                     detected leak or lobbying campaign backfires on the
                     attacker, worse if the attack also failed, and gives the
                     victim licence to retaliate (a decaying feud).

Known simplifications (from the round-3 audit): a run has at most one supply
shock, so an early accident rules out a later blockade; during a shock labs
keep the cash for chips they cannot get, so the shock defers spending rather
than destroying money.

UNSEAT_ONLY=a,b turns on only those mechanisms; UNSEAT_OFF=a turns one off.
With all five off this variant reproduces the core exactly.

Truth, observation and belief stay separate: government and lab decisions
read beliefs, public state (scrutiny, public anger, a public supply shock)
and the deciding lab's own state. World mechanics read truth (whether private
incidents exist to leak, the public's hidden sensitivity).

Pre-registered predictions (written before any run, 16 October 2026):
  P1 supply_shock: bloc-B takeoff wins rise. The frontier's share of bloc-A
     wins barely moves (a bloc-wide cut preserves order inside the bloc);
     the incumbent gains a little through priority allocation.
     Wrong if the frontier's share of bloc-A wins falls by more than 5 points.
  P2 targeted_scrutiny: frontier wins fall (it has the largest unsafety gap,
     so the most incidents), but national-champion protection blunts it.
     Catastrophe falls slightly. Wrong if frontier wins do not fall.
  P3 seizure: fires in under 15% of runs; nationalization is more common than
     dissolution because governments usually believe the race is close.
  P4 governance: crises concentrate at the frontier lab; safety-lab wins rise.
     Wrong if the frontier is not the lab with the most crises.
  P5 king: the incumbent attacks most; most attacks go undetected; lead
     changes rise; frontier wins fall a few points.
  All five: frontier wins fall from about 40% to 25-30%; catastrophe roughly
     flat. Wrong if frontier wins stay above 35%.

Parameters are synthetic. Fire rates were calibrated on 300 seeds before any
outcome was examined, against these judgment-call anchors for a ten-year run:
a blockade in about 10% of runs (a war-level event); a natural chokepoint
failure in roughly 10-20%; about one to two lab-specific decrees per run
(Italy's 2023 ChatGPT suspension is the kind of precedent); seizure of a lab
in about 10% of runs (no precedent); a governance crisis at the frontier lab
in about half of runs (OpenAI saw a 2020-21 split and a 2023 board crisis
within four years); about three hostile moves per run. First-pass settings
fired 2-5 times more often and were cut. Because seizure was calibrated to
about 10%, the fire-rate half of P3 is not a test; its nationalize-versus-
dissolve half still is.

After the audit (16 October 2026) staff fear became a separate, undiscounted
hazard belief instead of a multiplier on leadership's, and the tension
threshold was recalibrated on seeds 0-299 to keep a frontier-lab crisis in
under half of runs (44%). Headline results use held-out seeds 1000-1999.
"""
import math
import os

import core

UNSEAT = ("supply_shock", "targeted_scrutiny", "seizure", "governance", "king")

U = dict(
    # 1. supply shock
    shock_depth=(0.4, 0.85),        # share of bloc-A leading-edge supply lost
    blockade_depth=(0.6, 0.95),
    shock_len=(4, 12),              # quarters at full depth
    shock_recover=8,                # quarters to recover linearly afterwards
    a_exposure=dict(frontier=1.0, safety=1.0, incumbent=0.6),
    b_dependence_controls=0.2,      # bloc B's leading-edge dependence under export controls
    b_dependence_open=0.8,
    pipeline_loss=0.6,              # share of exposed in-transit orders lost x depth
    shock_sentiment=0.85,
    blockade_reach=0.75,            # believed bloc-A projection (x C_STAR) that prompts a blockade
    blockade_try=0.02,
    blockade_sanction=0.3,          # bloc-B capital access multiplier while a blockade lasts
    # 2. targeted scrutiny
    scrutiny_k=0.5,                 # scrutiny per unit severity x public sensitivity
    scrutiny_decay=0.2,
    investor_scrutiny=0.5,          # valuation x exp(-k * scrutiny)
    decree_threshold=2.0,
    decree_len=4,
    decree_cut=0.5,                 # training compute multiplier is 1 - cut
    # 3. seizure
    nearmiss_sev=3.0,               # severity (exponential units) that counts as a near miss
    nearmiss_C=0.5,                 # ... at capability >= this x C_STAR
    seize_threshold=3.5,
    seize_keep_gap=3.0,             # believed lead below which a government nationalizes rather than dissolves
    nat_budget=0.6,                 # state funding per quarter for a nationalized lab
    # 4. governance
    tension_decay=0.8,
    tension_k=1.0,
    tension_threshold=0.8,
    crisis_p=0.12,
    crisis_cooldown=6,
    exodus_len=6,
    exodus_cut=0.7,
    exodus_boost=1.15,
    ouster_val=0.4,
    # 5. king
    king_gap=1.5,                   # believed deficit to the leader that motivates an attack
    king_reach=0.6,                 # leader's believed projection (x C_STAR) that makes it urgent
    king_try=dict(frontier=0.1, safety=0.05, incumbent=0.12, challenger=0.1, state=0.1),
    king_detect=dict(leak=0.35, lobby=0.5, poach=0.6),
    feud_bonus=1.0,
    feud_decay=0.8,
    turnabout_scrutiny=0.8,
    turnabout_val=0.6,
    leak_window=8,                  # quarters of private incidents that can be dug up
)


def make_config(base, only=None, off=()):
    if only is None:
        env = os.environ.get("UNSEAT_ONLY")
        only = set(env.split(",")) if env else set(UNSEAT)
    off = set(off) | set(filter(None, os.environ.get("UNSEAT_OFF", "").split(",")))
    for m in UNSEAT:
        base["cfg"]["mech"][m] = m in only and m not in off
    base["cfg"]["unknowns"]["chokepoint_hazard"] = (0.002, 0.02)   # natural shock chance per quarter
    base["cfg"]["u"] = dict(U)
    return base


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.U = self.cfg.get("u", U)
        for m in UNSEAT:
            self.mech.setdefault(m, False)
        for l in self.labs.values():
            l.scrutiny = 0.0
            l.effects = []            # [(until_t, train-compute multiplier, tag)]
            l.val_effects = []        # [(until_t, valuation multiplier, tag)]
            l.private_incidents = []  # [(t, sev)] not yet public
            l.nationalized = False
            l.tension = 0.0
            l.crisis_cd = 0
            l.king_cd = 0
            l.feud = {}               # attacker name -> licence to retaliate
            l.fate = None
        self.shock = None
        self.near_misses = []
        self.pending_leaks = []
        # Staff of each lab: same prior and evidence as leadership, no motivated discount.
        hz = self.cfg["unknowns"]["hazard"]
        self.staff = {n: core.GridBelief(hz[0], hz[1], self.cfg["grid"], r["hazard_prior"])
                      for n, r in self.roles.items()}

    # ---------------- helpers ----------------
    def _active(self, effects):
        return [e for e in effects if e[0] > self.t]

    def tmult(self, lab):
        m = 1.0
        for until, x, _ in getattr(lab, "effects", ()):
            if until > self.t:
                m *= x
        return m

    def val_mult(self, lab):
        if getattr(lab, "nationalized", False):
            return 0.0
        m = 1.0
        if self.mech["targeted_scrutiny"] and lab.scrutiny > 0:
            m *= math.exp(-self.U["investor_scrutiny"] * lab.scrutiny)
        for until, x, _ in lab.val_effects:
            if until > self.t:
                m *= x
        if lab.bloc == "B" and self.shock and self.shock["cause"] == "blockade" and self.a_cut() > 0:
            m *= self.U["blockade_sanction"]
        return m

    def domestic(self, bloc, exclude=None):
        return [l for l in self.live_labs() if l.bloc == bloc and l is not exclude]

    def gov_gap(self, b):
        who = f"gov{b}"
        other = [x for x in self.govs_conf if x != b][0]
        return self.believed_bloc_best(who, b) - self.believed_bloc_best(who, other)

    # ---------------- training multipliers (decrees, exodus, poaching) ----------------
    def train_gain(self, lab, train_K, believed=False):
        return super().train_gain(lab, train_K * self.tmult(lab), believed)

    # ---------------- 1. supply shock ----------------
    def a_cut(self):
        s = self.shock
        if not s or self.t < s["start"]:
            return 0.0
        if self.t < s["end"]:
            return s["depth"]
        return max(0.0, s["depth"] * (1 - (self.t - s["end"]) / self.U["shock_recover"]))

    def exposure(self, l):
        if l.bloc == "A":
            return self.U["a_exposure"].get(l.name, 1.0)
        return self.U["b_dependence_controls"] if self.export_controls else self.U["b_dependence_open"]

    def start_shock(self, cause, depth_rng):
        lo, hi = depth_rng
        depth = lo + (hi - lo) * self.u("shock_depth", cause)
        a, b = self.U["shock_len"]
        length = a + int((b - a + 1) * self.u("shock_len", cause))
        self.shock = dict(start=self.t, end=self.t + length, depth=depth, cause=cause)
        for l in self.live_labs():
            cut = self.exposure(l) * depth * self.U["pipeline_loss"]
            l.pipeline = [(ta, units * (1 - cut)) for (ta, units) in l.pipeline]
        self.sentiment *= self.U["shock_sentiment"]
        self.log("supply_shock", cause=cause, depth=round(depth, 3), length=length)

    def compute_market(self):
        if not self.mech["supply_shock"]:
            return super().compute_market()
        if self.shock is None and self.u("chokepoint", self.t) < self.unk["chokepoint_hazard"]:
            self.start_shock("accident", self.U["shock_depth"])
        cut_a = self.a_cut()
        if cut_a <= 0:
            return super().compute_market()
        c = self.cfg
        supply = c["chip_supply0"] * (1 + c["chip_supply_growth"]) ** self.t
        orders = {}
        for l in self.live_labs():
            build = self.templates[l.template][0]
            spend = build * max(0.0, l.cash) * 0.5
            if l.bloc == "B" and self.export_controls:
                spend *= 0.6
            orders[l.name] = spend
        total_spend = sum(orders.values())
        base_cost = c["chip_price0"] * supply
        price = c["chip_price0"] * max(1.0, total_spend / max(1e-6, base_cost)) ** 0.7
        for l in self.live_labs():
            cut = min(0.95, self.exposure(l) * cut_a)
            spend = orders[l.name] * (1 - cut)          # chips that do not exist cannot be bought
            price_l = price / (1 - cut) ** 0.5           # scarcity premium for exposed buyers
            units = spend / price_l
            if l.bloc == "B" and self.export_controls:
                units *= 0.7
            l.cash -= spend
            l.capex = spend
            if units > 0:
                l.pipeline.append((self.t + c["compute_lag"], units))
        # The public price is the one a fully exposed bloc-A buyer faces.
        self.chip_price = price / (1 - min(0.95, cut_a)) ** 0.5

    def maybe_blockade(self):
        """Bloc B's government blockades the chokepoint when it believes bloc A
        is close to takeoff and B is behind. It is always attributed."""
        if "B" not in self.govs_conf or self.shock is not None:
            return
        c, g = self.cfg, self.govs_conf["B"]
        reach = self.believed_bloc_best("govB", "A", proj=c["horizon"])
        if reach < self.U["blockade_reach"] * c["C_STAR"] or self.gov_gap("B") >= -1.0:
            return
        p = self.U["blockade_try"] * g["aggression"] * (1 + 0.5 * self.hostility["B"])
        if self.u("blockade", self.t) < min(0.9, p):
            self.start_shock("blockade", self.U["blockade_depth"])
            self.hostility["A"] += 2.0
            if not self.export_controls:
                self.export_controls = True
                self.log("export_controls", gov="A", trigger="blockade")

    # ---------------- 2. targeted scrutiny ----------------
    def on_public_incident(self, l, sev, source):
        if self.mech["targeted_scrutiny"]:
            l.scrutiny += self.U["scrutiny_k"] * sev * self.unk["sensitivity"]
        if (self.mech["seizure"] and sev >= self.U["nearmiss_sev"]
                and l.C >= self.U["nearmiss_C"] * self.cfg["C_STAR"] and not l.nationalized):
            self.near_misses.append((l.name, sev))
            self.log("near_miss", lab=l.name, sev=round(sev, 2), source=source)

    def incidents(self):
        n0 = len(self.events)
        super().incidents()
        for e in self.events[n0:]:
            if e["kind"] != "incident":
                continue
            l = self.labs[e["lab"]]
            if e["public"]:
                self.on_public_incident(l, e["sev"], "incident")
            else:
                l.private_incidents.append((self.t, e["sev"]))

    def leak_private(self, l, source):
        """Make a lab's recent private incidents public. Returns how many."""
        recent = [(t, s) for (t, s) in l.private_incidents if self.t - t <= self.U["leak_window"]]
        l.private_incidents = []
        sens = self.unk["sensitivity"]
        for _, sev in recent:
            self.on_public_incident(l, sev, source)
            self.public[l.bloc] += sens * 0.5
            l.rep *= 0.9
            self.pending_leaks.append((l.name, sev))
        if recent:
            self.sentiment *= 0.95
            self.log("leak", lab=l.name, n=len(recent), source=source)
        return len(recent)

    def observe(self):
        super().observe()
        if self.t == 0:
            return
        for name, sev in self.pending_leaks:
            others = tuple(n for n in self.beliefs if n != name)   # the lab already knew
            s = core.Signal(self.t, "incident", name, sev, public=False, observers=others)
            self.signals.append(s)
            self._new_signals.append(s)
        self.pending_leaks = []

    def internalize(self):
        super().internalize()
        if self.t == 0 or not self.mech["governance"]:
            return
        for l in self.live_labs():
            n = sum(1 for s in self._new_signals if s.kind == "incident"
                    and (s.public or l.name in s.observers))
            e_own, e_other = self.believed_exposure(l.name, split=True)

            def ll(h, n=n, eo=e_own, ex=e_other, d=self.believed_detect):
                lam = max(1e-6, h * (eo + d * ex))
                return n * math.log(lam) - lam
            self.staff[l.name].update(ll, self.beliefs[l.name].receptivity)

    def decrees(self):
        for b, g in self.govs_conf.items():
            who = f"gov{b}"
            B = self.beliefs[who]
            dom = self.domestic(b)
            if not dom:
                continue
            gap = self.gov_gap(b)
            champion = max(dom, key=lambda l: B.cap[l.name].mu)
            hz = self.hz_frac(who)
            for l in dom:
                if l.scrutiny < 0.3 or any(t == "decree" for _, _, t in self._active(l.effects)):
                    continue
                protect = g["w"]["nation"] * max(0.0, 2.0 - gap) / 2.0 if l is champion else 0.0
                s = l.scrutiny + 0.5 * g["w"]["public"] * self.public[b] + g["w"]["safety"] * hz - protect
                if s > self.U["decree_threshold"]:
                    l.effects.append((self.t + self.U["decree_len"], 1 - self.U["decree_cut"], "decree"))
                    self.log("decree", gov=b, lab=l.name, scrutiny=round(l.scrutiny, 2),
                             protected=round(protect, 2))

    def public_opinion(self):
        if not self.mech["targeted_scrutiny"]:
            return super().public_opinion()
        c = self.cfg
        sens = self.unk["sensitivity"]
        disp = c["displacement"] * self.adoption() * self.frontier_deployed() / 10.0
        now = [e for e in self.events if e["kind"] == "incident" and e["t"] == self.t and e["public"]]
        for b in self.public:
            n_local = sum(1 for i in now if i["bloc"] == b)
            n_global = len(now)
            self.public[b] += sens * (0.5 * n_local + 0.15 * n_global + disp)
            self.public[b] *= (1 - c["public_decay"])
            mult = self.govs_conf[b]["protest_mult"]
            excess = self.public[b] - c["protest_threshold"]
            if excess > 0 and self.u("protest", self.t, b) < min(0.8, 0.3 * excess * mult):
                targets = sorted((l for l in self.live_labs() if l.bloc == b), key=lambda l: l.name)
                if targets:
                    # Protesters go where the scandal is.
                    wts = [0.5 + l.scrutiny for l in targets]
                    r = self.u("protest_target", self.t, b) * sum(wts)
                    l = targets[-1]
                    for cand, wt in zip(targets, wts):
                        r -= wt
                        if r <= 0:
                            l = cand
                            break
                    lost = l.K * c["protest_damage"]
                    l.K -= lost
                    self.log("disruption", bloc=b, lab=l.name, lost=round(lost, 2))

    # ---------------- 3. seizure ----------------
    def seizures(self):
        pending, self.near_misses = self.near_misses, []
        for name, sev in pending:
            l = self.labs[name]
            if not l.alive or l.nationalized:
                continue
            b = l.bloc
            g = self.govs_conf[b]
            who = f"gov{b}"
            s = (2.0 * g["w"]["safety"] * self.hz_frac(who) + g["w"]["public"] * self.public[b]
                 + 0.2 * sev + 0.2 * l.scrutiny)
            if s < self.U["seize_threshold"]:
                self.log("seize_declined", gov=b, lab=name, score=round(s, 2))
                continue
            rivals = self.domestic(b, exclude=l)
            if self.gov_gap(b) < self.U["seize_keep_gap"] or not rivals:
                self.nationalize(l)
            else:
                self.dissolve(l, rivals)

    def nationalize(self, l):
        r = dict(self.roles[l.role])
        r["w"] = dict(lead=0.5, profit=0.1, safety=0.8, nation=1.0)
        r["self_discount"] = 0.1
        r["publish_safety"] = 0.5
        r["open_bias"] = -2.0
        l.base_role = l.role
        key = f"{l.name}_nationalized"
        self.roles[key] = r
        l.role = key
        l.nationalized = True
        l.fate = "nationalized"
        self.beliefs[l.name].self_discount = 0.1
        l.effects.append((self.t + 4, 0.5, "safety_review"))
        self.log("nationalize", gov=l.bloc, lab=l.name)

    def dissolve(self, l, rivals):
        share = 0.6 * l.K / len(rivals)
        for r in rivals:
            r.K += share
            # Staff scatter: the know-how transfer is split, not copied to every rival.
            r.C += 0.5 * max(0.0, l.C - r.C) / len(rivals)
            r.S += 0.5 * max(0.0, l.S - r.S) / len(rivals)
        l.alive = False
        l.fate = "dissolved"
        self.log("dissolve", gov=l.bloc, lab=l.name, to=sorted(r.name for r in rivals))

    def government_decide(self):
        super().government_decide()
        if self.mech["targeted_scrutiny"]:
            self.decrees()
        if self.mech["seizure"]:
            self.seizures()

    def capital_market(self):
        c = self.cfg
        labs = self.live_labs()
        if not labs:
            return
        obs = {}
        for l in labs:
            recent = [v for (_, v) in self.bench_hist[l.name][-4:]]
            if len(recent) >= 2:
                obs[l.name] = (recent[-1], recent[-1] - recent[0])
            else:
                obs[l.name] = (l.deployed_C, 0.3)
        top = max(v[0] for v in obs.values())
        pool = c["investor_base"] * self.sentiment * (1 + 0.05 * self.t)
        vals = {}
        for l in labs:
            lvl, mom = obs[l.name]
            v = (max(0.1, lvl) / max(1e-6, top)) ** 2 * math.exp(0.5 * max(-1.0, min(4.0, mom)))
            if l.open_weights:
                v *= 1.15
            if l.bloc == "B":
                v *= c["bloc_b_market_access"]
            vm = self.val_mult(l)
            if vm != 1.0:
                v *= vm
            vals[l.name] = v
        z = sum(vals.values())
        for l in labs:
            r = pool * vals[l.name] / z if z > 0 else 0.0
            l.cash += r
            l.raised = r
            l.raised_ema = 0.6 * l.raised_ema + 0.4 * r
            l.cash += l.ext
            sub = self.gov_policy[l.bloc]["subsidy"]
            if sub > 0:
                l.cash += sub * (1.2 if getattr(l, "base_role", l.role) == "state" else 0.5)
            if l.nationalized:
                l.cash += self.U["nat_budget"]

    # ---------------- 4. governance ----------------
    def governance(self):
        U_ = self.U
        hz_hi = self.cfg["unknowns"]["hazard"][1]
        for l in sorted(self.live_labs(), key=lambda x: x.name):
            if l.crisis_cd > 0:
                l.crisis_cd -= 1
            B = self.beliefs[l.name]
            staff_fear = self.staff[l.name].mean() / hz_hi
            gap = max(0.0, l.C - l.S) / 10.0
            own_sev = sum(e["sev"] for e in self.events
                          if e["t"] == self.t and e["kind"] == "incident" and e["lab"] == l.name)
            push = U_["tension_k"] * (staff_fear * gap * l.train_frac + 0.3 * own_sev)
            l.tension = U_["tension_decay"] * l.tension + push
            excess = l.tension - U_["tension_threshold"]
            if excess <= 0 or l.crisis_cd > 0:
                continue
            if self.u("crisis", self.t, l.name) >= min(0.8, U_["crisis_p"] * excess):
                continue
            l.tension = 0.0
            l.crisis_cd = U_["crisis_cooldown"]
            if self.u("crisis_kind", self.t, l.name) < 0.5:
                l.effects.append((self.t + U_["exodus_len"], U_["exodus_cut"], "exodus"))
                dest = [x for x in self.domestic(l.bloc, exclude=l)]
                to = None
                if dest:
                    to = max(dest, key=lambda x: (self.roles[x.role]["w"]["safety"], x.name))
                    to.effects.append((self.t + U_["exodus_len"], U_["exodus_boost"], "hires"))
                    to.S += 0.5
                self.log("crisis", lab=l.name, how="exodus", to=to.name if to else None)
                if self.u("whistle", self.t, l.name) < 0.5:
                    self.leak_private(l, "whistleblower")
            else:
                l.val_effects.append((self.t + 2, U_["ouster_val"], "ouster"))
                l.template = "safety"
                B.self_discount *= 0.5
                self.log("crisis", lab=l.name, how="ouster")

    # ---------------- 5. going for the king ----------------
    def king(self):
        U_, c = self.U, self.cfg
        H = c["horizon"]
        for l in self.live_labs():
            l.feud = {k: v * U_["feud_decay"] for k, v in l.feud.items() if v * U_["feud_decay"] > 0.05}
        for att in sorted(self.live_labs(), key=lambda x: x.name):
            if att.king_cd > 0:
                att.king_cd -= 1
                continue
            B = self.beliefs[att.name]
            est = {n: B.cap[n] for n in B.cap if self.labs[n].alive}
            if not est:
                continue
            feud_tgt = max(att.feud, key=lambda n: (att.feud[n], n)) if att.feud else None
            if feud_tgt and not self.labs[feud_tgt].alive:
                feud_tgt = None
            lead = max(est, key=lambda n: est[n].mu)
            motive = (est[lead].mu - att.C > U_["king_gap"]
                      and est[lead].mu + H * est[lead].growth >= U_["king_reach"] * c["C_STAR"])
            if feud_tgt:
                tgt, feud = feud_tgt, att.feud[feud_tgt]
            elif motive:
                tgt, feud = lead, 0.0
            else:
                continue
            p = U_["king_try"].get(att.name, 0.2) * (1 + U_["feud_bonus"] * feud)
            if self.u("king_try", self.t, att.name) >= min(0.9, p):
                continue
            self.attack(att, self.labs[tgt], retaliation=feud > 0)
            att.king_cd = 2

    def attack(self, att, tgt, retaliation):
        U_ = self.U
        same = att.bloc == tgt.bloc
        if att.name == "safety":
            kinds = ["leak"]                     # it only exposes true incidents
        elif same:
            kinds = ["leak", "lobby", "poach"]
        else:
            kinds = ["leak", "poach"]
        kind = kinds[int(self.u("king_kind", self.t, att.name) * len(kinds))]
        ok = False
        if kind == "leak":
            has = any(self.t - t <= U_["leak_window"] for t, _ in tgt.private_incidents)
            if has and self.u("king_find", self.t, att.name) < 0.7:
                ok = self.leak_private(tgt, f"leak:{att.name}") > 0
        elif kind == "lobby":
            p = min(0.8, 0.3 * (1 + att.ext) * (0.5 + self.public[tgt.bloc]))
            if self.u("king_lobby", self.t, att.name) < p:
                tgt.effects.append((self.t + 3, 0.7, "lobby_decree"))
                ok = True
        else:
            p = 0.6 if same else 0.25
            att.cash -= 0.3
            if self.u("king_poach", self.t, att.name) < p:
                tgt.effects.append((self.t + 4, 0.88, "poached"))
                att.effects.append((self.t + 4, 1.08, "poached_in"))
                ok = True
        detected = self.u("king_seen", self.t, att.name) < U_["king_detect"][kind]
        self.log("king_attack", lab=att.name, target=tgt.name, how=kind, ok=ok,
                 detected=detected, retaliation=retaliation)
        if detected:
            tgt.feud[att.name] = tgt.feud.get(att.name, 0.0) + 1.0
            if kind in ("leak", "lobby"):
                missed = 2.0 if not ok else 1.0
                if self.mech["targeted_scrutiny"]:
                    att.scrutiny += U_["turnabout_scrutiny"] * missed
                att.val_effects.append((self.t + 2, U_["turnabout_val"] ** missed, "turnabout"))
                att.rep *= 0.95 ** missed

    def covert_ops(self):
        super().covert_ops()
        if self.mech["supply_shock"]:
            self.maybe_blockade()
        if self.mech["king"]:
            self.king()

    # ---------------- end of quarter ----------------
    def accounting(self):
        before = {l.name for l in self.live_labs()}
        super().accounting()
        for name in before:
            l = self.labs[name]
            if not l.alive and l.fate in (None, "nationalized"):
                l.fate = "bankrupt"
        if self.mech["governance"]:
            self.governance()
        for l in self.live_labs():
            l.scrutiny *= 1 - self.U["scrutiny_decay"]
            l.effects = self._active(l.effects)
            l.val_effects = self._active(l.val_effects)

    def maybe_consolidate(self, b, g):
        alive = {l.name for l in self.live_labs()}
        super().maybe_consolidate(b, g)
        for name in alive:
            l = self.labs[name]
            if not l.alive and l.fate is None:
                l.fate = "merged"
