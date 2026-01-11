# Appic

一个基于 Web 的现代化图形设计编辑器，使用 React + TypeScript + Fabric.js 构建。

## 功能特性

### 核心功能
- **画布编辑** - 基于 Fabric.js 的强大画布编辑能力
- **图层管理** - 可视化图层列表，支持拖拽排序、可见性控制和图层锁定
- **对象操作** - 支持文本、形状（矩形、圆形）、图片等多种对象类型
- **属性编辑** - 精确控制对象的位置、大小、颜色、透明度等属性
- **多页面设计** - 支持在同一个项目中创建和管理多个设计页面
- **撤销/重做** - 完整的历史记录管理，支持撤销和重做操作
- **导出功能** - 将设计导出为 PNG、JPEG、SVG 等多种格式

### 交互体验
- **拖拽排序** - 使用 @dnd-kit 实现流畅的图层拖拽排序
- **实时预览** - 所有编辑操作实时反映到画布
- **选中同步** - 画布对象选中状态与图层列表自动同步
- **响应式布局** - 灵活的三栏布局，适配不同屏幕尺寸

## 技术栈

- **前端框架**: React 19.2.0 + TypeScript 5.9
- **构建工具**: Vite 7.2
- **样式方案**: Tailwind CSS 4.1
- **Canvas 库**: Fabric.js 7.1
- **拖拽功能**: @dnd-kit
- **图标库**: lucide-react

## 项目结构

```
src/
├── application/       # 应用层服务
├── components/        # React 组件
│   ├── canvas/       # 画布相关组件
│   ├── layout/       # 布局组件
│   ├── panel/        # 面板组件（图层、属性等）
│   └── toolbar/      # 工具栏组件
├── contexts/         # React Context（状态管理）
├── core/             # 核心业务逻辑
│   ├── domain/       # 领域模型和事件
│   └── types/        # 核心类型定义
├── hooks/            # 自定义 React Hooks
├── infrastructure/   # 基础设施（DI、事件总线、命令总线等）
├── presentation/     # 展示层
│   ├── controllers/  # 控制器
│   ├── hooks/        # 展示层 Hooks
│   ├── stores/       # 状态存储
│   └── views/        # 视图组件
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
│   └── fabric/       # Fabric.js 相关工具
└── constants/        # 常量定义
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 架构设计

本项目采用分层架构设计：

1. **展示层 (Presentation)** - 负责 UI 渲染和用户交互
2. **应用层 (Application)** - 处理业务用例和流程编排
3. **领域层 (Core/Domain)** - 包含核心业务逻辑和领域模型
4. **基础设施层 (Infrastructure)** - 提供技术支持和交叉关注点

### 状态管理

使用 React Context API 进行全局状态管理：
- `DesignContext` - 设计、页面、图层状态
- `CanvasContext` - Canvas 对象选中状态和配置

### 设计模式

- **依赖注入** - 使用容器管理依赖关系
- **事件驱动** - 事件总线实现组件间解耦通信
- **命令模式** - 命令总线封装操作意图
- **仓储模式** - 统一的数据访问接口

## 使用指南

### 创建设计

1. 点击左上角的设计标题区域
2. 输入设计名称
3. 创建第一个页面开始设计

### 添加对象

使用底部工具栏可以添加：
- **文本** - 点击文本图标添加文本对象
- **形状** - 支持矩形、圆形等基本形状
- **图片** - 点击图片图标上传本地图片

### 编辑图层

在右侧图层面板中可以：
- **拖拽排序** - 拖动图层调整显示顺序
- **切换可见性** - 点击眼睛图标显示/隐藏图层
- **锁定图层** - 点击锁图标防止误操作
- **选中编辑** - 点击图层选中并编辑属性

### 导出设计

点击画布右上角的导出按钮，选择导出格式：
- PNG（支持透明背景）
- JPEG
- SVG

## 开发指南

### 添加新的对象类型

1. 在 `src/utils/fabric/objectFactory.ts` 中添加创建函数
2. 在 `src/types/canvas.types.ts` 中更新类型定义
3. 在底部工具栏中添加对应的按钮

### 扩展属性编辑

1. 在 `src/components/panel/PropertyEditor.tsx` 中添加新的属性控件
2. 使用 `handlePropertyChange` 函数更新属性

### 自定义画布配置

修改 `src/constants/canvas.ts` 中的 `defaultCanvasConfig`

## 许可证

MIT
