// DOM取得
const tabsContainer = document.getElementById('tabs');
const taskListsContainer = document.getElementById('task-lists');
const addTabBtn = document.getElementById('add-tab');
let currentTab = '';
let tabNames = {};

// タブ作成（削除・編集・切り替え・並び替え・リスト削除対応）
function createTab(tabId, label) {
  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab-btn';
  tabBtn.dataset.tab = tabId;

  // タブ名の表示
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

  // タブ削除（✕）
  const tabClose = document.createElement('span');
  tabClose.textContent = '✕';
  tabClose.className = 'tab-close';
  tabClose.title = 'このタブを削除';
  tabClose.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('このタブを削除しますか？')) {
      delete tabNames[tabId];
      const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
      delete todoData[tabId];
      localStorage.setItem('todoData', JSON.stringify(todoData));
      tabBtn.remove();
      const taskList = document.getElementById(tabId);
      if (taskList) taskList.remove();
      saveTabNames();
      saveTabOrder();
      saveTasks();
      const firstTab = document.querySelector('.tab-btn');
      if (firstTab) switchTab(firstTab.dataset.tab);
    }
  });

  tabBtn.appendChild(tabLabel);
  tabBtn.appendChild(tabClose);
  tabBtn.addEventListener('click', () => switchTab(tabId));
  tabsContainer.appendChild(tabBtn);

  // リスト生成
  const deleteListBtn = document.createElement('button');
  deleteListBtn.textContent = '🗑 このリストを削除';
  deleteListBtn.className = 'delete-list-btn';
  deleteListBtn.addEventListener('click', () => {
    if (confirm('このリスト（タブ）を削除しますか？')) {
      delete tabNames[tabId];
      const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
      delete todoData[tabId];
      localStorage.setItem('todoData', JSON.stringify(todoData));
      tabBtn.remove();
      list.remove();
      saveTabNames();
      saveTabOrder();
      saveTasks();
      const firstTab = document.querySelector('.tab-btn');
      if (firstTab) switchTab(firstTab.dataset.tab);
    }
  });

  const list = document.createElement('div');
  list.className = 'task-list hidden';
  list.id = tabId;
  list.appendChild(deleteListBtn);
  taskListsContainer.appendChild(list);

  Sortable.create(list, {
    animation: 150,
    onEnd: () => saveTasks()
  });
}

// タブ切替
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

// タスク追加
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

// 保存系
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

function loadTabNames() {
  const stored = localStorage.getItem('tabNames');
  if (stored) tabNames = JSON.parse(stored);
}

function loadTabOrder() {
  const stored = localStorage.getItem('tabOrder');
  return stored ? JSON.parse(stored) : null;
}

// 初期化・復元
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

// イベント登録
document.getElementById('add-btn').addEventListener('click', () => {
  const text = document.getElementById('task-input').value.trim();
  if (!text || !currentTab) return;
  addTask(text);
  document.getElementById('task-input').value = '';
});

window.addEventListener('load', () => {
  loadTasks();
  Sortable.create(tabsContainer, {
    animation: 150,
    onEnd: () => saveTabOrder()
  });
});
