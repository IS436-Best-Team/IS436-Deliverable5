-- Perry Hall LGMIS prototype schema
-- Updated privacy rule: Player does NOT store player names.
-- Players are identified by jersey_number only.
-- The same jersey_number can exist on two different teams, but cannot repeat inside one team.
-- The front-end prototype works without SQL; this file is for the later database connection.

CREATE TABLE League (
  league_id VARCHAR(64) PRIMARY KEY,
  league_name VARCHAR(120) NOT NULL,
  season VARCHAR(50) NOT NULL,
  age_division VARCHAR(50) NOT NULL,
  game_length_minutes INT NOT NULL,
  period_count INT NOT NULL,
  substitution_interval_minutes INT NOT NULL,
  minimum_playtime_minutes INT NOT NULL,
  foul_disqualification_limit INT NOT NULL,
  max_players_on_court INT NOT NULL
);

CREATE TABLE Team (
  team_id VARCHAR(64) PRIMARY KEY,
  league_id VARCHAR(64) NOT NULL,
  team_name VARCHAR(120) NOT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  CONSTRAINT fk_team_league FOREIGN KEY (league_id) REFERENCES League(league_id)
);

CREATE TABLE Player (
  player_id VARCHAR(64) PRIMARY KEY,
  team_id VARCHAR(64) NOT NULL,
  jersey_number VARCHAR(10) NOT NULL,
  default_status VARCHAR(30) NOT NULL DEFAULT 'eligible',
  is_active BIT NOT NULL DEFAULT 1,
  CONSTRAINT fk_player_team FOREIGN KEY (team_id) REFERENCES Team(team_id),
  CONSTRAINT uq_player_team_jersey UNIQUE (team_id, jersey_number),
  CONSTRAINT chk_player_default_status CHECK (default_status IN ('eligible','needs_time','requirement_met','injured','unavailable','disqualified'))
);

CREATE TABLE CoachUser (
  user_id VARCHAR(64) PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  CONSTRAINT chk_coach_user_role CHECK (role IN ('admin','coach','assistant_coach'))
);

CREATE TABLE TeamCoach (
  team_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (team_id, user_id),
  CONSTRAINT fk_teamcoach_team FOREIGN KEY (team_id) REFERENCES Team(team_id),
  CONSTRAINT fk_teamcoach_user FOREIGN KEY (user_id) REFERENCES CoachUser(user_id)
);

CREATE TABLE Game (
  game_id VARCHAR(64) PRIMARY KEY,
  league_id VARCHAR(64) NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  opponent_name VARCHAR(120) NOT NULL,
  game_date DATE NOT NULL,
  location VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  CONSTRAINT fk_game_league FOREIGN KEY (league_id) REFERENCES League(league_id),
  CONSTRAINT fk_game_team FOREIGN KEY (team_id) REFERENCES Team(team_id),
  CONSTRAINT fk_game_created_by FOREIGN KEY (created_by) REFERENCES CoachUser(user_id),
  CONSTRAINT chk_game_status CHECK (status IN ('scheduled','in_progress','completed','cancelled'))
);

CREATE TABLE Substitution (
  substitution_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  player_in_id VARCHAR(64) NOT NULL,
  player_out_id VARCHAR(64) NOT NULL,
  substitution_time DATETIME2 NOT NULL,
  recorded_by VARCHAR(64) NOT NULL,
  CONSTRAINT fk_sub_game FOREIGN KEY (game_id) REFERENCES Game(game_id),
  CONSTRAINT fk_sub_player_in FOREIGN KEY (player_in_id) REFERENCES Player(player_id),
  CONSTRAINT fk_sub_player_out FOREIGN KEY (player_out_id) REFERENCES Player(player_id),
  CONSTRAINT fk_sub_recorded_by FOREIGN KEY (recorded_by) REFERENCES CoachUser(user_id)
);

CREATE TABLE Foul (
  foul_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  foul_number INT NOT NULL,
  foul_time DATETIME2 NOT NULL,
  recorded_by VARCHAR(64) NOT NULL,
  CONSTRAINT fk_foul_game FOREIGN KEY (game_id) REFERENCES Game(game_id),
  CONSTRAINT fk_foul_player FOREIGN KEY (player_id) REFERENCES Player(player_id),
  CONSTRAINT fk_foul_recorded_by FOREIGN KEY (recorded_by) REFERENCES CoachUser(user_id)
);

CREATE TABLE Injury (
  injury_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  injury_time DATETIME2 NOT NULL,
  notes VARCHAR(500) NULL,
  recorded_by VARCHAR(64) NOT NULL,
  CONSTRAINT fk_injury_game FOREIGN KEY (game_id) REFERENCES Game(game_id),
  CONSTRAINT fk_injury_player FOREIGN KEY (player_id) REFERENCES Player(player_id),
  CONSTRAINT fk_injury_recorded_by FOREIGN KEY (recorded_by) REFERENCES CoachUser(user_id)
);

CREATE TABLE GameRoster (
  game_roster_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  initial_status VARCHAR(30) NOT NULL DEFAULT 'eligible',
  is_present BIT NOT NULL DEFAULT 1,
  CONSTRAINT fk_roster_game FOREIGN KEY (game_id) REFERENCES Game(game_id),
  CONSTRAINT fk_roster_player FOREIGN KEY (player_id) REFERENCES Player(player_id),
  CONSTRAINT uq_roster_game_player UNIQUE (game_id, player_id),
  CONSTRAINT chk_roster_initial_status CHECK (initial_status IN ('eligible','needs_time','requirement_met','injured','unavailable','disqualified'))
);

CREATE TABLE PlayerGameStatus (
  player_game_status_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  current_status VARCHAR(30) NOT NULL DEFAULT 'eligible',
  status_color VARCHAR(20) NOT NULL DEFAULT 'green',
  minutes_played INT NOT NULL DEFAULT 0,
  foul_count INT NOT NULL DEFAULT 0,
  is_disqualified BIT NOT NULL DEFAULT 0,
  is_unavailable BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_status_game FOREIGN KEY (game_id) REFERENCES Game(game_id),
  CONSTRAINT fk_status_player FOREIGN KEY (player_id) REFERENCES Player(player_id),
  CONSTRAINT chk_status_current CHECK (current_status IN ('eligible','needs_time','requirement_met','injured','unavailable','disqualified')),
  CONSTRAINT chk_status_color CHECK (status_color IN ('green','red','blue','gray','gold'))
);

CREATE TABLE AIQuery (
  ai_query_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  game_id VARCHAR(64) NULL,
  query_text VARCHAR(MAX) NOT NULL,
  query_type VARCHAR(50) NOT NULL,
  response_text VARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL,
  CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES CoachUser(user_id),
  CONSTRAINT fk_ai_team FOREIGN KEY (team_id) REFERENCES Team(team_id),
  CONSTRAINT fk_ai_game FOREIGN KEY (game_id) REFERENCES Game(game_id)
);

CREATE TABLE Report (
  report_id VARCHAR(64) PRIMARY KEY,
  generated_by VARCHAR(64) NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  game_id VARCHAR(64) NULL,
  report_type VARCHAR(50) NOT NULL,
  report_data VARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL,
  CONSTRAINT fk_report_user FOREIGN KEY (generated_by) REFERENCES CoachUser(user_id),
  CONSTRAINT fk_report_team FOREIGN KEY (team_id) REFERENCES Team(team_id),
  CONSTRAINT fk_report_game FOREIGN KEY (game_id) REFERENCES Game(game_id)
);

-- Optional contact-page prototype table for the website form.
CREATE TABLE ContactMessage (
  message_id VARCHAR(64) PRIMARY KEY,
  sender_name VARCHAR(100) NOT NULL,
  sender_email VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message VARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL
);
