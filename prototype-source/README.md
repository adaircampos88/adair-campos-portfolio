# Interactive Energy Flow prototype

This is the editable source for the interactive prototype embedded on the portfolio homepage. The generated static files are written to `../energy-prototype/` and are the files published by GitHub Pages.

## Build

```bash
npm install
npm run build
```

After building, run the portfolio checks from the repository root:

```bash
python3 tools/validate_site.py
```

The experience starts from the current time in Munich, plays the day simulation automatically when reduced motion is not requested, loads current Munich weather from Open-Meteo, and falls back to local values if the request is unavailable. The timeline, play control, scenario controls, energy ribbons, weather panel and reduced-motion behavior are implemented in `page.tsx`. Visitors who prefer reduced motion can still start the animation explicitly with the Play control.
