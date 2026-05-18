# 大类资产与政经日报静态站点

这个仓库用于保存日报 Markdown/HTML，并把 HTML 报告发布成 GitHub Pages 静态站点。

## 本地生成站点

日报 HTML 放在 `日报/output/` 后，运行：

```bash
node scripts/build_static_site.js
```

脚本会生成：

- `docs/index.html`：报告首页
- `docs/reports/*.html`：可打开的日报页面

## 发布到 GitHub Pages

1. 在 GitHub 创建一个空仓库。
2. 本地添加 remote 并推送：

```bash
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git add .
git commit -m "Add static report site"
git push -u origin main
```

3. 打开 GitHub 仓库的 `Settings -> Pages`。
4. `Build and deployment` 选择 `GitHub Actions`。
5. 等待 `Publish static reports` workflow 成功后，GitHub 会给出一个 `https://...github.io/.../` 链接。

之后每次新增日报并 push，GitHub Actions 会重新构建并发布站点。

## 注意

报告内容仅供学习用途，不构成投资建议。
