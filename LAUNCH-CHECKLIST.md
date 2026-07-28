# adaircampos.com launch checklist

The site is deliberately **not ready to publish** until the encrypted `LEGAL_ADDRESS` repository secret is present and the legal text is approved. The tracked HTML intentionally retains `TODO_LEGAL_ADDRESS`; GitHub Actions replaces it only inside the deployment artifact.

## 1. Complete the required private details

- Add a repository Actions secret named `LEGAL_ADDRESS` containing the complete serviceable address. Use two lines: street and house number, then postcode and city.
- Do not replace `TODO_LEGAL_ADDRESS` in the tracked source files; this prevents the address from entering the public Git history.
- Have the bilingual legal text reviewed for the actual setup.
- Completed: Google Analytics property, web stream and measurement ID (`G-FKVRQR01B0`).
- Completed: event and user-data retention set to **2 months**, Google Signals disabled, advertising personalisation disabled and enhanced measurement disabled.

## 2. Google Analytics 4

Create:

- Property: `Adair Campos Portfolio`
- Time zone: `Europe/Berlin`
- Currency: `EUR`
- Web stream: `https://adaircampos.com`

The implementation uses basic Consent Mode. Google Analytics is not requested until a visitor explicitly accepts. Only these events are implemented:

- `page_view`
- `case_study_open`
- `cv_download`
- `contact_click`
- `linkedin_click`

## 3. Push the public GitHub repository

Repository: `adaircampos88/adair-campos-portfolio`.

Push from this folder:

```bash
git push -u origin main
```

In GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**. The workflow validates the source, inserts `LEGAL_ADDRESS` without printing it, uploads the generated `_site` artifact and deploys it.

## 4. Purchase and connect the domain

`adaircampos.com` has been purchased through Cloudflare Registrar. In the GitHub Pages settings, confirm the custom domain is `adaircampos.com`.

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

- Confirm the source still contains `TODO_LEGAL_ADDRESS` and the generated `_site/privacy.html` and `_site/impressum.html` do not.
- Confirm the workflow fails safely when `LEGAL_ADDRESS` is absent.
- Test the site at 320, 390, 768, 1024 and 1440 px in light and dark modes.
- Verify keyboard navigation, focus, reduced motion, 200% zoom, increased text spacing and contrast.
- Confirm no request to `googletagmanager.com` or `google-analytics.com` occurs before consent or after rejection.
- Confirm the five approved GA events after acceptance and again after consent withdrawal.
- Verify all three case studies, images, PDF download, email, LinkedIn, legal pages and mobile navigation.
- Verify canonical tags, `robots.txt`, `sitemap.xml`, structured data, social preview and `404.html`. Confirm the legal pages are not in the sitemap and include `noindex`.
- Check `https://adaircampos.com` and the `www` redirect over HTTPS with no mixed content.
- Run mobile and desktop Lighthouse reports targeting 90+ for Performance, Accessibility, Best Practices and SEO.
- Require a clean Git tree, create a launch commit and tag it only after every blocker is cleared.

## Launch gate

Do not add the live URL to LinkedIn until:

1. the legal address is present in the deployed legal pages but absent from tracked source history;
2. the legal text is approved;
3. the GA measurement ID and retention settings are complete;
4. HTTPS and redirects work;
5. final QA passes.
