# Modeling and Predicting Artist Career Decline in Music Streaming

**Kultum Lhabaik & Elizabeth Garcia** · Emory University · CS 470

📄 [Final Report (PDF)](./reports/project_report.pdf)

---

## Summary

A two-stage data mining framework for predicting artist popularity decline using longitudinal Spotify data. From 32,828 raw tracks we built artist-year profiles for 1,094 artists (3,474 labeled observations). Stage one applies Ward linkage clustering and discovers **eight career archetypes** with decline rates ranging from 16% to 53%. Stage two trains supervised classifiers to predict a ≥10-point popularity drop in the following year. **Gradient Boosting achieves 92.0% recall** on the held-out test set (95% CI: [87.5%, 96.2%]), catching 127 of 138 real decline cases.

---

## Research Questions

1. Can we discover meaningful career lifecycle archetypes from longitudinal Spotify artist-year data?
2. Can we predict which artists will experience a meaningful popularity decline in the following year?

---

## Data & Feature Engineering

**Source:** 30,000 Spotify Songs dataset (Kaggle) — 32,828 tracks filtered to 1990–2020, deduplicated, and restricted to artists with ≥3 active years → **1,094 artists**, collapsed into **4,568 artist-year profiles**.

**11 time-aware features** built using expanding-window operations (each row sees only its past):

| Feature | What it measures |
|---------|-----------------|
| `yearly_change` | Popularity change vs. last active year |
| `variability` | How much popularity bounces year to year |
| `career_age` | Years the artist has been active |
| `peak_popularity` | Highest popularity ever reached |
| `gap_from_peak` | Distance below all-time high |
| `years_since_peak` | How long ago they hit their peak |
| `career_slope` | Overall direction of popularity |
| `release_consistency` | Did they release music last year? |
| `track_count_change` | Releasing more or fewer songs? |
| `momentum` | Performing above or below own average? |
| `recent_ratio` | Current popularity as fraction of personal best |

**Decline label:** ≥10-point drop in the following year → 25.6% decline rate. Train: years ≤2016. Test: years >2016.

---

## Stage 1 — Career Lifecycle Clustering

**Method:** Ward linkage agglomerative clustering on 8 Z-score standardized career features. Silhouette scores tested k=2–8; best at **k=8 (score = 0.219)**.

| Archetype | n | Decline Rate | Example Artists |
|-----------|---|-------------|-----------------|
| **Legacy Faders** | 49 | **53%** | Metallica, The Rolling Stones, Jimi Hendrix |
| **Momentum Lost** | 116 | **40%** | The Weeknd, Justin Timberlake, Ariana Grande |
| Low-Mid Steady | 264 | 24% | Lana Del Rey, Tame Impala |
| Mainstream Stable | 341 | 24% | Billie Eilish, Bruno Mars, Beyoncé |
| Long-Running Stable | 105 | 24% | Drake, Eminem, Rihanna |
| Low Current Visibility | 70 | 19% | Bruce Springsteen, Erykah Badu |
| Established High-Performers | 54 | 17% | Bad Bunny, BTS, Post Malone |
| **Catalog Risers** | 95 | **16%** | BLACKPINK, Cigarettes After Sex |

**Validation:** χ² = 109.94, p < 0.0001, Cramér's V = 0.178. The most actionable group is **Momentum Lost** — artists who reached real peaks but now show the most negative momentum of any cluster, making them identifiable before decline accelerates.

---

## Stage 2 — Supervised Decline Prediction

Four classifiers trained with expanding-window CV (test years 2013–2016), balanced class weights, and F2-optimal threshold tuning on a held-out 2016 validation fold.

| Model | PR-AUC | CV Recall | CV F2 | Test Recall | Test F2 |
|-------|--------|-----------|-------|-------------|---------|
| **Gradient Boosting** ★ | 0.299 | 0.888 | 0.665 | **0.920** | **0.539** |
| XGBoost | 0.302 | 0.900 | 0.667 | 0.906 | 0.535 |
| Random Forest | 0.309 | 0.823 | 0.660 | 0.855 | 0.532 |
| Decision Tree | 0.236 | — | — | 0.848 | 0.530 |
| Random baseline | 0.165 | — | — | — | — |

**Final model (Gradient Boosting, threshold = 0.369):** TP=127, FN=11, FP=499, TN=198. Bootstrap 95% CI: recall [0.875, 0.962]. The cost is 3.9 false alarms per correct detection — suited for narrowing a watchlist, not replacing human judgment.

**Top predictors:** `mean_popularity` (test importance 0.112) and `yearly_change` (0.045) carry nearly all predictive signal. An ablation to just these two features drops PR-AUC only from 0.299 to 0.281.

---

## Key Findings

1. **Eight statistically distinct career archetypes exist**, with decline rates ranging from 16% (Catalog Risers) to 53% (Legacy Faders)
2. **Momentum Lost artists are the most actionable group** — identifiable before decline accelerates, giving talent managers a concrete early-warning signal
3. **Current popularity and recent trajectory dominate prediction** — 16 of 18 engineered features add only marginal value beyond mean_popularity and yearly_change
4. **Spotify's popularity score imposes a data ceiling** — off-platform events (label changes, controversies, tours, comebacks) are invisible to any feature derivable from streaming data alone

---

## Repository Structure

```
├── data/
│   ├── raw/                        # Source CSVs and schema documentation
│   │   ├── dataset_M.csv           # 114K tracks, 114 genres
│   │   ├── spotify_songs_JA.csv    # 32K tracks with release dates
│   │   ├── context.md              # Schema and cross-dataset notes
│   │   └── readme.md               # Spotify audio feature definitions
│   └── processed/
│       ├── artist_year_profiles.csv # 3,474 labeled artist-year rows
│       └── artist_clusters.csv     # Cluster assignments for 1,094 artists
│
├── notebooks/
│   ├── Data Preparation/
│   │   └── artist_profile.ipynb    # Feature engineering pipeline
│   ├── exploratory/                # EDA on each raw dataset
│   └── final/
│       ├── artist_lifecycle_clustering.ipynb   # Stage 1: Ward clustering
│       └── decline_prediction.ipynb            # Stage 2: Classification
│
├── reports/
│   ├── project_report.pdf          # Full IEEE-format paper
│   └── *.png                       # All figures (17 total)
```

---

## Tech Stack

**Analysis:** Python · pandas · NumPy · scikit-learn · XGBoost · Matplotlib · Seaborn
**Clustering:** Ward linkage agglomerative clustering · silhouette analysis · PCA
**Classification:** Decision Tree · Random Forest · HistGradientBoosting · XGBoost
**Evaluation:** PR-AUC · F2 score · expanding-window CV · bootstrap confidence intervals · permutation importance

---

## Acknowledgments

Built for CS 470 (Data Mining) at Emory University under Dr. Kai Shu.
