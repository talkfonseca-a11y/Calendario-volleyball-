(() => {
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const monthShort = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const monthSelect = document.querySelector('#month-select');
  const eventList = document.querySelector('#event-list');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const start = new Date(2026, 9, 4, 12);
  const end = new Date(2027, 9, 31, 12);
  const events = [];
  const addEvent = (date, type, dayName, time = '') => events.push({ date: new Date(date), type, dayName, time });

  // A rotina semanal vai de segunda a sábado; o domingo segue a lista alternada original.
  // Futevôlei: segunda, quarta e sexta. Vôlei: terça, quinta e sábado.
  for (let date = new Date(2026, 9, 5, 12); date <= end; date.setDate(date.getDate() + 1)) {
    const weekday = date.getDay();
    if (weekday === 1 || weekday === 3 || weekday === 5) {
      addEvent(date, 'futevolei', ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'][weekday]);
    } else if (weekday === 2 || weekday === 4) {
      addEvent(date, 'volei', ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'][weekday]);
    } else if (weekday === 6) {
      addEvent(date, 'volei', 'Sábado');
    }
  }
  // Domingos alternados: 04/10/2026 começa com futevôlei, conforme o calendário original.
  for (let date = new Date(start), index = 0; date <= end; date.setDate(date.getDate() + 7), index++) {
    addEvent(date, index % 2 === 0 ? 'futevolei' : 'volei', 'Domingo');
  }
  events.sort((a, b) => a.date - b.date);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let activeFilter = 'todos';
  const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const formatLong = date => `${date.getDate()} de ${monthNames[date.getMonth()]}`;
  const nextName = document.querySelector('#next-name');
  const nextDate = document.querySelector('#next-date');
  function updateUpcoming() {
    const currentDay = new Date();
    currentDay.setHours(0, 0, 0, 0);
    const todayEvent = events.find(event => {
      const eventDay = new Date(event.date);
      eventDay.setHours(0, 0, 0, 0);
      return eventDay.getTime() === currentDay.getTime();
    });
    if (todayEvent) {
      nextName.textContent = todayEvent.type === 'volei' ? 'Vôlei' : 'Futevôlei';
      nextDate.textContent = `Hoje · ${formatLong(todayEvent.date)}`;
      document.querySelector('#next-day-number').textContent = String(todayEvent.date.getDate()).padStart(2, '0');
      document.querySelector('#next-day-month').textContent = monthShort[todayEvent.date.getMonth()];
    } else {
      nextName.textContent = 'Sem encontro hoje';
      nextDate.textContent = 'Confira a programação dos próximos dias.';
      document.querySelector('#next-day-number').textContent = String(currentDay.getDate()).padStart(2, '0');
      document.querySelector('#next-day-month').textContent = monthShort[currentDay.getMonth()];
    }
  }
  updateUpcoming();
  // Atualiza o painel automaticamente após a virada do dia, mesmo com a página aberta.
  window.setInterval(() => { updateUpcoming(); render(); }, 30 * 1000);

  const months = [...new Map(events.map(event => [monthKey(event.date), event.date])).entries()];
  months.forEach(([key, date]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${monthNames[date.getMonth()][0].toUpperCase()}${monthNames[date.getMonth()].slice(1)} ${date.getFullYear()}`;
    monthSelect.append(option);
  });
  const initialMonth = events.some(event => monthKey(event.date) === monthKey(today)) ? monthKey(today) : monthKey(end);
  monthSelect.value = initialMonth;

  const pastSection = document.querySelector('#past-section');
  const pastList = document.querySelector('#past-list');
  const pastCount = document.querySelector('#past-count');

  function makeEventRow(event, stateClass = '') {
    const row = document.createElement('article');
    row.className = `event-row ${stateClass}`.trim();
    const date = document.createElement('div'); date.className = 'event-date';
    const day = document.createElement('strong'); day.textContent = String(event.date.getDate()).padStart(2, '0');
    const month = document.createElement('span'); month.textContent = monthShort[event.date.getMonth()];
    date.append(day, month);
    const info = document.createElement('div'); info.className = 'event-info';
    const name = document.createElement('strong'); name.textContent = event.type === 'volei' ? 'Vôlei' : 'Futevôlei';
    const detail = document.createElement('span'); detail.textContent = `${event.dayName} · ${formatLong(event.date)}`;
    info.append(name, detail);
    const badge = document.createElement('span'); badge.className = 'event-status';
    badge.textContent = stateClass === 'is-today' ? 'Hoje' : stateClass === 'is-past' ? 'Realizado' : 'Agendado';
    row.append(date, info, badge);
    return row;
  }

  function render() {
    const monthEvents = events.filter(event => monthKey(event.date) === monthSelect.value);
    const visible = monthEvents.filter(event => activeFilter === 'todos' || event.type === activeFilter);
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    eventList.replaceChildren();
    const upcoming = visible.filter(event => {
      const d = new Date(event.date); d.setHours(0, 0, 0, 0);
      return d >= todayDate;
    });
    if (!upcoming.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Nenhum encontro futuro para este filtro neste mês.'; eventList.append(empty);
    } else {
      upcoming.forEach(event => {
        const d = new Date(event.date); d.setHours(0, 0, 0, 0);
        eventList.append(makeEventRow(event, d.getTime() === todayDate.getTime() ? 'is-today' : 'is-future'));
      });
    }
    const past = visible.filter(event => {
      const d = new Date(event.date); d.setHours(0, 0, 0, 0);
      return d < todayDate;
    });
    pastList.replaceChildren();
    pastSection.hidden = past.length === 0;
    pastCount.textContent = past.length ? `${past.length} ${past.length === 1 ? 'encontro' : 'encontros'}` : '';
    past.forEach(event => pastList.append(makeEventRow(event, 'is-past')));
  }
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
  render();
})();