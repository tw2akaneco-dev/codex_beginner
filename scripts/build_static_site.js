const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "日报", "output");
const docsDir = path.join(root, "docs");
const reportsDir = path.join(docsDir, "reports");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readTitle(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/i);
  if (title) return title[1].trim();
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return h1 ? h1[1].replace(/<[^>]+>/g, "").trim() : path.basename(filePath, ".html");
}

function inferDate(name) {
  const match = name.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function inferType(name, title) {
  const text = `${name} ${title}`;
  if (text.includes("早间")) return "早报";
  if (text.includes("晚间")) return "晚报";
  if (text.includes("周")) return "周报";
  if (text.includes("月")) return "月报";
  if (text.includes("年")) return "年报";
  return "报告";
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function build() {
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Missing report output directory: ${outputDir}`);
  }

  fs.mkdirSync(docsDir, { recursive: true });
  ensureCleanDir(reportsDir);

  const reports = fs
    .readdirSync(outputDir)
    .filter((name) => name.endsWith(".html"))
    .sort()
    .reverse()
    .map((name) => {
      const source = path.join(outputDir, name);
      const target = path.join(reportsDir, name);
      fs.copyFileSync(source, target);
      const title = readTitle(source);
      return {
        name,
        title,
        date: inferDate(name),
        type: inferType(name, title),
        href: `reports/${encodeURIComponent(name)}`,
      };
    });

  fs.writeFileSync(path.join(docsDir, ".nojekyll"), "", "utf8");
  fs.writeFileSync(path.join(docsDir, "index.html"), renderIndex(reports), "utf8");
  console.log(`Built ${reports.length} report(s) into ${docsDir}`);
}

function renderIndex(reports) {
  const cards = reports.length
    ? reports
        .map(
          (report) => `<article class="report-card">
            <div class="meta">
              <span>${escapeHtml(report.date || "未注明日期")}</span>
              <span>${escapeHtml(report.type)}</span>
            </div>
            <h2>${escapeHtml(report.title)}</h2>
            <a href="${report.href}">打开报告</a>
          </article>`
        )
        .join("\n")
    : `<p class="empty">还没有可发布的 HTML 报告。</p>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>大类资产与政经日报</title>
  <style>
    :root {
      --bg: #f5f7f8;
      --paper: #ffffff;
      --text: #1d2939;
      --muted: #667085;
      --line: #d9e2ec;
      --accent: #167f78;
      --sidebar: #0f302d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.7;
    }
    header {
      background: var(--sidebar);
      color: #eef8f6;
      padding: 48px 24px;
    }
    .wrap {
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(30px, 5vw, 48px);
      line-height: 1.15;
      letter-spacing: 0;
    }
    .lead {
      max-width: 720px;
      margin: 0;
      color: rgba(255, 255, 255, 0.76);
      font-size: 17px;
    }
    main {
      padding: 28px 0 56px;
    }
    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .report-card {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .meta span {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 3px 10px;
      color: var(--muted);
      font-size: 13px;
    }
    h2 {
      margin: 0 0 16px;
      font-size: 20px;
      line-height: 1.4;
      letter-spacing: 0;
    }
    a {
      color: var(--accent);
      font-weight: 700;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
    }
    .empty {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
      color: var(--muted);
    }
    footer {
      padding: 20px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <h1>大类资产与政经日报</h1>
      <p class="lead">把本地生成的日报发布为可跨设备访问的静态网页。内容仅供学习用途，不构成投资建议。</p>
    </div>
  </header>
  <main>
    <div class="wrap">
      <div class="report-grid">
        ${cards}
      </div>
      <footer>学习用途，不构成投资建议。</footer>
    </div>
  </main>
</body>
</html>
`;
}

build();
