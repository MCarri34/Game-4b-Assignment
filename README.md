# Climb.exe

**By:** Noah Billedo and Michael Carrillo  
**Built With:** Phaser 3, Tiled, JavaScript

---

## 🎮 Game Overview

**Climb.exe** is a vertical platformer where your goal is to reach the top of a treacherous level filled with enemies, coins, and checkpoints. Inspired by old-school arcade difficulty and modern polish, Climb.exe challenges you to plan your movement carefully and collect coins to unlock checkpoints along the way.

---

## 🕹️ How to Play

- **Move**: Left / Right Arrow Keys  
- **Jump/Double Jump**: Spacebar  
- **Activate Checkpoint**: C (requires enough coins from the last section)  
- **Pause**: P  
- **Restart**: R (can only be used while paused or on the victory screen)

💡 **Goal:** Reach the top of the level while managing resources (coins) and activating checkpoints to save progress.

---

## ✅ Custom Rubric

- [x] **Horizontal Movement**
- [x] **Jumping Mechanics**
- [x] **Checkpoints** (cost-based)
- [x] **Coin Collection**
- [x] **Enemy Interactions**
- [x] **Death + Respawn System**
- [x] **Pause / Restart System**
- [x] **Victory State + End Screen**
- [x] **Custom Sound Effects**
- [x] **Tilemap Integration from Tiled**

### ✔ Game Feel / Juice

- [x] **Walking and Wall-Sliding Particles**
- [x] **Death Particle Effects**
- [x] **Victory Sound + Scene Transition**
- [x] **Animations for Enemies and Coins**
- [x] **UI for Checkpoints**
- [x] **Clean Visual Style with 1-bit Tileset**

---

## 🧩 Assets & Tools

- **Tileset**: [Kenney's 1-bit Pack](https://kenney.nl/assets/bit-pack)
- **Sound Effects**: Copyright Free Audio
- **Level Design**: Tiled (.tmx and .tmj formats)
- **Engine**: Phaser 3

---

## 📈 Scoring

- Your **final coin count** is shown at the end of the game.
- Coins are **removed upon death** unless a checkpoint was activated before death.
- Checkpoints **require coins** to activate and are **optional but strategic**.

---

## 🛠 Known Features

- Enemies patrol and kill on contact unless jumped on.
- Coin animation manually toggles between two frames.
- Checkpoints animate based on activation state (tile ID between 20–22).
- Player power-ups and particle effects for movement polish.

---

Enjoy climbing!