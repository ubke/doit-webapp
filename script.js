const tabsContainer = document.getElementById('tabs');
const taskListsContainer = document.getElementById('task-lists');
const addTabBtn = document.getElementById('add-tab');

let currentTab = '';

// ✅ タブ追加ボタンで最大30個までタブを作成できるようにする
addTabBtn.addEventListener('click', () => {
  const tabCount = document.querySelectorAll('.tab-btn').length;
  if (tabCount >= 30) {
    alert('タブは最大30個までです');
    return;
  }
  const newTabId = `tab${tabCount + 1}`;
  createTab(newTabId, `リスト${tabCount + 1}`);
  switchTab(newTabId);
  saveTabNames();
});

function createTab(tabId, label) {
  // タブボタン作成
  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab-btn';
  tabBtn.dataset.tab = tabId;
  tabBtn.textContent = label;
  tabBtn.addEventListener('click', () => switchTab(tabId));
  tabsContainer.appendChild(tabBtn);

  // タスクリスト作成
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

// ✅ タスク保存と読み込み機能は従来通り維持
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

function loadTasks() {
  const data = JSON.parse(localStorage.getItem('todoData') || '{}');
  const savedTabs = Object.keys(data);
  if (savedTabs.length === 0) {
    createTab('tab1', 'リスト1');
    switchTab('tab1');
    return;
  }
  savedTabs.forEach((tabId, index) => {
    createTab(tabId, `リスト${index + 1}`);
    data[tabId].forEach(task => addTask(task.text, task.done, document.getElementById(tabId)));
  });
  switchTab(savedTabs[0]);
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

window.addEventListener('load', loadTasks);
