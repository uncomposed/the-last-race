# Preserved Stage 2a engine

This source/build snapshot predates Stage 2b edits and preserves replay compatibility with `owner-first.json` and `owner-first-chat.json`. Both original artifacts were verified with this engine. Their old source identity is `27927417938cf140ce9994d8fbcacc5a2c92a51cfe1f25684f9d53844857190f`.

From the repository root:

```sh
npm run play:legacy -- --resume owner-first-chat.json
```

Do not regenerate this snapshot’s identity using the new engine sources. Dependencies resolve from the root install. This version retains the historical Stage 2a limitations; it exists for recovery, not as the current play surface.
