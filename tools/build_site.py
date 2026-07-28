from __future__ import annotations

import html
import os
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
PLACEHOLDER = "TODO_LEGAL_ADDRESS"

PUBLIC_FILES = (
    "index.html",
    "case-study-energy-flow.html",
    "case-study-ev-research.html",
    "case-study-isolarcloud-evaluation.html",
    "cv.html",
    "privacy.html",
    "impressum.html",
    "404.html",
    "accessibility-audit.html",
    "styles.css",
    "script.js",
    "site-config.js",
    "robots.txt",
    "sitemap.xml",
    "CNAME",
    "Adair_Campos_Senior_Product_Designer_CV.pdf",
)


def legal_address_markup() -> str:
    value = os.environ.get("LEGAL_ADDRESS", "").strip()
    if not value or value == PLACEHOLDER:
        raise SystemExit(
            "LEGAL_ADDRESS is missing. Add it as a GitHub Actions repository secret before deployment."
        )
    if len(value) < 12:
        raise SystemExit("LEGAL_ADDRESS appears incomplete; deployment stopped.")
    lines = [html.escape(line.strip()) for line in value.splitlines() if line.strip()]
    if not lines:
        raise SystemExit("LEGAL_ADDRESS contains no usable address; deployment stopped.")
    return "<br/>".join(lines)


def copy_public_site(address_markup: str) -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()

    for relative in PUBLIC_FILES:
        source = ROOT / relative
        if not source.exists():
            raise SystemExit(f"Required public file is missing: {relative}")
        destination = OUTPUT / relative
        if source.suffix == ".html":
            content = source.read_text(encoding="utf-8")
            if relative in {"privacy.html", "impressum.html"}:
                content = content.replace(PLACEHOLDER, address_markup)
                content, count = re.subn(
                    r"<!-- DEPLOY_REMOVE_START -->.*?<!-- DEPLOY_REMOVE_END -->",
                    "",
                    content,
                    flags=re.DOTALL,
                )
                if count != 1:
                    raise SystemExit(f"Expected one local-preview notice in {relative}; found {count}.")
            destination.write_text(content, encoding="utf-8")
        else:
            shutil.copy2(source, destination)

    shutil.copytree(ROOT / "assets", OUTPUT / "assets")
    (OUTPUT / ".nojekyll").write_text("", encoding="utf-8")

    remaining = [
        path.relative_to(OUTPUT)
        for path in OUTPUT.rglob("*")
        if path.is_file() and PLACEHOLDER in path.read_text(encoding="utf-8", errors="ignore")
    ]
    if remaining:
        raise SystemExit(f"Publication placeholder remains in generated files: {remaining}")


if __name__ == "__main__":
    copy_public_site(legal_address_markup())
    print("Production site generated successfully; the private address was not printed.")
