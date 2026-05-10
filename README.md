# Perry Hall LGMIS Website Prototype

This is a static Visual Studio/GitHub-ready website prototype for the **League Game Management and Analytics Information System (LGMIS)**.

The project is Maryland-themed and designed for the Perry Hall Recreation / Baltimore County recreation basketball context.

## Important roster-privacy update

Roster players are identified by **jersey number only**.

The code does **not** collect or display player names, initials, or personal identifiers. Adult coach/admin users can have names because they are account holders, but the `Player` table only stores:

- `player_id`
- `team_id`
- `jersey_number`
- `default_status`
- `is_active`

Jersey numbers are unique inside one team. Two different teams can both have jersey `42`, but one team cannot have two jersey `42` records.

## Demo logins

Coach:

```text
coach@example.com
coach123
```

Admin:

```text
admin@example.com
admin123
```

## Main pages

- `index.html` — Login page for coach/admin users
- `dashboard.html` — Main dashboard
- `team-add.html` — Coach team add form with jersey-only roster rows
- `team-manage.html` — Coach roster management with duplicate jersey validation
- `admin-users.html` — Admin add/delete coach/admin users
- `games.html` — Create game and enter jersey-level game status data
- `reports.html` — Display entered data back to the user
- `ai-query.html` — AI query placeholder
- `contact.html` — League/project contact page
- `user-guide.html` — User guide and interface standards

## Local prototype data

The site stores prototype records in browser `localStorage`. The keys line up with the ERD/database tables:

```text
lgmis_leagues
lgmis_teams
lgmis_players
lgmis_coach_users
lgmis_team_coaches
lgmis_games
lgmis_game_rosters
lgmis_player_game_statuses
lgmis_substitutions
lgmis_fouls
lgmis_injuries
lgmis_ai_queries
lgmis_reports
lgmis_contact_messages
```

The SQL schema is in:

```text
data/schema.sql
```

## Database connection note

The site is not connected to SQL yet. Placeholder buttons are included for SQL report generation, substitution tracking, API upload, and AI service integration.

When SQL is added later, keep the UI layout and replace the localStorage read/write functions in `assets/js/app.js` with API calls.

## Visual Studio setup

1. Open Visual Studio.
2. Choose **Open a local folder**.
3. Select the folder containing this README.
4. Open `index.html` in the browser.
5. Use the demo login credentials above.

## GitHub setup

```bash
git init
git add .
git commit -m "Add jersey-only Perry Hall LGMIS prototype"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Image folder

Images belong here:

```text
assets/images/
```

The images below are already included as placeholders. Replace them with approved images using the same file names.

| File name | What it should be |
|---|---|
| `hero-court.jpg` | Basketball court, gym, or clean game-day hero background. Avoid close-up minor faces. |
| `perry-hall-rec.jpg` | Perry Hall Recreation Office, Honeygo Run Community Center, or approved recreation office photo. |
| `team-huddle.jpg` | Coach clipboard, empty bench, basketball equipment, or team warmup from far away/behind. Avoid identifiable minors. |
| `basketball-court.jpg` | Basketball court, scoreboard, or generic gym photo. |
| `maryland-flag.png` | Maryland flag or Maryland flag pattern. |
| `basketball-icon.png` | Simple basketball icon or project logo. |
