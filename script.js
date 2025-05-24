const tabsContainer = document.getElementById('tabs');
const taskListsContainer = document.getElementById('task-lists');
const addTabBtn = document.getElementById('add-tab');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-btn');

let currentTab = '';
let tabNames = {}; // { tabId: 'tabName', ... }
let taskLists = {}; // { tabId: domElement, ... }

// ✅ 全タブのタスクを localStorage に保存
function saveTasks() {
  const data = {};
  for (const tabId in taskLists) {
    const listElement = taskLists[tabId];
    const tasks = [];
    listElement.querySelectorAll('.task-item').forEach(item => {
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
  const order = Array.from(tabsContainer.querySelectorAll('.tab-btn')).map(btn => btn.dataset.tab);
  localStorage.setItem('tabOrder', JSON.stringify(order));
}

function loadTabNames() {
  const stored = localStorage.getItem('tabNames');
  if (stored) {
    tabNames = JSON.parse(stored);
  } else {
    tabNames = {};
  }
}

function loadTabOrder() {
  const stored = localStorage.getItem('tabOrder');
  return stored ? JSON.parse(stored) : null;
}

// ✅ タスク追加
function addTask(text, done = false, targetListElement, shouldSave = true) {
  if (!text.trim()) return;

  const list = targetListElement || taskLists[currentTab];
  if (!list) {
    console.error('Error: Target list not found for adding task.');
    return;
  }

  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';

  const left = document.createElement('div');
  left.className = 'task-left';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = done;

  const taskText = document.createElement('span');
  taskText.textContent = text.trim();
  taskText.className = 'task-text';
  if (done) taskText.classList.add('done');

  checkbox.addEventListener('change', () => {
    taskText.classList.toggle('done');
    saveTasks(); // 状態変更時に保存
  });

  left.appendChild(checkbox);
  left.appendChild(taskText);

  const delBtn = document.createElement('button');
  delBtn.textContent = '削除';
  delBtn.className = 'delete-btn';
  delBtn.addEventListener('click', () => {
    taskItem.remove();
    saveTasks(); // 削除時に保存
  });

  taskItem.appendChild(left);
  taskItem.appendChild(delBtn);
  list.appendChild(taskItem);

  if (shouldSave) {
    saveTasks(); // 手動追加時に保存
  }
}

// ✅ タブを作成
function createTab(tabId, label, isActive = false) {
  const tabBtn = document.createElement('button');
  tabBtn.className = 'tab-btn';
  tabBtn.dataset.tab = tabId;

  const tabLabel = document.createElement('span');
  tabLabel.textContent = label;
  tabLabel.addEventListener('dblclick', () => {
    const newName = prompt('新しいタブ名を入力してください：', tabLabel.textContent);
    if (newName && newName.trim()) {
      const trimmedNewName = newName.trim();
      tabLabel.textContent = trimmedNewName;
      tabNames[tabId] = trimmedNewName;
      saveTabNames();
    }
  });

  const tabClose = document.createElement('span');
  tabClose.textContent = '✕';
  tabClose.className = 'tab-close';
  tabClose.title = 'このタブを削除';
  tabClose.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`タブ "${tabNames[tabId]}" を削除しますか？このタブのタスクもすべて削除されます。`)) {
      // DOMからタブとリストを削除
      tabBtn.remove();
      if (taskLists[tabId]) taskLists[tabId].remove();

      // データから削除
      delete tabNames[tabId];
      delete taskLists[tabId]; // taskListsからも削除

      const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
      delete todoData[tabId];
      localStorage.setItem('todoData', JSON.stringify(todoData));

      saveTabNames();
      saveTabOrder();

      // もし削除したタブがアクティブだったら、最初のタブをアクティブにする
      if (currentTab === tabId || tabsContainer.children.length === 0) {
        const firstTabBtn = tabsContainer.querySelector('.tab-btn');
        if (firstTabBtn) {
          switchTab(firstTabBtn.dataset.tab);
        } else {
          currentTab = ''; // タブがもうない場合
          taskListsContainer.innerHTML = ''; // タスクリスト表示もクリア
        }
      }
    }
  });

  tabBtn.appendChild(tabLabel);
  tabBtn.appendChild(tabClose);
  tabBtn.addEventListener('click', () => switchTab(tabId));
  tabsContainer.appendChild(tabBtn);

  // タスクリストのコンテナを作成
  const list = document.createElement('div');
  list.className = 'task-list hidden'; // 最初は非表示
  list.id = tabId;
  taskListsContainer.appendChild(list);
  taskLists[tabId] = list; // グローバル変数に保存

  // Sortable.js の初期化
  Sortable.create(list, {
    animation: 150,
    onEnd: () => saveTasks() // 並び替え完了時に保存
  });

  // localStorage からこのタブのタスクを読み込む
  const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
  if (!todoData[tabId]) { // もしこのタブのデータがlocalStorageになければ初期化
    todoData[tabId] = [];
    localStorage.setItem('todoData', JSON.stringify(todoData));
  }

  const savedTasks = todoData[tabId] || [];
  savedTasks.forEach(task => {
    addTask(task.text, task.done, list, false); // 初期読み込み時は保存しない (false)
  });

  if (isActive) {
    switchTab(tabId);
  }
}

// ✅ タブ切り替え
function switchTab(tabId) {
  if (!tabNames[tabId]) { // 存在しないタブIDなら何もしない (タブ削除時などに発生しうる)
    // もしアクティブなタブがなくなったら、最初のタブをアクティブにする
    const firstTabBtn = tabsContainer.querySelector('.tab-btn');
    if (firstTabBtn) {
        tabId = firstTabBtn.dataset.tab;
    } else {
        currentTab = '';
        // すべてのタスクリストを隠す
        document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
        // すべてのタブボタンを非アクティブにする
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        return;
    }
  }

  currentTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));

  const activeBtn = tabsContainer.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const activeList = taskLists[tabId];

  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  if (activeList) {
    activeList.classList.remove('hidden');
  }
}


// ✅ タブとタスクの初期読み込み
function loadInitialData() {
  loadTabNames(); // tabNames を先に読み込む
  const todoData = JSON.parse(localStorage.getItem('todoData') || '{}');
  const tabOrder = loadTabOrder();

  let tabIdsToLoad = [];

  if (tabOrder && tabOrder.length > 0) {
    // 保存された順序があり、かつtabNamesに存在するタブIDのみを対象とする
    tabIdsToLoad = tabOrder.filter(id => tabNames[id]);
    // tabOrder には存在するが tabNames にない古いIDはここでフィルタリングされる
    // tabNames には存在するが tabOrder にない新しいIDも考慮する (例: 古いバージョンからの移行)
    Object.keys(tabNames).forEach(id => {
        if(!tabIdsToLoad.includes(id)){
            tabIdsToLoad.push(id); // 順序リストになかったタブを追加
        }
    });

  } else {
    // 順序がない場合は、tabNames のキー (実質 todoData のキーでも良いが、tabNames を優先)
    tabIdsToLoad = Object.keys(tabNames);
  }


  if (tabIdsToLoad.length === 0) {
    // タブもタスクも全くない場合、デフォルトのタブを作成
    const defaultId = `tab${Date.now()}`;
    const defaultName = 'リスト1';
    tabNames[defaultId] = defaultName; // tabNames にも保存
    saveTabNames(); // 新しいデフォルトタブ名を保存
    createTab(defaultId, defaultName, true); // 作成してアクティブにする
    // この時点で todoData[defaultId] = [] が createTab 内で設定され、localStorage に保存される
    saveTabOrder(); // デフォルトタブの順序も保存
    return;
  }

  tabIdsToLoad.forEach((tabId, index) => {
    const name = tabNames[tabId]; // tabNames から名前を取得
    createTab(tabId, name, index === 0); // 最初のタブをアクティブにする
  });

  if (tabsContainer.children.length > 0 && !currentTab) {
    switchTab(tabsContainer.children[0].dataset.tab);
  } else if (tabsContainer.children.length === 0) {
    currentTab = ''; // 表示するタブがない
  }
}

// --- イベントリスナー ---

// 「＋ タブ追加」ボタン
addTabBtn.addEventListener('click', () => {
  const newTabNameBase = '新しいリスト';
  let newTabName = newTabNameBase;
  let counter = 1;
  // ユニークなタブ名を生成 (例: 新しいリスト, 新しいリスト 2, ...)
  while (Object.values(tabNames).includes(newTabName)) {
    newTabName = `${newTabNameBase} ${counter + 1}`;
    counter++;
  }

  const userNewTabName = prompt('新しいタブの名前を入力してください:', newTabName);
  if (userNewTabName && userNewTabName.trim()) {
    const trimmedNewName = userNewTabName.trim();
    const newTabId = `tab${Date.now()}`;

    tabNames[newTabId] = trimmedNewName; // tabNamesに追加
    saveTabNames();

    createTab(newTabId, trimmedNewName, true); // 新しいタブを作成しアクティブにする
    saveTabOrder(); // 新しいタブを含めた順序を保存
    // createTab内で新しいタブの空のタスクリストがlocalStorageに保存される
  }
});

// 「タスク追加」ボタン
addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (!currentTab) {
    alert('タスクを追加するタブを選択または作成してください。');
    return;
  }
  if (text) {
    addTask(text, false, taskLists[currentTab], true); // shouldSave = true
    taskInput.value = '';
  }
});

// タスク入力欄でEnterキー押下時にもタスク追加
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTaskBtn.click(); // 追加ボタンのクリックイベントを発火
  }
});


// --- 初期化処理 ---
window.addEventListener('load', () => {
  loadInitialData();

  // タブのドラッグ＆ドロップによる並び替え
  Sortable.create(tabsContainer, {
    animation: 150,
    onEnd: () => saveTabOrder() // 並び替え完了時にタブの順序を保存
  });
});
