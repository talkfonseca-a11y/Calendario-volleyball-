(() => {
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const monthShort = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const monthSelect = document.querySelector('#month-select');
  const eventList = document.querySelector('#event-list');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const start = new Date(2026, 9, 4, 12);
  const end = new Date(2027, 9, 31, 12);
  const events = [];
  for (let date = new Date(start), index = 0; date <= end; date.setDate(date.getDate() + 7), index++) {
    const copy = new Date(date);
    events.push({ date: copy, type: index % 2 === 0 ? 'futevolei' : 'volei' });
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let activeFilter = 'todos';
  const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const formatLong = date => `${date.getDate()} de ${monthNames[date.getMonth()]}`;
  const upcoming = events.find(event => event.date >= today) || events[events.length - 1];
  document.querySelector('#next-name').textContent = upcoming.type === 'volei' ? 'Vôlei' : 'Futevôlei';
  document.querySelector('#next-date').textContent = `Domingo, ${formatLong(upcoming.date)}`;
  document.querySelector('#next-day-number').textContent = String(upcoming.date.getDate()).padStart(2, '0');
  document.querySelector('#next-day-month').textContent = monthShort[upcoming.date.getMonth()];

  const months = [...new Map(events.map(event => [monthKey(event.date), event.date])).entries()];
  months.forEach(([key, date]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${monthNames[date.getMonth()][0].toUpperCase()}${monthNames[date.getMonth()].slice(1)} ${date.getFullYear()}`;
    monthSelect.append(option);
  });
  const initialMonth = events.some(event => monthKey(event.date) === monthKey(today)) ? monthKey(today) : monthKey(upcoming.date);
  monthSelect.value = initialMonth;

  function render() {
    const visible = events.filter(event => monthKey(event.date) === monthSelect.value && (activeFilter === 'todos' || event.type === activeFilter));
    eventList.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Nenhum encontro para este filtro.'; eventList.append(empty); return;
    }
    visible.forEach(event => {
      const row = document.createElement('article'); row.className = 'event-row';
      const date = document.createElement('div'); date.className = 'event-date';
      const day = document.createElement('strong'); day.textContent = String(event.date.getDate()).padStart(2, '0');
      const month = document.createElement('span'); month.textContent = monthShort[event.date.getMonth()];
      date.append(day, month);
      const info = document.createElement('div'); info.className = 'event-info';
      const name = document.createElement('strong'); name.textContent = event.type === 'volei' ? 'Vôlei' : 'Futevôlei';
      const detail = document.createElement('span'); detail.textContent = `Domingo · ${formatLong(event.date)}`;
      info.append(name, detail);
      row.append(date, info); eventList.append(row);
    });
  }
  monthSelect.addEventListener('change', render);
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    render();
  }));
  const themeToggle = document.querySelector('#theme-toggle');
  themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeToggle.title = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
    themeToggle.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.5 8.5 0 1 0 12 12Z"/></svg>';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171916' : '#f7f7f5';
  });
  render();
})();
