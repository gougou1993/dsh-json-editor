/**
 * Client half of the JSON editor bundle.
 * A pure-client JSON editor: text editing with format/minify/validate,
 * a collapsible colored tree view, file import/export and local autosave.
 */
window.__ModuleLoader__.load({
  id: '@oakzhong/dsh-json-editor',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useCallback, useMemo } = React

    const NS = 'dsh-json-editor'
    const PANEL_ID = 'json-editor'
    const STYLE_ID = 'dsh-json-editor/css'
    const SAVE_KEY = 'dsh-json-editor.content.v1'
    const SAMPLE = '{\n  "name": "示例",\n  "version": 1.0,\n  "enabled": true,\n  "items": [1, 2, 3],\n  "nested": { "key": "value" }\n}'

    const zh = {
      title: 'JSON 编辑器', subtitle: '编辑、格式化、校验 JSON，并以树形结构浏览。',
      format: '格式化', minify: '压缩', validate: '校验', clear: '清空', sample: '示例',
      import: '导入文件', export: '导出', editor: '编辑', tree: '树形',
      valid: '✓ 合法 JSON', invalid: '✗ 无效 JSON', empty: '空内容',
      line: '行 {n}', chars: '{n} 字符', keys: '{n} 个键',
      copy: '复制', copied: '已复制', autoSaved: '已自动保存',
      errorAt: '位置 {n}', confirmClear: '确定清空内容？',
      back: '返回',
    }
    const en = {
      title: 'JSON editor', subtitle: 'Edit, format, validate and browse JSON as a tree.',
      format: 'Format', minify: 'Minify', validate: 'Validate', clear: 'Clear', sample: 'Sample',
      import: 'Import file', export: 'Export', editor: 'Editor', tree: 'Tree',
      valid: '✓ Valid JSON', invalid: '✗ Invalid JSON', empty: 'Empty',
      line: 'Line {n}', chars: '{n} chars', keys: '{n} keys',
      copy: 'Copy', copied: 'Copied', autoSaved: 'Auto-saved',
      errorAt: 'At position {n}', confirmClear: 'Clear content?',
      back: 'Back',
    }
    let t = (k) => (zh[k] || k)
    const fmt = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : ''))

    function SidebarIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true,
        style: { opacity: props.active ? 1 : 0.82 },
      },
        h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }),
        h('path', { d: 'M7 9v3l-2 2 2 2v2M17 9v3l2 2-2 2v2' })
      )
    }

    // Parse result is computed once per text change.
    function useParsed(text) {
      return useMemo(() => {
        if (!text.trim()) return { ok: false, empty: true, value: null, error: null }
        try { return { ok: true, empty: false, value: JSON.parse(text), error: null } }
        catch (e) { return { ok: false, empty: false, value: null, error: e.message } }
      }, [text])
    }

    // ---- collapsible tree node ----
    function TreeNode({ name, value, depth, defaultOpen }) {
      const [open, setOpen] = useState(defaultOpen !== false)
      const isObj = value !== null && typeof value === 'object'
      const kind = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
      const scalar = !isObj
      const preview = () => {
        if (kind === 'string') return '"' + value + '"'
        if (kind === 'null') return 'null'
        return String(value)
      }
      return h('div', { className: 'dshJson-node' },
        h('div', {
          className: 'dshJson-nodeHead',
          style: { paddingLeft: (depth * 16) + 'px' },
          onClick: () => { if (isObj) setOpen((v) => !v) },
        },
          isObj ? h('span', { className: 'dshJson-arrow' }, open ? '▾' : '▸') : h('span', { className: 'dshJson-arrow dshJson-dot' }, '·'),
          name !== null ? h('span', { className: 'dshJson-key' }, name + ': ') : null,
          isObj
            ? h('span', { className: 'dshJson-bracket' }, Array.isArray(value) ? '[ ' + value.length + ' ]' : '{ ' + Object.keys(value).length + ' }')
            : h('span', { className: 'dshJson-val dshJson-' + kind }, preview())
        ),
        isObj && open
          ? h('div', { className: 'dshJson-children' },
              (Array.isArray(value)
                ? value.map((v, i) => [String(i), v])
                : Object.entries(value)
              ).map(([k, v]) => h(TreeNode, { key: k, name: Array.isArray(value) ? null : k, value: v, depth: depth + 1, defaultOpen: depth < 1 }))
            )
          : null
      )
    }

    function JsonPanel({ ctx }) {
      const [text, setText] = useState(() => {
        try { return window.localStorage.getItem(SAVE_KEY) || SAMPLE } catch (_) { return SAMPLE }
      })
      const [view, setView] = useState('editor')
      const [msg, setMsg] = useState('')
      const fileRef = useRef(null)
      const parsed = useParsed(text)

      useEffect(() => { try { window.localStorage.setItem(SAVE_KEY, text) } catch (_) {} }, [text])

      const flash = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(''), 2000) }, [])

      const format = useCallback(() => {
        if (!parsed.ok) { flash(t('invalid')); return }
        setText(JSON.stringify(parsed.value, null, 2))
        flash(t('valid'))
      }, [parsed, flash])

      const minify = useCallback(() => {
        if (!parsed.ok) { flash(t('invalid')); return }
        setText(JSON.stringify(parsed.value))
        flash(t('valid'))
      }, [parsed, flash])

      const validate = useCallback(() => flash(parsed.ok ? t('valid') : t('invalid')), [parsed, flash])

      const clear = useCallback(() => {
        if (text.trim() && !window.confirm(t('confirmClear'))) return
        setText('')
      }, [text])

      const importFile = useCallback(async (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        try { setText(await file.text()); flash(t('import')) }
        catch (err) { flash(err.message) }
        e.target.value = ''
      }, [flash])

      const exportFile = useCallback(() => {
        try {
          const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = 'data.json'
          document.body.appendChild(a); a.click(); a.remove()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch (e) { flash(e.message) }
      }, [text, flash])

      const copy = useCallback(async () => {
        try { await navigator.clipboard.writeText(text); flash(t('copied')) }
        catch (e) { flash(e.message) }
      }, [text, flash])

      const goBack = useCallback(() => {
        try { if (ctx && ctx.layout) ctx.layout.selectPanel('conversation') } catch (_) {}
      }, [ctx])

      const keyCount = useMemo(() => {
        if (!parsed.ok) return 0
        const count = (v) => {
          if (v === null || typeof v !== 'object') return 0
          if (Array.isArray(v)) return v.reduce((s, x) => s + count(x), 0)
          return Object.keys(v).length + Object.values(v).reduce((s, x) => s + count(x), 0)
        }
        return count(parsed.value)
      }, [parsed])

      return h('div', { className: 'dshJson-root' },
        h('div', { className: 'dshJson-head' },
          h('div', null,
            h('div', { className: 'dshJson-title' }, t('title')),
            h('div', { className: 'dshJson-sub' }, t('subtitle'))
          ),
          h('button', { type: 'button', className: 'dshJson-back', onClick: goBack }, '‹ ' + t('back'))
        ),
        h('div', { className: 'dshJson-toolbar' },
          h('button', { type: 'button', className: 'dshJson-btn dshJson-btnPrimary', onClick: format }, t('format')),
          h('button', { type: 'button', className: 'dshJson-btn', onClick: minify }, t('minify')),
          h('button', { type: 'button', className: 'dshJson-btn', onClick: validate }, t('validate')),
          h('button', { type: 'button', className: 'dshJson-btn', onClick: copy }, t('copy')),
          h('button', { type: 'button', className: 'dshJson-btn', onClick: () => fileRef.current && fileRef.current.click() }, t('import')),
          h('button', { type: 'button', className: 'dshJson-btn', onClick: exportFile }, t('export')),
          h('button', { type: 'button', className: 'dshJson-btn', onClick: () => setText(SAMPLE) }, t('sample')),
          h('button', { type: 'button', className: 'dshJson-btn dshJson-del', onClick: clear }, t('clear')),
          h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: importFile })
        ),
        h('div', { className: 'dshJson-bar' },
          h('div', { className: 'dshJson-tabs' },
            h('button', { type: 'button', className: 'dshJson-tab' + (view === 'editor' ? ' dshJson-tabOn' : ''), onClick: () => setView('editor') }, t('editor')),
            h('button', { type: 'button', className: 'dshJson-tab' + (view === 'tree' ? ' dshJson-tabOn' : ''), onClick: () => setView('tree') }, t('tree'))
          ),
          h('span', { className: 'dshJson-status ' + (parsed.empty ? '' : (parsed.ok ? 'dshJson-ok' : 'dshJson-bad')) },
            parsed.empty ? t('empty') : (parsed.ok ? t('valid') : t('invalid')),
            msg ? ' · ' + msg : ''
          )
        ),
        view === 'editor'
          ? h('textarea', {
              className: 'dshJson-editor', value: text, spellCheck: false,
              placeholder: '{ "key": "value" }',
              onChange: (e) => setText(e.target.value),
            })
          : h('div', { className: 'dshJson-tree' },
              !parsed.ok
                ? h('div', { className: 'dshJson-note' }, parsed.empty ? t('empty') : (t('invalid') + (parsed.error ? ' · ' + parsed.error : '')))
                : h(TreeNode, { name: null, value: parsed.value, depth: 0, defaultOpen: true })
            ),
        h('div', { className: 'dshJson-foot' },
          h('span', null, fmt(t('chars'), { n: text.length })),
          h('span', null, fmt(t('keys'), { n: keyCount })),
          h('span', null, t('autoSaved'))
        )
      )
    }

    function apply(ctx) {
      ctx.effect(() => installStyles(), 'dsh-json-editor: styles')
      if (ctx.locale !== undefined) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-json-editor: dictionaries')
        t = ctx.locale.bind(NS)
      }
      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist', id: PANEL_ID, order: 29, label: () => t('title'), locale: NS,
      }, SidebarIcon)), 'dsh-json-editor: sidebar entry')
      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main', key: PANEL_ID, locale: NS,
      }, (props) => h(JsonPanel, { ctx }))), 'dsh-json-editor: panel')
    }

    function installStyles() {
      if (typeof document === 'undefined') return () => {}
      const existing = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')
      if (existing) return () => {}
      const style = document.createElement('style')
      style.dataset.plugin = NS
      style.dataset.pluginCss = STYLE_ID
      style.textContent = `
.dshJson-root{display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:16px 18px 18px;gap:10px;overflow:hidden;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base)}
.dshJson-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex:0 0 auto}
.dshJson-title{font-size:20px;font-weight:700;line-height:1.3}
.dshJson-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:3px}
.dshJson-back{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;padding:5px 11px;border-radius:8px;cursor:pointer;font-family:inherit;white-space:nowrap}
.dshJson-toolbar{display:flex;gap:6px;flex-wrap:wrap;flex:0 0 auto}
.dshJson-btn{padding:6px 11px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
.dshJson-btn:hover{border-color:var(--dsw-alias-brand-primary)}
.dshJson-btnPrimary{background:#e08a2f;color:#fff;border-color:transparent;font-weight:600}
.dshJson-del{color:var(--dsw-alias-state-error-primary)}
.dshJson-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:0 0 auto}
.dshJson-tabs{display:flex;gap:4px}
.dshJson-tab{padding:6px 14px;border-radius:8px 8px 0 0;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;font-family:inherit}
.dshJson-tabOn{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-weight:600;border-color:var(--dsw-alias-border-l2)}
.dshJson-status{font-size:11px}
.dshJson-ok{color:var(--dsw-alias-state-success-primary)}
.dshJson-bad{color:var(--dsw-alias-state-error-primary)}
.dshJson-editor{flex:1 1 auto;min-height:180px;width:100%;box-sizing:border-box;resize:none;padding:14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.6;outline:none}
.dshJson-editor:focus{border-color:var(--dsw-alias-brand-primary)}
.dshJson-tree{flex:1 1 auto;min-height:180px;overflow:auto;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);padding:10px 12px}
.dshJson-node{font-family:ui-monospace,monospace;font-size:12.5px}
.dshJson-nodeHead{display:flex;align-items:center;padding:3px 0;border-radius:5px;cursor:default;white-space:nowrap}
.dshJson-nodeHead:hover{background:var(--dsw-alias-bg-layer-2)}
.dshJson-arrow{display:inline-block;width:16px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshJson-dot{cursor:default}
.dshJson-key{color:#7aa2f7;font-weight:600}
.dshJson-bracket{color:var(--dsw-alias-label-secondary)}
.dshJson-val{color:#9ece6a}
.dshJson-string{color:#e0af68}
.dshJson-number{color:#ff9e64}
.dshJson-boolean{color:#bb9af7}
.dshJson-null{color:#565f89;font-style:italic}
.dshJson-note{font-size:12px;color:var(--dsw-alias-label-secondary);padding:12px}
.dshJson-foot{display:flex;gap:16px;flex:0 0 auto;font-size:11px;color:var(--dsw-alias-label-secondary)}
`
      document.head.appendChild(style)
      return () => { style.remove() }
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
