# 每日计划

一个简洁的每日计划程序，支持任务添加和完成情况记录。支持 **iOS 手机 / iPad** 以「添加到主屏幕」方式当 App 使用。

## 功能

- **添加任务**：输入任务内容后点击「添加」或按回车
- **完成记录**：点击任务前的圆圈标记为已完成/未完成
- **删除任务**：点击任务右侧的 × 删除
- **日期切换**：选择不同日期查看对应日期的计划
- **完成统计**：显示总任务数、已完成数、完成率
- **任务分组**：按工作/学习/生活等分组展示
- **昨日回顾与复盘**：查看前一天完成情况并写复盘
- **整体缩放**：页面头部可放大/缩小
- **本地存储**：数据保存在浏览器 localStorage，刷新不丢失

## 在 iPhone / iPad 上使用（PWA）

需要先让应用跑在 **HTTPS 网址** 上，再用 Safari「添加到主屏幕」。任选下面一种方式即可。

### 方式一：GitHub Pages（推荐，免费 HTTPS）

**第一步：在 GitHub 新建仓库**

1. 打开 [github.com/new](https://github.com/new)。
2. **Repository name** 填：`daily-plan`（或任意英文名，如 `my-daily-plan`）。
3. 选 **Public**，**不要**勾选 “Add a README file”。
4. 点击 **Create repository**。

**第二步：把本项目的代码推上去**

1. 确保本机已安装 [Git](https://git-scm.com/downloads)，在终端进入本项目目录（例如 `demo3`）。
2. 将下面命令里的 **`你的用户名`** 换成你的 GitHub 用户名（仓库名已用 `daily-plan`），整段复制到终端执行：

```bash
git init
git add .
git commit -m "init: 每日计划 PWA"
git branch -M main
git remote add origin https://github.com/你的用户名/daily-plan.git
git push -u origin main
```

3. 若提示未配置用户，先执行（替换成你的昵称和邮箱）：
   ```bash
   git config --global user.name "你的名字"
   git config --global user.email "你的邮箱@example.com"
   ```

   **Windows 用户**：安装 Git 后，可在本项目目录用「命令提示符」执行（将 `你的用户名` 换成你的 GitHub 用户名）：
   ```bat
   deploy-to-github.bat 你的用户名
   ```
   脚本会自动完成 `git init`、首次提交、添加远程并推送到 `daily-plan` 仓库。

**第三步：开启 GitHub Pages**

1. 在该仓库页面点 **Settings** → 左侧 **Pages**。
2. 在 **Build and deployment** 里，**Source** 选择 **GitHub Actions**（不要选 “Deploy from a branch”）。
3. 若上一步已推送代码，Actions 会自动跑完部署；也可到 **Actions** 页手动运行 **Deploy to GitHub Pages** workflow。
4. 部署完成后，在 **Settings → Pages** 会看到站点地址：
   - 仓库名为 `daily-plan` 时：**`https://你的用户名.github.io/daily-plan/`**
   - 若仓库名是 `你的用户名.github.io`，则为：`https://你的用户名.github.io/`

**第四步：在手机上使用**

用 iPhone / iPad 的 **Safari** 打开上面的地址，然后 **分享 → 添加到主屏幕** 即可。

### 方式二：Netlify（免费 HTTPS）

1. 打开 [netlify.com](https://www.netlify.com)，用 GitHub 登录。
2. **Add new site → Import an existing project**，选 GitHub 并选中本项目的仓库。
3. 构建设置已写在 `netlify.toml` 里，直接点 **Deploy**。
4. 部署完成后会得到 `https://随机名.netlify.app`，可改名为 `https://每日计划.netlify.app` 等。
5. 用手机 Safari 打开该地址，**分享 → 添加到主屏幕**。

### 方式三：Vercel（免费 HTTPS）

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录。
2. **Add New → Project**，导入本项目的仓库。
3. 无需改配置，直接 **Deploy**。
4. 完成后得到 `https://项目名.vercel.app`。
5. 用手机 Safari 打开该地址，**分享 → 添加到主屏幕**。

### 方式四：本机 + HTTPS 隧道（不部署到网上）

适合只在当前网络、临时用手机访问：

1. 在项目目录运行本地服务：
   ```bash
   npm run start
   ```
2. **另开一个终端**，运行隧道（会得到一个 HTTPS 链接）：
   ```bash
   npm run tunnel
   ```
3. 终端里会打印类似 `your url is: https://xxx.loca.lt`，用手机 Safari 打开这个链接即可（首次可能要点 “Click to Continue”）。
4. 在 Safari 里 **分享 → 添加到主屏幕** 即可。

> 隧道关闭后链接会失效，下次需重新执行 `npm run tunnel`。数据仍在手机本地，不会丢。

---

**添加到主屏幕（任选一种方式得到 HTTPS 后）：**

1. 用 **Safari** 打开上面的 HTTPS 地址。
2. 点击底部 **「分享」** → **「添加到主屏幕」**，名称可保持「每日计划」，点 **「添加」**。
3. 主屏幕会出现「每日计划」图标，点开即全屏使用，数据保存在本机，可离线使用（需先在线打开过一次）。

## 本地使用（电脑）

直接用浏览器打开 `index.html` 即可；或使用本地服务器：

```bash
npx serve .
```

## 文件说明

- `index.html` - 主页面（含 PWA 与 iOS meta）
- `manifest.json` - PWA 配置（名称、图标、全屏等）
- `sw.js` - Service Worker（离线缓存）
- `icon.svg` - 应用图标（主屏幕图标）
- `styles.css` - 样式
- `app.js` - 逻辑与本地存储
- `package.json` - 脚本：`npm run start` 本地运行，`npm run tunnel` 生成 HTTPS 隧道
- `.github/workflows/deploy-pages.yml` - GitHub Actions，推送到 main/master 后自动部署到 GitHub Pages
- `deploy-to-github.bat` - Windows 一键推送到 GitHub 的 `daily-plan` 仓库（用法：`deploy-to-github.bat 你的用户名`）
- `netlify.toml` / `vercel.json` - Netlify、Vercel 部署配置
