# Strava Analysis

A local browser dashboard for analysing and presenting Strava running data.

## Run it

```bash
cd /Users/ryangreenhall/Documents/code/strava-analysis
npm run dev
```

Open `http://localhost:5173`.

## Import data

Use the Strava activities CSV export. The app recognises common columns including:

- `Activity Date`
- `Activity Name`
- `Activity Type`
- `Distance`
- `Moving Time`
- `Elevation Gain`

It also accepts JSON arrays with equivalent fields. Distances under `500` are treated as kilometres, while larger distance values are treated as metres.

## What it shows

- Total runs, distance, moving time, and weighted average pace
- Monthly trend chart for distance, moving time, or elevation
- Run distance distribution
- Longest runs table
- A short narrative summary for presenting the training block
