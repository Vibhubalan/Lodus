import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "docs", "verification-flows.md");
const outPath = path.join(root, "docs", "verification-flows.pdf");

const md = fs.readFileSync(mdPath, "utf8");

const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

function writeBlock(text, opts = {}) {
  const { fontSize = 10, bold = false, gap = 6 } = opts;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);
  doc.text(text, { width: pageWidth, align: "left" });
  doc.moveDown(gap / 10);
}

for (const rawLine of md.split(/\r?\n/)) {
  const line = rawLine.trimEnd();

  if (line.startsWith("# ")) {
    doc.moveDown(0.3);
    writeBlock(line.slice(2), { fontSize: 18, bold: true, gap: 10 });
    continue;
  }
  if (line.startsWith("## ")) {
    doc.moveDown(0.2);
    writeBlock(line.slice(3), { fontSize: 14, bold: true, gap: 8 });
    continue;
  }
  if (line.startsWith("### ")) {
    writeBlock(line.slice(4), { fontSize: 12, bold: true, gap: 6 });
    continue;
  }
  if (line === "---") {
    doc.moveDown(0.3);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#cccccc")
      .stroke();
    doc.moveDown(0.5);
    continue;
  }
  if (line.startsWith("|")) {
    writeBlock(line.replace(/\|/g, "  ").replace(/`/g, ""), { fontSize: 8, gap: 2 });
    continue;
  }
  if (line.startsWith("- ") || line.startsWith("* ")) {
    writeBlock(`• ${line.slice(2).replace(/`/g, "")}`, { fontSize: 10, gap: 3 });
    continue;
  }
  if (line.startsWith("```")) continue;
  if (!line.trim()) {
    doc.moveDown(0.35);
    continue;
  }
  writeBlock(line.replace(/`/g, "").replace(/\*\*/g, ""), { fontSize: 10, gap: 4 });
}

doc.end();

stream.on("finish", () => {
  console.log(`Wrote ${outPath}`);
});

stream.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
