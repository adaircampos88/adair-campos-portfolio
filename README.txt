ADAIR CAMPOS — THREE-CASE PORTFOLIO BUILD

Preview through a local HTTP server instead of opening the files directly:

    python3 -m http.server 8000

Then open http://localhost:8000/.

Pages:
- index.html — portfolio homepage with three selected projects
- case-study-energy-flow.html — product strategy and concept-design case study
- case-study-ev-research.html — generative UX research case study
- case-study-isolarcloud-evaluation.html — evaluative UX research and iteration case study
- cv.html — web CV
- Adair_Campos_Senior_Product_Designer_CV.pdf — downloadable CV
- styles.css — responsive visual design
- script.js — scroll reveal and progress indicator
- site-config.js — canonical site and consent-controlled GA configuration
- privacy.html / impressum.html — bilingual legal pages; the address is injected only during deployment
- LAUNCH-CHECKLIST.md — required launch handoffs and acceptance checks
- tools/build_site.py — creates the deployable `_site` artifact and privately inserts the legal address
- .github/workflows/deploy-pages.yml — validates, builds and deploys the site through GitHub Actions

Publishing notes:
- Confidential interfaces and values are recreated, simplified or anonymised.
- The EV case study is presented as a standalone research project and does not claim implementation.
- The iSolarCloud evaluation is presented as a shared project with Maria Ciccarelli; Adair was the primary interviewer and both designers shared planning, synthesis, prioritisation and reporting.
- The evaluation findings informed ongoing product iterations.
- Contact, LinkedIn and CV links are active.
- The canonical production URL is https://adaircampos.com.
- The tracked source intentionally keeps `TODO_LEGAL_ADDRESS`; the production build replaces it from the encrypted GitHub Actions secret `LEGAL_ADDRESS`.
- Google Analytics uses measurement ID `G-FKVRQR01B0` and does not load until a visitor accepts analytics.
- Legal pages are linked in the footer but excluded from the sitemap, marked `noindex`, and excluded from analytics measurement.
