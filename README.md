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
    - style like example UI
      - show border/dividers while editing
      - responsive: phones -> desktop
      - scroll big lists nicely
      - allow editing
        - do a deep dive into modifying the Monaco Editor:
          - https://github.com/react-monaco-editor/react-monaco-editor?tab=readme-ov-file
          - https://github.com/Microsoft/monaco-editor
          - how do I replace 4 spaces at the beginning of a line with the grip & checkbox
          - how do I use any font?
          - does browser spell checker work?
        - look into modifying the ITFlow editor: https://github.com/itflow-org/itflow
      - code clean-up
        - break into files & organize into folders
        - checkbox class code
        - dark mode nastyness: https://tailwindcss.com/docs/dark-mode
    - dragability
      * use https://github.com/atlassian/pragmatic-drag-and-drop
      - increase item width while dragging
    - alt+⬆, alt+⬇, alt+⬅, alt+➡
    - multi-row highlighting
    - multi-row ([shift]+)[tab]
      - ([shift]+)[tab]
    - multi-row highlight+[tab]
      - highlight+[tab]
    - [CTRL]+z, [CTRL]+y
    - synchronize with back-end
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

## Notes

- Architecture/framework/library decisions are saved in [DECISIONS.md](DECISIONS.md)
