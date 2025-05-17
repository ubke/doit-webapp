// ✅ 追加: 各タブのタスクを保存するためにローカルストレージへ保存する関数
function saveTasks() {
  const data = {};
  document.querySelectorAll('.task-list').forEach(list => {
    const tasks = [];
    list.querySelectorAll('.task-item').forEach(item => {
      const text = item.querySelector('.task-text').textContent;
      const done = item.querySelector('input[type="checkbox"]').checked;
      tasks.push({ text, done }); // ✅ チェック状態を一緒に保存
    });
    data[list.id] = tasks; // タブIDごとに保存
  });
  localStorage.setItem('todoData', JSON.stringify(data));
}

// ✅ 追加: ページ読み込み時にローカルストレージからタスクを復元
function loadTasks() {
  const data = JSON.parse(localStorage.getItem('todoData') || '{}');
  Object.keys(data).forEach(tabId => {
    const list = document.getElementById(tabId);
    if (!list) return;
    data[tabId].forEach(task => {
      addTask(task.text, task.done, list); // ✅ 保存済みのチェック状態も反映
    });
  });
}

// ✅ 修正: addTask に保存オプションと状態引数を追加
function addTask(text, done = false, container = null) {
  if (!text) return;
  const activeTab = container || document.querySelector('.task-list:not(.hidden)');
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';

  const left = document.createElement('div');
  left.className = 'task-left';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = done; // ✅ チェック状態を設定

  const taskText = document.createElement('span');
  taskText.textContent = text;
  taskText.className = 'task-text';
  if (done) taskText.classList.add('done'); // ✅ 完了スタイルを付与

  checkbox.addEventListener('change', () => {
    taskText.classList.toggle('done');
    saveTasks(); // ✅ チェック変更時に保存
  });

  left.appendChild(checkbox);
  left.appendChild(taskText);

  const delBtn = document.createElement('button');
  delBtn.textContent = '削除';
  delBtn.className = 'delete-btn';
  delBtn.addEventListener('click', () => {
    taskItem.remove();
    saveTasks(); // ✅ 削除時にも保存更新
  });

  taskItem.appendChild(left);
  taskItem.appendChild(delBtn);

  activeTab.appendChild(taskItem);
  saveTasks(); // ✅ タスク追加時にも保存
}

// ✅ 変更: 追加ボタンでタスクを登録
const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = '';
});

// ✅ タブ切り替え処理（変更なし）
const tabs = document.querySelectorAll('.tab-btn');
let currentTab = 'tab1';
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
    currentTab = btn.dataset.tab;
  });
});

// ✅ 追加: ページ読み込み時にタスクを読み込む
window.addEventListener('load', loadTasks);

