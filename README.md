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

## 每日自动上传

日报 Agent 生成 `日报/output/*.md` 和 `日报/output/*.html` 后，运行：

```bash
./scripts/publish_reports.sh "Update daily report YYYY-MM-DD"
```

脚本会自动：

1. 重新生成 `docs/index.html` 和 `docs/reports/*.html`
2. 暂存日报、站点、脚本和相关资料
3. 没有变化时自动跳过
4. 有变化时提交并 push 到 GitHub

push 成功后，GitHub Actions 会自动发布 GitHub Pages。

## 注意

报告内容仅供学习用途，不构成投资建议。


## 产品学习指南

- 本地文件：`study/product-learning-guide.html`
- 发布文件：`docs/study/product-learning-guide.html`
- 首页入口：`docs/index.html` 中的“信贷风控中后台产品 7 天学习指南”
