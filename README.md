# System Thinking Lab

一个运行在浏览器中的因果回路图与系统动力学模拟实验室。

它帮助用户完成：

> 描述问题 → 绘制因果关系 → 识别反馈回路 → 调整参数 → 运行时间仿真 → 比较系统行为

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/weepwood/system-thinking-lab)

## 当前版本

首个可运行 MVP 已包含：

- 因果关系图编辑器：库存、流量、辅助变量与参数节点
- 正向和反向因果连接
- 时间延迟标记
- 自动识别增强回路与平衡回路
- Euler 时间步进仿真
- 参数滑块和仿真时间设置
- ECharts 时间变化曲线
- 基于结构与结果的系统解释
- 浏览器本地保存
- STLab JSON 导入与导出
- 撤销与重做
- Netlify SPA 部署配置
- GitHub Actions 构建与测试

## 内置经典模型

1. 平台增长与服务器容量
2. SIR 传染病模型
3. 捕食者—猎物模型
4. 公地悲剧
5. 银行挤兑
6. 技术扩散

每个模型都带有可编辑因果关系图、默认参数、时间仿真函数、关键观察指标和建议实验问题。

## 技术栈

- React 19 + TypeScript
- Vite
- React Flow / XYFlow
- ECharts
- Zustand
- Vitest
- Netlify

## 本地运行

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
npm run preview
```

运行测试：

```bash
npm test
```

## Netlify 部署

点击 README 顶部的 **Deploy to Netlify** 按钮，或在 Netlify 中导入 `weepwood/system-thinking-lab`。

Netlify 会自动读取 `netlify.toml`：

- 构建命令：`npm run build`
- 发布目录：`dist`
- Node.js：22
- SPA 回退：所有路由返回 `index.html`

## 项目结构

```text
src/
├─ components/       # 画布、参数、结果和检查器
├─ engine/           # 回路分析与结果解释
├─ models/           # 经典模型及仿真函数
├─ types/            # 领域模型定义
├─ App.tsx
├─ store.ts          # Zustand 工作区状态
└─ styles.css
```

## 模型文件

导出的 `.stlab.json` 将模型语义、画布布局、参数和仿真设置保存在一个版本化文件中。当前格式版本为 `1.0`。

## 设计边界

当前版本是系统动力学学习与实验 MVP，不试图替代 Vensim、Stella 等成熟专业软件。

后续规划：

- 通用方程编辑器和 AST
- 库存流量图专用语义
- RK4 求解器
- 参数敏感性分析
- 多情景对比
- 蒙特卡洛模拟
- 模型版本历史
- AI 建模建议
- XMILE 有限导入与导出

## License

MIT
