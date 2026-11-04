// NBA : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoBase sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoBase.
// Elle tourne dans le bac à sable de NeoBase, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">NBA</span><span id=\"nbaDay\"></span>\n        <div class=\"agNav\" id=\"nbaDayNav\"><button class=\"btn px\" id=\"nbaPrev\" title=\"Nuit précédente\">&lt;</button><button class=\"btn px\" id=\"nbaToday\">CETTE NUIT</button><button class=\"btn px\" id=\"nbaNext\" title=\"Nuit suivante\">&gt;</button></div>\n        <div class=\"agNav\" id=\"nbaTabs\"><button class=\"btn px\" data-v=\"games\">MATCHS</button><button class=\"btn px\" data-v=\"standings\">CLASSEMENT</button></div></div>\n      <label style=\"display:flex;gap:8px;align-items:center;margin:6px 0 10px;color:var(--shell);font-size:14px\"><input type=\"checkbox\" id=\"nbaCal\"> Ajouter les matchs de mes équipes favorites (★) à mon emploi du temps, mis à jour automatiquement</label>\n      <div id=\"nbaGames\" class=\"nbaGrid\"></div>\n      <div id=\"nbaStandings\" class=\"stCols\"></div>\n      <div id=\"nbaDetail\" style=\"display:none\"></div>\n      <div class=\"hint\">Données ESPN, heures de Paris. Clique sur un match pour sa feuille de match et ses stats avancées, sur un joueur pour ses stats. L'étoile d'une équipe en fait ton équipe : ses matchs passent en premier.</div>\n    </div>";
/*CSS-MOVED*/ const CSS = `#nbaDay{font-size:17px;color:#fff}
#nbaDayNav{margin-left:auto}
#nbaTabs{margin-left:12px}
#nbaTabs .btn.on{--c:var(--magenta);color:#fff}
.nbaGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.nbaGame{gap:8px}
.nbaGame.fav{--c:var(--magenta)}
.nbaScore{font:20px var(--title);color:#fff;text-align:right}
.nbaTeam.lost .tn{color:var(--muted)}
.nbaTeam.lost .nbaScore{color:var(--muted)}
.nbaStatus{font:8px var(--title);letter-spacing:1px;color:var(--lilac);padding-top:6px;border-top:1px solid rgba(255,255,255,.06)}
.nbaStatus.live{color:#fff}
.nbaStatus.live::before{content:"";display:inline-block;width:8px;height:8px;margin-right:8px;background:var(--red);animation:blink 1s steps(2) infinite}
.nbaStar{all:unset;cursor:var(--cp,pointer);color:var(--muted);font-size:16px;padding:0 4px}
.nbaStar:hover,.nbaStar.on{color:#ffd07a}
.nbaRow{display:grid;grid-template-columns:24px 24px 1fr 56px 52px 44px 40px;gap:8px;align-items:center;font-size:14px;color:var(--lilac);padding:4px 0}
.nbaRow img{width:22px;height:22px;object-fit:contain}
.nbaRow .tn{color:#fff;display:flex;align-items:center;gap:4px;min-width:0;white-space:nowrap;overflow:hidden}
.nbaGame.click{cursor:var(--cp,pointer)}
.nbaGame.click:hover{--c:var(--violet)}
.nbaPl{all:unset;cursor:var(--cp,pointer);color:#fff;text-decoration:underline dotted rgba(255,255,255,.35)}
.nbaPl:hover{color:var(--pink)}
.nbaPl.st{font-weight:600}
#nbaDetail{display:flex;flex-direction:column;gap:20px;align-items:flex-start}
#nbaDetail>.sysCard{align-self:stretch;overflow-x:auto}
.nbaTable{border-collapse:collapse;font-size:14px;color:var(--lilac);width:100%}
.nbaTable th{font:7px var(--title);letter-spacing:1px;color:var(--muted);text-align:right;padding:6px 8px;white-space:nowrap}
.nbaTable td{text-align:right;padding:5px 8px;border-top:1px solid rgba(255,255,255,.06);white-space:nowrap}
.nbaTable th:first-child,.nbaTable td:first-child{text-align:left}
.nbaTable tr:hover td{background:rgba(var(--pkr),.06)}
.nbaCmp{display:grid;grid-template-columns:70px 1fr 70px;gap:4px 10px;align-items:center;font-size:14px;color:var(--lilac)}
.nbaCmp b{color:#fff;font-weight:600}
.nbaCmp b:last-of-type{text-align:right}
.nbaCmp span{text-align:center}
.nbaBar{grid-column:1/-1;display:flex;gap:2px;height:6px}
.nbaBar i{background:var(--line2)}
.nbaBar i.win{background:var(--magenta)}
.nbaBio{flex-direction:row!important;gap:20px;align-items:center}
.nbaBio img{width:150px;height:110px;object-fit:cover;object-position:top;background:rgba(0,0,0,.2)}
.nbaName{font:16px var(--title);color:#fff;margin-bottom:6px}
.nbaFacts{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin-top:10px;font-size:14px;color:var(--muted)}
.nbaFacts b{color:#fff;font-weight:500}
.nbaRow.head{font:7px var(--title);letter-spacing:1px;color:var(--muted)}
.nbaRow.fav{background:rgba(var(--mgr),.14)}
.nbaRow.cut{border-top:2px dashed var(--line2);margin-top:4px;padding-top:8px}
`;  // le style de ce plugin (il utilise les variables du thème de NeoBase)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoBase pour s'ouvrir."; return; }
  const { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "nbaApp" ? view : view.querySelector('#' + id);  // les identifiants de ta vue, sans toucher à ceux du reste de NeoBase
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  let prefs = await doc('prefs');
  if (prefs == null) {  // première ouverture : tu retrouves tes réglages d'avant
    prefs = {}; const old = legacy.settings ? await legacy.settings().catch(() => ({})) : {};
    for (const k of ["nbaTeam"]) if (old[k] !== undefined && old[k] !== '' && !(Array.isArray(old[k]) && !old[k].length)) prefs[k] = old[k];
    if (Object.keys(prefs).length) await folder.write('prefs', prefs);
  }
  const neo = { win: a => ctx.host.win?.(a), getSettings: async () => prefs, setSettings: async s => { Object.assign(prefs, s); await folder.write('prefs', prefs); return prefs; } };
  const favs = () => [...new Set([...(prefs.nbaTeams || []), ...(prefs.nbaTeam ? [prefs.nbaTeam] : [])])], isFav = a => favs().includes(a);  // plusieurs équipes favorites (l'ancien réglage « nbaTeam » en fait partie)
  // ---- ton code d'origine ----
  /* ---------- NBA: a game's page (score by quarter, team stats, advanced stats, box score) and a player's page (bio, season and career
     averages, last games), from ESPN's public JSON like the rest of the app. A click on a game opens it, a click on a player opens him. ---------- */
  let nbaBack = null;  // what "Retour" goes back to
  const nbaN = v => parseFloat(v) || 0, nbaPct = v => (v * 100).toFixed(1) + ' %';
  function nbaDetail(nodes, back) {
    nbaBack = back;
    const box = $('nbaDetail'), b = el('button', 'btn px', '‹ RETOUR');
    b.onclick = () => { const f = nbaBack; nbaBack = null; f ? f() : nbaClose(); };
    box.replaceChildren(b, ...nodes);
    $('nbaGames').style.display = $('nbaStandings').style.display = 'none'; box.style.display = ''; $('nbaDayNav').style.visibility = 'hidden';
    view.querySelector('#nbaApp .appWrap')?.scrollTo?.(0, 0); $('nbaApp').scrollTop = 0;
  }
  function nbaClose() { $('nbaDetail').style.display = 'none'; nbaRender(); }
  const nbaLoading = what => nbaDetail([el('div', 'hint', 'Chargement ' + what + '…')]);
  const nbaTable = (head, rows, cls = '') => {
    const t = el('table', 'nbaTable ' + cls), h = el('tr');
    h.append(...head.map(x => el('th', '', x))); t.append(h);
    for (const r of rows) { const tr = el('tr'); for (const c of r) { const td = el('td'); c instanceof Node ? td.append(c) : td.textContent = c ?? ''; tr.append(td); } t.append(tr); }
    return t;
  };
  // a team's advanced numbers from its box score: shooting efficiency, possessions, points per 100 possessions
  function nbaAdvanced(t, opp) {
    const g = (o, k) => nbaN(o.statistics.find(s => s.name === k)?.displayValue), pair = (o, k) => (o.statistics.find(s => s.name === k)?.displayValue || '0-0').split('-').map(nbaN);
    const [fgm, fga] = pair(t, 'fieldGoalsMade-fieldGoalsAttempted'), [tpm] = pair(t, 'threePointFieldGoalsMade-threePointFieldGoalsAttempted'), [, fta] = pair(t, 'freeThrowsMade-freeThrowsAttempted');
    const pts = nbaN(t.pts), tov = g(t, 'totalTurnovers') || g(t, 'turnovers'), orb = g(t, 'offensiveRebounds'), ast = g(t, 'assists');
    const poss = fga - orb + tov + .44 * fta, [, ofga] = pair(opp, 'fieldGoalsMade-fieldGoalsAttempted'), [, ofta] = pair(opp, 'freeThrowsMade-freeThrowsAttempted');
    const oposs = ofga - g(opp, 'offensiveRebounds') + (g(opp, 'totalTurnovers') || g(opp, 'turnovers')) + .44 * ofta, pace = (poss + oposs) / 2;
    return {efg: fga ? (fgm + .5 * tpm) / fga : 0, ts: fga + fta ? pts / (2 * (fga + .44 * fta)) : 0, pace, ortg: pace ? pts / pace * 100 : 0, astTo: tov ? ast / tov : ast, astPct: fgm ? ast / fgm : 0, tovPct: poss ? tov / poss : 0};
  }
  console.assert(Math.abs(nbaAdvanced({pts: 100, statistics: [{name: 'fieldGoalsMade-fieldGoalsAttempted', displayValue: '40-80'}, {name: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', displayValue: '10-30'}, {name: 'freeThrowsMade-freeThrowsAttempted', displayValue: '10-10'}]},
    {statistics: []}).efg - .5625) < 1e-9, 'nbaAdvanced');

  async function nbaGame(id) {
    nbaLoading('du match');
    let s; try { s = await nbaFetch('site/v2/sports/basketball/nba/summary?event=' + id); } catch (e) { return nbaDetail([el('div', 'hint', 'Match indisponible : ' + e.message)]); }
    const comp = s.header.competitions[0], st = comp.status.type, teams = [...comp.competitors].sort((a, b) => a.homeAway === 'away' ? -1 : 1);
    const bt = abbr => s.boxscore?.teams?.find(t => t.team.abbreviation === abbr), nodes = [];
    // the score and the quarters
    const top = el('div', 'sysCard px nbaHead');
    for (const t of teams) {
      const r = el('div', 'nbaTeam' + (st.state === 'post' && !t.winner ? ' lost' : '')), logo = el('img'), n = el('div', 'tn');
      logo.src = t.team.logos?.[0]?.href || t.team.logo || ''; logo.onerror = () => logo.style.visibility = 'hidden';
      n.append(t.team.displayName, el('small', '', (t.homeAway === 'home' ? 'domicile' : 'extérieur') + (t.record?.[0]?.summary ? ' · ' + t.record[0].summary : '')));
      r.append(logo, n, el('span'), el('span', 'nbaScore', st.state === 'pre' ? '' : t.score)); top.append(r);
    }
    top.append(el('div', 'nbaStatus' + (st.state === 'in' ? ' live' : ''), st.state === 'pre' ? 'à ' + new Date(comp.date).toLocaleString('fr-FR', {weekday: 'long', hour: '2-digit', minute: '2-digit'}) : (st.state === 'in' ? 'EN DIRECT · ' : '') + nbaFr(st.detail || st.shortDetail)));
    const q = Math.max(0, ...teams.map(t => t.linescores?.length || 0));
    if (q) top.append(nbaTable(['', ...Array.from({length: q}, (_, i) => i < 4 ? i + 1 + 'e QT' : 'Prol. ' + (i - 3)), 'Total'], teams.map(t => [t.team.abbreviation, ...Array.from({length: q}, (_, i) => t.linescores?.[i]?.displayValue ?? ''), t.score])));
    const v = s.gameInfo?.venue; if (v) top.append(el('div', 'hint', v.fullName + (v.address?.city ? ', ' + v.address.city : '') + (s.gameInfo.attendance ? ' · ' + s.gameInfo.attendance.toLocaleString('fr-FR') + ' spectateurs' : '')));
    nodes.push(top);
    const [ta, tb] = teams.map(t => bt(t.team.abbreviation));
    if (ta && tb) {
      ta.pts = teams[0].score; tb.pts = teams[1].score;
      // team stats side by side, with a bar showing who did better
      const LAB = {fieldGoalPct: 'Tirs %', threePointFieldGoalPct: '3 pts %', freeThrowPct: 'Lancers %', totalRebounds: 'Rebonds', offensiveRebounds: 'Rebonds off.', assists: 'Passes déc.', steals: 'Interceptions',
        blocks: 'Contres', totalTurnovers: 'Balles perdues', pointsInPaint: 'Points dans la raquette', fastBreakPoints: 'Contre-attaque', turnoverPoints: 'Points sur pertes adverses', largestLead: 'Plus gros écart', fouls: 'Fautes'};
      const LOW = ['totalTurnovers', 'fouls'];
      const card = el('div', 'sysCard px'); card.append(el('span', 'label', 'Stats des équipes · ' + teams.map(t => t.team.abbreviation).join(' / ')));
      for (const [k, name] of Object.entries(LAB)) {
        const a = ta.statistics.find(x => x.name === k), b = tb.statistics.find(x => x.name === k); if (!a || !b) continue;
        const av = nbaN(a.displayValue), bv = nbaN(b.displayValue), r = el('div', 'nbaCmp'), bar = el('div', 'nbaBar'), l = el('i'), rr = el('i');
        const share = av + bv ? av / (av + bv) * 100 : 50; l.style.width = share + '%'; rr.style.width = 100 - share + '%';
        const better = LOW.includes(k) ? av < bv : av > bv; (av === bv ? null : better ? l : rr)?.classList.add('win');
        bar.append(l, rr); r.append(el('b', '', a.displayValue), el('span', '', name), el('b', '', b.displayValue), bar); card.append(r);
      }
      nodes.push(card);
      // advanced stats, computed from the box score
      const A = nbaAdvanced(ta, tb), B = nbaAdvanced(tb, ta), adv = el('div', 'sysCard px');
      adv.append(el('span', 'label', 'Stats avancées'), nbaTable(['', teams[0].team.abbreviation, teams[1].team.abbreviation], [
        ['Tir effectif (eFG %)', nbaPct(A.efg), nbaPct(B.efg)], ['Tir réel (TS %)', nbaPct(A.ts), nbaPct(B.ts)], ['Points / 100 possessions', A.ortg.toFixed(1), B.ortg.toFixed(1)],
        ['Rythme (possessions)', A.pace.toFixed(1), B.pace.toFixed(1)], ['Paniers sur passe', nbaPct(A.astPct), nbaPct(B.astPct)], ['Passes / balle perdue', A.astTo.toFixed(2), B.astTo.toFixed(2)], ['Pertes / possession', nbaPct(A.tovPct), nbaPct(B.tovPct)],
      ], 'adv'), el('div', 'hint', 'eFG % compte un panier à 3 points pour 1,5 · TS % ajoute les lancers francs · le rythme est le nombre de possessions estimé.'));
      nodes.push(adv);
    }
    // the box score of each team: a click on a player opens his page
    for (const p of s.boxscore?.players || []) {
      const blk = p.statistics?.[0]; if (!blk?.athletes?.length) continue;
      const card = el('div', 'sysCard px'), i = k => blk.names.indexOf(k);
      card.append(el('span', 'label', 'Feuille de match · ' + p.team.displayName));
      const head = ['Joueur', 'MIN', 'PTS', 'REB', 'PD', 'INT', 'CTR', 'TIRS', '3 PTS', 'LF', 'BP', '+/-', 'TS %'];
      const rows = blk.athletes.map(a => {
        const x = a.stats || [], n = el('button', 'nbaPl' + (a.starter ? ' st' : ''), a.athlete.shortName || a.athlete.displayName);
        n.title = 'Voir les stats de ' + a.athlete.displayName; n.onclick = () => nbaPlayer(a.athlete.id, () => nbaGame(id));
        if (a.didNotPlay || !x.length) return [n, a.reason || 'n’a pas joué'];
        const [fgm, fga] = (x[i('FG')] || '0-0').split('-').map(nbaN), [, fta] = (x[i('FT')] || '0-0').split('-').map(nbaN), pts = nbaN(x[i('PTS')]);
        return [n, x[i('MIN')], x[i('PTS')], x[i('REB')], x[i('AST')], x[i('STL')], x[i('BLK')], x[i('FG')], x[i('3PT')], x[i('FT')], x[i('TO')], x[i('+/-')], fga + fta ? nbaPct(pts / (2 * (fga + .44 * fta))) : '-'];
      });
      card.append(nbaTable(head, rows, 'box'), el('div', 'hint', 'En gras : les titulaires. Clique sur un joueur pour ses stats de la saison.'));
      nodes.push(card);
    }
    if (nodes.length === 1) nodes.push(el('div', 'hint', 'La feuille de match arrive au coup d’envoi.'));
    nbaDetail(nodes, null);
  }

  async function nbaPlayer(id, back) {
    nbaLoading('du joueur');
    const base = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/' + id, get = u => fetch(u).then(r => { if (!r.ok) throw new Error('ESPN ' + r.status); return r.json(); });
    let a, o; try { [a, o] = await Promise.all([get(base).then(j => j.athlete), get(base + '/overview').catch(() => ({}))]); } catch (e) { return nbaDetail([el('div', 'hint', 'Joueur indisponible : ' + e.message)], back); }
    const nodes = [], top = el('div', 'sysCard px nbaBio'), pic = el('img');
    pic.src = a.headshot?.href || ''; pic.onerror = () => pic.style.display = 'none';
    const info = el('div');
    info.append(el('div', 'nbaName', a.displayName), el('div', 'hint', [a.team?.displayName, a.position?.displayName && ({Forward: 'Ailier', Guard: 'Arrière', Center: 'Pivot', 'Point Guard': 'Meneur', 'Shooting Guard': 'Arrière', 'Small Forward': 'Ailier', 'Power Forward': 'Ailier fort'}[a.position.displayName] || a.position.displayName), a.jersey && '#' + a.jersey].filter(Boolean).join(' · ')));
    const cm = s => { const m = /(\d+)' (\d+)"/.exec(s || ''); return m ? Math.round((+m[1] * 12 + +m[2]) * 2.54) + ' cm' : ''; }, kg = s => { const m = /(\d+)/.exec(s || ''); return m ? Math.round(+m[1] * .4536) + ' kg' : ''; };
    const facts = [['Âge', a.age ? a.age + ' ans' : ''], ['Taille', cm(a.displayHeight)], ['Poids', kg(a.displayWeight)], ['Né à', a.displayBirthPlace], ['Draft', a.displayDraft], ['Université', a.college?.name], ['Saison en NBA', (a.displayExperience || '').replace(/(\d+)\w* Season/, '$1e')]].filter(f => f[1]);
    const dl = el('div', 'nbaFacts'); for (const [k, x] of facts) dl.append(el('span', '', k), el('b', '', x)); info.append(dl);
    top.append(pic, info); nodes.push(top);
    const st = o.statistics;
    if (st?.splits?.length) {
      const FR = {GP: 'MJ', MIN: 'MIN', 'FG%': 'TIRS %', '3P%': '3 PTS %', 'FT%': 'LF %', REB: 'REB', AST: 'PD', BLK: 'CTR', STL: 'INT', PF: 'FTES', TO: 'BP', PTS: 'PTS'};
      const card = el('div', 'sysCard px'); card.append(el('span', 'label', 'Moyennes par match'));
      card.append(nbaTable(['', ...st.labels.map(l => FR[l] || l)], st.splits.map(sp => [{'Regular Season': 'Saison', Career: 'Carrière', Postseason: 'Playoffs'}[sp.displayName] || sp.displayName, ...sp.stats])), el('div', 'hint', 'MJ : matchs joués · PD : passes décisives · INT : interceptions · CTR : contres · BP : balles perdues · LF : lancers francs.'));
      nodes.push(card);
    }
    const gl = o.gameLog, blk = gl?.statistics?.[0];
    if (blk?.events?.length) {
      const card = el('div', 'sysCard px'); card.append(el('span', 'label', 'Derniers matchs'));
      const pick = ['points', 'totalRebounds', 'assists', 'minutes', 'fieldGoalPct', 'threePointPct'], idx = pick.map(k => blk.names.indexOf(k));
      card.append(nbaTable(['Match', 'PTS', 'REB', 'PD', 'MIN', 'TIRS %', '3 PTS %'], blk.events.map(ev => {
        const e = gl.events?.[ev.eventId] || {}, g = el('button', 'nbaPl', (e.gameDate ? new Date(e.gameDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) + ' ' : '') + (e.atVs || '') + ' ' + (e.opponent?.abbreviation || '') + (e.gameResult ? ' · ' + ({W: 'V', L: 'D'}[e.gameResult] || e.gameResult) + ' ' + (e.score || '') : ''));
        g.title = 'Voir ce match'; g.onclick = () => nbaGame(ev.eventId);
        return [g, ...idx.map(i => ev.stats[i] ?? '')];
      })));
      nodes.push(card);
    }
    nbaDetail(nodes, back);
  }
  /* ---------- NBA app: scores of a night and standings, from ESPN's public JSON (no account); the favorite team (settings.nbaTeam) comes first ---------- */
  const NBA = 'https://site.api.espn.com/apis/', nbaFetch = p => fetch(NBA + p).then(r => { if (!r.ok) throw new Error('ESPN ' + r.status); return r.json(); });
  let nbaDate = null, nbaView = 'games', nbaTimer = null;
  // the night to show by default: US date in New York, the previous one until noon there (games end in the French morning)
  const nbaDefault = () => { const ny = new Date(new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})); if (ny.getHours() < 12) ny.setDate(ny.getDate() - 1); return ymd(ny); };
  const nbaFr = s => s.replace(/End of (\d)\w+/, 'Fin du $1e QT').replace(/(\d)(st|nd|rd|th)( Quarter)?/, '$1e QT').replace(/Halftime/, 'Mi-temps').replace(/\bOT\b/, 'prol.').replace(/Final/, 'Terminé');
  console.assert(nbaFr('7:32 - 3rd') === '7:32 - 3e QT' && nbaFr('End of 1st') === 'Fin du 1e QT' && nbaFr('Final/OT') === 'Terminé/prol.', 'nbaFr');
  const nbaStar = abbr => {
    const b = el('button', 'nbaStar' + (isFav(abbr) ? ' on' : ''), isFav(abbr) ? '★' : '☆');
    b.title = isFav(abbr) ? "Ce n'est plus une de mes équipes" : 'Une de mes équipes : ses matchs passent en premier et vont dans mon emploi du temps';
    b.onclick = async e => { e.stopPropagation(); const set = new Set(favs()); set.has(abbr) ? set.delete(abbr) : set.add(abbr); prefs = await neo.setSettings({nbaTeams: [...set], nbaTeam: ''}); nbaRender(); nbaCalendar(); };
    return b;
  };
  async function nbaRender() {
    clearTimeout(nbaTimer);
    if (!view.classList.contains('on')) return;
    nbaDate ??= nbaDefault();
    const d = new Date(nbaDate + 'T12:00'), next = addDays(d, 1);
    $('nbaDay').textContent = 'Nuit du ' + d.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric'}) + ' au ' + next.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    view.querySelectorAll('#nbaTabs .btn').forEach(b => b.classList.toggle('on', b.dataset.v === nbaView));
    $('nbaDayNav').style.visibility = nbaView === 'games' ? '' : 'hidden';
    if (nbaBack !== null || $('nbaDetail').style.display !== 'none') return;  // a game or a player is open: the live refresh waits
    $('nbaGames').style.display = nbaView === 'games' ? '' : 'none'; $('nbaStandings').style.display = nbaView === 'games' ? 'none' : '';
    try {
      if (nbaView === 'standings') return nbaStandings(await nbaFetch('v2/sports/basketball/nba/standings'));
      const sb = await nbaFetch('site/v2/sports/basketball/nba/scoreboard?dates=' + nbaDate.replace(/-/g, ''));
      const games = (sb.events || []).map(e => ({e, c: e.competitions[0]})).sort((a, b) => {
        const fav = g => g.c.competitors.some(t => isFav(t.team.abbreviation)) ? 0 : 1;
        return fav(a) - fav(b) || a.e.date.localeCompare(b.e.date);
      });
      $('nbaGames').replaceChildren(...(games.length ? games.map(nbaCard) : [el('div', 'hint', 'Aucun match cette nuit-là.')]));
      if (games.some(g => g.e.status.type.state === 'in')) nbaTimer = setTimeout(nbaRender, 30000);  // live scores
    } catch (err) { $('nbaGames').replaceChildren(el('div', 'hint', 'Résultats indisponibles : ' + err.message + '. Vérifie ta connexion.')); }
  }
  function nbaCard({e, c}) {
    const st = e.status.type, card = el('div', 'sysCard px nbaGame'), teams = [...c.competitors].sort((a, b) => a.homeAway === 'away' ? -1 : 1);
    if (teams.some(t => isFav(t.team.abbreviation))) card.classList.add('fav');
    for (const t of teams) {
      const r = el('div', 'nbaTeam' + (st.state === 'post' && !t.winner ? ' lost' : '')), logo = el('img'), n = el('div', 'tn');
      logo.src = t.team.logo || ''; logo.onerror = () => logo.style.visibility = 'hidden';
      n.append(t.team.shortDisplayName || t.team.displayName, el('small', '', (t.homeAway === 'home' ? 'domicile' : 'extérieur') + (t.records?.[0]?.summary ? ' · ' + t.records[0].summary : '')));
      r.append(logo, n, nbaStar(t.team.abbreviation), el('span', 'nbaScore', st.state === 'pre' ? '' : t.score));
      card.append(r);
    }
    const live = st.state === 'in', s = el('div', 'nbaStatus' + (live ? ' live' : ''));
    s.textContent = st.name === 'STATUS_POSTPONED' ? 'Reporté' : st.state === 'pre' ? 'à ' + new Date(e.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) + ' (heure de Paris)'
      : live ? 'EN DIRECT · ' + nbaFr(st.shortDetail) : nbaFr(st.shortDetail);
    card.append(s);
    // best scorer of each team, once the game has started
    const tops = st.state === 'pre' ? [] : teams.map(t => t.leaders?.find(l => l.name === 'points')?.leaders?.[0]).filter(Boolean);
    if (tops.length) {  // the best scorers: a click opens the player
      const h = el('div', 'hint', 'Meilleurs marqueurs : ');
      tops.forEach((l, i) => { const b = el('button', 'nbaPl', l.athlete.shortName + ' ' + l.displayValue + ' pts'); b.onclick = ev => { ev.stopPropagation(); nbaPlayer(l.athlete.id, () => nbaClose()); }; h.append(i ? ' · ' : '', b); });
      card.append(h);
    }
    card.classList.add('click'); card.title = 'Voir la feuille de match et les stats avancées'; card.onclick = () => nbaGame(e.id);
    return card;
  }
  function nbaStandings(st) {
    $('nbaStandings').replaceChildren(...(st.children || []).map(conf => {
      const card = el('div', 'sysCard px'), stat = (en, k) => en.stats.find(s => s.name === k)?.displayValue ?? '';
      card.append(el('span', 'label', conf.name === 'Eastern Conference' ? 'Conférence Est' : conf.name === 'Western Conference' ? 'Conférence Ouest' : conf.name));
      const rows = [...conf.standings.entries].sort((a, b) => +stat(a, 'playoffSeed') - +stat(b, 'playoffSeed'));
      const head = el('div', 'nbaRow head'); head.append(el('span', '', '#'), el('span', '', ''), el('span', '', 'Équipe'), el('span', '', 'V-D'), el('span', '', '%'), el('span', '', 'Écart'), el('span', '', 'Série'));
      card.append(head);
      rows.forEach((en, i) => {
        const r = el('div', 'nbaRow' + (isFav(en.team.abbreviation) ? ' fav' : '') + (i === 6 || i === 10 ? ' cut' : '')), logo = el('img');
        logo.src = en.team.logos?.[0]?.href || ''; logo.onerror = () => logo.style.visibility = 'hidden';
        const name = el('span', 'tn', en.team.shortDisplayName || en.team.displayName);
        name.append(nbaStar(en.team.abbreviation));
        r.append(el('span', '', i + 1), logo, name, el('span', '', stat(en, 'wins') + '-' + stat(en, 'losses')), el('span', '', stat(en, 'winPercent')), el('span', '', stat(en, 'gamesBehind')), el('span', '', stat(en, 'streak')));
        r.title = i < 6 ? 'Qualifiée pour les playoffs' : i < 10 ? 'Play-in' : '';
        card.append(r);
      });
      card.append(el('div', 'hint', '1 à 6 : playoffs · 7 à 10 : play-in'));
      return card;
    }));
  }
  $('nbaPrev').onclick = () => { nbaDate = ymd(addDays(new Date(nbaDate + 'T12:00'), -1)); nbaRender(); };
  $('nbaNext').onclick = () => { nbaDate = ymd(addDays(new Date(nbaDate + 'T12:00'), 1)); nbaRender(); };
  $('nbaToday').onclick = () => { nbaDate = nbaDefault(); nbaRender(); };
  $('nbaTabs').onclick = e => { const v = e.target.dataset.v; if (v) { nbaView = v; nbaBack = null; $('nbaDetail').style.display = 'none'; nbaRender(); } };
  // ---- les matchs de tes équipes dans ton emploi du temps ----
  const hm = mn => String(Math.floor(mn / 60)).padStart(2, '0') + ':' + String(mn % 60).padStart(2, '0');
  async function nbaCalendar() {
    const evs = new Map();
    if (prefs.nbaCalendar !== false) for (const abbr of favs()) {
      try {
        const j = await nbaFetch('site/v2/sports/basketball/nba/teams/' + abbr.toLowerCase() + '/schedule');
        for (const e of j.events || []) {
          const d = new Date(e.date); if (d < new Date(Date.now() - 36e5) || d > new Date(Date.now() + 75 * 864e5)) continue;
          const cs = e.competitions?.[0]?.competitors || [], home = cs.find(c => c.homeAway === 'home')?.team, away = cs.find(c => c.homeAway === 'away')?.team, s = d.getHours() * 60 + d.getMinutes();
          evs.set(e.id, {id: 'nba:' + e.id, kind: 'event', title: 'NBA · ' + (away?.displayName || '?') + ' à ' + (home?.displayName || '?'), date: ymd(d), start: hm(s), end: hm(Math.min(1439, s + 150)), allDay: false, color: '#e89a3a', place: 'Match NBA'});
        }
      } catch {}
    }
    ctx.host.agenda?.sync('nba', [...evs.values()].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)));
  }
  $('nbaCal').checked = prefs.nbaCalendar !== false;
  $('nbaCal').onchange = async () => { prefs = await neo.setSettings({nbaCalendar: $('nbaCal').checked}); nbaCalendar(); ctx.host.toast(prefs.nbaCalendar ? 'Les matchs de tes équipes sont dans ton emploi du temps' : 'Les matchs ne sont plus dans ton emploi du temps'); };
  nbaCalendar(); const calTimer = setInterval(nbaCalendar, 3 * 3600e3);
  // ---- fin ----
  ctx.onOpen(() => { nbaRender(); });
  ctx.onClose(() => { clearTimeout(nbaTimer); clearInterval(calTimer); });
}
