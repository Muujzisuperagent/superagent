// 文案覆盖层：运行时把游戏里的每一句原文映射成玩家自己改过的版本。
// 只存 localStorage，不写源码；导出的 JSON 可以回灌到 copy-manifest / 源码。

const STORAGE_KEY = 'escape-copy-overrides-v1'

export type CopyOverrides = Record<string, string>

type CopyListener = () => void

const listeners = new Set<CopyListener>()
const surfaces = new Map<string, Set<() => void>>()

function readStorage(): CopyOverrides {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const result: CopyOverrides = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' && key.length > 0) result[key] = value
    }
    return result
  } catch {
    return {}
  }
}

let overrides: CopyOverrides = readStorage()

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // 隐私模式/配额满：改动仍在本页生效，只是刷新后丢失。
  }
}

function notify(): void {
  refreshCopySurfaces()
  for (const listener of listeners) listener()
}

/** 原文 → 当前生效文案；没有改动时原样返回。 */
export function copyText(source: string): string {
  const override = overrides[source]
  return override === undefined ? source : override
}

export function hasCopyOverride(source: string): boolean {
  return overrides[source] !== undefined
}

export function getCopyOverride(source: string): string | undefined {
  return overrides[source]
}

export function allCopyOverrides(): CopyOverrides {
  return { ...overrides }
}

/** 空串或与原文相同 = 还原。 */
export function setCopyOverride(source: string, value: string): void {
  if (value.trim() === '' || value === source) {
    if (overrides[source] === undefined) return
    delete overrides[source]
  } else {
    if (overrides[source] === value) return
    overrides[source] = value
  }
  persist()
  notify()
}

export function clearCopyOverride(source: string): void {
  if (overrides[source] === undefined) return
  delete overrides[source]
  persist()
  notify()
}

export function clearAllCopyOverrides(): void {
  if (Object.keys(overrides).length === 0) return
  overrides = {}
  persist()
  notify()
}

export function replaceCopyOverrides(next: CopyOverrides): void {
  overrides = {}
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string' && key.length > 0 && value.trim() !== '' && value !== key) overrides[key] = value
  }
  persist()
  notify()
}

export function onCopyChange(listener: CopyListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** 3D 画布文字（匾额/刻字/药签）注册重绘入口：改文案后不必重启即可看到新字。 */
export function registerCopySurface(source: string, redraw: () => void): void {
  let bucket = surfaces.get(source)
  if (!bucket) {
    bucket = new Set()
    surfaces.set(source, bucket)
  }
  bucket.add(redraw)
}

export function refreshCopySurfaces(): void {
  const done = new Set<() => void>()
  for (const bucket of surfaces.values()) {
    for (const redraw of bucket) {
      if (done.has(redraw)) continue
      done.add(redraw)
      try {
        redraw()
      } catch {
        // 单个画布失败不应拖垮其余文案
      }
    }
  }
}
