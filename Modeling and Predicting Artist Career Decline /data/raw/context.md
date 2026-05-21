# Raw Dataset Context

## dataset_ M.csv

**Source:** Kaggle (Spotify audio features scraped via Spotify API)  
**Rows:** 114,000 | **Columns:** 21 (plus unnamed index column)  
**Purpose:** Wide genre coverage for classification/clustering tasks

### Schema
| Column | Type | Description |
|--------|------|-------------|
| `track_id` | str | Spotify track URI |
| `artists` | str | Artist name(s) |
| `album_name` | str | Album name |
| `track_name` | str | Track name |
| `popularity` | int (0–100) | Spotify popularity score at time of collection |
| `duration_ms` | int | Track duration in milliseconds |
| `explicit` | bool | Whether track has explicit content |
| `danceability` | float (0–1) | Suitability for dancing |
| `energy` | float (0–1) | Perceptual intensity and activity |
| `key` | int (-1–11) | Estimated key (Pitch Class notation; -1 = unknown) |
| `loudness` | float (dB) | Average loudness, typically -60 to 0 |
| `mode` | int (0/1) | 0 = minor, 1 = major |
| `speechiness` | float (0–1) | Presence of spoken words |
| `acousticness` | float (0–1) | Confidence the track is acoustic |
| `instrumentalness` | float (0–1) | Predicts absence of vocals |
| `liveness` | float (0–1) | Presence of live audience |
| `valence` | float (0–1) | Musical positiveness |
| `tempo` | float | Estimated BPM |
| `time_signature` | int | Estimated beats per bar |
| `track_genre` | str | Genre label (114 unique genres) |

### Key Facts
- **114 genres** (1,000 tracks each): acoustic, afrobeat, alt-rock, alternative, ambient, anime, ... through world-music
- **Popularity:** mean=33, median=35; many zero-popularity tracks (likely delisted songs)
- **Nulls:** 1 row each in `artists`, `album_name`, `track_name`
- **No release date column** — do not try to access `album_release_date`

---

## spotify_songs_JA.csv

**Source:** TidyTuesday 2020-01-21 via `spotifyr` R package  
**Rows:** 32,833 | **Columns:** 23  
**Purpose:** Playlist-based genre classification with release date; covers ~1957–2020

### Schema
| Column | Type | Description |
|--------|------|-------------|
| `track_id` | str | Spotify track URI |
| `track_name` | str | Track name |
| `track_artist` | str | Artist name |
| `track_popularity` | int (0–100) | Spotify popularity score |
| `track_album_id` | str | Album URI |
| `track_album_name` | str | Album name |
| `track_album_release_date` | str | Release date (YYYY-MM-DD or YYYY) |
| `playlist_name` | str | Source playlist name |
| `playlist_id` | str | Playlist URI |
| `playlist_genre` | str | Broad genre (6 values) |
| `playlist_subgenre` | str | Subgenre (24 values) |
| `danceability` | float (0–1) | — |
| `energy` | float (0–1) | — |
| `key` | int (-1–11) | — |
| `loudness` | float (dB) | — |
| `mode` | int (0/1) | — |
| `speechiness` | float (0–1) | — |
| `acousticness` | float (0–1) | — |
| `instrumentalness` | float (0–1) | — |
| `liveness` | float (0–1) | — |
| `valence` | float (0–1) | — |
| `tempo` | float | — |
| `duration_ms` | int | — |

### Key Facts
- **6 playlist genres:** edm, latin, pop, r&b, rap, rock
- **24 subgenres:** dance pop, trap, reggaeton, hip hop, latin pop, etc.
- **Release dates:** 1957–2020; parse with `pd.to_datetime(..., errors='coerce')` — some entries are year-only strings
- **Popularity:** mean=42, median=45; higher than dataset_ M.csv (likely because tracks came from active playlists)
- **Nulls:** 5 rows each in `track_name`, `track_artist`, `track_album_name`

---

## universal_top_spotify_songs.csv

**Source:** Kaggle — daily-updated Spotify charts scrape  
**Rows:** 2,110,316 | **Columns:** 25  
**Purpose:** Time-series of chart performance across 73 countries (2023-10-18 to 2025-06-11)

> **Note:** This file is gitignored due to size.

### Schema
| Column | Type | Description |
|--------|------|-------------|
| `spotify_id` | str | Spotify track URI |
| `name` | str | Track name |
| `artists` | str | Artist name(s) |
| `daily_rank` | int | Chart position on that day (1 = #1) |
| `daily_movement` | int | Change in rank from previous day |
| `weekly_movement` | int | Change in rank from previous week |
| `country` | str | ISO 3166-1 alpha-2 country code (empty = global chart) |
| `snapshot_date` | str | Date of chart snapshot (YYYY-MM-DD) |
| `popularity` | int (0–100) | Spotify popularity score on that date |
| `is_explicit` | bool | Explicit content flag |
| `duration_ms` | int | Track duration |
| `album_name` | str | Album name |
| `album_release_date` | str | Album release date |
| `danceability` | float (0–1) | — |
| `energy` | float (0–1) | — |
| `key` | int | — |
| `loudness` | float (dB) | — |
| `mode` | int (0/1) | — |
| `speechiness` | float (0–1) | — |
| `acousticness` | float (0–1) | — |
| `instrumentalness` | float (0–1) | — |
| `liveness` | float (0–1) | — |
| `valence` | float (0–1) | — |
| `tempo` | float | — |
| `time_signature` | int | — |

### Key Facts
- **73 countries** (ISO codes) + global chart rows where `country` is empty (~28,908 null rows)
- **Date range:** 2023-10-18 to 2025-06-11 (daily snapshots)
- **Popularity:** mean=76, median=79 — much higher than other datasets; these are charting songs only
- **All audio feature columns are stored as strings** — cast to float before use
- **Nulls:** ~29k in `country` (global chart rows), ~822 in `album_name`, ~659 in `album_release_date`

---

## Cross-Dataset Notes

### Joining on track_id
The `track_id` / `spotify_id` columns can be used to join datasets, but column names differ:

| Dataset | ID column | Artist column | Popularity column |
|---------|-----------|---------------|-------------------|
| dataset_ M.csv | `track_id` | `artists` | `popularity` |
| spotify_songs_JA.csv | `track_id` | `track_artist` | `track_popularity` |
| universal_top_spotify_songs.csv | `spotify_id` | `artists` | `popularity` |

### Popularity score differences
Popularity scores are point-in-time and differ across datasets. `universal_top_spotify_songs.csv` skews high (charting songs); `dataset_ M.csv` skews low (includes many obscure/delisted tracks).

### Audio features
All three datasets share the same Spotify audio feature definitions (danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, duration_ms). See `readme.md` for full feature definitions.
