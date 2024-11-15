# Task IT Easy

🎉 Fun Project Management 👨‍💼

## MVP

- deploy DB
  - deploy infrastructure
    - create docker-compose.yml with flask API & neo4j
      - create (& publish) reusable flask container/repo
  - create schema
    * put all users in 1 DB (for now)
    * ![image](https://github.com/user-attachments/assets/ff9b6bad-6cc6-4eb8-b433-09b1637705e1)
- deploy API
  - create endpoints
    - create user (and organization)
    - create task
    - update task
    - delete task
  - deploy infrastructure
- deploy UI
  - deploy react app
  - create text UI
    - dragability
      * use https://github.com/atlassian/pragmatic-drag-and-drop
    - alt+⬆, alt+⬇
    - ([shift]+)[tab]
  - create visual UI
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
