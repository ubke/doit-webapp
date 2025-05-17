const tabs = document.querySelectorAll('.tab-btn');
const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');

let currentTab = 'tab1';

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
  Object.keys(data).forEach(tabId => {
    const list = document.getElementById(tabId);
    if (!list) return;
    data[tabId].forEach(task => {
      addTask(task.text, task.done, list);
    });
  });
}

function addTask(text, done = false, container = null) {
  if (!text) return;
  const activeTab = container || document.querySelector('.task-list:not(.hidden)');
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

addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = '';
});

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
    currentTab = btn.dataset.tab;
  });
});

window.addEventListener('load', loadTasks);
