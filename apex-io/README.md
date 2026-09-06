# Apex.XRP

Original skill-based slither arena. Snakes, skins, XRP stake tiers, leaderboards.

This is a **local prototype**, not a licensed gambling product and not a copy of any commercial site.

## Phone

Works in a mobile browser. Add to Home Screen for a full-screen feel.

- Drag on the arena to steer
- Hold **BOOST** (bottom right)
- Cash out from the HUD button
- **Den** / **Board** tabs open menus; they hide while you are in a match

## Run

Open `index.html` in a modern browser, or from this folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Configure your fee address

1. Open the app
2. Click **Treasury**
3. Paste your XRP address (starts with `r`)
4. Choose Testnet or Simulated

Cash-out takes a **10% fee** and credits the rest to the player. The fee is marked for your treasury address.

Mainnet settlement is **not enabled** in this build. Wire Gem Wallet / Crossmark / Xaman yourself before touching real XRP.

## What is included

- Three stake servers: Hatchling (1 XRP), Coil (5 XRP), Apex (20 XRP)
- Skin workshop (species, pattern, colors, eyes)
- Arena: mouse steer, hold click to boost, eat orbs, crash others
- Cash out (Q or button) with 10% operator fee
- Leaderboards in XRP + USD (price feed with fallback)

## Legal

Real-money wagering is regulated where you live. Shipping this to the public with live deposits can require licenses, age gates, and KYC. You are responsible for that.
