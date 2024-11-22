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
      - 16 leading spaces move the grip & checkbox accordingly
      - A new line should add a new checkbox
      - adopt monaco dark color scheme everywhere
      - fit into a cute bordered card
        - putting the grip & checkbox into the Glyph area might help: https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IGlyphMarginWidget.html#getDomNode
      - show border/dividers while editing
      - increase line size
      - add delete button
      - responsive: phones -> desktop
      - scroll big lists nicely
      - resize the editor to fit into a bordered card
      - turn on spell checking
      - checkbox hover effect & cursor
      - code clean-up
        - break into files & organize into folders
        - checkbox class code
        - dark mode nastyness: https://tailwindcss.com/docs/dark-mode
      - give back:
        - make StackOverflow post about unable to access Browser API (like document, window, localstorage) in Remix
        - modify docs page to add browser API keywords and example: https://remix.run/docs/en/main/file-conventions/-client
    - allow dragability
      * use https://github.com/atlassian/pragmatic-drag-and-drop
      - increase item width while dragging
    - deal with the 8 spaces at the beginning of the line
      - don't allow the cursor to go there with arrow keys
      - don't allow the cursor to go there with the mouse (make the grip & checkbox div bigger)
    - synchronize with back-end
    - checking box should do something
      - ie. [strikethrough](https://microsoft.github.io/monaco-editor/playground.html?source=v0.52.0#example-interacting-with-the-editor-line-and-inline-decorations) & moved to deemphasized done list
    - pressing the delete button should wipe the line
      - and CTRL+Z should bring it back
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
- hover effects for check box (dark & light)
- undo accidental deletion
- multi-user simultaneous editing
  - subscribe to DB changes
- alt+⬅, alt+➡
- last line should replace the checkbox with a + and insert a placeholder "List item"

## Notes

- Architecture/framework/library decisions are saved in [DECISIONS.md](DECISIONS.md)
