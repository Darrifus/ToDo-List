const STORAGE_KEY = 'todo_tasks';

const state = {
  tasks: [],
  filter: 'all', // all | active | completed
  search: '',
  sortByDate: false
};

const nodes = {};


function createLayout() {
  // Header
  const header = document.createElement('header');
  const h1 = document.createElement('h1');
  h1.textContent = 'ToDo List';
  const p = document.createElement('p');
  p.textContent = 'Добавляйте и отслеживайте задачи с ToDo List!';
  header.append(h1, p);

  // Main
  const main = document.createElement('main');

  // Форма добавления задачи
  const formSection = document.createElement('section');
  formSection.className = 'card';
  const form = document.createElement('form');
  form.className = 'todo-form';
  form.setAttribute('aria-label', 'Добавить задачу');

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Название задачи';
  input.required = true;

  const date = document.createElement('input');
  date.type = 'date';

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'btn';
  addBtn.textContent = 'Добавить';

  const clearAllBtn = document.createElement('button');
  clearAllBtn.type = 'button';
  clearAllBtn.className = 'btn second';
  clearAllBtn.textContent = 'Очистить все задачи';

  form.append(input, date, addBtn);
  formSection.append(form);

  // Панель управления
  const controlsSection = document.createElement('section');
  controlsSection.className = 'card';
  const controls = document.createElement('div');
  controls.className = 'controls';

  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Поиск по названию...';

  const filter = document.createElement('select');
  filter.append(
    new Option('Все', 'all'),
    new Option('Активные', 'active'),
    new Option('Выполненные', 'completed')
  );

  const sortBtn = document.createElement('button');
  sortBtn.type = 'button';
  sortBtn.className = 'btn second';
  sortBtn.textContent = 'Показать по дате';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn second';
  clearBtn.textContent = 'Очистить выполненные';

  controls.append(search, filter, sortBtn, clearBtn, clearAllBtn);
  nodes.clearAllBtn = clearAllBtn;
  controlsSection.append(controls);

  // Список задач
  const listSection = document.createElement('section');
  listSection.className = 'card';
  const list = document.createElement('ul');
  list.className = 'task-list';
  list.setAttribute('aria-live', 'polite');
  listSection.append(list);

  main.append(formSection, controlsSection, listSection);
  document.body.append(header, main);

  // Сохраняем ссылки на узлы
  nodes.form = form;
  nodes.input = input;
  nodes.date = date;
  nodes.addBtn = addBtn;
  nodes.search = search;
  nodes.filter = filter;
  nodes.sortBtn = sortBtn;
  nodes.clearBtn = clearBtn;
  nodes.list = list;
}

function addTask(title, date) {
  const task = {
    id: Date.now().toString(),
    title,
    date: date || null,
    completed: false
  };
  state.tasks.unshift(task);
  saveTasks();
  renderTasks();
}


function deleteTask(id) {
  if (!confirm('Удалить задачу?')) return;
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function toggle(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTasks();
  renderTasks();
}

function startEdit(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const li = nodes.list.querySelector(`li[data-id="${id}"]`);
  if (!li) return;

  const content = li.querySelector('.task-content');
  content.replaceChildren();

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = task.title;
  titleInput.className = 'edit-input';
  titleInput.style.marginBottom = '6px';

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = task.date || '';
  dateInput.className = 'edit-date';
  dateInput.style.marginBottom = '6px';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Сохранить';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn second';
  cancelBtn.textContent = 'Отмена';

  saveBtn.addEventListener('click', () => {
    const newTitle = titleInput.value.trim();
    const newDate = dateInput.value || null;
    if (!newTitle) {
      alert('Название не может быть пустым');
      return;
    }
    task.title = newTitle;
    task.date = newDate;
    saveTasks();
    renderTasks();
  });

  cancelBtn.addEventListener('click', () => renderTasks());

  content.append(titleInput, dateInput, saveBtn, cancelBtn);
  titleInput.focus();
}


function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    state.tasks = JSON.parse(raw);
  } catch (e) {
    console.error('Ошибка при чтении задач из localStorage', e);
    state.tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function handleDragStart(e) {
  const id = e.currentTarget.dataset.id;
  e.dataTransfer.setData('text/plain', id);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  const fromId = e.dataTransfer.getData('text/plain');
  const toId = e.currentTarget.dataset.id;
  if (!fromId || fromId === toId) return;

  const visibleNodes = Array.from(nodes.list.children);
  const visibleIds = visibleNodes.map(n => n.dataset.id);
  const fromIndex = visibleIds.indexOf(fromId);
  const toIndex = visibleIds.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1) return;

  visibleIds.splice(fromIndex, 1);
  visibleIds.splice(toIndex, 0, fromId);

  const visibleSet = new Set(visibleIds);
  const invisible = state.tasks.filter(t => !visibleSet.has(t.id));
  const visibleTasks = visibleIds.map(id => state.tasks.find(t => t.id === id));
  state.tasks = [...visibleTasks, ...invisible];

  saveTasks();
  renderTasks();
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}


function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ru-RU');
  } catch (e) {
    return iso;
  }
}

function renderTasks() {
  const list = nodes.list;
  list.replaceChildren();

  let visible = state.tasks.slice();

  if (state.search) {
    visible = visible.filter(t => t.title.toLowerCase().includes(state.search));
  }
  if (state.filter === 'active') visible = visible.filter(t => !t.completed);
  if (state.filter === 'completed') visible = visible.filter(t => t.completed);

  if (state.sortByDate) {
    visible.sort((a, b) => {
      const da = a.date ? new Date(a.date) : new Date(8640000000000000);
      const db = b.date ? new Date(b.date) : new Date(8640000000000000);
      return da - db;
    });
  }

  visible.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    li.draggable = !state.sortByDate;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = !!task.completed;
    checkbox.addEventListener('change', () => toggle(task.id));

    const content = document.createElement('div');
    content.className = 'task-content';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    if (task.completed) title.classList.add('done');

    const date = document.createElement('div');
    date.className = 'task-date';
    date.textContent = task.date ? formatDate(task.date) : '';

    content.append(title, date);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn second';
    editBtn.type = 'button';
    editBtn.textContent = 'Редактировать';
    editBtn.addEventListener('click', () => startEdit(task.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn';
    delBtn.type = 'button';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '⋮⋮';

    actions.append(editBtn, delBtn, dragHandle);
    li.append(checkbox, content, actions);

    // DnD события
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('dragleave', handleDragLeave);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    list.appendChild(li);
  });

  nodes.sortBtn.textContent = state.sortByDate
    ? 'Режим: по дате (выключить)'
    : 'Показать по дате';
}


function bindUI() {
  nodes.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = nodes.input.value.trim();
    const date = nodes.date.value || null;
    if (!title) {
      alert('Введите название задачи');
      return;
    }
    addTask(title, date);
    nodes.input.value = '';
    nodes.date.value = '';
    nodes.input.focus();
  });

  nodes.search.addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    renderTasks();
  });

  nodes.filter.addEventListener('change', (e) => {
    state.filter = e.target.value;
    renderTasks();
  });

  nodes.sortBtn.addEventListener('click', () => {
    state.sortByDate = !state.sortByDate;
    renderTasks();
  });

  nodes.clearBtn.addEventListener('click', () => {
    if (!confirm('Удалить все выполненные задачи?')) return;
    state.tasks = state.tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  });

  nodes.search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nodes.search.value = '';
      state.search = '';
      renderTasks();
    }
  });

  nodes.clearAllBtn.addEventListener('click', () => {
    if (!confirm('Удалить все задачи?')) return;
    state.tasks = [];
    saveTasks();
    renderTasks();
  });
}

function init() {
  createLayout();
  loadTasks();
  bindUI();
  renderTasks();
  nodes.input.focus();
}

init();
