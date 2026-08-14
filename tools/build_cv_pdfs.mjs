import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "/Users/dratriga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const portfolioRoot = resolve(scriptDirectory, "..");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pythonPath =
  "/Users/dratriga/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const documents = [
  {
    source: join(portfolioRoot, "cv-product-print.html"),
    output: join(portfolioRoot, "Adair_Campos_Product_Designer_CV.pdf"),
  },
  {
    source: join(portfolioRoot, "cv-uxui-print.html"),
    output: join(portfolioRoot, "Adair_Campos_UX_UI_Designer_CV.pdf"),
  },
];

const mergeScript = String.raw`
from pathlib import Path
import sys
from pypdf import PdfReader, PdfWriter

parts = [Path(value) for value in sys.argv[1:-1]]
output = Path(sys.argv[-1])
writer = PdfWriter()
for part in parts:
    reader = PdfReader(part)
    if len(reader.pages) != 1:
        raise SystemExit(f"Expected one page in {part}, found {len(reader.pages)}")
    writer.add_page(reader.pages[0])
with output.open("wb") as handle:
    writer.write(handle)
`;

async function renderDocument(browser, document) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "adair-cv-pages-"));
  const pageFiles = [];

  try {
    for (let pageIndex = 0; pageIndex < 2; pageIndex += 1) {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(document.source).href, { waitUntil: "networkidle" });
      await page.evaluate((selectedIndex) => {
        const pages = [...document.querySelectorAll("article.page")];
        if (pages.length !== 2) {
          throw new Error(`Expected two CV page elements, found ${pages.length}`);
        }
        const selectedPage = pages[selectedIndex].cloneNode(true);
        const main = document.createElement("main");
        main.append(selectedPage);
        document.body.replaceChildren(main);
        selectedPage.style.breakBefore = "auto";
        selectedPage.style.breakAfter = "auto";
        selectedPage.style.pageBreakBefore = "auto";
        selectedPage.style.pageBreakAfter = "auto";
      }, pageIndex);
      await page.emulateMedia({ media: "print" });

      const pageFile = join(
        temporaryDirectory,
        `${basename(document.output, ".pdf")}-${pageIndex + 1}.pdf`,
      );
      await page.pdf({
        path: pageFile,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      await page.close();
      pageFiles.push(pageFile);
    }

    const merge = spawnSync(pythonPath, ["-c", mergeScript, ...pageFiles, document.output], {
      encoding: "utf8",
    });
    if (merge.status !== 0) {
      throw new Error(merge.stderr || `Could not merge ${basename(document.output)}`);
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  for (const document of documents) {
    await renderDocument(browser, document);
    process.stdout.write(`Built ${document.output}\n`);
  }
} finally {
  await browser.close();
}
