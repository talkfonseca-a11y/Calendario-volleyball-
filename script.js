(() => {
  'use strict';
  const SUPABASE_URL = 'https://lvdgppffbecxfmaujkuz.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QEtgxEuccmTXYFTCStGKOg_Senb9RGT';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const monthShort = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const weekNames = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  const monthSelect = document.querySelector('#month-select');
  const eventList = document.querySelector('#event-list');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const start = new Date(2026, 9, 4, 12);
  const end = new Date(2027, 9, 31, 12);
  let events = [];
  let activeFilter = 'todos';
  let isAdmin = false;
  let currentUser = null;
  let loading = true;
  let saveBusy = false;
  const nextName = document.querySelector('#next-name');
  const nextDate = document.querySelector('#next-date');
  const lastUpdated = document.querySelector('#last-updated');
  const pastSection = document.querySelector('#past-section');
  const pastList = document.querySelector('#past-list');
  const pastCount = document.querySelector('#past-count');
  const adminToggle = document.querySelector('#admin-toggle');
  const adminContent = document.querySelector('#admin-content');
  const adminLogin = document.querySelector('#admin-login');
  const adminTools = document.querySelector('#admin-tools');
  const adminMessage = document.querySelector('#admin-message');
  const historyToggle = document.querySelector('#history-toggle');
  const historyList = document.querySelector('#history-list');
  const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const formatLong = date => `${date.getDate()} de ${monthNames[date.getMonth()]}`;
  const localDate = value => value instanceof Date ? new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12) : new Date(`${value}T12:00:00`);
  const modalityLabel = value => value === 'Vôlei' || value === 'volei' ? 'Vôlei' : 'Futevôlei';
  const modalityKey = value => modalityLabel(value) === 'Vôlei' ? 'volei' : 'futevolei';
  const showMessage = (message, kind = '') => {
    adminMessage.textContent = message;
    adminMessage.dataset.kind = kind;
  };
  function buildDefaultEvents() {
    const list = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weekday = d.getDay();
      let modality;
      if (weekday === 0) {
        const weeks = Math.round((d - start) / (7 * 86400000));
        modality = weeks % 2 === 0 ? 'Futevôlei' : 'Vôlei';
      } else if ([1,3,5].includes(weekday)) modality = 'Futevôlei';
      else modality = 'Vôlei';
      list.push({ id: null, event_date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, modality, updated_at: null, updated_by: null });
    }
    return list;
  }
  async function loadEvents() {
    const selectedBeforeReload = monthSelect.value;
    const { data, error } = await db.from('calendar_events')
      .select('id,event_date,modality,updated_at,updated_by')
      .gte('event_date','2026-10-04')
      .lte('event_date','2027-10-31')
      .order('event_date');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('O banco não retornou eventos para o período do calendário.');
    events = data.map(row => {
      const date = localDate(row.event_date);
      return {...row, date, type: modalityKey(row.modality), dayName: weekNames[date.getDay()]};
    });
    populateMonths(selectedBeforeReload);
    await loadSiteState();
    loading = false;
    render();
  }
  async function loadSiteState() {
    const { data, error } = await db.from('calendar_site_state').select('last_updated_at,last_updated_by').eq('id',1).maybeSingle();
    if (error) {
      lastUpdated.textContent = 'Última atualização indisponível';
      return;
    }
    if (!data || !data.last_updated_at) { lastUpdated.textContent = 'Ainda sem alterações registradas'; return; }
    const date = new Date(data.last_updated_at);
    lastUpdated.textContent = `Última atualização: ${date.toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}`;
  }
  function populateMonths(preferredMonth = '') {
    monthSelect.replaceChildren();
    const months = [...new Map(events.map(event => [monthKey(event.date), event.date])).entries()];
    months.forEach(([key, date]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${monthNames[date.getMonth()][0].toUpperCase()}${monthNames[date.getMonth()].slice(1)} ${date.getFullYear()}`;
      monthSelect.append(option);
    });
    const today = new Date(); today.setHours(0,0,0,0);
    const defaultMonth = events.some(event => monthKey(event.date) === monthKey(today)) ? monthKey(today) : monthKey(end);
    monthSelect.value = months.some(([key]) => key === preferredMonth) ? preferredMonth : defaultMonth;
  }
  function updateUpcoming() {
    const today = new Date(); today.setHours(0,0,0,0);
    const event = events.find(item => { const d = new Date(item.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
    if (event) {
      nextName.textContent = modalityLabel(event.modality);
      nextDate.textContent = `Hoje · ${formatLong(event.date)}`;
      document.querySelector('#next-day-number').textContent = String(event.date.getDate()).padStart(2,'0');
      document.querySelector('#next-day-month').textContent = monthShort[event.date.getMonth()];
    } else {
      nextName.textContent = 'Confira a programação';
      const next = events.find(item => { const d = new Date(item.date); d.setHours(0,0,0,0); return d >= today; });
      nextDate.textContent = next ? `Próximo encontro · ${formatLong(next.date)}` : 'Não há encontros futuros cadastrados.';
      const shown = next ? next.date : today;
      document.querySelector('#next-day-number').textContent = String(shown.getDate()).padStart(2,'0');
      document.querySelector('#next-day-month').textContent = monthShort[shown.getMonth()];
    }
  }
  function makeEventRow(event, stateClass = '') {
    const row = document.createElement('article');
    row.className = `event-row ${stateClass}`.trim();
    const date = document.createElement('div'); date.className = 'event-date';
    const day = document.createElement('strong'); day.textContent = String(event.date.getDate()).padStart(2,'0');
    const month = document.createElement('span'); month.textContent = monthShort[event.date.getMonth()];
    date.append(day, month);
    const info = document.createElement('div'); info.className = 'event-info';
    const name = document.createElement('strong'); name.textContent = modalityLabel(event.modality);
    const detail = document.createElement('span'); detail.textContent = `${event.dayName} · ${formatLong(event.date)}`;
    info.append(name, detail);
    if (isAdmin) {
      const editor = document.createElement('select');
      editor.className = 'event-editor';
      editor.setAttribute('aria-label', `Alterar modalidade de ${formatLong(event.date)}`);
      [['Vôlei','Vôlei'],['Futevôlei','Futevôlei']].forEach(([value,label]) => {
        const option = document.createElement('option'); option.value = value; option.textContent = label; editor.append(option);
      });
      editor.value = modalityLabel(event.modality);
      editor.disabled = saveBusy || !event.id;
      editor.addEventListener('change', () => saveModality(event, editor));
      row.append(date, info, editor);
    } else {
      const badge = document.createElement('span'); badge.className = 'event-status';
      const today = new Date(); today.setHours(0,0,0,0);
      const d = new Date(event.date); d.setHours(0,0,0,0);
      badge.textContent = stateClass === 'is-today' ? 'Hoje' : stateClass === 'is-past' ? 'Realizado' : 'Agendado';
      row.append(date, info, badge);
    }
    return row;
  }
  function confirmSundayRebase(event, previous, next, count) {
    const dialog = document.querySelector('#sunday-confirm-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') {
      return Promise.resolve(window.confirm(`Reorganizar domingos? ${count} domingos a partir de ${formatLong(event.date)} serão recalculados. Os outros dias não serão alterados.`));
    }
    document.querySelector('#sunday-confirm-date').textContent = formatLong(event.date);
    document.querySelector('#sunday-confirm-count').textContent = String(count);
    document.querySelector('#sunday-confirm-from').textContent = previous;
    document.querySelector('#sunday-confirm-to').textContent = next;
    return new Promise(resolve => {
      const onClose = () => {
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'confirm');
      };
      dialog.addEventListener('close', onClose);
      dialog.showModal();
    });
  }

  async function saveModality(event, editor) {
    if (!isAdmin || !currentUser || saveBusy || !event.id) return;
    const next = editor.value;
    if (next === event.modality) return;
    const previous = event.modality;
    const isSunday = event.date.getDay() === 0;
    const affectedSundays = isSunday
      ? events.filter(item => item.date.getDay() === 0 && item.event_date >= event.event_date).sort((a, b) => a.event_date.localeCompare(b.event_date))
      : [];
    if (isSunday) {
      const confirmed = await confirmSundayRebase(event, previous, next, affectedSundays.length);
      if (!confirmed) {
        editor.value = previous;
        return;
      }
    }
    saveBusy = true;
    render();
    showMessage(isSunday ? 'Recalculando a sequência dos domingos…' : `Salvando ${formatLong(event.date)}…`);
    try {
      if (isSunday) {
        const { data, error } = await db.rpc('rebase_sunday_schedule', {
          p_start_date: event.event_date,
          p_start_modality: next
        });
        if (error) throw error;
        await loadEvents();
        showMessage(`Sequência atualizada: ${affectedSundays.length} domingo(s) conferidos a partir de ${formatLong(event.date)}. Os demais dias permaneceram iguais.`, 'success');
      } else {
        const { data, error } = await db.from('calendar_events')
          .update({modality:next})
          .eq('id',event.id)
          .select('id,event_date,modality,updated_at,updated_by')
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Nenhuma linha foi atualizada. Confira a permissão de administrador no banco.');
        await loadEvents();
        showMessage(`Alteração salva: ${formatLong(event.date)} — ${previous} → ${next}. Os domingos não foram alterados.`, 'success');
      }
      if (!historyList.hidden) await loadHistory();
    } catch (error) {
      console.error('Falha ao salvar modalidade:', error);
      showMessage(isSunday
        ? 'Não foi possível recalcular os domingos. Nenhuma alteração parcial foi aplicada; atualize a página e tente novamente.'
        : 'Não foi possível confirmar a alteração. Verifique a conexão e atualize a página antes de tentar novamente.', 'error');
      try { await loadEvents(); } catch (reloadError) { console.error('Falha ao recarregar calendário:', reloadError); render(); }
    } finally {
      saveBusy = false;
      render();
    }
  }
  async function renderSafely() { render(); }
  function render() {
    updateUpcoming();
    const selectedMonth = monthSelect.value;
    const monthEvents = events.filter(event => monthKey(event.date) === selectedMonth);
    const visible = monthEvents.filter(event => activeFilter === 'todos' || event.type === activeFilter);
    const today = new Date(); today.setHours(0,0,0,0);
    eventList.replaceChildren();
    const upcoming = visible.filter(event => { const d = new Date(event.date); d.setHours(0,0,0,0); return d >= today; });
    if (loading) {
      const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = 'Carregando calendário…'; eventList.append(p);
    } else if (!upcoming.length) {
      const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = 'Nenhum encontro futuro para este filtro neste mês.'; eventList.append(p);
    } else upcoming.forEach(event => {
      const d = new Date(event.date); d.setHours(0,0,0,0);
      eventList.append(makeEventRow(event, d.getTime() === today.getTime() ? 'is-today' : 'is-future'));
    });
    const past = visible.filter(event => { const d = new Date(event.date); d.setHours(0,0,0,0); return d < today; });
    pastList.replaceChildren();
    pastSection.hidden = past.length === 0;
    pastCount.textContent = past.length ? `${past.length} ${past.length === 1 ? 'encontro' : 'encontros'}` : '';
    past.forEach(event => pastList.append(makeEventRow(event, 'is-past')));
  }
  async function loadHistory() {
    historyList.hidden = false;
    historyList.replaceChildren();
    const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = 'Carregando histórico…'; historyList.append(p);
    const historyCutoff = new Date();
    historyCutoff.setMonth(historyCutoff.getMonth() - 2);
    const { data, error } = await db.from('calendar_change_log').select('event_date,old_modality,new_modality,action,changed_at').eq('action','UPDATE').gte('changed_at', historyCutoff.toISOString()).order('changed_at',{ascending:false}).limit(100);
    historyList.replaceChildren();
    if (error) {
      const err = document.createElement('p'); err.className = 'empty-state'; err.textContent = 'Não foi possível carregar o histórico agora.'; historyList.append(err); return;
    }
    if (!data || !data.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Ainda não há alterações de modalidade registradas.'; historyList.append(empty); return;
    }
    data.forEach((item, index) => {
      const row = document.createElement('div'); row.className = `history-row ${index === 0 ? 'is-latest' : 'is-older'}`;
      const date = document.createElement('span'); date.textContent = localDate(item.event_date).toLocaleDateString('pt-BR');
      const change = document.createElement('span');
      change.textContent = item.action === 'UPDATE' ? `${item.old_modality || '—'} → ${item.new_modality || '—'}` : item.action === 'INSERT' ? `Incluído: ${item.new_modality || '—'}` : `Removido: ${item.old_modality || '—'}`;
      const when = document.createElement('small'); when.textContent = new Date(item.changed_at).toLocaleString('pt-BR');
      row.append(date, change, when); historyList.append(row);
    });
  }
  async function checkAdmin(session) {
    currentUser = session?.user || null;
    isAdmin = Boolean(currentUser && currentUser.app_metadata && currentUser.app_metadata.role === 'admin');
    adminLogin.hidden = isAdmin;
    adminTools.hidden = !isAdmin;
    adminToggle.textContent = isAdmin ? 'Sessão ativa' : 'Entrar';
    if (isAdmin) {
      showMessage('Acesso administrativo autorizado.', 'success');
    } else if (currentUser) {
      showMessage('Esta conta não tem permissão de administrador.', 'error');
      await db.auth.signOut();
      currentUser = null;
    } else showMessage('');
    render();
  }
  adminToggle.addEventListener('click', () => { adminContent.hidden = !adminContent.hidden; adminToggle.setAttribute('aria-expanded', String(!adminContent.hidden)); });
  adminLogin.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.querySelector('#admin-email').value.trim();
    const password = document.querySelector('#admin-password').value;
    const button = adminLogin.querySelector('button[type="submit"]');
    button.disabled = true; showMessage('Verificando acesso…');
    const { data, error } = await db.auth.signInWithPassword({email,password});
    button.disabled = false;
    if (error) { showMessage('Não foi possível entrar. Confira o e-mail e a senha.', 'error'); return; }
    await checkAdmin(data.session);
  });
  document.querySelector('#admin-logout').addEventListener('click', async () => {
    await db.auth.signOut(); isAdmin = false; currentUser = null;
    showMessage('Você saiu da área administrativa.'); render();
  });
  historyToggle.addEventListener('click', async () => {
    const opening = historyList.hidden;
    historyList.hidden = !opening;
    historyToggle.textContent = opening ? 'Ocultar histórico' : 'Ver histórico';
    if (opening) await loadHistory();
  });
  monthSelect.addEventListener('change', render);
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    render();
  }));
  const themeToggle = document.querySelector('#theme-toggle');
  const themeStorageKey = 'castanheiras-theme';
  function applyTheme(dark, save = false) {
    document.body.classList.toggle('dark', dark);
    themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeToggle.title = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
    themeToggle.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3-1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.5 8.5 0 1 0 12 12Z"/></svg>';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171916' : '#f7f7f5';
    if (save) { try { localStorage.setItem(themeStorageKey, dark ? 'dark' : 'light'); } catch (_) {} }
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(themeStorageKey); } catch (_) {}
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme ? savedTheme === 'dark' : systemPrefersDark);
  themeToggle.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark'), true));
  db.auth.getSession().then(({data,error}) => {
    if (error) console.warn('Sessão Supabase:', error.message);
    checkAdmin(data?.session || null);
  });
  loadEvents().catch(error => {
    console.error('Falha ao carregar calendário:', error);
    loading = false;
    events = buildDefaultEvents().map(row => {
      const date = localDate(row.event_date);
      return {...row, date, type:modalityKey(row.modality), dayName:weekNames[date.getDay()]};
    });
    populateMonths();
    render();
    lastUpdated.textContent = 'Banco indisponível — programação padrão apenas para consulta.';
    if (adminToggle) adminToggle.disabled = true;
  });
})();