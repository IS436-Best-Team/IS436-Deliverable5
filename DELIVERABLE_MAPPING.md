# Deliverable Mapping

## Teacher requirement: User Interface Design

The five most important prototype screens are:

1. Login — `index.html`
2. Team Add — `team-add.html`
3. Team Manage — `team-manage.html`
4. Admin Users — `admin-users.html`
5. Reports — `reports.html`

Additional screens were added because they support the use cases:

- Dashboard — `dashboard.html`
- Game Tracker / Create Game — `games.html`
- AI Query Placeholder — `ai-query.html`
- Contact and student/team documentation — `contact.html`
- User Guide — `user-guide.html`

## Teacher requirement: Interface standards

Documented in `user-guide.html`:

- Maryland color theme: red, black, gold, and white
- Consistent navigation
- Large buttons and readable cards
- Status colors: red, green, blue, gray
- Role-based navigation for coach/admin users
- Child-safety data rule: no player names are collected or displayed
- Jersey number is the only roster player identifier
- Jersey number uniqueness is enforced within each team

## Teacher requirement: Program Design

The prototypes are converted into functional HTML/CSS/JavaScript pages.

Data is stored in browser localStorage for the prototype, using table-style keys that match `data/schema.sql`.

## Teacher requirement: UI must store data matching the database table

The SQL schema contains:

- `League`
- `Team`
- `Player`
- `CoachUser`
- `TeamCoach`
- `Game`
- `Substitution`
- `Foul`
- `Injury`
- `GameRoster`
- `PlayerGameStatus`
- `AIQuery`
- `Report`
- optional `ContactMessage`

The `Player` table intentionally does not contain name fields. It stores jersey number only.

## Teacher requirement: Develop a form and report

Forms:

- Team Add form
- Team Manage add/edit form
- Admin user form
- Game Tracker form
- AI Query placeholder form
- Contact form

Reports:

- Report summary
- Player report using jersey-only identifiers
- Game report using jersey-only identifiers
- SQL report placeholder buttons

## Teacher requirement: Documentation

Documentation is provided in:

- `user-guide.html`
- `contact.html`
- `README.md`

The contact page includes:

- Team name
- Project contact person
- Team member bios
- Roles
- Meeting time outside class
- Perry Hall Recreation Office / Baltimore County information
