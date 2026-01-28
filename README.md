# Task IT Easy

🎉 Fun Project Management 👨‍💼

## Prerequisites

- Docker engine
- poetry
- poetry-plugin-dotenv plug-in
- NodeJS
- pnpm
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
    - box checking
      - preserve checked state on:
        - line creation (ie. pressing enter)
          - talk to Grok: what are the different events that can alter the number of lines to determine if I should handle each 1:
            - pressing enter
            - having a \n in a selection and typing or copy/pasting
            - pasting a \n
        - line deletion (ie. removing a \n and/or pressing the x)
      - add hideability:
        - create a "show completed" toggle
        - when toggled copy all checked tasks to a deemphasized done list (similar to keep)
          - will require a completely separate text model will need to be maintained & synced with changes from the visible model
    - clean-up:
      - add "lines" as an array of objects for each line, removing separate indentation & checked arrays in stateManagement
      - create onMount method that fires does all the stateManager house keeping (ie. checked styling, button creation)
    - responsive:
      - phones -> desktop
      - content area height: https://stackoverflow.com/questions/47017753/monaco-editor-dynamically-resizable
      - ensure Chrome works as well as Firefox
    - turn on spell check
    - saving (ie. to local storage)
      - consider storing strikethrough markdown along with checked status
- deploy online
  - re-deploy on push to prod

## Future

- allow paid users
  - authentication
  - saving to the cloud
- interface for multiple lists
- preserve checked state (& all item metadata) on:
  - ALT + Up/Down (editor.action.moveLinesUpAction/DownAction)
  - multi-line selection chunk change
  - multi multi-line selection chunk change
  - find out what other ways/features the Monaco editor has for changing line order & add consider adding to roadmap, handling, or disabling
- dragability fixes & improvements:
  - allow window scroll while dragging
    - track editor & window scroll relative to mouse & start positions
  - play nice with collapsed chevrons
    - when scrolling over a collapsed chevron, don't cause it to expand (unless you sit there for an extended period of time)
    - when uncollapsing a chevron above the line you're dragging, included the height of the chevron in dY calculations
  - when multiple lines are selected, dragging any of those grips should drag all of those lines selected as well as all children of all lines selected
  - dragging between a parent and its children should snap the indentation of the children & their descendants to at most the max allowed indentation
  - play with only snapping to a line after 1-full line of traversal after snap (same goes for indentation).  This means going back & forth 1 pixel shouldn't keep firing re-orders
- add tooltips to settings
- add back forbidden area cursor snapping (to beginning of line after indentations or end of previous line when arrowed backwards).  Note: disallowedCursorPositions is still there waiting to be reacted to
  - allow shift-selecting with left & right arrows into indents
    - ideal solution might be to use MS-word-like cursor positioning wrt indentation
    - hack could involve listening to the press of the shift key 
  - disallow clicking the indented area by not listening to click events there & hiding "I" cursor
- create visual diagram UI
  - creating tasks
  - redrawing relationships
  - dragability
  - color selection
  - synchronize with text UI & thus back-end (or vice versa)
- code clean-up
  - move Editor.jsx into separate folder & break it up
  - move checkbox class code into separate file
- copy-pasting from notepad
- copy-pasting from OneNote formatted list
- change font (to non-monospace)
- apply indentation of other lines on parent indentation change (via keyboard when multiple lines are selected)
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
- make drag effects snazzier
- sticky scroll: enable it and use overlay widgets instead of content widgets when scrolling beyond the top
- fix UI jank:
  - when content widgets scroll out of view (ie. a hidden div with higher z-index)
- fix UX jank:
  - drag scrolling the bottom threshold scrolls down but the top threshold doesn't scroll up
- last line should replace the checkbox with a + and insert a placeholder "List item"
- implement custom folding/collapsing:
  - place them next to grip on hover instead of in the margin
  - tell Monaco which lines to fold: https://stackoverflow.com/a/64430787/2363056 + https://stackoverflow.com/questions/50148938
  - fix janky (IMO) default behavior where alt + ⬆ over a folded line unfolds it and moves your line to within the folded section
- fix janky highlighting when highlighting text then moving over the left gutter:
  - maybe [this API](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.EditorLayoutInfo.html#contentLeft) or the layout API can help
- draw row-highlighting top & bottom borders across the entire editor card
- MS-word-like cursor positioning when pressing the down arrow on the first column
- multi-user simultaneous editing
  - subscribe to DB changes
- consider adding a placeholder for empty lines
- fix "overwrite content widget" warnings with `editor.removeContentWidget({getId: () =>`task-action-right${lineNumber}`})`
  - note: this is super tricky since you have to actually target the lines you want to remove, not just the last line
- look into what happens to the indentations if you copy-paste a list overtop of an existing list that's the same length

## Notes

- Architecture/framework/library decisions are saved in [DECISIONS.md](DECISIONS.md)
