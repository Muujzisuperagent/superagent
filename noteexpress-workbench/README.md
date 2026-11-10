# NoteExpress 论文工作台

v1.1 起以独立模式运行：新建会话时在 Agent 预设中选择 **NoteExpress 论文模式**，工作台面板会自动展开并挂载全部论文功能（noteexpress 工具、/noteexpress 命令、论文助手系统提示词）。其他模式的会话完全不会出现该面板，也不会注册相关工具。

## 验证结果

- COM 连接、文献检索和 PDF 文本提取：通过；Agensh PDF 共 13 页。
- 原生笔记：可创建笔记条目；HTML/RTF 正文写入报 System Error Code 5 拒绝访问。未实现原生正文写入，界面明确提示。
- 本地笔记：已通过安装后的 noteexpress 工具执行中文保存及读回；验收笔记已清理。
- UI：Client conversation.input.dock 插槽已实时注册，模式外会话面板不渲染、不请求。模式内自动展开的完整体验需在论文模式会话中验收。JavaScript 语法与界面静态检测通过。桌面无障碍读取先超时、后报私有文件 DACL 错误，因此实际渲染与按钮交互未完成验收。
- 模式隔离：preset-noteexpress 预设行已激活；创造模式会话中 noteexpress 工具已消失（Tool.listTools 确认）。

## 使用

保持 NoteExpress 运行并打开文献库。直接对 AI 说“在我的 NoteExpress 中查找 Agensh”“读这篇论文的第 2 页”或“将这段内容保存为本地阅读笔记”。

## 自动检索网络论文（v1.1）

- `search_web`：用 CrossRef 或 PubMed 公开 API 检索论文（arXiv 在当前网络不可达，暂不支持），返回标题、作者、年份、DOI 等标准化题录。
- `export_ris`：把选中的题录生成标准 RIS 文件，`open=true` 时自动打开 NoteExpress 导入窗口，确认目标文件夹即可入库。
- 注意：NoteExpress 桌面版 COM 的在线检索和题录导入接口在本版本会触发进程内部访问冲突，已验证不可安全使用；因此入库走 RIS 文件 + NoteExpress 自己的导入窗口这一受支持路径。

本地笔记保存在本插件目录 data/notes 中，与文献库 UID 和文献 UID 关联。请备份该目录。删除插件源目录会同时丢失这些笔记。

当前实现针对本机 Windows 环境，使用系统 Windows PowerShell COM 和已安装的 Python 3.14/PyMuPDF。Python 路径在 operations.js 中，换电脑需调整。PDF 读取仅提取文本，不进行扫描件 OCR。

插件包：@local/noteexpress-workbench 1.0.0。无安装脚本或额外下载依赖。
