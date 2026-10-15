import collections, copy, core
dup = collections.Counter(); purposes = set()
class K(core.World):
    def u(self, *key):
        self._seen = getattr(self, "_seen", collections.Counter())
        self._seen[key] += 1
        if self._seen[key] == 2: dup[key[0]] += 1
        purposes.add(key[0] if key[0] != "unk" else "unk")
        return super().u(*key)
for s in range(300): K(s).run()
print("purposes:", sorted(purposes)); print("keys drawn more than once:", dict(dup))
base = [core.World(s).run().outcome for s in range(300)]
conf = core.make_base_config(); conf["cfg"]["bench_noise"] = 1.51
alt = [core.World(s, copy.deepcopy(conf)).run().outcome for s in range(300)]
print("bench_noise 1.5->1.51: same outcome kind %d/300, same winner %d/300" % (
    sum(a["kind"] == b["kind"] for a, b in zip(base, alt)), sum(a["winner"] == b["winner"] for a, b in zip(base, alt))))
conf = core.make_base_config(); conf["cfg"]["mech"]["disclosure"] = False
alt = [core.World(s, copy.deepcopy(conf)).run().outcome for s in range(300)]
print("disclosure off: same outcome kind %d/300" % sum(a["kind"] == b["kind"] for a, b in zip(base, alt)))
