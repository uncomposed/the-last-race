#!/bin/zsh
# Rebuilds page-hidden.html from the scenario lab's page: sim patches (patch.mjs), then page patches (patch-ui.mjs).
set -e
cd "$(dirname "$0")"
SRC=${1:-../../../../../../learn-to-play-button-c33120/experiments/pacing-the-frontier/check/steps-bt-results/scenarios/page-scen.html}
node patch.mjs "$SRC" page-hidden.html
node patch-ui.mjs page-hidden.html
