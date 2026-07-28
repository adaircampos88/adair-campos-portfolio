# adaircampos.design launch checklist

The site is deliberately **not ready to publish** until the two `TODO_` values are replaced and the legal text is approved.

## 1. Complete the required private details

- Replace every `TODO_LEGAL_ADDRESS` in `impressum.html` and `privacy.html` with a complete serviceable address.
- Have the bilingual legal text reviewed for the actual setup.
- Create the Google Analytics property described below and replace `TODO_GA_MEASUREMENT_ID` in `site-config.js` with the `G-...` web-stream ID.
- In GA4 Admin, set event-data retention to **2 months**, leave Google Signals disabled, and do not enable advertising personalisation.

## 2. Google Analytics 4

Create:

- Property: `Adair Campos Portfolio`
- Time zone: `Europe/Berlin`
- Currency: `EUR`
- Web stream: `https://adaircampos.design`

The implementation uses basic Consent Mode. Google Analytics is not requested until a visitor explicitly accepts. Only these events are implemented:

- `page_view`
- `case_study_open`
- `cv_download`
- `contact_click`
- `linkedin_click`

## 3. Create and push the public GitHub repository

Create `adaircampos88/adair-campos-portfolio` as a public, empty repository. Do not add a generated README or `.gitignore`, because the local repository already contains its history.

Then run from this folder:

```bash
git remote add origin https://github.com/adaircampos88/adair-campos-portfolio.git
git push -u origin main
```

In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)**.

## 4. Purchase and connect the domain

Purchase `adaircampos.design` through Cloudflare Registrar after reconfirming availability at checkout. In the GitHub Pages settings, set the custom domain to `adaircampos.design` before changing DNS.

At Cloudflare DNS, use DNS-only records during verification:

| Type | Name | Content |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | adaircampos88.github.io |

Remove conflicting apex or `www` records. After GitHub verifies the domain, enable **Enforce HTTPS**. GitHub Pages should serve the apex domain and redirect `www` to it.

## 5. Final release verification

- Confirm `rg -n "TODO_" privacy.html impressum.html site-config.js` returns no results.
- Test the site at 320, 390, 768, 1024 and 1440 px in light and dark modes.
- Verify keyboard navigation, focus, reduced motion, 200% zoom, increased text spacing and contrast.
- Confirm no request to `googletagmanager.com` or `google-analytics.com` occurs before consent or after rejection.
- Confirm the five approved GA events after acceptance and again after consent withdrawal.
- Verify all three case studies, images, PDF download, email, LinkedIn, legal pages and mobile navigation.
- Verify canonical tags, `robots.txt`, `sitemap.xml`, structured data, social preview and `404.html`.
- Check `https://adaircampos.design` and the `www` redirect over HTTPS with no mixed content.
- Run mobile and desktop Lighthouse reports targeting 90+ for Performance, Accessibility, Best Practices and SEO.
- Require a clean Git tree, create a launch commit and tag it only after every blocker is cleared.

## Launch gate

Do not add the live URL to LinkedIn until:

1. the legal address is present;
2. the legal text is approved;
3. the GA measurement ID and retention settings are complete;
4. HTTPS and redirects work;
5. final QA passes.
