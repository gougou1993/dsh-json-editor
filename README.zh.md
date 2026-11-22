# JSON 编辑器（dsh-json-editor）

一款运行在 DSH（DeepSeek Harness）中的 JSON 编辑插件。左侧栏提供入口，可在中央面板编辑、格式化、校验 JSON，并以树形结构浏览，所有内容自动保存在浏览器本地。

## 插件信息

- **包名**：`@oakzhong/dsh-json-editor`
- **版本**：1.0.0
- **入口**：左侧栏「JSON 编辑器」
- **类型**：纯 Client 插件（Host 半部为空实现，无后端路由）

## 使用技术

| 层面 | 技术 |
|---|---|
| 插件框架 | DSH Cordis 作用域 bundle（`cordis.patch.yml`，name 为 `@oakzhong/dsh-json-editor`） |
| Client 半部 | `window.__ModuleLoader__.load({ id })` 注册的前端模块，id 为全限定名 |
| UI | React 无 JSX（`React.createElement`），双视图：编辑 / 树形 |
| 样式 | 组件内注入 `<style>`（`data-plugin-css` 标识），使用 DSH 主题 token，适配明暗主题 |
| 国际化 | `ctx.locale.register / bind`，中英双语（zh / en） |
| 数据解析 | 原生 `JSON.parse` / `JSON.stringify`，`useMemo` 实时解析校验 |
| 数据存储 | 浏览器 `localStorage`（键 `dsh-json-editor.content.v1`），输入即自动保存 |
| 文件交互 | `File.text()` 导入，Blob + `URL.createObjectURL` 导出 |

## 功能

### 1. 编辑与校验
- 文本编辑区直接输入 JSON，实时解析并显示「合法 / 无效 / 空」状态
- 错误消息来自 `JSON.parse`，便于定位问题

### 2. 工具栏
- **格式化**：按 2 空格缩进美化 JSON
- **压缩**：移除空白的一行输出
- **校验**：显示当前 JSON 是否合法
- **示例**：载入一段示例 JSON
- **清空**：清空内容（带确认）
- **复制**：复制当前文本到剪贴板
- **导入文件**：从本地 .json 文件读取内容
- **导出**：将当前内容下载为 `data.json`

### 3. 树形视图
- 切换到「树形」标签，以可折叠的树结构浏览 JSON
- 按类型着色：字符串 / 数字 / 布尔 / null / 数组 / 对象
- 数组显示长度，对象显示键数；深层节点默认折叠

### 4. 统计与持久化
- 底部显示字符数、键数量（递归统计）
- 所有编辑自动保存到本机，刷新/重启不丢失

## 目录结构

```
dsh-json-editor/
├── package.json          # 清单（作用域包名）、bundle 配置、client 注入声明
├── cordis.patch.yml      # Loader 插入行
├── index.js              # Host 半部（空实现）
├── client.js             # Client 半部：编辑器、树视图、工具栏、样式
├── locale/
│   ├── zh.json           # 中文显示元信息
│   └── en.json           # 英文显示元信息
├── icon.svg              # 插件图标
├── README.md             # 英文说明
├── README.zh.md          # 本文档（中文）
```

## 安装与使用

1. 通过插件管理器安装该 bundle（`install_bundle` 指向本目录）
2. 左侧栏点击「JSON 编辑器」
3. 输入 JSON，使用工具栏格式化/校验，或切到树形视图浏览
4. 用导入/导出按钮与本地文件交换数据
