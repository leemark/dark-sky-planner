# Dark Sky Planner

A browser-based astrophotography planning tool that helps workshop leaders and astrophotographers find optimal dark sky locations and dates. All calculations run client-side — no backend, no API keys required.

## Features

- **Interactive map** with CartoDB Dark Matter basemap and light pollution overlay (Bortle scale)
- **Click-to-pin** any location for instant local conditions
- **Solar panel** — sunrise/sunset, all twilight phases, darkness window duration
- **Lunar panel** — phase name, illumination %, rise/set times
- **Milky Way panel** — galactic center visibility window, peak altitude/azimuth, out-of-season warning
- **Night timeline** — SVG visualization of the full night: twilight bands, moon arc, MW window, optimal shooting window
- **Monthly calendar** — every night scored and color-coded (Excellent → Poor); click any night to load it
- **Shareable URLs** — encode location + date into URL params for easy sharing
- **Keyboard navigation** — `←/→` to step through dates
- **Responsive** — sidebar becomes a bottom sheet on mobile (≤768px)

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| [Vite](https://vitejs.dev/) | 7.x | Dev server + bundler |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Interactive map |
| [SunCalc](https://github.com/mourner/suncalc) | 1.9.0 | Sun & moon times |
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | 2.1.19 | Galactic center altitude/azimuth |
| [tz-lookup](https://github.com/darkskyapp/tz-lookup) | 6.1.25 | Lat/lng → IANA timezone |

No API keys needed. Reverse geocoding uses [Nominatim](https://nominatim.openstreetmap.org/) (free, rate-limited).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How It Works

1. Click anywhere on the map to drop a pin
2. The sidebar immediately shows solar/lunar/MW data for tonight at that location
3. Use the date picker (or `←/→` keys) to browse other nights
4. Open the **calendar** (📅) to see the full month color-coded by shooting quality
5. Use the **share** button (🔗) to copy a URL with the current location + date

## Shooting Window Logic

The optimal shooting window is the intersection of three intervals:

```
shootingWindow = darkness ∩ moon-down ∩ MW-visible
```

- **Darkness**: astronomical dusk → astronomical dawn (sun ≥18° below horizon)
- **Moon-down**: when moon is below horizon, or illumination < 10% (treated as no interference)
- **MW-visible**: galactic center altitude ≥ 15° above horizon

### Quality Scoring

| Score | Criteria |
|-------|---------|
| Excellent | ≥3 hours + moon <25% |
| Good | ≥2 hours + moon <50% |
| Fair | ≥1 hour |
| Poor | Any window <1 hour |
| None | No overlap |

## Project Structure

```
src/
├── main.js              # Bootstrap, URL state, event wiring
├── state.js             # Singleton state + event emitter
├── style.css            # Dark theme, layout, responsive
├── astro/
│   ├── solar.js         # SunCalc → twilight DateTimes
│   ├── lunar.js         # Moon phase, illumination, rise/set
│   ├── milkyway.js      # Galactic center alt/az sampling
│   ├── windows.js       # Interval intersection logic
│   └── scoring.js       # Quality enum
├── map/
│   ├── map.js           # Leaflet init, tile layers, opacity slider
│   ├── pin.js           # Click-to-pin marker
│   └── geocoder.js      # Nominatim reverse geocoding
├── ui/
│   ├── sidebar.js       # Panel orchestrator
│   ├── datepicker.js    # Date input + keyboard nav
│   ├── solarPanel.js    # Sun times display
│   ├── lunarPanel.js    # Moon phase display
│   ├── mwPanel.js       # Milky Way window display
│   ├── timeline.js      # SVG night timeline
│   ├── calendar.js      # Monthly quality grid
│   └── legend.js        # Bortle scale legend
└── utils/
    ├── constants.js     # MW_MIN_ALT_DEG, thresholds
    ├── time.js          # Timezone-aware formatting
    └── url.js           # URL state encode/decode
```

## Milky Way Season

The galactic core is best viewed from **February through October** (Northern Hemisphere). The app shows an out-of-season warning for November–January when the core stays below 15° during dark hours.

## License

MIT
