# Task IT Easy

🎉 Fun Project Management 👨‍💼

## Prerequisites

- Docker engine
- poetry
- poetry-plugin-dotenv plug-in
- NodeJS
- npm
- git
- Linux (tested on Ubuntu)

### Serving on-line

- Linux server exposed to the internet
  - with A-record's for API, GUI, and API admin
- nginx reverse proxy

## Getting Started

### Initialize Environment

```bash
git clone
npm --prefix ./ui install ./ui
poetry install
echo "DB_PASSWORD=s0m3_sup3r_s3cur3_p4ssw0rd" > .env
echo "API_HOST=api.someurliown.io" >> .env
echo "GUI_HOST=gui.someurliown.io" >> .env
echo "ADMIN_HOST=api-admin.someurliown.io" >> .env
```

### Run App (in dev mode)

```bash
poetry run docker compose -f app.yml up -d
npm --prefix ./ui run dev
```

## MVP

- deploy UI
  - create text UI
    - style like example UI:
      - responsive: phones -> desktop
      - allow dragability
        * use https://github.com/atlassian/pragmatic-drag-and-drop
        - increase item width while dragging
      - handle the last line properly
        - when any non-indentation is in it, add a \n to the end of the model (without loosing cursor position)
        - when last x lines are only indentations, delete x-1 lines
      - code clean-up
        - break into files & organize into folders
        - use React to target those styles instead of the current barbarism
        - checkbox class code
        - dark mode nastyness: https://tailwindcss.com/docs/dark-mode
      - give back:
        - make StackOverflow post about unable to access Browser API (like document, window, localstorage) in Remix
        - modify docs page to add browser API keywords and example: https://remix.run/docs/en/main/file-conventions/-client
        - document how you can list all the events with console.log({editor})
    - turn on spell check
    - get rid of duplicate word suggestions
    - when a parent is outdent'ed, all children that get outdent'ed too should loose their leading spaces
    - synchronize with back-end
    - checking box should do something
      - ie. [strikethrough](https://microsoft.github.io/monaco-editor/playground.html?source=v0.52.0#example-interacting-with-the-editor-line-and-inline-decorations) & moved to deemphasized done list
  - create visual diagram UI
    - creating tasks
    - redrawing relationships
    - dragability
    - color selection
    - synchronize with text UI & thus back-end (or vice versa)
- deploy online
- authentication
- allow paid users

## Future

- copy-pasting from notepad
- copy-pasting from OneNote formatted list
- change font (to non-monospace)
- when multi-line indenting, don't add leading spaces to lines that are at their max indentation
- allow collapsing with the chevron
- only scroll when contents are bigger than text area
- exports to
  - JSON (full)
  - MD (readable)
- descriptions can have
  - attached images
  - in-line images
  - content other than the title
- keep history of all notes/props/updates
  - just store everything in the updated relationship
  - be more clever about the delete functionality
- integrate with GitHub cards
- integrate with Jira
- implement folding/collapsing by considering the 2 options:
  - custom code folding chevrons:
    - place them next to grip on hover
    - tell Monaco edit which lines to fold: https://stackoverflow.com/a/64430787/2363056
  - leverage Monaco's built-in folding by relying on that undocumented API.  To use this method we could:
    - keep track of which lines have chevrons and which chevrons have been toggled
    - listen to the DOM for which rows are visible
- better target the margin width (for indentation folding) with Monaco API instead of CSS hack
  - API https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.EditorLayoutInfo.html#contentLeft
- allow shift-selecting with left & right arrows into indents
  - ideal solution might be to use MS-word-like cursor positioning wrt indentation
  - hack could involve listening to the press of the shift key 
- disallow clicking the indented area by not listening to click events there & hiding "I" cursor
- draw row-highlighting top & bottom borders across the entire editor card
- MS-word-like cursor positioning when pressing the down arrow on the first column
- multi-user simultaneous editing
  - subscribe to DB changes
- alt+⬅, alt+➡
- last line should replace the checkbox with a + and insert a placeholder "List item"

## Notes

- Architecture/framework/library decisions are saved in [DECISIONS.md](DECISIONS.md)
