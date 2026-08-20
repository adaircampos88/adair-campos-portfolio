from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    "index.html",
    "case-study-energy-flow.html",
    "case-study-ev-research.html",
    "case-study-isolarcloud-evaluation.html",
    "cv.html",
    "privacy.html",
    "impressum.html",
    "404.html",
]
CANONICAL_PAGES = [page for page in PUBLIC_PAGES if page != "404.html"]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self.meta: list[dict[str, str]] = []
        self.h1_count = 0
        self.title_count = 0
        self.scripts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag in {"a", "link"} and values.get("href"):
            self.links.append((tag, values["href"]))
        if tag in {"img", "script", "iframe"} and values.get("src"):
            self.links.append((tag, values["src"]))
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])
        if tag == "meta":
            self.meta.append(values)
        if tag == "h1":
            self.h1_count += 1
        if tag == "title":
            self.title_count += 1


def is_local(reference: str) -> bool:
    return not reference.startswith(("https://", "http://", "mailto:", "tel:", "javascript:", "data:"))


def local_target(reference: str) -> Path | None:
    split = urlsplit(reference)
    if not split.path or split.path == "/":
        return ROOT / "index.html"
    path = split.path.lstrip("/")
    return ROOT / path


errors: list[str] = []
for page_name in PUBLIC_PAGES:
    page_path = ROOT / page_name
    if not page_path.exists():
        errors.append(f"Missing page: {page_name}")
        continue
    parser = PageParser()
    parser.feed(page_path.read_text(encoding="utf-8"))
    if parser.h1_count != 1:
        errors.append(f"{page_name}: expected one h1, found {parser.h1_count}")
    if parser.title_count != 1:
        errors.append(f"{page_name}: expected one title, found {parser.title_count}")
    descriptions = [meta for meta in parser.meta if meta.get("name") == "description" and meta.get("content")]
    if not descriptions:
        errors.append(f"{page_name}: missing meta description")
    if page_name in CANONICAL_PAGES and 'rel="canonical"' not in page_path.read_text(encoding="utf-8"):
        errors.append(f"{page_name}: missing canonical link")
    for required in ("og:title", "og:description", "og:image"):
        if page_name != "404.html" and not any(meta.get("property") == required for meta in parser.meta):
            errors.append(f"{page_name}: missing {required}")
    if page_name not in {"404.html", "privacy.html", "impressum.html"} and "site-config.js" not in parser.scripts:
        errors.append(f"{page_name}: missing site-config.js")
    for tag, reference in parser.links:
        if not is_local(reference):
            continue
        target = local_target(reference)
        if target and not target.exists():
            errors.append(f"{page_name}: missing local {tag} target {reference}")

index = (ROOT / "index.html").read_text(encoding="utf-8")
VERIFIED_CASE_STUDIES = set(PUBLIC_PAGES[1:4])
for case_study in VERIFIED_CASE_STUDIES:
    if case_study not in index:
        errors.append(f"Homepage does not link to {case_study}")

homepage_case_studies = set(re.findall(r'href=["\'](case-study-[^"\']+\.html)["\']', index))
if homepage_case_studies != VERIFIED_CASE_STUDIES:
    errors.append(
        "Homepage case studies must be exactly the three verified projects; "
        f"found {sorted(homepage_case_studies)}"
    )

if len(list((ROOT / "assets" / "projects").rglob("*.webp"))) < 20:
    errors.append("Expected at least 20 project image assets")

for required_file in (
    "CNAME", "robots.txt", "sitemap.xml", "site-config.js", "Adair_Campos_Senior_Product_Designer_CV.pdf",
    "Adair_Campos_Product_Designer_CV.pdf", "Adair_Campos_UX_UI_Designer_CV.pdf",
    "assets/meta/favicon.svg", "assets/meta/apple-touch-icon.png", "assets/meta/og-portfolio.png",
    "tools/build_site.py", ".github/workflows/deploy-pages.yml",
    "energy-prototype/index.html",
    "case-study-energy-flow.css", "case-study-energy-flow.js",
):
    if not (ROOT / required_file).exists():
        errors.append(f"Missing launch file: {required_file}")

expected_todos = {
    "TODO_LEGAL_ADDRESS": {"privacy.html", "impressum.html", "LAUNCH-CHECKLIST.md", "README.txt"},
    "TODO_GA_MEASUREMENT_ID": {"site-config.js", "LAUNCH-CHECKLIST.md", "README.txt"},
}
for todo, allowed_files in expected_todos.items():
    found = {
        path.name
        for path in ROOT.iterdir()
        if path.is_file() and todo in path.read_text(encoding="utf-8", errors="ignore")
    }
    unexpected = found - allowed_files
    if unexpected:
        errors.append(f"{todo} appears unexpectedly in {sorted(unexpected)}")

if re.search(r'<script[^>]+src=["\']https://(?:www\.)?google', index, flags=re.I):
    errors.append("Homepage contains a statically loaded Google script")

for legal_page in ("privacy.html", "impressum.html"):
    legal_content = (ROOT / legal_page).read_text(encoding="utf-8")
    if 'name="robots"' not in legal_content or "noindex" not in legal_content:
        errors.append(f"{legal_page}: missing noindex directive")

sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
for legal_page in ("privacy.html", "impressum.html"):
    if legal_page in sitemap:
        errors.append(f"sitemap.xml should not list privacy-sensitive page {legal_page}")

energy_page = (ROOT / "case-study-energy-flow.html").read_text(encoding="utf-8")
for required_shell_marker in (
    'class="site-header airbnb-header"',
    'class="airbnb-desktop-nav"',
    'class="mobile-bottom-nav"',
    'class="theme-toggle"',
    'class="cookie-settings-button"',
    'href="https://www.linkedin.com/in/adair-campos-b1b5415a"',
    'href="mailto:adaircampos88@gmail.com"',
    'src="script.js"',
    'src="case-study-energy-flow.js"',
    'data-case-section-link="research-chapter"',
    'data-case-section-link="design-chapter"',
    'data-case-section-link="reflection"',
):
    if required_shell_marker not in energy_page:
        errors.append(f"case-study-energy-flow.html: missing production shell marker {required_shell_marker}")

for forbidden_copy in (
    "noindex",
    "Not published",
    "Preview controls",
    "Local process lab",
    "Review before integration",
    "Potential story transition",
    "case-study-energy-flow-lab",
):
    if forbidden_copy in energy_page:
        errors.append(f"case-study-energy-flow.html: contains private/lab marker {forbidden_copy}")

if errors:
    print("Site validation failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print(f"Validated {len(PUBLIC_PAGES)} public pages.")
print("All local links and assets resolve.")
print("Three verified case studies and project assets are present.")
print("Launch metadata files are present.")
blockers = []
if "TODO_LEGAL_ADDRESS" in (ROOT / "privacy.html").read_text(encoding="utf-8") or "TODO_LEGAL_ADDRESS" in (ROOT / "impressum.html").read_text(encoding="utf-8"):
    blockers.append("TODO_LEGAL_ADDRESS")
if "TODO_GA_MEASUREMENT_ID" in (ROOT / "site-config.js").read_text(encoding="utf-8"):
    blockers.append("TODO_GA_MEASUREMENT_ID")
if blockers:
    print("Publication blockers:", ", ".join(blockers))
else:
    print("No publication TODOs remain.")
