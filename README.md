# Las Vegas Valley, Summer 2024: Land Surface Temperature, NDVI and Elevation

An exploratory Google Earth Engine analysis of how daytime land surface
temperature (LST) varied across the Las Vegas Valley in summer 2024, and how
it relates to vegetation (NDVI), elevation, and land cover.

## Context

Summer 2024 was the hottest on record in Las Vegas according to the National
Weather Service (records from 1937). Source: [add the link you checked, for
example https://www.ktnv.com/news/its-official-las-vegas-just-had-its-hottest-summer-on-record].
This project looks at the satellite surface temperature pattern for that
summer. It is descriptive. It does not measure health, energy or ecosystem
effects.

## Questions

1. How are summer LST, NDVI and elevation related across the valley?
2. Is built-up land warmer than non-built land at the Landsat overpass time,
   and does the answer depend on how "non-built" is defined?

## Data

| Data | Source |
|---|---|
| Landsat 9 Collection 2 Level 2 | `LANDSAT/LC09/C02/T1_L2`, 1 June to 31 August 2024 (11 cloud-masked scenes, median composite) |
| Land cover | ESA WorldCover v200 (water = 80, built-up = 50) |
| Elevation | SRTM, `USGS/SRTMGL1_003` |
| Comparison only | MODIS MOD11A1 v061 daytime LST (about 1 km) |

Study area: a rectangle of about 1,597 km² around the valley
(west -115.35, south 35.95, east -114.95, north 36.35). It is a choice, not an
official boundary, and the results depend on it.

## Method

- Cloud and shadow pixels masked with `QA_PIXEL`, then scale factors applied.
- LST is the USGS `ST_B10` surface temperature (Kelvin) converted to °C. No
  extra emissivity correction is applied, because USGS has already applied one.
- NDVI is computed from bands SR_B5 and SR_B4. Water is masked out.
- Correlations and a regression use a random sample of 19,961 pixels (30 m).
  The regression explains LST with standardized NDVI and elevation together.
- Built-up minus non-built LST is compared under different reference
  definitions, box sizes, and 100 m elevation bands.

## Results

Only relative differences are reported.

**Pixel-level relationships (n = 19,961)**

| Pair | Pearson r |
|---|---|
| NDVI and LST | -0.41 |
| Elevation and LST | -0.34 |
| NDVI and elevation | 0.08 |

Regression on standardized variables: NDVI coefficient -0.39, elevation
coefficient -0.31, R² about 0.26. NDVI and elevation together explain about a
quarter of the pixel-to-pixel variation in LST. About three-quarters is not
explained by these two variables.

**Sparse versus green pixels (mean LST difference, °C)**

| NDVI threshold | Sparse minus green |
|---|---|
| 0.15 | 2.4 |
| 0.20 | 3.6 |
| 0.30 | 5.3 |
| 0.40 | 6.4 |

The difference grows as the threshold rises, so it has no single value.

**Built-up minus non-built (°C)**

| Reference or setting | Difference |
|---|---|
| All non-built land | -0.6 |
| Shrub, grass and cropland only | +1.6 |
| All non-built, box 5 km larger | -0.6 |
| All non-built, box 5 km smaller | +0.2 |

| Elevation band (m) | Built minus non-built (°C) |
|---|---|
| 500-600 | -0.2 |
| 600-700 | -0.6 |
| 700-800 | -1.6 |
| 800-900 | -2.5 |
| 900-1000 | -3.0 |

The sign of the built-up difference depends on how the reference is defined,
so this analysis does not show a robust daytime surface heat island. The
growing gap at higher elevation is not explained here.

## Limitations

- One summer, one morning overpass, and a median of 11 scenes. Landsat gives
  no surface temperature at night, so the nighttime heat island is not covered.
- No weather data. The results are associations, not causes.
- Landsat and MODIS mean LST differ by about 6 °C over the same box, so only
  relative differences are reported.
- Results depend on the box, the rural definition, and the NDVI threshold.

|

link to the project: [https://code.earthengine.google.com/a0dcf9907b0d8e8ab2a27d169e3d70bf](https://code.earthengine.google.com/774c3bbc0437f51ef68c43a9c00d06e0)
