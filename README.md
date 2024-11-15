# Task IT Easy

🎉 Fun Project Management 👨‍💼

## Prerequisites

- Docker engine
- poetry
- poetry-plugin-dotenv plug-in
- git
- Linux (tested on Ubuntu)

## Getting Started

```bash
git clone
poetry install
echo "DB_PASSWORD=s0m3_sup3r_s3cur3_p4ssw0rd" > .env
poetry run docker compose -f app.yml up -d
```

## MVP

- deploy API
  - create endpoints
    - create user (and organization)
    - create task
    - update task
    - delete task
- deploy DB
  - create schema
    * put all users in 1 DB (for now)
    * ![image](https://github.com/user-attachments/assets/ff9b6bad-6cc6-4eb8-b433-09b1637705e1)
- deploy UI
  - deploy react app
  - create text UI
    - dragability
      * use https://github.com/atlassian/pragmatic-drag-and-drop
    - alt+⬆, alt+⬇, alt+⬅, alt+➡
    - ([shift]+)[tab]
  - create visual diagram UI
    - creating tasks
    - redrawing relationships
    - dragability
    - color selection
- authentication
- allow paid users
 
## Future

- copy-pasting from notepad
- copy-pasting from OneNote formatted list
- exports to
  - JSON (full)
  - MD (readable)
- dark mode
- descriptions can have
  - attached images
  - in-line images
  - content other than the title
- keep history of all notes/props
- integrate with GitHub cards
- integrate with Jira

## Notes

- Architecture/framework/library decisions are saved in [DECISIONS.md](DECISIONS.md)
