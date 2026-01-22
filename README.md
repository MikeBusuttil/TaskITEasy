# Task IT Easy

🎉 Fun Project Management 👨‍💼

## Prerequisites

- Docker engine
- poetry
- poetry-plugin-dotenv plug-in
- NodeJS
- npm
- git
- Linux (tested on WSL Ubuntu)

### Serving on-line

- Linux server exposed to the internet
  - with A-record's for API, GUI, and API admin
- nginx reverse proxy

## Getting Started

### Initialize Environment

```bash
git clone
pnpm --dir ./ui install
poetry install
echo "DB_PASSWORD=s0m3_sup3r_s3cur3_p4ssw0rd" > .env
echo "API_HOST=api.someurliown.io" >> .env
echo "GUI_HOST=gui.someurliown.io" >> .env
echo "ADMIN_HOST=api-admin.someurliown.io" >> .env
```

### Run App (in dev mode)

```bash
poetry run docker compose -f app.yml up -d
pnpm --dir ./ui run start
```

## MVP

- deploy UI
  - create text UI
    - allow dragability
      * use https://github.com/atlassian/pragmatic-drag-and-drop ?
        - right-left dragging indents & outdents
        - up-down dragging
      - increase item width while dragging
    - checking box should do something. Like:
      - hiding when "show completed" is unchecked & copied to a deemphasized done list (similar to keep)
      - [strikethrough](https://microsoft.github.io/monaco-editor/playground.html?source=v0.52.0#example-interacting-with-the-editor-line-and-inline-decorations) 
    - style like example UI:
      - handle the last line properly
        - when any non-indentation is in it, add a \n to the end of the model (without loosing cursor position)
        - when last x lines are only indentations, delete x-1 lines
        - last line should replace the checkbox with a + and insert a placeholder "List item"
      - responsive: phones -> desktop
    - turn on spell check
    - saving (ie. to local storage)
- deploy online
  - re-deploy on push to prod

## Future

- allow paid users
  - authentication
  - saving to the cloud
- add back cursor snapping to beginning of line after indentations
- create visual diagram UI
  - creating tasks
  - redrawing relationships
  - dragability
  - color selection
  - synchronize with text UI & thus back-end (or vice versa)
- create a "lock" mode:
  - when a parent is outdent'ed, all children that get outdent'ed too should loose their leading spaces
  - dragging a parent drags all children
- code clean-up
  - move Editor.jsx into separate folder & break it up
  - move checkbox class code into separate file
- give back:
  - make StackOverflow post about unable to access Browser API (like document, window, localstorage) in Remix
  - modify docs page to add browser API keywords and example: https://remix.run/docs/en/main/file-conventions/-client
  - document how you can list all the events with console.log({editor})
- allow clicking to the right of the checkbox into the editor (can hack the cursor position)
- copy-pasting from notepad
- copy-pasting from OneNote formatted list
- change font (to non-monospace)
- when multi-line indenting, don't add leading spaces to lines that are at their max indentation
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
- implement custom folding/collapsing:
  - place them next to grip on hover instead of in the margin
  - tell Monaco which lines to fold: https://stackoverflow.com/a/64430787/2363056 + https://stackoverflow.com/questions/50148938
- fix janky highlighting when highlighting text then moving over the left gutter:
  - maybe [this API](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.EditorLayoutInfo.html#contentLeft) or the layout API can help
- allow shift-selecting with left & right arrows into indents
  - ideal solution might be to use MS-word-like cursor positioning wrt indentation
  - hack could involve listening to the press of the shift key 
- disallow clicking the indented area by not listening to click events there & hiding "I" cursor
- draw row-highlighting top & bottom borders across the entire editor card
- MS-word-like cursor positioning when pressing the down arrow on the first column
- multi-user simultaneous editing
  - subscribe to DB changes
- alt+⬅, alt+➡ (in/out-dents line & all children)
- last line should replace the checkbox with a + and insert a placeholder "List item"
- fix "overwrite content widget" warnings with `editor.removeContentWidget({getId: () =>`task-action-right${lineNumber}`})`
  - note: this is super tricky since you have to actually target the lines you want to remove, not just the last line

## Notes

- Architecture/framework/library decisions are saved in [DECISIONS.md](DECISIONS.md)
