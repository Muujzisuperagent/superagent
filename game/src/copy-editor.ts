// 文案编辑器：右下/左下角一个按钮 + 侧栏清单。
// 1) 原文清单来自 copy-manifest.ts（源码里所有静态中文文案）；
// 2) 改动写入 localStorage，立即覆盖页面文字与 3D 画布文字；
// 3) 导出 JSON 可以交回项目，把改好的文案合并回源码。
import { COPY_MANIFEST } from './copy-manifest'
import {
  allCopyOverrides,
  clearAllCopyOverrides,
  clearCopyOverride,
  copyText,
  getCopyOverride,
  hasCopyOverride,
  onCopyChange,
  replaceCopyOverrides,
  setCopyOverride
} from './copy-store'

const ROOT_ID = 'copy-editor-root'
const OPEN_CLASS = 'ce-open'

type NodeState = { source: string; applied: string }

const nodeStates = new WeakMap<Text, NodeState>()
let localizing = false
let initialized = false

function insideEditor(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement ?? null
  return Boolean(element?.closest(`#${ROOT_ID}`))
}

/** 把一个文本节点对齐到当前覆盖文案；记住 source，改完还能反查。 */
function localizeNode(node: Text): void {
  if (localizing || insideEditor(node)) return
  const current = node.nodeValue ?? ''
  const state = nodeStates.get(node)
  const source = state && current === state.applied ? state.source : current
  if (!source.trim()) {
    nodeStates.set(node, { source, applied: current })
    return
  }
  const next = copyText(source)
  if (next !== current) {
    localizing = true
    node.nodeValue = next
    localizing = false
  }
  nodeStates.set(node, { source, applied: next })
}

function localizeSubtree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeNode(root as Text)
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    localizeNode(node as Text)
    node = walker.nextNode()
  }
}

function localizeAll(): void {
  localizeSubtree(document.body)
}

function collectLiveSources(): string[] {
  const found = new Set<string>()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const text = node as Text
    if (!insideEditor(text)) {
      const source = nodeStates.get(text)?.source ?? text.nodeValue ?? ''
      if (source.trim().length >= 2 && /[\u4e00-\u9fff]/.test(source) && !/^[\d\s./:：·—－-]+m?$/.test(source)) {
        found.add(source)
      }
    }
    node = walker.nextNode()
  }
  return [...found]
}

function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): T {
  let timer = 0
  return ((...args: never[]) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }) as T
}

function downloadJson(): void {
  const data = JSON.stringify(allCopyOverrides(), null, 2)
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '还魂路引-文案覆盖.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function mountStyles(): void {
  const style = document.createElement('style')
  style.textContent = `
  #copy-editor-root { position: fixed; inset: 0; pointer-events: none; z-index: 80; font: 14px/1.6 "Microsoft YaHei", "Noto Serif SC", sans-serif; }
  #copy-editor-root button { font: inherit; cursor: pointer; }
  #copy-editor-toggle {
    position: absolute; left: 18px; bottom: 18px; pointer-events: auto;
    padding: 8px 14px; border: 1px solid rgba(201,162,90,.55); border-radius: 4px;
    background: rgba(14,12,10,.86); color: #d9c99f; letter-spacing: .08em;
    box-shadow: 0 4px 18px rgba(0,0,0,.45);
  }
  #copy-editor-toggle:hover { border-color: #c9a25a; color: #f0e3c4; }
  #copy-editor-panel {
    position: absolute; right: 16px; top: 16px; bottom: 16px; width: min(430px, calc(100vw - 32px));
    display: none; flex-direction: column; pointer-events: auto;
    background: rgba(14,13,11,.96); border: 1px solid rgba(201,162,90,.5); border-radius: 6px;
    box-shadow: 0 18px 60px rgba(0,0,0,.6); color: #ded6c4; overflow: hidden;
  }
  #copy-editor-root.ce-open #copy-editor-panel { display: flex; }
  .ce-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid rgba(201,162,90,.25); }
  .ce-head strong { color: #c9a25a; font-size: 15px; letter-spacing: .12em; flex: 1; }
  .ce-count { color: #8d8a7c; font-size: 12px; }
  .ce-close { background: none; border: 0; color: #b8b09c; font-size: 20px; line-height: 1; padding: 0 4px; }
  .ce-hint { margin: 0; padding: 8px 14px; color: #8f8a79; font-size: 12px; border-bottom: 1px solid rgba(201,162,90,.12); }
  .ce-search { margin: 10px 14px 6px; padding: 7px 10px; background: #0c0b09; border: 1px solid rgba(201,162,90,.3); color: #e9e2d2; outline: none; }
  .ce-toolbar { display: flex; gap: 8px; padding: 4px 14px 10px; flex-wrap: wrap; border-bottom: 1px solid rgba(201,162,90,.18); }
  .ce-toolbar button { padding: 4px 10px; background: #171410; border: 1px solid rgba(201,162,90,.35); color: #cdbd97; font-size: 12px; }
  .ce-toolbar button:hover { border-color: #c9a25a; }
  .ce-list { flex: 1; overflow: auto; padding: 4px 14px 14px; }
  .ce-group-title { margin: 12px 0 4px; color: #9c8f6c; font-size: 12px; letter-spacing: .1em; }
  .ce-row { padding: 8px 0; border-bottom: 1px dashed rgba(201,162,90,.14); }
  .ce-row.ce-live { border-left: 2px solid rgba(134,201,168,.5); padding-left: 8px; }
  .ce-src { color: #cfc6b1; font-size: 12px; white-space: pre-wrap; word-break: break-word; margin-bottom: 4px; }
  .ce-src .ce-tag { color: #7f7864; margin-right: 6px; }
  .ce-area { width: 100%; box-sizing: border-box; min-height: 46px; resize: vertical; padding: 6px 8px; background: #0b0a08; color: #f1eadb; border: 1px solid rgba(201,162,90,.28); font: inherit; }
  .ce-area:focus { outline: 1px solid rgba(201,162,90,.6); }
  .ce-row-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 11px; color: #7f7a6b; }
  .ce-restore { background: none; border: 0; color: #a89b78; font-size: 11px; padding: 0; text-decoration: underline; }
  .ce-restore:hover { color: #d9c99f; }
  .ce-empty { padding: 24px 4px; color: #78735f; text-align: center; }
  `
  document.head.appendChild(style)
}

function buildEditor(): void {
  const root = document.createElement('div')
  root.id = ROOT_ID
  root.innerHTML = `
    <button id="copy-editor-toggle" type="button">文案编辑 · F2</button>
    <aside id="copy-editor-panel" aria-label="文案编辑">
      <div class="ce-head">
        <strong>文案编辑</strong>
        <span class="ce-count" id="copy-editor-count"></span>
        <button class="ce-close" id="copy-editor-close" type="button" aria-label="关闭">×</button>
      </div>
      <p class="ce-hint">改动即时生效，只存本机浏览器。导出 JSON 可交回项目合并进源码。</p>
      <input class="ce-search" id="copy-editor-search" type="search" placeholder="搜索原文 / 分组 / 已改文案" />
      <div class="ce-toolbar">
        <button id="copy-editor-export" type="button">导出 JSON</button>
        <button id="copy-editor-import" type="button">导入 JSON</button>
        <button id="copy-editor-clear" type="button">全部还原</button>
        <input id="copy-editor-file" type="file" accept=".json,application/json" hidden />
      </div>
      <div class="ce-list" id="copy-editor-list"></div>
    </aside>
  `
  document.body.appendChild(root)

  const toggle = root.querySelector<HTMLButtonElement>('#copy-editor-toggle')!
  const panel = root.querySelector<HTMLElement>('#copy-editor-panel')!
  const close = root.querySelector<HTMLButtonElement>('#copy-editor-close')!
  const search = root.querySelector<HTMLInputElement>('#copy-editor-search')!
  const list = root.querySelector<HTMLElement>('#copy-editor-list')!
  const count = root.querySelector<HTMLElement>('#copy-editor-count')!
  const exportButton = root.querySelector<HTMLButtonElement>('#copy-editor-export')!
  const importButton = root.querySelector<HTMLButtonElement>('#copy-editor-import')!
  const clearButton = root.querySelector<HTMLButtonElement>('#copy-editor-clear')!
  const fileInput = root.querySelector<HTMLInputElement>('#copy-editor-file')!

  const manifestTexts = new Set(COPY_MANIFEST.map((entry) => entry.text))
  let liveSources: string[] = []
  let liveTimer = 0

  const rowEditors = new Map<string, { row: HTMLElement; area: HTMLTextAreaElement; state: HTMLElement }>()

  function makeRow(source: string, group: string, live: boolean): HTMLElement {
    const row = document.createElement('div')
    row.className = live ? 'ce-row ce-live' : 'ce-row'
    const src = document.createElement('div')
    src.className = 'ce-src'
    const tag = document.createElement('span')
    tag.className = 'ce-tag'
    tag.textContent = group
    src.appendChild(tag)
    src.appendChild(document.createTextNode(source))
    const area = document.createElement('textarea')
    area.className = 'ce-area'
    area.rows = 2
    area.placeholder = '留空 = 用原文'
    area.value = getCopyOverride(source) ?? ''
    const foot = document.createElement('div')
    foot.className = 'ce-row-foot'
    const state = document.createElement('span')
    state.textContent = hasCopyOverride(source) ? '已改' : '未改'
    area.addEventListener('input', debounce(() => {
      setCopyOverride(source, area.value)
      state.textContent = hasCopyOverride(source) ? '已改' : '未改'
      updateCount()
    }, 380))
    const restore = document.createElement('button')
    restore.type = 'button'
    restore.className = 'ce-restore'
    restore.textContent = '还原这一条'
    restore.addEventListener('click', () => {
      clearCopyOverride(source)
      area.value = ''
      state.textContent = '未改'
    })
    foot.append(state, restore)
    row.append(src, area, foot)
    rowEditors.set(source, { row, area, state })
    return row
  }

  function render(): void {
    rowEditors.clear()
    list.textContent = ''
    const query = search.value.trim().toLowerCase()
    const groups = new Map<string, string[]>()
    for (const entry of COPY_MANIFEST) {
      if (!groups.has(entry.group)) groups.set(entry.group, [])
      groups.get(entry.group)!.push(entry.text)
    }
    let shown = 0
    for (const [group, texts] of groups) {
      const visible = texts.filter((text) => {
        if (!query) return true
        const current = copyText(text)
        return text.toLowerCase().includes(query) || current.toLowerCase().includes(query) || group.toLowerCase().includes(query)
      })
      if (visible.length === 0) continue
      const title = document.createElement('div')
      title.className = 'ce-group-title'
      title.textContent = `${group} · ${visible.length}`
      list.appendChild(title)
      for (const text of visible) {
        list.appendChild(makeRow(text, group, false))
        shown += 1
      }
    }
    const liveVisible = liveSources.filter((source) => {
      if (!query) return true
      return source.toLowerCase().includes(query) || copyText(source).toLowerCase().includes(query) || '当前界面'.includes(query)
    })
    if (liveVisible.length > 0) {
      const title = document.createElement('div')
      title.className = 'ce-group-title'
      title.textContent = `当前界面（动态文案） · ${liveVisible.length}`
      list.appendChild(title)
      for (const source of liveVisible) {
        list.appendChild(makeRow(source, '当前界面', true))
        shown += 1
      }
    }
    if (shown === 0) {
      const empty = document.createElement('div')
      empty.className = 'ce-empty'
      empty.textContent = '没有匹配的文案'
      list.appendChild(empty)
    }
  }

  function updateCount(): void {
    const total = Object.keys(allCopyOverrides()).length
    count.textContent = total > 0 ? `已改 ${total} 条` : '未改动'
  }

  function refreshLive(): void {
    const next = collectLiveSources().filter((source) => !manifestTexts.has(source))
    const changed = next.length !== liveSources.length || next.some((source, index) => source !== liveSources[index])
    if (changed) {
      liveSources = next
      render()
    }
  }

  function open(): void {
    if (document.pointerLockElement) document.exitPointerLock()
    root.classList.add(OPEN_CLASS)
    localizeAll()
    refreshLive()
    render()
    updateCount()
    window.clearInterval(liveTimer)
    liveTimer = window.setInterval(refreshLive, 900)
    search.focus()
  }

  function closePanel(): void {
    root.classList.remove(OPEN_CLASS)
    window.clearInterval(liveTimer)
    liveTimer = 0
  }

  function togglePanel(): void {
    if (root.classList.contains(OPEN_CLASS)) closePanel()
    else open()
  }

  toggle.addEventListener('click', togglePanel)
  close.addEventListener('click', closePanel)
  exportButton.addEventListener('click', downloadJson)
  importButton.addEventListener('click', () => fileInput.click())
  clearButton.addEventListener('click', () => {
    if (window.confirm('还原全部文案改动？')) {
      clearAllCopyOverrides()
      render()
      updateCount()
    }
  })
  search.addEventListener('input', () => render())
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Record<string, unknown>
        const next: Record<string, string> = {}
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string') next[key] = value
        }
        replaceCopyOverrides(next)
        liveSources = []
        render()
        updateCount()
      } catch {
        window.alert('JSON 解析失败：需要 { "原文": "新文案" } 形式')
      }
      fileInput.value = ''
    }
    reader.readAsText(file)
  })

  // 游戏把按键绑在 window 上（WASD / E / M）；编辑面板内打字不能触发它们。
  for (const type of ['keydown', 'keyup', 'keypress'] as const) {
    root.addEventListener(type, (event) => {
      // F2/Esc 只在 keydown 处理一次：keyup 时焦点可能已落在搜索框，会二次开关面板。
      if (event.type === 'keydown') {
        const key = event as KeyboardEvent
        if (key.code === 'F2' || (key.code === 'Escape' && root.classList.contains(OPEN_CLASS))) {
          event.preventDefault()
          event.stopPropagation()
          if (key.code === 'F2') togglePanel()
          else closePanel()
          return
        }
      }
      event.stopPropagation()
    }, true)
  }

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'F2') return
    event.preventDefault()
    togglePanel()
  })

  onCopyChange(() => {
    localizeAll()
    updateCount()
    for (const [source, { area, state }] of rowEditors) {
      if (document.activeElement !== area && area.value !== (getCopyOverride(source) ?? '')) {
        area.value = getCopyOverride(source) ?? ''
      }
      state.textContent = hasCopyOverride(source) ? '已改' : '未改'
    }
  })

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') {
        if (record.target.nodeType === Node.TEXT_NODE) localizeNode(record.target as Text)
      } else {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) localizeNode(node as Text)
          else if (node.nodeType === Node.ELEMENT_NODE) localizeSubtree(node)
        })
      }
    }
  })
  observer.observe(document.body, { subtree: true, childList: true, characterData: true })

  localizeAll()
  updateCount()

  // 给自动化测试/外部脚本留一个入口，正常玩法不需要。
  ;(window as unknown as Record<string, unknown>).__copyEditor = {
    open,
    close: closePanel,
    set: setCopyOverride,
    clear: clearCopyOverride,
    clearAll: clearAllCopyOverrides,
    overrides: allCopyOverrides
  }
}

function init(): void {
  if (initialized && document.getElementById(ROOT_ID)) return
  initialized = true
  mountStyles()
  buildEditor()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
