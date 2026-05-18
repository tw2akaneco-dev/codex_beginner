const fs = require("fs");
const path = require("path");

const input = process.argv[2];
const output = process.argv[3];

if (!input) {
  console.error("Usage: node render_report_html.js <input.md> [output.html]");
  process.exit(1);
}

const inputPath = path.resolve(input);
const outputPath = output
  ? path.resolve(output)
  : inputPath.replace(/\.md$/i, ".html");

const markdown = fs.readFileSync(inputPath, "utf8");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(text, index) {
  const base = text
    .toLowerCase()
    .replace(/[`*_#[\]().｜|:：，,。？?！!、]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `section-${index}`;
}

function inlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/（待确认）|待确认/g, '<span class="tag tag-warn">待确认</span>');
  html = html.replace(/数据缺失|未获取/g, '<span class="tag tag-missing">$&</span>');
  return html;
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function renderTable(lines, start) {
  const header = splitTableRow(lines[start]);
  let i = start + 2;
  const rows = [];
  while (i < lines.length && /^\s*\|/.test(lines[i])) {
    rows.push(splitTableRow(lines[i]));
    i += 1;
  }

  const thead = `<thead><tr>${header
    .map((cell) => `<th>${inlineMarkdown(cell)}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;
  return {
    html: `<div class="table-wrap"><table>${thead}${tbody}</table></div>`,
    next: i,
  };
}

function parseMeta(lines) {
  const titleLine = lines.find((line) => /^#\s+/.test(line)) || "# 大类资产报告";
  const title = titleLine.replace(/^#\s+/, "").trim();
  const parts = title.split("｜").map((part) => part.trim()).filter(Boolean);
  const datePart = parts.find((part) => /\d{4}(-\d{2}){0,2}/.test(part)) || "";
  const reportType = parts[0] || "大类资产报告";
  return { title, datePart, reportType };
}

function collectSections(lines) {
  const sections = [];
  let count = 0;
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (!match) continue;
    count += 1;
    const title = match[1].trim();
    sections.push({ title, id: slugify(title, count), index: count });
  }
  return sections;
}

function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const sections = collectSections(lines);
  let sectionCursor = 0;
  let inSection = false;
  let html = "";
  let i = 0;

  const closeLists = (state) => {
    let out = "";
    if (state.ul) out += "</ul>";
    if (state.ol) out += "</ol>";
    state.ul = false;
    state.ol = false;
    return out;
  };

  const listState = { ul: false, ol: false };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      html += closeLists(listState);
      i += 1;
      continue;
    }

    if (/^#\s+/.test(line)) {
      html += closeLists(listState);
      i += 1;
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      html += closeLists(listState);
      if (inSection) html += "</section>";
      const section = sections[sectionCursor] || {
        id: slugify(h2[1], sectionCursor + 1),
        index: sectionCursor + 1,
      };
      sectionCursor += 1;
      inSection = true;
      html += `<section class="section" id="${section.id}"><h2><span>${section.index}</span>${inlineMarkdown(
        h2[1].trim()
      )}</h2>`;
      i += 1;
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      html += closeLists(listState);
      html += `<h3>${inlineMarkdown(h3[1].trim())}</h3>`;
      i += 1;
      continue;
    }

    if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      html += closeLists(listState);
      const table = renderTable(lines, i);
      html += table.html;
      i = table.next;
      continue;
    }

    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      html += closeLists(listState);
      html += `<blockquote>${inlineMarkdown(quote[1].trim())}</blockquote>`;
      i += 1;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (listState.ol) html += closeLists(listState);
      if (!listState.ul) {
        html += "<ul>";
        listState.ul = true;
      }
      html += `<li>${inlineMarkdown(bullet[1].trim())}</li>`;
      i += 1;
      continue;
    }

    const ordered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (ordered) {
      if (listState.ul) html += closeLists(listState);
      if (!listState.ol) {
        html += "<ol>";
        listState.ol = true;
      }
      html += `<li>${inlineMarkdown(ordered[2].trim())}</li>`;
      i += 1;
      continue;
    }

    html += closeLists(listState);
    const isBeginnerNote = line.includes("小白理解");
    html += isBeginnerNote
      ? `<div class="beginner-note">${inlineMarkdown(line.trim())}</div>`
      : `<p>${inlineMarkdown(line.trim())}</p>`;
    i += 1;
  }

  html += closeLists(listState);
  if (inSection) html += "</section>";
  return { body: html, sections };
}

const lines = markdown.split(/\r?\n/);
const meta = parseMeta(lines);
const rendered = renderMarkdown(markdown);
const summary = (() => {
  const start = lines.findIndex((line) => /^##\s+给我看的超短版/.test(line));
  if (start < 0) return "用数据和新闻线索复盘全球大类资产。";
  const bullet = lines.slice(start + 1).find((line) => /^\s*[-*]\s+/.test(line));
  return bullet ? bullet.replace(/^\s*[-*]\s+/, "").trim() : "先看结论，再看数据和联动链条。";
})();

const navItems = rendered.sections
  .map(
    (section) =>
      `<a href="#${section.id}"><span>${section.index}.</span>${escapeHtml(section.title)}</a>`
  )
  .join("");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(meta.title)}</title>
  <style>
    :root {
      --sidebar: #0f302d;
      --sidebar-soft: rgba(255, 255, 255, 0.72);
      --paper: #ffffff;
      --bg: #f4f7f8;
      --text: #1d2939;
      --muted: #667085;
      --line: #d9e2ec;
      --accent: #167f78;
      --accent-2: #2f6de0;
      --note: #edf6ff;
      --warn: #fff7e6;
      --missing: #f3f4f6;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.75;
    }
    .layout {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      min-height: 100vh;
    }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 28px 24px;
      background: var(--sidebar);
      color: #eef8f6;
    }
    .sidebar h1 {
      margin: 0 0 18px;
      font-size: 30px;
      line-height: 1.18;
      letter-spacing: 0;
    }
    .sidebar .summary {
      margin: 0 0 24px;
      color: var(--sidebar-soft);
      font-size: 15px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 34px;
    }
    .chip {
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 999px;
      padding: 6px 12px;
      color: #e4f2ef;
      font-size: 13px;
      white-space: nowrap;
    }
    .toc-title {
      margin: 0 0 12px;
      color: #aacbc6;
      font-weight: 700;
      font-size: 14px;
    }
    .toc {
      display: grid;
      gap: 4px;
    }
    .toc a {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 6px;
      align-items: start;
      padding: 8px 10px;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.86);
      text-decoration: none;
      font-size: 15px;
      line-height: 1.45;
    }
    .toc a:hover {
      background: rgba(255, 255, 255, 0.10);
      color: #fff;
    }
    .toc span {
      color: #9cc8c2;
      font-variant-numeric: tabular-nums;
    }
    main {
      min-width: 0;
      padding: 40px 48px 56px;
    }
    .content {
      max-width: 1180px;
      margin: 0 auto;
    }
    .hero {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 28px 32px;
      margin-bottom: 24px;
    }
    .hero h1 {
      margin: 0 0 10px;
      font-size: 34px;
      line-height: 1.25;
      letter-spacing: 0;
    }
    .hero p {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
    }
    .section {
      scroll-margin-top: 24px;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 28px 32px;
      margin: 22px 0;
    }
    h2 {
      margin: 0 0 20px;
      padding-bottom: 14px;
      border-bottom: 4px solid var(--accent);
      font-size: 26px;
      line-height: 1.35;
      letter-spacing: 0;
    }
    h2 span {
      margin-right: 12px;
      color: var(--accent);
      font-size: 16px;
      vertical-align: 3px;
    }
    h3 {
      margin: 24px 0 10px;
      font-size: 21px;
      line-height: 1.45;
      letter-spacing: 0;
    }
    p { margin: 12px 0; }
    ul, ol { padding-left: 22px; margin: 12px 0; }
    li { margin: 7px 0; }
    blockquote {
      margin: 18px 0;
      padding: 16px 20px;
      border-left: 5px solid var(--accent-2);
      background: var(--note);
      color: #213047;
      font-weight: 650;
    }
    .beginner-note {
      margin: 18px 0 4px;
      padding: 16px 18px;
      border-left: 5px solid var(--accent-2);
      background: var(--note);
      color: #24324a;
      font-weight: 600;
    }
    .table-wrap {
      width: 100%;
      overflow-x: auto;
      margin: 16px 0 20px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
      font-size: 14px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      border-right: 1px solid var(--line);
      padding: 12px 14px;
      text-align: left;
      vertical-align: top;
    }
    th:last-child, td:last-child { border-right: 0; }
    tr:last-child td { border-bottom: 0; }
    th {
      background: #eef3f5;
      color: #243042;
      font-weight: 750;
    }
    code {
      padding: 2px 5px;
      border-radius: 5px;
      background: #edf2f7;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.92em;
    }
    .tag {
      display: inline-block;
      margin: 0 2px;
      padding: 1px 7px;
      border-radius: 999px;
      font-size: 0.86em;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .tag-warn { background: var(--warn); color: #9a5b00; border-color: #f4d69c; }
    .tag-missing { background: var(--missing); color: #475467; border-color: #d0d5dd; }
    a {
      color: #155eef;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
    }
    .footer {
      color: var(--muted);
      text-align: center;
      font-size: 13px;
      padding: 26px 0 4px;
    }
    @media (max-width: 900px) {
      .layout { display: block; }
      .sidebar {
        position: relative;
        height: auto;
        padding: 24px 20px;
      }
      .sidebar h1 { font-size: 26px; }
      main { padding: 22px 16px 36px; }
      .hero, .section { padding: 22px 18px; }
      .hero h1 { font-size: 26px; }
      h2 { font-size: 22px; }
      .toc a { grid-template-columns: 24px 1fr; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <h1>${escapeHtml(meta.reportType)}</h1>
      <p class="summary">${inlineMarkdown(summary)}</p>
      <div class="chips">
        ${meta.datePart ? `<span class="chip">${escapeHtml(meta.datePart)}</span>` : ""}
        <span class="chip">HTML 看盘版</span>
        <span class="chip">学习用途</span>
      </div>
      <div class="toc-title">目录</div>
      <nav class="toc">${navItems}</nav>
    </aside>
    <main>
      <div class="content">
        <header class="hero">
          <h1>${escapeHtml(meta.title)}</h1>
          <p>${inlineMarkdown(summary)}</p>
        </header>
        ${rendered.body}
        <footer class="footer">学习用途，不构成投资建议。数据缺失和待确认信息请以后续权威来源为准。</footer>
      </div>
    </main>
  </div>
</body>
</html>
`;

fs.writeFileSync(outputPath, html, "utf8");
console.log(outputPath);
