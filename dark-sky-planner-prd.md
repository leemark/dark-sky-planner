# Dark Sky Planner — Product Requirements Document

## Overview

**Dark Sky Planner** is a browser-based, map-first planning tool for astrophotography — specifically for finding the best locations and dates to photograph the Milky Way. Unlike field tools like PhotoPills, this is a **scouting and trip planning tool** designed around the question: *"Where should I go, and when?"*

The primary use case is planning astrophotography workshops and guided shoots, but the tool is useful for any astrophotographer who wants to scan a region and find optimal dark sky windows without checking locations one at a time.

### What This Is NOT

This is not a replacement for PhotoPills or Stellarium. It does not need AR overlays, exposure calculators, depth of field tools, or star trail planning. It is the tool you use **before** those tools — to decide where and when to go.

---

## Core Value Proposition

**Existing workflow (painful):**
1. Check lightpollutionmap.info for dark locations
2. Open PhotoPills, manually check moon phase for a specific date
3. Check moonrise/moonset times for that location
4. Check Milky Way core visibility for that date/time
5. Repeat for each candidate location and date
6. Try to communicate the plan to workshop participants via text/email

**Dark Sky Planner workflow:**
1. Open map, pick a region
2. Pick a date (or ask "show me the best nights this month")
3. See darkness windows, moon interference, and MW core visibility overlaid on a light pollution map
4. Share a link with the group

---

## Target Users

- **Primary:** Astrophotography workshop leaders planning group shoots
- **Secondary:** Solo astrophotographers planning trips
- **Tertiary:** General stargazers/aurora chasers who want dark sky locations

---

## Technical Architecture

### Stack

- **Frontend:** Vanilla JavaScript (no framework), single-page application
- **Mapping:** Leaflet.js (free, no API key required for base tiles)
- **Astronomy calculations:** SunCalc (sun/moon positions, phases, rise/set times — runs client-side) + astronomy-engine (Milky Way galactic center position calculations)
- **Light pollution data:** Tile overlay from World Atlas of Artificial Night Sky Brightness (VIIRS data)
- **Hosting:** Static site — no backend required. All calculations run client-side.
- **Build:** Vite or similar minimal bundler

### Key Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| [Leaflet](https://leafletjs.com/) | Interactive map | Free, lightweight, huge plugin ecosystem |
| [SunCalc](https://github.com/mourner/suncalc) | Moon phase, rise/set, sun rise/set, twilight times | Client-side, no API key, ~3KB |
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | Galactic center altitude/azimuth calculations | Client-side, comprehensive astronomy lib |
| Light pollution tiles | Bortle scale overlay on map | See data sources below |

### Data Sources

- **Moon data:** All computed client-side via SunCalc (phase, illumination %, rise time, set time, altitude, azimuth)
- **Sun/twilight data:** SunCalc (sunrise, sunset, civil/nautical/astronomical twilight)
- **Milky Way core position:** astronomy-engine — compute the altitude and azimuth of the galactic center (RA 17h 45m 40s, Dec -29° 00′ 28″) for any date/time/location
- **Light pollution:** VIIRS/DMSP satellite composite tiles. Options include:
  - [lightpollutionmap.info tile server](https://www.lightpollutionmap.info/) (check terms of use)
  - Self-hosted tiles from [Earth Observation Group](https://eogdata.mines.edu/products/vnl/)
  - Fallback: static GeoJSON of Bortle zone boundaries
- **Weather (future/optional):** OpenWeatherMap or similar for cloud cover forecast overlay

---

## Features — MVP (v1.0)

### F1: Interactive Map with Light Pollution Overlay

The base experience. User sees a map (defaulting to their location or Colorado) with a light pollution heat map overlay showing Bortle scale zones.

**Requirements:**
- Leaflet map with standard pan/zoom
- Light pollution tile overlay with opacity control
- Bortle scale legend
- Click anywhere on the map to set a "planning pin" — this becomes the reference location for all calculations
- Reverse geocode the pin location to show a readable place name
- Default map center: user's geolocation (with fallback to Colorado Springs, CO)

### F2: Date Picker + Lunar Data Panel

User selects a target date. The app computes and displays all relevant lunar and solar data for the pinned location on that date.

**Requirements:**
- Date picker (default to today)
- For the selected date and pinned location, display:
  - Moon phase (name + icon/visual)
  - Moon illumination percentage
  - Moonrise and moonset times
  - Sunrise and sunset times
  - Astronomical twilight start (evening) and end (morning) — this defines "true darkness"
  - **Darkness window:** time range when it is both past astronomical twilight AND the moon is below the horizon (or moon illumination is < ~10%)
  - If there is no good darkness window (e.g., full moon is up all night), say so clearly

### F3: Milky Way Core Visibility

For the selected date, location, and time, compute whether the Milky Way core is visible.

**Requirements:**
- Calculate galactic center altitude and azimuth throughout the night
- Display the time window when the galactic center is above the horizon (altitude > 0°) — ideally > 15-20° for good photography
- Show the compass bearing (azimuth) of the core at peak altitude
- Cross-reference with the darkness window from F2 to produce a **"Milky Way shooting window"** — the overlap of: true darkness + moon below horizon + galactic center above ~15°
- Display this window prominently as the key output ("Tonight's MW window: 11:42 PM – 3:18 AM, core peaks at 45° altitude bearing SSE")
- Handle the seasonal reality: Milky Way core is not visible November–January from mid-northern latitudes. Show a clear message when it's out of season.

### F4: Night Timeline Visualization

A horizontal timeline bar for the selected night (sunset to sunrise) showing all the layers at a glance.

**Requirements:**
- Horizontal bar spanning sunset → sunrise
- Color-coded segments:
  - **Civil twilight** (light blue)
  - **Nautical twilight** (medium blue)
  - **Astronomical twilight** (dark blue)
  - **True darkness** (very dark / black)
- Moon arc overlay: show when the moon is above the horizon (with brightness/opacity tied to illumination %)
- Milky Way core window: highlighted segment showing when the core is above the minimum altitude threshold
- **Golden window highlight:** the intersection of true darkness + no moon + MW core visible. This is the money zone.
- Interactive: hovering/tapping on the timeline shows exact time and conditions at that moment

### F5: "Best Nights" Calendar View

For trip/workshop planning, show a month-at-a-glance view of shooting quality.

**Requirements:**
- Monthly calendar grid
- Each night scored/colored based on:
  - Moon illumination (lower = better)
  - Length of the MW shooting window (longer = better)
  - Simple scoring: e.g., green (>3hr window), yellow (1-3hr), orange (<1hr), red (no window)
- Click any date to load that night's full details in the main view
- Arrow navigation between months
- This is the "which weekend should we plan the workshop?" view

### F6: Shareable Links

Workshop leaders need to share plans with participants.

**Requirements:**
- URL encodes: lat/lng of pin, selected date
- Opening a shared link loads the map centered on the location with the date pre-selected
- No accounts, no login required

---

## Features — Post-MVP (v2.0+)

These are out of scope for v1 but should inform architectural decisions (don't paint yourself into a corner):

- **Weather/cloud cover overlay** — 48-72hr forecast overlay from weather API
- **Multiple pins** — compare two or three candidate locations side by side
- **Driving time radius** — "show me Bortle 3 or darker within 2 hours of Colorado Springs"
- **Aurora probability overlay** (Kp index) — useful for northern latitudes
- **Elevation/terrain awareness** — mountain horizons can block low-altitude targets
- **Export to calendar** — add the shooting window as a calendar event
- **PWA/offline** — cache tiles and work without connectivity in the field
- **Compass/AR view** — phone compass showing where the core will be (this approaches PhotoPills territory, so be thoughtful about scope)

---

## UI/UX Guidelines

### Layout

Desktop-first (planning tool), but responsive for tablet/mobile reference in the field.

**Desktop layout:**
- Map takes up ~65-70% of the viewport (left/center)
- Right sidebar: date picker, lunar data panel, MW data, night timeline
- Calendar view can be a modal or a full-width overlay

**Mobile layout:**
- Full-width map
- Bottom sheet / drawer for data panels
- Swipeable between map and calendar views

### Design Principles

- **Dark UI.** This is a night photography tool — respect the audience. Dark background, muted colors, with accent colors for the key data (e.g., warm gold for the shooting window highlight).
- **Data density over minimalism.** Astrophotographers want to see the numbers. Don't hide data behind extra taps.
- **The map is the hero.** All other UI is in service of the map. The map should never feel cramped.
- **Fast.** All calculations are client-side. There should be zero loading spinners for moon/sun/MW data after the initial page load.

### Color Palette Suggestions

- Background: deep navy/charcoal (#0d1117 or similar)
- Light pollution overlay: standard Bortle scale colors (dark blue → green → yellow → orange → red → white)
- Moon: silver/white tones
- Milky Way window: warm gold/amber accent
- Golden shooting window: bright highlight (gold or cyan — something that pops against the dark UI)
- Danger/no-go: muted red for full moon nights or no-window dates

---

## Data Model

### Location State
```
{
  lat: number,
  lng: number,
  name: string,          // reverse geocoded place name
  elevation?: number     // meters, for future terrain features
}
```

### Night Calculation (for a given date + location)
```
{
  date: string,                    // ISO date
  location: { lat, lng },
  sun: {
    rise: DateTime,
    set: DateTime,
    astronomicalTwilightEvening: DateTime,   // darkness begins
    astronomicalTwilightMorning: DateTime    // darkness ends
  },
  moon: {
    phase: string,                 // "Waxing Crescent", "Full", etc.
    illumination: number,          // 0.0 – 1.0
    rise: DateTime | null,         // null if moon doesn't rise that night
    set: DateTime | null,
    altitude: number[],            // altitude at each hour of the night
  },
  milkyWay: {
    coreRise: DateTime | null,     // when galactic center crosses 0° alt
    coreSet: DateTime | null,
    peakAltitude: number,          // max altitude in degrees
    peakAzimuth: number,           // compass bearing at peak
    peakTime: DateTime,
    aboveThreshold: {              // when core is above min shooting altitude
      start: DateTime,
      end: DateTime
    }
  },
  shootingWindow: {                // THE KEY OUTPUT
    start: DateTime | null,
    end: DateTime | null,
    durationMinutes: number,
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'none'
  }
}
```

---

## Milky Way Calculation Notes

The Milky Way core's position is fixed in celestial coordinates (the galactic center is at approximately RA 17h 45m, Dec -29°). Its visibility from any location on Earth depends on:

1. **Time of year:** The core is above the horizon during nighttime hours roughly from February through October in mid-northern latitudes (~35-45°N). Peak season is June-August when it reaches highest altitude.
2. **Time of night:** The core rises and sets like any celestial object. Its transit time shifts ~4 minutes earlier each night.
3. **Latitude:** From Colorado Springs (~38.8°N), the core maxes out at about 22° altitude. Farther south = higher altitude = better.

**Calculation approach:**
- Use astronomy-engine to compute the altitude and azimuth of the galactic center (RA 17h 45.6m, Dec -29.0°) at regular intervals (every 10-15 minutes) throughout the night
- Find when altitude crosses the minimum threshold (recommend 15° as default, with user-adjustable option)
- Intersect this window with the true darkness window (astronomical twilight) and the moon-down window

**Quality scoring for calendar view:**
- **Excellent:** Shooting window > 4 hours, moon illumination < 5%
- **Good:** Shooting window 2-4 hours, moon illumination < 25%
- **Fair:** Shooting window 1-2 hours, or moon illumination 25-50%
- **Poor:** Shooting window < 1 hour, or moon illumination > 50%
- **None:** No shooting window (core below horizon during darkness, or full moon up all night)

---

## Development Phases

### Phase 1: Core Map + Moon Data (Week 1-2)
- [ ] Project scaffolding (Vite + vanilla JS)
- [ ] Leaflet map with dark basemap tiles
- [ ] Light pollution tile overlay with opacity slider
- [ ] Click-to-pin location selection
- [ ] SunCalc integration: compute moon phase, rise/set, illumination for pinned location + selected date
- [ ] SunCalc integration: compute sun rise/set and twilight times
- [ ] Date picker
- [ ] Display computed data in sidebar panel

### Phase 2: Milky Way + Shooting Window (Week 2-3)
- [ ] astronomy-engine integration: compute galactic center position throughout the night
- [ ] Calculate MW core visibility window (above threshold altitude)
- [ ] Calculate composite shooting window (darkness ∩ moon-down ∩ MW-visible)
- [ ] Display shooting window prominently
- [ ] Night timeline visualization bar

### Phase 3: Calendar + Polish (Week 3-4)
- [ ] Monthly calendar view with quality scores per night
- [ ] Navigate between months
- [ ] Click calendar date → load that night's details
- [ ] Shareable URLs (encode location + date in URL params)
- [ ] Responsive layout for mobile/tablet
- [ ] UI polish, dark theme, typography, loading states

### Phase 4: Testing + Launch
- [ ] Validate calculations against PhotoPills / Stellarium for accuracy
- [ ] Test across major browsers
- [ ] Performance audit (smooth map panning with overlay)
- [ ] Deploy to static hosting (Netlify, Vercel, or GitHub Pages)

---

## Open Questions / Decisions for Development

1. **Light pollution tile source:** Need to evaluate lightpollutionmap.info tile server terms of use vs. self-hosting VIIRS tiles. Self-hosting is more work but avoids dependency.
2. **Minimum altitude threshold for MW core:** Default to 15° but should this be user-configurable in v1?
3. **Basemap tiles:** Leaflet needs a tile provider. Options include CartoDB Dark Matter (free, dark theme, good aesthetic fit), Mapbox (better quality, requires API key), or OpenStreetMap (free but light theme).
4. **Reverse geocoding:** For converting pin lat/lng to place names. Nominatim (free, OpenStreetMap) is the easiest option.
5. **Time zone handling:** Critical to get right. All display times must be in the local time zone of the pinned location, not the user's browser time zone. Consider using a timezone lookup library (e.g., `tz-lookup` or the Google Time Zone API).

---

## Success Criteria

The tool is successful if:
- A workshop leader can find the best shooting location + date for next month's workshop in under 2 minutes
- They can share the plan with participants via a single URL
- Calculated shooting windows match PhotoPills/Stellarium to within ~10 minutes accuracy
- The entire app loads and runs with no backend, no accounts, no API keys (or at most one free-tier key for tiles)
