# LLM 性能基准测试平台 (LLM Performance Comp)

这是一个用于集中管理、比较和分析大语言模型 (LLM) 性能基准测试数据的综合平台。旨在为开发者和研究人员提供专业、精准且高效的工具，通过数据可视化和对比分析，帮助优化 LLM 的配置和部署决策。

## 核心功能

1.  **CSV 批量导入**：支持通过上传 CSV 文件快速导入多条基准测试结果。用户可以为导入的数据统一配置模型名称、服务器、芯片和框架等信息。
2.  **手动添加数据**：提供直观的表单，支持手动输入单个基准测试的配置（如并发数、输入/输出长度）和性能指标（如 TTFT、TPOT、TPS）。
3.  **基准测试管理**：提供可搜索、可过滤的列表视图，方便用户浏览、编辑和删除已保存的基准测试数据。
4.  **性能对比分析**：支持选择两个基准测试进行侧边栏对比，直观展示各项性能指标的差异，并提供视觉化的增量分析。
5.  **对比报告保存**：支持将对比结果保存为持久化报告，方便后续查阅和分享。
6.  **社区留言板**：提供一个简单的留言板功能，支持用户发布和分享关于模型性能的见解或反馈。

## 技术栈

- **前端框架**: React 19 + TypeScript
- **后端服务**: Node.js + Express
- **数据库**: SQLite
- **构建工具**: Vite
- **样式库**: Tailwind CSS + Shadcn UI
- **动画/图表**: Framer Motion + Recharts
- **图标**: Lucide React + Phosphor Icons
- **状态管理**: React Query (TanStack Query)

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
cd ..
```

### 启动项目

```bash
# 启动后端服务 (默认端口 3001)
npm run server

# 启动前端开发服务器 (默认端口 5000)
npm run dev
```

### 构建项目

```bash
npm run build
```

## 项目结构

- `src/`: 前端源代码
  - `components/`: React 组件
  - `hooks/`: 自定义 React Hooks (API 交互)
  - `lib/`: 工具函数和类型定义
- `server/`: 后端源代码
  - `index.js`: Express 服务器和数据库初始化
- `tests/`: 测试文件

## 贡献指南

请参考 [PRD.md](PRD.md) 了解详细的功能需求和设计规范。

