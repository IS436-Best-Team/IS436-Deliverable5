/* Perry Hall LGMIS static prototype
   Privacy data rule: roster players are identified by jersey number only. The UI does not collect
   or display roster player names. Jersey numbers are unique within a team, but the same jersey
   number may exist on different teams.

   Data is stored in localStorage using keys that match the ERD-style schema in data/schema.sql.
   This is a Visual Studio/GitHub friendly front-end prototype, not a production auth system. */
(function(){
  'use strict';

  const DB_PREFIX = 'lgmis_';
  const SCHEMA_VERSION = '2026-05-jersey-only-erd-v4';
  const TABLES = [
    'leagues', 'teams', 'players', 'coach_users', 'team_coaches',
    'games', 'game_rosters', 'player_game_statuses', 'substitutions',
    'fouls', 'injuries', 'ai_queries', 'reports', 'contact_messages'
  ];
  const OLD_TABLES = ['users', 'game_stats', 'player_game_status'];

  const STATUS_LABELS = {
    eligible: {label:'Eligible', cls:'green'},
    needs_time: {label:'Needs Time', cls:'red'},
    requirement_met: {label:'Requirement Met', cls:'green'},
    injured: {label:'Injured', cls:'blue'},
    unavailable: {label:'Unavailable', cls:'gray'},
    disqualified: {label:'Disqualified', cls:'gray'},
    present: {label:'Present', cls:'green'},
    absent: {label:'Absent', cls:'gray'},
    active: {label:'Active', cls:'green'},
    inactive: {label:'Inactive', cls:'gray'},
    completed: {label:'Completed', cls:'green'},
    scheduled: {label:'Scheduled', cls:'gold'},
    cancelled: {label:'Cancelled', cls:'gray'},
    in_progress: {label:'In Progress', cls:'gold'}
  };

  const STATUS_COLOR_BY_VALUE = {
    eligible: 'green',
    needs_time: 'red',
    requirement_met: 'green',
    injured: 'blue',
    unavailable: 'gray',
    disqualified: 'gray'
  };

  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const tableKey = (name) => DB_PREFIX + name;
  const getTable = (name) => JSON.parse(localStorage.getItem(tableKey(name)) || '[]');
  const setTable = (name, rows) => localStorage.setItem(tableKey(name), JSON.stringify(rows));
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const today = () => new Date().toISOString().slice(0,10);
  const now = () => new Date().toISOString();
  const safe = (value) => String(value ?? '').replace(/[<>]/g, '');
  const normJersey = (value) => String(value ?? '').trim().toUpperCase();
  const boolText = (value) => String(value) === '1' || value === true ? 'Yes' : 'No';
  const isActiveText = (value) => String(value) === '1' || value === true ? 'Active' : 'Inactive';
  const currentUser = () => JSON.parse(sessionStorage.getItem(DB_PREFIX + 'current_user') || 'null');
  const setCurrentUser = (user) => sessionStorage.setItem(DB_PREFIX + 'current_user', JSON.stringify(user));
  const clearCurrentUser = () => sessionStorage.removeItem(DB_PREFIX + 'current_user');

  function formDataObj(form){
    const data = new FormData(form);
    const obj = {};
    for(const [key,value] of data.entries()) obj[key] = typeof value === 'string' ? value.trim() : value;
    return obj;
  }

  function displayUserName(user){
    if(!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
  }

  function roleLabel(role){
    return safe(String(role || '').replace('_', ' '));
  }

  function statusColorFor(status){
    return STATUS_COLOR_BY_VALUE[status] || 'gray';
  }

  function statusPill(status, explicitColor){
    const item = STATUS_LABELS[status] || {label: status || 'Unknown', cls: explicitColor || 'gray'};
    const cls = explicitColor || item.cls || 'gray';
    return `<span class="pill ${safe(cls)}"><span class="status-dot"></span>${safe(item.label)}</span>`;
  }

  function toast(message){
    let host = qs('#toast-host');
    if(!host){
      host = document.createElement('div');
      host.id = 'toast-host';
      host.className = 'toast';
      document.body.appendChild(host);
    }
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = message;
    host.appendChild(item);
    setTimeout(() => item.remove(), 3900);
  }

  function removeOldData(){
    [...TABLES, ...OLD_TABLES].forEach(t => localStorage.removeItem(tableKey(t)));
    localStorage.removeItem(DB_PREFIX + 'seeded');
  }

  function seedData(){
    if(localStorage.getItem(DB_PREFIX + 'schema_version') === SCHEMA_VERSION) return;
    removeOldData();
    TABLES.forEach(t => setTable(t, []));

    const leagueId = 'league_perryhall_winter_2026';
    const teamId = 'team_demo_panthers';
    const teamTwoId = 'team_demo_hawks';
    const adminId = 'user_demo_admin';
    const coachId = 'user_demo_coach';
    const assistantId = 'user_demo_assistant';
    const gameId = 'game_demo_001';

    setTable('leagues', [{
      league_id: leagueId,
      league_name: 'Perry Hall Rec Basketball',
      season: 'Winter 2026',
      age_division: '5th-6th',
      game_length_minutes: '40',
      period_count: '4',
      substitution_interval_minutes: '5',
      minimum_playtime_minutes: '15',
      foul_disqualification_limit: '5',
      max_players_on_court: '5'
    }]);

    setTable('coach_users', [
      {user_id: adminId, first_name:'League', last_name:'Admin', email:'admin@example.com', role:'admin', password_hash:'admin123', is_active:'1'},
      {user_id: coachId, first_name:'Coach', last_name:'Demo', email:'coach@example.com', role:'coach', password_hash:'coach123', is_active:'1'},
      {user_id: assistantId, first_name:'Assistant', last_name:'Coach', email:'assistant@example.com', role:'assistant_coach', password_hash:'assistant123', is_active:'1'}
    ]);

    setTable('teams', [
      {team_id: teamId, league_id: leagueId, team_name:'Perry Hall Panthers', is_active:'1'},
      {team_id: teamTwoId, league_id: leagueId, team_name:'Honeygo Hawks', is_active:'1'}
    ]);

    setTable('team_coaches', [
      {team_id: teamId, user_id: coachId},
      {team_id: teamId, user_id: assistantId},
      {team_id: teamTwoId, user_id: coachId}
    ]);

    const jerseyRows = [
      ['4','eligible','1'], ['7','needs_time','1'], ['11','eligible','1'], ['12','requirement_met','1'],
      ['15','eligible','1'], ['20','injured','1'], ['22','eligible','1'], ['42','unavailable','1']
    ];
    const players = jerseyRows.map((row, i) => ({
      player_id:`player_demo_${i+1}`,
      team_id:teamId,
      jersey_number:row[0],
      default_status:row[1],
      is_active:row[2]
    }));
    players.push({
      player_id:'player_demo_hawks_42',
      team_id:teamTwoId,
      jersey_number:'42',
      default_status:'eligible',
      is_active:'1'
    });
    setTable('players', players);

    setTable('games', [{
      game_id:gameId,
      league_id:leagueId,
      team_id:teamId,
      created_by:coachId,
      opponent_name:'White Marsh Wildcats',
      game_date:today(),
      location:'Honeygo Run Community Center',
      status:'completed'
    }]);

    const seededGamePlayers = players.filter(p => p.team_id === teamId);
    setTable('game_rosters', seededGamePlayers.map((p, i) => ({
      game_roster_id:`roster_demo_${i+1}`,
      game_id:gameId,
      player_id:p.player_id,
      initial_status:p.default_status,
      is_present: p.default_status === 'unavailable' ? '0' : '1'
    })));

    setTable('player_game_statuses', seededGamePlayers.map((p, i) => {
      const minutes = [16, 10, 14, 18, 15, 4, 12, 0][i] || 0;
      const fouls = [1, 0, 2, 1, 0, 0, 3, 0][i] || 0;
      const status = p.default_status;
      return {
        player_game_status_id:`status_demo_${i+1}`,
        game_id:gameId,
        player_id:p.player_id,
        current_status:status,
        status_color:statusColorFor(status),
        minutes_played:String(minutes),
        foul_count:String(fouls),
        is_disqualified:'0',
        is_unavailable: status === 'unavailable' ? '1' : '0'
      };
    }));

    setTable('fouls', [
      {foul_id:'foul_demo_001', game_id:gameId, player_id:'player_demo_3', foul_number:'1', foul_time:now(), recorded_by:coachId},
      {foul_id:'foul_demo_002', game_id:gameId, player_id:'player_demo_3', foul_number:'2', foul_time:now(), recorded_by:coachId},
      {foul_id:'foul_demo_003', game_id:gameId, player_id:'player_demo_7', foul_number:'1', foul_time:now(), recorded_by:coachId}
    ]);

    setTable('injuries', [
      {injury_id:'injury_demo_001', game_id:gameId, player_id:'player_demo_6', injury_time:now(), notes:'Prototype injury note; do not include personal medical details.', recorded_by:coachId}
    ]);

    localStorage.setItem(DB_PREFIX + 'schema_version', SCHEMA_VERSION);
    localStorage.setItem(DB_PREFIX + 'seeded', 'yes');
  }

  function renderHeader(){
    const header = qs('.app-header');
    if(!header) return;
    const user = currentUser();
    const page = document.body.dataset.page || '';
    const isAdmin = user && user.role === 'admin';
    const navLinks = user ? [
      ['dashboard.html','Dashboard','dashboard'],
      ['team-add.html','Add Team','team-add'],
      ['team-manage.html','Manage Team','team-manage'],
      ['games.html','Game Tracker','games'],
      ['reports.html','Reports','reports'],
      ['ai-query.html','AI Query','ai-query'],
      ...(isAdmin ? [['admin-users.html','Admin Users','admin-users']] : []),
      ['user-guide.html','User Guide','user-guide'],
      ['contact.html','Contact','contact']
    ] : [
      ['index.html','Login','login'],
      ['user-guide.html','User Guide','user-guide'],
      ['contact.html','Contact','contact']
    ];
    header.innerHTML = `
      <div class="maryland-strip"></div>
      <div class="container header-inner">
        <a class="brand" href="${user ? 'dashboard.html' : 'index.html'}" aria-label="LGMIS home">
          <span class="brand-mark"><img src="assets/images/basketball-icon.png" alt="Basketball icon"></span>
          <span><span class="brand-title">Perry Hall LGMIS</span><br><span class="brand-subtitle">Rec Basketball Prototype</span></span>
        </a>
        <button class="nav-toggle" type="button" aria-label="Open navigation">Menu</button>
        <nav class="main-nav" aria-label="Main navigation">
          ${navLinks.map(([href,label,key]) => `<a class="${page === key ? 'active' : ''}" href="${href}">${label}</a>`).join('')}
          ${user ? `<span class="nav-user">${safe(displayUserName(user))} <span class="role-badge">${roleLabel(user.role)}</span></span><button type="button" id="logoutBtn">Logout</button>` : ''}
        </nav>
      </div>`;
    const toggle = qs('.nav-toggle', header);
    const nav = qs('.main-nav', header);
    if(toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
    const logout = qs('#logoutBtn', header);
    if(logout) logout.addEventListener('click', () => { clearCurrentUser(); location.href = 'index.html'; });
  }

  function renderFooter(){
    const footer = qs('.footer');
    if(!footer) return;
    footer.innerHTML = `
      <div class="container footer-inner">
        <div><strong>Perry Hall LGMIS</strong><br><span class="small">IS 436 jersey-only prototype for league game management, team management, and reporting.</span></div>
        <div class="small">Maryland theme: red, black, gold, white · Built for Visual Studio + GitHub</div>
      </div>`;
  }

  function guard(allowedRoles){
    const user = currentUser();
    if(!user){ location.href = 'index.html'; return false; }
    if(allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)){
      const main = qs('main');
      if(main){
        main.innerHTML = `<div class="container"><div class="alert danger"><strong>Access denied.</strong> This screen is limited to ${allowedRoles.join(', ')} users. Login with the correct demo role.</div><p><a class="btn primary" href="dashboard.html">Return to dashboard</a></p></div>`;
      }
      return false;
    }
    return true;
  }

  function visibleTeamsForUser(){
    const user = currentUser();
    const teams = getTable('teams');
    if(!user || user.role === 'admin') return teams;
    const teamIds = getTable('team_coaches').filter(tc => tc.user_id === user.user_id).map(tc => tc.team_id);
    return teams.filter(t => teamIds.includes(t.team_id));
  }

  function leagueById(leagueId){
    return getTable('leagues').find(l => l.league_id === leagueId) || {};
  }

  function teamById(teamId){
    return getTable('teams').find(t => t.team_id === teamId) || {};
  }

  function playerById(playerId){
    return getTable('players').find(p => p.player_id === playerId) || {};
  }

  function populateLeagueSelect(select, includeBlank=true){
    if(!select) return;
    const leagues = getTable('leagues');
    select.innerHTML = includeBlank ? '<option value="">Choose league...</option>' : '';
    leagues.forEach(l => select.insertAdjacentHTML('beforeend', `<option value="${safe(l.league_id)}">${safe(l.league_name)} — ${safe(l.season)} — ${safe(l.age_division)}</option>`));
  }

  function populateTeamSelect(select, includeBlank=true){
    if(!select) return;
    const teams = visibleTeamsForUser();
    select.innerHTML = includeBlank ? '<option value="">Choose team...</option>' : '';
    teams.forEach(t => {
      const league = leagueById(t.league_id);
      select.insertAdjacentHTML('beforeend', `<option value="${safe(t.team_id)}">${safe(t.team_name)} — ${safe(league.age_division || 'League')}</option>`);
    });
  }

  function populateGameSelect(select, teamId='', includeBlank=true){
    if(!select) return;
    const visibleTeamIds = visibleTeamsForUser().map(t => t.team_id);
    const games = getTable('games').filter(g => visibleTeamIds.includes(g.team_id) && (!teamId || g.team_id === teamId));
    select.innerHTML = includeBlank ? '<option value="">All games</option>' : '';
    games.forEach(g => select.insertAdjacentHTML('beforeend', `<option value="${safe(g.game_id)}">${safe(g.game_date)} ${safe(g.opponent_name)} vs  </option>`));
  }

  function jerseyExistsOnTeam(teamId, jerseyNumber, ignorePlayerId=''){
    const jersey = normJersey(jerseyNumber);
    if(!teamId || !jersey) return false;
    return getTable('players').some(p => p.team_id === teamId && p.player_id !== ignorePlayerId && normJersey(p.jersey_number) === jersey);
  }

  function latestStatusForPlayer(playerId, gameId=''){
    const rows = getTable('player_game_statuses').filter(s => s.player_id === playerId && (!gameId || s.game_id === gameId));
    return rows.length ? rows[rows.length - 1] : null;
  }

  function aggregateStatusForPlayer(playerId, gameId=''){
    const rows = getTable('player_game_statuses').filter(s => s.player_id === playerId && (!gameId || s.game_id === gameId));
    return {
      minutes: rows.reduce((sum, row) => sum + Number(row.minutes_played || 0), 0),
      fouls: rows.reduce((sum, row) => sum + Number(row.foul_count || 0), 0),
      latest: rows.length ? rows[rows.length - 1] : null,
      count: rows.length
    };
  }

  function initLogin(){
    clearCurrentUser();
    const form = qs('#loginForm');
    if(!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(form);
      const user = getTable('coach_users').find(u => u.email.toLowerCase() === data.email.toLowerCase() && u.password_hash === data.password && String(u.is_active) === '1');
      if(!user){ toast('Login failed. Try admin@example.com/admin123 or coach@example.com/coach123.'); return; }
      setCurrentUser(user);
      location.href = 'dashboard.html';
    });
    qsa('[data-demo-login]').forEach(btn => btn.addEventListener('click', () => {
      const role = btn.dataset.demoLogin;
      const email = role === 'admin' ? 'admin@example.com' : 'coach@example.com';
      const password = role === 'admin' ? 'admin123' : 'coach123';
      qs('#email').value = email;
      qs('#password').value = password;
      form.requestSubmit();
    }));
  }

  function initDashboard(){
    if(!guard()) return;
    const teams = visibleTeamsForUser();
    const teamIds = teams.map(t => t.team_id);
    const players = getTable('players').filter(p => teamIds.includes(p.team_id));
    const games = getTable('games').filter(g => teamIds.includes(g.team_id));
    const users = getTable('coach_users');
    const stats = [
      ['Teams', teams.length, '🏀'], ['Jersey Records', players.length, '🔢'], ['Games', games.length, '📋'], ['Users', users.length, '🔐']
    ];
    const statHost = qs('#dashboardStats');
    if(statHost) statHost.innerHTML = stats.map(s => `<article class="card stat-card"><div><div class="num">${s[1]}</div><div class="label">${s[0]}</div></div><div class="icon-tile">${s[2]}</div></article>`).join('');

    const rosterHost = qs('#dashboardRoster');
    if(rosterHost){
      const active = players.slice(0,6);
      rosterHost.innerHTML = active.length ? active.map(p => {
        const latest = latestStatusForPlayer(p.player_id);
        const displayStatus = latest ? latest.current_status : p.default_status;
        const displayColor = latest ? latest.status_color : statusColorFor(p.default_status);
        return `<div class="card bio-card"><div class="avatar">#${safe(p.jersey_number)}</div><div><strong>Jersey #${safe(p.jersey_number)}</strong><br><span class="small">${statusPill(displayStatus, displayColor)} · ${safe(isActiveText(p.is_active))}</span></div></div>`;
      }).join('') : '<div class="empty-state">No roster data yet. Add a team to begin.</div>';
    }

    const gameHost = qs('#recentGames');
    if(gameHost){
      gameHost.innerHTML = games.length ? `
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Team</th><th>Opponent</th><th>Status</th></tr></thead><tbody>
          ${games.slice(-5).reverse().map(g => {
            const t = teamById(g.team_id);
            return `<tr><td>${safe(g.game_date)}</td><td>${safe(t.team_name || 'Team')}</td><td>${safe(g.opponent_name)}</td><td>${statusPill(g.status)}</td></tr>`;
          }).join('')}
        </tbody></table></div>` : '<div class="empty-state">No games entered yet.</div>';
    }
  }

  function initTeamAdd(){
    if(!guard(['coach','assistant_coach','admin'])) return;
    populateLeagueSelect(qs('#league_id'), false);
    const playerRows = qs('#playerRows');
    if(playerRows){
      playerRows.innerHTML = Array.from({length:10}, (_, i) => `
        <div class="card player-row" data-index="${i}">
          <h3>Jersey Entry ${i+1}</h3>
          <div class="form-grid">
            <div class="field"><label>Jersey #</label><input class="control" name="jersey_number_${i}" placeholder="42"></div>
            <div class="field"><label>Default Status</label><select class="control" name="default_status_${i}"><option value="eligible">Eligible</option><option value="needs_time">Needs Time</option><option value="requirement_met">Requirement Met</option><option value="injured">Injured</option><option value="unavailable">Unavailable</option></select></div>
            <div class="field"><label>Active on Team?</label><select class="control" name="is_active_${i}"><option value="1">Active</option><option value="0">Inactive</option></select></div>
          </div>
        </div>`).join('');
    }
    const form = qs('#teamAddForm');
    if(form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(form);
      const team_id = uid('team');
      const rosterRows = [];
      const seen = new Set();

      for(let i=0;i<10;i++){
        const jersey = normJersey(data[`jersey_number_${i}`]);
        if(!jersey) continue;
        if(seen.has(jersey)){
          toast(`Jersey #${jersey} is entered more than once. A team cannot have duplicate jersey numbers.`);
          return;
        }
        seen.add(jersey);
        rosterRows.push({
          player_id:uid('player'),
          team_id,
          jersey_number:jersey,
          default_status:data[`default_status_${i}`] || 'eligible',
          is_active:data[`is_active_${i}`] || '1'
        });
      }

      const team = {team_id, league_id:data.league_id, team_name:data.team_name, is_active:data.is_active || '1'};
      const teams = getTable('teams'); teams.push(team); setTable('teams', teams);
      const players = getTable('players'); rosterRows.forEach(row => players.push(row)); setTable('players', players);

      const user = currentUser();
      if(user && user.role !== 'admin'){
        const links = getTable('team_coaches');
        links.push({team_id, user_id:user.user_id});
        setTable('team_coaches', links);
      }

      toast('Team and jersey-only roster saved. No player names were stored.');
      form.reset();
      setTimeout(() => location.href = 'team-manage.html', 800);
    });
  }

  function initTeamManage(){
    if(!guard(['coach','assistant_coach','admin'])) return;
    const select = qs('#manageTeamSelect');
    populateTeamSelect(select, true);
    const addForm = qs('#addPlayerForm');
    if(select){
      select.addEventListener('change', () => renderManageRoster(select.value));
      if(select.options.length > 1){ select.selectedIndex = 1; renderManageRoster(select.value); }
    }
    if(addForm) addForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(addForm);
      const team_id = data.team_id || (select ? select.value : '');
      const jersey = normJersey(data.jersey_number);
      if(!team_id){ toast('Choose a team before adding a jersey record.'); return; }
      if(!jersey){ toast('Enter a jersey number.'); return; }
      if(jerseyExistsOnTeam(team_id, jersey)){ toast(`Jersey #${jersey} already exists on this team. Duplicate jersey numbers are allowed only on different teams.`); return; }
      const players = getTable('players');
      players.push({
        player_id:uid('player'), team_id, jersey_number:jersey,
        default_status:data.default_status || 'eligible', is_active:data.is_active || '1'
      });
      setTable('players', players);
      toast(`Jersey #${jersey} added.`);
      addForm.reset();
      renderManageRoster(team_id);
    });
  }

  function renderManageRoster(teamId){
    const host = qs('#manageRoster');
    const addTeamInput = qs('#addPlayerTeamId');
    if(addTeamInput) addTeamInput.value = teamId || '';
    if(!host) return;
    if(!teamId){ host.innerHTML = '<div class="empty-state">Choose a team to manage its roster.</div>'; return; }
    const team = teamById(teamId);
    const players = getTable('players').filter(p => p.team_id === teamId);
    qs('#selectedTeamName') && (qs('#selectedTeamName').textContent = team ? team.team_name : 'Selected Team');
    if(!players.length){ host.innerHTML = '<div class="empty-state">No jersey records yet. Use the add player form below.</div>'; return; }
    host.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Jersey #</th><th>Default Status</th><th>Active?</th><th>Latest Game Status</th><th>Total Minutes</th><th>Total Fouls</th><th>Actions</th></tr></thead><tbody>
      ${players.map(p => {
        const agg = aggregateStatusForPlayer(p.player_id);
        const latest = agg.latest;
        return `<tr data-player-id="${safe(p.player_id)}">
          <td><input class="control" name="jersey_number" value="${safe(p.jersey_number)}" style="width:90px"></td>
          <td><select class="control" name="default_status">${['eligible','needs_time','requirement_met','injured','unavailable'].map(s => `<option value="${s}" ${p.default_status===s?'selected':''}>${safe(STATUS_LABELS[s].label)}</option>`).join('')}</select></td>
          <td><select class="control" name="is_active" style="width:110px"><option value="1" ${String(p.is_active)==='1'?'selected':''}>Active</option><option value="0" ${String(p.is_active)==='0'?'selected':''}>Inactive</option></select></td>
          <td>${latest ? statusPill(latest.current_status, latest.status_color) : statusPill(p.default_status)}</td>
          <td>${safe(agg.minutes)}</td>
          <td>${safe(agg.fouls)}</td>
          <td class="table-actions"><button class="btn gold save-player" type="button">Save</button><button class="btn danger delete-player" type="button">Delete</button></td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
    qsa('.save-player', host).forEach(btn => btn.addEventListener('click', () => updatePlayerRow(btn.closest('tr'), teamId)));
    qsa('.delete-player', host).forEach(btn => btn.addEventListener('click', () => deletePlayerRow(btn.closest('tr'), teamId)));
  }

  function updatePlayerRow(row, teamId){
    const id = row.dataset.playerId;
    const players = getTable('players');
    const idx = players.findIndex(p => p.player_id === id);
    if(idx < 0) return;
    const jersey = normJersey(qs('[name="jersey_number"]', row).value);
    if(!jersey){ toast('Jersey number cannot be blank.'); return; }
    if(jerseyExistsOnTeam(teamId, jersey, id)){ toast(`Jersey #${jersey} already exists on this team. Use a different jersey number.`); return; }
    players[idx].jersey_number = jersey;
    players[idx].default_status = qs('[name="default_status"]', row).value.trim();
    players[idx].is_active = qs('[name="is_active"]', row).value.trim();
    setTable('players', players);
    toast('Jersey record saved.');
    renderManageRoster(teamId);
  }

  function deletePlayerRow(row, teamId){
    if(!confirm('Delete this jersey record from the prototype roster?')) return;
    const id = row.dataset.playerId;
    setTable('players', getTable('players').filter(p => p.player_id !== id));
    setTable('game_rosters', getTable('game_rosters').filter(s => s.player_id !== id));
    setTable('player_game_statuses', getTable('player_game_statuses').filter(s => s.player_id !== id));
    setTable('substitutions', getTable('substitutions').filter(s => s.player_in_id !== id && s.player_out_id !== id));
    setTable('fouls', getTable('fouls').filter(s => s.player_id !== id));
    setTable('injuries', getTable('injuries').filter(s => s.player_id !== id));
    toast('Jersey record deleted.');
    renderManageRoster(teamId);
  }

  function initAdminUsers(){
    if(!guard(['admin'])) return;
    populateTeamSelect(qs('#userTeamId'), true);
    renderUsersTable();
    const form = qs('#userForm');
    if(form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(form);
      if(getTable('coach_users').some(u => u.email.toLowerCase() === data.email.toLowerCase())){ toast('A user with that email already exists.'); return; }
      const userId = uid('user');
      const users = getTable('coach_users');
      users.push({
        user_id:userId,
        first_name:data.first_name,
        last_name:data.last_name,
        email:data.email,
        role:data.role,
        password_hash:data.password_hash,
        is_active:data.is_active || '1'
      });
      setTable('coach_users', users);
      if(data.team_id && data.role !== 'admin'){
        const links = getTable('team_coaches');
        links.push({team_id:data.team_id, user_id:userId});
        setTable('team_coaches', links);
      }
      toast('Adult coach/admin user added to CoachUser table.');
      form.reset();
      renderUsersTable();
    });
  }

  function renderUsersTable(){
    const host = qs('#usersTable');
    if(!host) return;
    const users = getTable('coach_users');
    const teams = getTable('teams');
    const links = getTable('team_coaches');
    host.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team Assignment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${users.map(u => {
        const teamNames = links.filter(tc => tc.user_id === u.user_id).map(tc => (teams.find(t => t.team_id === tc.team_id) || {}).team_name).filter(Boolean);
        return `<tr data-user-id="${safe(u.user_id)}"><td>${safe(displayUserName(u))}</td><td>${safe(u.email)}</td><td>${roleLabel(u.role)}</td><td>${safe(teamNames.join(', ') || 'League-wide')}</td><td>${statusPill(String(u.is_active)==='1'?'active':'inactive')}</td><td><button class="btn danger delete-user" type="button">Delete</button></td></tr>`;
      }).join('')}
    </tbody></table></div>`;
    qsa('.delete-user', host).forEach(btn => btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.userId;
      if(currentUser() && currentUser().user_id === id){ toast('You cannot delete the user currently logged in.'); return; }
      if(!confirm('Delete this user?')) return;
      setTable('coach_users', getTable('coach_users').filter(u => u.user_id !== id));
      setTable('team_coaches', getTable('team_coaches').filter(tc => tc.user_id !== id));
      toast('User deleted.');
      renderUsersTable();
    }));
  }

  function initGames(){
    if(!guard(['coach','assistant_coach','admin'])) return;
    const select = qs('#gameTeamId');
    populateTeamSelect(select, true);
    if(qs('#gameDate')) qs('#gameDate').value = today();
    if(select){
      select.addEventListener('change', () => { renderLeagueRules(select.value); renderGamePlayers(select.value); });
      if(select.options.length > 1){ select.selectedIndex = 1; renderLeagueRules(select.value); renderGamePlayers(select.value); }
    }
    const quick = qs('#quickMinutes');
    if(quick) quick.addEventListener('click', () => {
      qsa('.stat-minutes').forEach((input, i) => input.value = String(8 + (i % 5) * 3));
      qsa('.stat-fouls').forEach((input, i) => input.value = String(i % 4));
      toast('Demo minutes and fouls filled. Player identifiers remain jersey-only.');
    });
    const form = qs('#gameForm');
    if(form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(form);
      if(!data.team_id){ toast('Choose a team first.'); return; }
      const user = currentUser() || {};
      const team = teamById(data.team_id);
      const league = leagueById(team.league_id);
      const game_id = uid('game');

      const games = getTable('games');
      games.push({
        game_id,
        league_id:team.league_id,
        team_id:data.team_id,
        created_by:user.user_id || '',
        opponent_name:data.opponent_name,
        game_date:data.game_date,
        location:data.location,
        status:data.status
      });
      setTable('games', games);

      const rosters = getTable('game_rosters');
      const statuses = getTable('player_game_statuses');
      const fouls = getTable('fouls');
      const injuries = getTable('injuries');

      qsa('#gamePlayers tbody tr').forEach(row => {
        const player_id = row.dataset.playerId;
        const present = qs('.roster-present', row).checked ? '1' : '0';
        const initial_status = qs('.roster-initial-status', row).value;
        const minutes_played = qs('.stat-minutes', row).value || '0';
        const foul_count = qs('.stat-fouls', row).value || '0';
        const injuryNote = qs('.stat-injury-note', row).value.trim();
        const manuallyDisqualified = qs('.stat-disqualified', row).checked;
        const manuallyUnavailable = qs('.stat-unavailable', row).checked;
        let current_status = qs('.stat-status', row).value;
        const foulLimit = Number(league.foul_disqualification_limit || 5);
        if(Number(foul_count) >= foulLimit || manuallyDisqualified) current_status = 'disqualified';
        if(manuallyUnavailable) current_status = 'unavailable';
        const status_color = statusColorFor(current_status);

        rosters.push({
          game_roster_id:uid('roster'),
          game_id,
          player_id,
          initial_status,
          is_present:present
        });

        statuses.push({
          player_game_status_id:uid('status'),
          game_id,
          player_id,
          current_status,
          status_color,
          minutes_played,
          foul_count,
          is_disqualified: current_status === 'disqualified' ? '1' : '0',
          is_unavailable: current_status === 'unavailable' || present === '0' ? '1' : '0'
        });

        for(let n = 1; n <= Number(foul_count || 0); n++){
          fouls.push({foul_id:uid('foul'), game_id, player_id, foul_number:String(n), foul_time:now(), recorded_by:user.user_id || ''});
        }

        if(current_status === 'injured' || injuryNote){
          injuries.push({injury_id:uid('injury'), game_id, player_id, injury_time:now(), notes:injuryNote || 'Injury status selected.', recorded_by:user.user_id || ''});
        }
      });

      setTable('game_rosters', rosters);
      setTable('player_game_statuses', statuses);
      setTable('fouls', fouls);
      setTable('injuries', injuries);

      toast('Game, roster, status, foul, and injury tables saved with jersey-only player identifiers.');
      setTimeout(() => location.href = 'reports.html', 900);
    });
  }

  function renderLeagueRules(teamId){
    const host = qs('#leagueRulesSnapshot');
    if(!host) return;
    if(!teamId){ host.innerHTML = '<div class="empty-state">Choose a team to see league rules.</div>'; return; }
    const team = teamById(teamId);
    const league = leagueById(team.league_id);
    host.innerHTML = `
      <div class="grid four">
        <article class="card stat-card"><div><div class="num">${safe(league.minimum_playtime_minutes || '0')}</div><div class="label">Min playtime</div></div><div class="icon-tile">⏱️</div></article>
        <article class="card stat-card"><div><div class="num">${safe(league.substitution_interval_minutes || '0')}</div><div class="label">Sub interval</div></div><div class="icon-tile">🔁</div></article>
        <article class="card stat-card"><div><div class="num">${safe(league.foul_disqualification_limit || '5')}</div><div class="label">Foul limit</div></div><div class="icon-tile">⚠️</div></article>
        <article class="card stat-card"><div><div class="num">${safe(league.max_players_on_court || '5')}</div><div class="label">Max on court</div></div><div class="icon-tile">🏀</div></article>
      </div>`;
  }

  function renderGamePlayers(teamId){
    const host = qs('#gamePlayers');
    if(!host) return;
    if(!teamId){ host.innerHTML = '<div class="empty-state">Choose a team to load game roster rows.</div>'; return; }
    const players = getTable('players').filter(p => p.team_id === teamId && String(p.is_active) === '1');
    if(!players.length){ host.innerHTML = '<div class="empty-state">No active jersey records on this team yet.</div>'; return; }
    host.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Jersey #</th><th>Present?</th><th>Initial Status</th><th>Minutes</th><th>Fouls</th><th>Current Status</th><th>Disqualified?</th><th>Unavailable?</th><th>Injury / Note</th></tr></thead><tbody>
      ${players.map(p => `<tr data-player-id="${safe(p.player_id)}"><td><strong>#${safe(p.jersey_number)}</strong></td><td><input class="roster-present" type="checkbox" ${p.default_status === 'unavailable' ? '' : 'checked'}></td><td><select class="control roster-initial-status">${['eligible','needs_time','requirement_met','injured','unavailable'].map(s => `<option value="${s}" ${p.default_status===s?'selected':''}>${safe(STATUS_LABELS[s].label)}</option>`).join('')}</select></td><td><input class="control stat-minutes" type="number" min="0" value="0" style="width:90px"></td><td><input class="control stat-fouls" type="number" min="0" value="0" style="width:80px"></td><td><select class="control stat-status"><option value="eligible">Eligible</option><option value="needs_time">Needs Time</option><option value="requirement_met">Requirement Met</option><option value="injured">Injured</option><option value="unavailable">Unavailable</option><option value="disqualified">Disqualified</option></select></td><td><input class="stat-disqualified" type="checkbox"></td><td><input class="stat-unavailable" type="checkbox"></td><td><input class="control stat-injury-note" placeholder="Optional status note" style="min-width:180px"></td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function initReports(){
    if(!guard()) return;
    populateTeamSelect(qs('#reportTeamId'), true);
    populateGameSelect(qs('#reportGameId'), '', true);
    renderReports();
    const teamSelect = qs('#reportTeamId');
    if(teamSelect) teamSelect.addEventListener('change', () => { populateGameSelect(qs('#reportGameId'), teamSelect.value, true); renderReports(); });
    const gameSelect = qs('#reportGameId');
    if(gameSelect) gameSelect.addEventListener('change', renderReports);
  }

  function renderReports(){
    const teamSelect = qs('#reportTeamId');
    const gameSelect = qs('#reportGameId');
    const teamId = teamSelect ? teamSelect.value : '';
    const gameId = gameSelect ? gameSelect.value : '';
    const teams = visibleTeamsForUser();
    const teamIds = teamId ? [teamId] : teams.map(t => t.team_id);
    const games = getTable('games').filter(g => teamIds.includes(g.team_id));
    const players = getTable('players').filter(p => teamIds.includes(p.team_id));
    const visiblePlayerIds = players.map(p => p.player_id);
    const statuses = getTable('player_game_statuses').filter(s => visiblePlayerIds.includes(s.player_id) && (!gameId || s.game_id === gameId));
    const rosterRows = getTable('game_rosters').filter(r => visiblePlayerIds.includes(r.player_id) && (!gameId || r.game_id === gameId));
    const injuries = getTable('injuries').filter(i => visiblePlayerIds.includes(i.player_id) && (!gameId || i.game_id === gameId));
    const summary = qs('#reportSummary');
    if(summary){
      summary.innerHTML = `
        <article class="card stat-card"><div><div class="num">${players.length}</div><div class="label">Jersey records</div></div><div class="icon-tile">🔢</div></article>
        <article class="card stat-card"><div><div class="num">${games.length}</div><div class="label">Games available</div></div><div class="icon-tile">📋</div></article>
        <article class="card stat-card"><div><div class="num">${statuses.reduce((n,s)=>n+Number(s.minutes_played||0),0)}</div><div class="label">Minutes recorded</div></div><div class="icon-tile">⏱️</div></article>
        <article class="card stat-card"><div><div class="num">${statuses.reduce((n,s)=>n+Number(s.foul_count||0),0)}</div><div class="label">Fouls recorded</div></div><div class="icon-tile">⚠️</div></article>`;
    }
    const rosterHost = qs('#playerReportTable');
    if(rosterHost){
      rosterHost.innerHTML = players.length ? `<div class="table-wrap"><table><thead><tr><th>Team</th><th>Jersey #</th><th>Default Status</th><th>Active?</th><th>Last Status</th><th>Total Minutes</th><th>Total Fouls</th><th>Disqualified?</th><th>Unavailable?</th></tr></thead><tbody>${players.map(p => {
        const team = teams.find(t => t.team_id === p.team_id) || {};
        const playerStatuses = statuses.filter(s => s.player_id === p.player_id);
        const latest = playerStatuses.length ? playerStatuses[playerStatuses.length - 1] : latestStatusForPlayer(p.player_id);
        const minutes = playerStatuses.reduce((sum, s) => sum + Number(s.minutes_played || 0), 0);
        const fouls = playerStatuses.reduce((sum, s) => sum + Number(s.foul_count || 0), 0);
        return `<tr><td>${safe(team.team_name || '')}</td><td>#${safe(p.jersey_number)}</td><td>${statusPill(p.default_status)}</td><td>${safe(isActiveText(p.is_active))}</td><td>${latest ? statusPill(latest.current_status, latest.status_color) : statusPill(p.default_status)}</td><td>${safe(minutes)}</td><td>${safe(fouls)}</td><td>${safe(boolText(latest ? latest.is_disqualified : '0'))}</td><td>${safe(boolText(latest ? latest.is_unavailable : '0'))}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<div class="empty-state">No jersey records match this report.</div>';
    }
    const gameHost = qs('#gameReportTable');
    if(gameHost){
      gameHost.innerHTML = statuses.length ? `<div class="table-wrap"><table><thead><tr><th>Game</th><th>Jersey #</th><th>Present?</th><th>Minutes</th><th>Fouls</th><th>Status</th><th>Injury / Notes</th></tr></thead><tbody>${statuses.map(s => {
        const game = getTable('games').find(g => g.game_id === s.game_id) || {};
        const player = playerById(s.player_id);
        const roster = rosterRows.find(r => r.game_id === s.game_id && r.player_id === s.player_id) || {};
        const injuryNotes = injuries.filter(i => i.game_id === s.game_id && i.player_id === s.player_id).map(i => i.notes).join('; ');
        return `<tr><td>${safe(game.game_date || '')} vs ${safe(game.opponent_name || '')}</td><td>#${safe(player.jersey_number || '')}</td><td>${safe(boolText(roster.is_present))}</td><td>${safe(s.minutes_played)}</td><td>${safe(s.foul_count)}</td><td>${statusPill(s.current_status, s.status_color)}</td><td>${safe(injuryNotes)}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<div class="empty-state">No game status rows match this report.</div>';
    }
  }

  function initAIQuery(){
    if(!guard()) return;
    populateTeamSelect(qs('#aiTeamId'), true);
    populateGameSelect(qs('#aiGameId'), '', true);
    const teamSelect = qs('#aiTeamId');
    if(teamSelect) teamSelect.addEventListener('change', () => populateGameSelect(qs('#aiGameId'), teamSelect.value, true));
    const form = qs('#aiQueryForm');
    const out = qs('#aiResponse');
    if(form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(form);
      if(!data.team_id){ toast('Choose a team before submitting an AI query.'); return; }
      const visibleTeams = visibleTeamsForUser();
      const teamIds = data.team_id ? [data.team_id] : visibleTeams.map(t => t.team_id);
      const players = getTable('players').filter(p => teamIds.includes(p.team_id));
      const statuses = getTable('player_game_statuses').filter(s => players.some(p => p.player_id === s.player_id) && (!data.game_id || s.game_id === data.game_id));
      const needsTime = statuses.filter(s => s.current_status === 'needs_time').length;
      const injured = statuses.filter(s => s.current_status === 'injured').length;
      const text = `Prototype response: I found ${players.length} jersey record(s) and ${statuses.length} game status row(s). ${needsTime} row(s) are marked Needs Time and ${injured} row(s) are marked Injured. Connect this page to the SQL database and AI service to answer the exact natural-language question.`;
      const rows = getTable('ai_queries');
      rows.push({
        ai_query_id:uid('aiq'),
        user_id:(currentUser()||{}).user_id || '',
        team_id:data.team_id || '',
        game_id:data.game_id || '',
        query_text:data.query_text,
        query_type:data.query_type || 'general',
        response_text:text,
        created_at:now()
      });
      setTable('ai_queries', rows);
      if(out) out.innerHTML = `<div class="alert"><strong>AI Query Placeholder</strong><br>${safe(text)}</div>`;
      form.reset();
      populateGameSelect(qs('#aiGameId'), '', true);
    });
  }

  function initContact(){
    const form = qs('#contactMessageForm');
    if(form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formDataObj(form);
      const rows = getTable('contact_messages');
      rows.push({message_id:uid('msg'), sender_name:data.sender_name, sender_email:data.sender_email, subject:data.subject, message:data.message, created_at:now()});
      setTable('contact_messages', rows);
      toast('Message saved locally for the prototype.');
      form.reset();
    });
  }

  function initPlaceholderButtons(){
    qsa('[data-placeholder-report]').forEach(btn => {
      if(btn.dataset.boundPlaceholder === 'yes') return;
      btn.dataset.boundPlaceholder = 'yes';
      btn.addEventListener('click', () => toast('Placeholder only: connect this button to the SQL/API report, substitution tracker, or AI service later.'));
    });
  }

  function initResetDemo(){
    const btn = qs('#resetDemoData');
    if(btn) btn.addEventListener('click', () => {
      if(!confirm('Reset all prototype data to the original demo records?')) return;
      removeOldData();
      localStorage.removeItem(DB_PREFIX + 'schema_version');
      seedData();
      toast('Demo data reset. Refreshing...');
      setTimeout(() => location.reload(), 600);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    seedData();
    renderHeader();
    renderFooter();
    initResetDemo();
    initPlaceholderButtons();
    const page = document.body.dataset.page;
    const initMap = {
      login:initLogin,
      dashboard:initDashboard,
      'team-add':initTeamAdd,
      'team-manage':initTeamManage,
      'admin-users':initAdminUsers,
      games:initGames,
      reports:initReports,
      'ai-query':initAIQuery,
      contact:initContact
    };
    if(initMap[page]) initMap[page]();
  });
})();
