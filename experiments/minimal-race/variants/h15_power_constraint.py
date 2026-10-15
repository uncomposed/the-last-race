"""H15: electric power, not chips, becomes the binding constraint mid-run.

Each bloc has a power envelope: how much installed compute its grid can
energise. The envelope grows slowly in A and faster in B. Chips that arrive
beyond a bloc's headroom (envelope minus installed compute) wait in a FIFO
queue. Public temperature in A thins A's headroom, which stands in for
permitting delay. Quarters where a queue remains are logged as power_bind.

Real-world anchor: grid interconnection queues and data-centre power limits.
No new randomness is used, so the paired baseline's draws are unchanged.
"""
import core


def make_config(base):
    base["cfg"]["power"] = dict(
        start=dict(A=36.0, B=15.0),      # envelope at t=0, in compute units
        growth=dict(A=0.6, B=1.6),       # envelope growth per quarter (additive)
        permit_k=1.0,                    # A headroom divided by (1 + permit_k * public_A)
    )
    return base


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.power = dict(self.cfg["power"]["start"])
        self.power_q = {b: [] for b in self.govs_conf}   # per bloc: [lab_name, units] FIFO

    def installed(self, bloc):
        return sum(l.K for l in self.live_labs() if l.bloc == bloc)

    def arrive_compute(self):
        p = self.cfg["power"]
        if self.t > 0:
            for b in self.power:
                self.power[b] += p["growth"][b]
        # Chips that have landed join their bloc's queue.
        for l in self.live_labs():
            keep = []
            for (ta, u) in l.pipeline:
                if ta <= self.t:
                    self.power_q[l.bloc].append([l.name, u])
                else:
                    keep.append((ta, u))
            l.pipeline = keep
        # Install queued chips up to the bloc's usable headroom, FIFO.
        for b, q in self.power_q.items():
            pub = self.public.get("A", 0.0) if b == "A" else 0.0
            room = max(0.0, self.power[b] - self.installed(b)) / (1.0 + p["permit_k"] * pub)
            while q and room > 1e-9:
                name, u = q[0]
                lab = self.labs[name]
                if not lab.alive:
                    q.pop(0)
                    continue
                take = min(u, room)
                lab.K += take
                room -= take
                if take >= u - 1e-12:
                    q.pop(0)
                else:
                    q[0] = [name, u - take]
            excess = sum(u for _, u in q)
            if excess > 1e-9:
                self.log("power_bind", bloc=b, excess=round(excess, 3),
                         envelope=round(self.power[b], 3))
