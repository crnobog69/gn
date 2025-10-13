# gn

a simple url redirect extension for brave browser (chromium).

## download

```bash
git clone https://github.com/crnobog69/gn.git
```

or download [`.zip`](https://github.com/crnobog69/gn/archive/refs/heads/main.zip) ( <- click )

## features

- simple url redirects
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
4. check "preserve path" if you want to maintain the url path during redirect
5. click "add"

### managing rules

- edit: click the "edit" button to modify a rule
- copy: click "copy" to copy a rule to clipboard, then paste into the form
- delete: remove unwanted rules
- collapse: click on a rule header to collapse/expand it
- double-click the "rules" header to delete all rules

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

## theme

uses the beautiful [catppuccin](https://catppuccin.com/palette/) mocha color palette.

## license

mit license - see license file for details