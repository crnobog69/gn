# gn

a simple, privacy-focused url redirect extension for brave/chromium browsers.

## download

```bash
git clone https://github.com/crnobog69/gn.git
```

or download [`.zip`](https://github.com/crnobog69/gn/archive/refs/heads/main.zip)

## features

- simple url redirects
- **search/filter rules** by url
- **wildcard pattern matching** (e.g. `*.github.com`)
- **rule categories** (social, dev, news, etc.)
- **usage statistics** (see most used rules)
- **bulk operations** (enable/disable/delete multiple rules)
- **keyboard shortcuts** for power users
- **rule templates** for common privacy redirects
- preserve path option - redirects maintain the full path
- edit rules - modify existing rules easily
- copy/paste rules - share rules between devices
- export/import - backup and restore all rules
- collapsible rules - keep your list organized
- catppuccin mocha theme
- lightweight and fast
- privacy-focused - all data stored locally

## installation

1. open brave browser
2. navigate to [`brave://extensions/`](brave://extensions/)
3. enable "developer mode" in the top right
4. click "load unpacked"
5. select the `gn` folder

## usage

### adding rules

1. click the extension icon in your toolbar
2. enter the "from" url (e.g., `github.com`)
3. enter the "to" url (e.g., `github.io`)
4. select a category (optional)
5. check "preserve path" if you want to maintain the url path during redirect
6. click "add"

### managing rules

- search: use the search box to filter rules
- wildcards: use `*` in the "from" url for pattern matching
- categories: organize rules by category, color-coded
- stats: click "stats" to see most used rules
- bulk: select multiple rules to enable/disable/delete in bulk
- edit: click the "edit" button to modify a rule
- copy: click "copy" to copy a rule to clipboard, then paste into the form
- delete: remove unwanted rules
- collapse: click on a rule header to collapse/expand it
- double-click the "rules" header to delete all rules

### keyboard shortcuts

- `Ctrl+N`: focus new rule form
- `Ctrl+F`: focus search box
- `Ctrl+Enter`: add/update rule
- `Escape`: cancel/close modals
- `Ctrl+A` (in search): select all visible rules

### rule templates

- click "templates" to quickly add privacy-focused redirects (e.g., YouTube → Invidious)

### preserve path feature

when preserve path is enabled:
- `github.com/user/repo` → `github.io/user/repo`
- the entire path, query parameters, and hash are preserved

when disabled:
- `github.com/user/repo` → `github.io`
- only redirects to the base url

### export/import

- export: download all rules as a json file for backup
- import: load rules from a previously exported json file

## example use cases

- redirect from a shut-down domain to its backup
- force https versions of sites
- redirect to alternative frontends (e.g., youtube → invidious)
- personal domain shortcuts
- privacy: auto-redirect to open-source frontends

## theme

uses the beautiful [catppuccin](https://catppuccin.com/palette/) mocha color palette.

## license

mit license - see license file for details