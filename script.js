const tabsContainer = document.getElementById('tabs');
const taskListsContainer = document.getElementById('task-lists');
const addTabBtn = document.getElementById('add-tab');
let currentTab = '';
let tabNames = {};
let taskLists = {}; // ← 各タブごとの task-list 要素を記憶

// ✅ タブ作成（表示・削除・名前変更）
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
      if (taskLists[tabId]) taskLists[tabId].remove();
      delete taskLists[tabId];

      saveTabNames();
      saveTabOrder();

      const firstTab = document.querySelector('.tab-btn');
      if (firstTab) switchTab(firstTab.dataset.tab);
    }
  });

  tabBtn.appendChild(tabLabel);
  tabBtn.appendChild(tabClose);
  tabBtn.addEventListener('click', () => switchTab(tabId));
  tabsContainer.appendChild(tabBtn);

  const list = document.createElement('div');
  list.className = 'task-list hidden';
  list.id = tabId;
  taskListsContainer.appendChild(list);
  taskLists[tabId] = list;

  Sortable.create(list, {
    animation: 150,
    onEnd: () => saveTasks()
  });

  const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
  if (!todoData[tabId]) {
    todoData[tabId] = [];
    localStorage.setItem('todoData', JSON.stringify(todoData));
  }

  const savedTasks = todoData[tabId];
  savedTasks.forEach(task => addTask(task.text, task.done, list));
}

// ✅ タブ切替処理（表示内容を切り替え）
function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));

  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const activeList = taskLists[tabId];

  if (activeBtn && activeList) {
    activeBtn.classList.add('active');
    activeList.classList.remove('hidden');
  }
}

// ✅ タスク追加（指定したタブのリストへ追加）
function addTask(text, done = false, container = null) {
  if (!text) return;
  const list = container || taskLists[currentTab];
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
  list.appendChild(taskItem);
  saveTasks();
}

// ✅ 全タブのタスクを保存（タブごとに分けて保存）
function saveTasks() {
  const data = {};
  for (const tabId in taskLists) {
    const list = taskLists[tabId];
    const tasks = [];
    list.querySelectorAll('.task-item').forEach(item => {
      const text = item.querySelector('.task-text').textContent;
      const done = item.querySelector('input[type="checkbox"]').checked;
      tasks.push({ text, done });
    });
    data[tabId] = tasks;
  }
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

// ✅ 初期化：タブとタスクの復元
function loadTasks() {
  const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
  loadTabNames();
  const tabOrder = loadTabOrder();
  const tabIds = tabOrder || Object.keys(todoData);

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
  });

  switchTab(tabIds[0]);
}

// ✅ タスク追加ボタン
document.getElementById('add-btn').addEventListener('click', () => {
  const text = document.getElementById('task-input').value.trim();
  if (!text || !currentTab) return;
  addTask(text);
  document.getElementById('task-input').value = '';
});

// ✅ ページ読み込み
window.addEventListener('load', () => {
  loadTasks();
  Sortable.create(tabsContainer, {
    animation: 150,
    onEnd: () => saveTabOrder()
  });
});
