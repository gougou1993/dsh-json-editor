# JSON Editor (dsh-json-editor)

A JSON editor plugin for DSH (DeepSeek Harness). It adds a left-sidebar entry with a central panel for editing, formatting, and validating JSON, plus a collapsible tree view. Content is saved locally in the browser.

## Plugin Info

- **Package**: `@oakzhong/dsh-json-editor`
- **Version**: 1.0.0
- **Entry**: left sidebar "JSON Editor"
- **Type**: pure Client plugin (no-op Host half, no backend routes)

## Tech Stack

| Layer | Technology |
|---|---|
| Plugin framework | DSH Cordis scoped bundle (`cordis.patch.yml`, name `@oakzhong/dsh-json-editor`) |
| Client half | `window.__ModuleLoader__.load({ id })` frontend module with a fully-qualified id |
| UI | React without JSX (`React.createElement`), two views: Editor / Tree |
| Styling | injected `<style>` (`data-plugin-css`), DSH theme tokens, light/dark aware |
| i18n | `ctx.locale.register / bind`, Chinese and English (zh / en) |
| Parsing | native `JSON.parse` / `JSON.stringify`, live validation via `useMemo` |
| Storage | browser `localStorage` (key `dsh-json-editor.content.v1`), autosave on input |
| Files | `File.text()` for import, Blob + `URL.createObjectURL` for export |

## Features

### 1. Editing & Validation
- Type JSON directly in the text area, with live status: valid / invalid / empty
- Error messages come from `JSON.parse` to help locate problems

### 2. Toolbar
- **Format**: pretty-print with 2-space indentation
- **Minify**: compact JSON into a single line
- **Validate**: show whether the current JSON is valid
- **Sample**: load a sample JSON document
- **Clear**: clear the content (with confirmation)
- **Copy**: copy the current text to the clipboard
- **Import file**: read content from a local `.json` file
- **Export**: download the current content as `data.json`

### 3. Tree View
- Switch to the "Tree" tab to browse JSON as a collapsible tree
- Color-coded by type: string / number / boolean / null / array / object
- Arrays show their length, objects show their key count; deep nodes are folded by default

### 4. Stats & Persistence
- Footer shows character count and key count (recursive)
- All edits are saved locally and survive refresh/restart

## Directory Structure

```
dsh-json-editor/
├── package.json          # manifest (scoped name), bundle config, client injection
├── cordis.patch.yml      # loader insert row
├── index.js              # Host half (no-op)
├── client.js             # Client half: editor, tree view, toolbar, styles
├── locale/
│   ├── zh.json           # Chinese display metadata
│   └── en.json           # English display metadata
├── icon.svg              # plugin icon
├── README.md             # this file (English)
└── README.zh.md          # Chinese documentation
```

## Installation & Usage

1. Install the bundle via the plugin manager (`install_bundle` pointing to this directory)
2. Click "JSON Editor" in the left sidebar
3. Type JSON, use the toolbar to format/validate, or switch to the tree view
4. Use import/export to exchange data with local files
