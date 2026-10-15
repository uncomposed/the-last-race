import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "variants"))
import h02_prediction_market as h
class VariantWorld(h.VariantWorld):
    def nudge_beliefs(self):
        pass
