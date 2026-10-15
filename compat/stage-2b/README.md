# Preserved Stage 2b engine

This is the unchanged 0.2.0 source snapshot taken before the playability repairs and connected lab loop. Its engine hash is `68aeb799c63d8bb44ffb1e44098bb8fb103900e5f5500782bdf9951332b4d2a2`. Do not regenerate its identity from new sources.

From the repository root:

```sh
npm run play:stage-2b -- --session-dir .last-race-codex-table
npm run play:stage-2b -- --resume PATH_TO_STAGE_2B_SAVE --session-dir .last-race-stage-2b-recovery
```

Dependencies resolve from the root install. Original user saves are unchanged. Copies of historical generated ending artifacts are retained locally in this snapshot's artifacts directory. The new engine rejects these saves by identity rather than altering their decisions or hidden world. Format-1 Stage 2a artifacts still require `compat/stage-2a`.
