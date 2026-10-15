import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "variants"))
import h02_prediction_market as h
class VariantWorld(h.VariantWorld):
    def market_price(self):
        sig=self.signals
        n=len(sig)
        super().market_price()
        del sig[n:]
