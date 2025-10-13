# gn - URL Redirector

A simple, minimalistic URL redirect extension for Brave browser with Catppuccin Mocha theme.

## Features

- 🔀 Simple URL redirects
- 🛤️ **Preserve Path** option - redirects maintain the full path (e.g., `github.com/user/repo` → `github.io/user/repo`)
- ✏️ **Edit rules** - modify existing rules easily
- 📋 **Copy/Paste rules** - share rules between devices
- 📤 **Export/Import** - backup and restore all rules
- 🗂️ **Collapsible rules** - keep your list organized
- 🎨 Beautiful Catppuccin Mocha theme
- ⚡ Lightweight and fast
- 🔒 Privacy-focused - all data stored locally

## Installation

1. Open Brave browser
2. Navigate to `brave://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `gn` folder

## Usage

1. Click the extension icon in your toolbar
2. Enter the "From" URL (e.g., `github.com`)
3. Enter the "To" URL (e.g., `github.io`)
4. Check "Preserve Path" if you want to maintain the URL path during redirect
5. Click "Add Rule"

### Managing Rules

- **Edit**: Click the "Edit" button to modify a rule
- **Copy**: Click "Copy" to copy a rule to clipboard, then paste into the form
- **Delete**: Remove unwanted rules
- **Collapse**: Click on a rule header to collapse/expand it
- **Collapse All/Expand All**: Bulk collapse or expand all rules

### Export/Import

- **Export All**: Download all rules as a JSON file for backup
- **Import**: Load rules from a previously exported JSON file

### Preserve Path Feature

When **Preserve Path** is enabled:
- `github.com/user/repo` → `github.io/user/repo`
- The entire path, query parameters, and hash are preserved

When disabled:
- `github.com/user/repo` → `github.io`
- Only redirects to the base URL

## Example Use Cases

- Redirect from a shut-down domain to its backup
- Force HTTPS versions of sites
- Redirect to alternative frontends (e.g., YouTube → Invidious)
- Personal domain shortcuts

## Theme

Uses the beautiful [Catppuccin Mocha](https://github.com/catppuccin/catppuccin) color palette.

## License

MIT License - see LICENSE file for details