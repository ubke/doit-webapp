const tabsContainer = document.getElementById('tabs');
const taskListsContainer = document.getElementById('task-lists');
const addTabBtn = document.getElementById('add-tab');

let currentTab = '';
let tabNames = {}; // ✅ タブ名管理用オブジェクト

addTabBtn.addEventListener('click', () => {
  const tabCount = document.querySelectorAll('.tab-btn').length;
  if (tabCount >= 30) {
    alert('タブは最大30個までです');
    return;
  }
  const newTabId = `tab${Date.now()}`; // ✅ 一意なIDにするためタイムスタンプ
  const newTabName = `リスト${tabCount + 1}`;
  tabNames[newTabId] = newTabName;
  createTab(newTabId, newTabName);
  switchTab(newTabId);
  saveTabNames();
  saveTabOrder();
});

function createTab(tabId, label) {
  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab-btn';
  tabBtn.dataset.tab = tabId;

  const tabLabel = document.createElement('span');
  tabLabel.textContent = label;
  tabLabel.addEventListener('dblclick', () => {
    const newName = prompt('新しいタブ名を入力してください：', tabLabel.textContent);
    if (newName && newName.trim()) {
      tabLabel.textContent = newName.trim();
      tabNames[tabId] = newName.trim();
      saveTabNames();
    }
  });

  tabBtn.appendChild(tabLabel);
  tabBtn.addEventListener('click', () => switchTab(tabId));
  tabsContainer.appendChild(tabBtn);

  const list = document.createElement('div');
  list.className = 'task-list hidden';
  list.id = tabId;
  taskListsContainer.appendChild(list);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const activeList = document.getElementById(tabId);
  if (activeBtn && activeList) {
    activeBtn.classList.add('active');
    activeList.classList.remove('hidden');
    currentTab = tabId;
  }
}

function saveTasks() {
  const data = {};
  document.querySelectorAll('.task-list').forEach(list => {
    const tasks = [];
    list.querySelectorAll('.task-item').forEach(item => {
      const text = item.querySelector('.task-text').textContent;
      const done = item.querySelector('input[type="checkbox"]').checked;
      tasks.push({ text, done });
    });
    data[list.id] = tasks;
  });
  localStorage.setItem('todoData', JSON.stringify(data));
}

function saveTabNames() {
  localStorage.setItem('tabNames', JSON.stringify(tabNames));
}

function saveTabOrder() {
  const order = Array.from(document.querySelectorAll('.tab-btn')).map(btn => btn.dataset.tab);
  localStorage.setItem('tabOrder', JSON.stringify(order));
}

function loadTabOrder() {
  const stored = localStorage.getItem('tabOrder');
  return stored ? JSON.parse(stored) : null;
}

function loadTabNames() {
  const stored = localStorage.getItem('tabNames');
  if (stored) tabNames = JSON.parse(stored);
}

function loadTasks() {
  const data = JSON.parse(localStorage.getItem('todoData') || '{}');
  loadTabNames();
  const tabOrder = loadTabOrder();
  const tabIds = tabOrder || Object.keys(data);

  if (tabIds.length === 0) {
    const defaultId = `tab${Date.now()}`;
    const defaultName = 'リスト1';
    tabNames[defaultId] = defaultName;
    createTab(defaultId, defaultName);
    switchTab(defaultId);
    return;
  }

  tabIds.forEach((tabId, index) => {
    const name = tabNames[tabId] || `リスト${index + 1}`;
    createTab(tabId, name);
    if (data[tabId]) {
      data[tabId].forEach(task => addTask(task.text, task.done, document.getElementById(tabId)));
    }
  });
  switchTab(tabIds[0]);
}

function addTask(text, done = false, container = null) {
  if (!text) return;
  const activeTab = container || document.getElementById(currentTab);
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';

  const left = document.createElement('div');
  left.className = 'task-left';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = done;

  const taskText = document.createElement('span');
  taskText.textContent = text;
  taskText.className = 'task-text';
  if (done) taskText.classList.add('done');

  checkbox.addEventListener('change', () => {
    taskText.classList.toggle('done');
    saveTasks();
  });

  left.appendChild(checkbox);
  left.appendChild(taskText);

  const delBtn = document.createElement('button');
  delBtn.textContent = '削除';
  delBtn.className = 'delete-btn';
  delBtn.addEventListener('click', () => {
    taskItem.remove();
    saveTasks();
  });

  taskItem.appendChild(left);
  taskItem.appendChild(delBtn);

  activeTab.appendChild(taskItem);
  saveTasks();
}

const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text || !currentTab) return;
  addTask(text);
  input.value = '';
});

window.addEventListener('load', () => {
  loadTasks();

  // ✅ タブ並び替え機能の初期化
  Sortable.create(tabsContainer, {
    animation: 150,
    onEnd: () => saveTabOrder()
  });
});
