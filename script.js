const tabsContainer = document.getElementById('tabs');
const taskListsContainer = document.getElementById('task-lists');
const addTabBtn = document.getElementById('add-tab');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-btn');

// アプリケーション全体のデータ構造
let appData = {
  tabs: {}, // { tabId1: { name: "Tab 1", tasks: [{id, text, done}] }, tabId2: ... }
  tabOrder: [], // ["tabId1", "tabId2", ...]
  activeTabId: null
};

// --- データ永続化関数 ---
function saveDataToLocalStorage() {
  localStorage.setItem('todoAppManagerData', JSON.stringify(appData));
}

function loadDataFromLocalStorage() {
  const storedData = localStorage.getItem('todoAppManagerData');
  if (storedData) {
    appData = JSON.parse(storedData);
    // 互換性のためのチェック (古いデータ構造からの移行など)
    if (!appData.tabs) appData.tabs = {};
    if (!appData.tabOrder) appData.tabOrder = [];
    if (!appData.activeTabId && appData.tabOrder.length > 0) {
        appData.activeTabId = appData.tabOrder[0];
    }
    // 各タブのタスクにIDがない場合、付与する (古いデータからの移行用)
    Object.values(appData.tabs).forEach(tab => {
        if (tab.tasks) {
            tab.tasks.forEach((task, index) => {
                if (!task.id) {
                    task.id = `task-${Date.now()}-${index}`;
                }
            });
        } else {
            tab.tasks = [];
        }
    });


  } else {
    // データがない場合の初期状態
    appData = {
      tabs: {},
      tabOrder: [],
      activeTabId: null
    };
  }
}

// --- DOM描画関数 ---

// 指定されたタブのタスクリストを描画
function renderTasks(tabId) {
  const tabData = appData.tabs[tabId];
  let taskListElement = document.getElementById(tabId);

  // もしリスト要素がなければ作成 (タブ追加直後など)
  if (!taskListElement) {
    taskListElement = document.createElement('div');
    taskListElement.className = 'task-list';
    taskListElement.id = tabId;
    taskListsContainer.appendChild(taskListElement);

    // Sortable.js の初期化
    Sortable.create(taskListElement, {
      animation: 150,
      draggable: '.task-item',
      onEnd: (evt) => {
        const tab = appData.tabs[appData.activeTabId];
        if (tab && tab.tasks) {
          const movedTask = tab.tasks.splice(evt.oldDraggableIndex, 1)[0];
          tab.tasks.splice(evt.newDraggableIndex, 0, movedTask);
          saveDataToLocalStorage();
          renderTasks(appData.activeTabId); // DOMを再描画してIDの整合性を保つ
        }
      }
    });
  }

  taskListElement.innerHTML = ''; // 既存のタスクをクリア

  if (tabData && tabData.tasks) {
    tabData.tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      taskItem.dataset.taskId = task.id; // タスクにIDを付与

      const left = document.createElement('div');
      left.className = 'task-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        toggleTaskDone(tabId, task.id);
      });

      const taskText = document.createElement('span');
      taskText.textContent = task.text;
      taskText.className = 'task-text';
      if (task.done) {
        taskText.classList.add('done');
      }

      left.appendChild(checkbox);
      left.appendChild(taskText);

      const delBtn = document.createElement('button');
      delBtn.textContent = '削除';
      delBtn.className = 'delete-btn';
      delBtn.addEventListener('click', () => {
        deleteTask(tabId, task.id);
      });

      taskItem.appendChild(left);
      taskItem.appendChild(delBtn);
      taskListElement.appendChild(taskItem);
    });
  }

  // 表示/非表示の切り替え
  document.querySelectorAll('.task-list').forEach(list => {
    list.classList.toggle('hidden', list.id !== appData.activeTabId);
  });
}

// 全てのタブボタンを描画
function renderTabs() {
  tabsContainer.innerHTML = ''; // 既存のタブをクリア
  appData.tabOrder.forEach(tabId => {
    const tabData = appData.tabs[tabId];
    if (!tabData) return; // データ不整合の場合スキップ

    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab-btn';
    tabBtn.dataset.tab = tabId;
    tabBtn.classList.toggle('active', tabId === appData.activeTabId);

    const tabLabel = document.createElement('span');
    tabLabel.textContent = tabData.name;
    tabLabel.addEventListener('dblclick', () => {
      const newName = prompt('新しいタブ名を入力してください：', tabData.name);
      if (newName && newName.trim()) {
        renameTab(tabId, newName.trim());
      }
    });

    const tabClose = document.createElement('span');
    tabClose.textContent = '✕';
    tabClose.className = 'tab-close';
    tabClose.title = 'このタブを削除';
    tabClose.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`タブ "${tabData.name}" を削除しますか？`)) {
        deleteTab(tabId);
      }
    });

    tabBtn.appendChild(tabLabel);
    tabBtn.appendChild(tabClose);
    tabBtn.addEventListener('click', () => {
      switchTab(tabId);
    });
    tabsContainer.appendChild(tabBtn);
  });
   // タブのドラッグ＆ドロップによる並び替え (renderTabsが呼ばれるたびに再初期化)
    Sortable.create(tabsContainer, {
        animation: 150,
        draggable: '.tab-btn',
        onEnd: (evt) => {
            const movedTabId = appData.tabOrder.splice(evt.oldDraggableIndex, 1)[0];
            appData.tabOrder.splice(evt.newDraggableIndex, 0, movedTabId);
            saveDataToLocalStorage();
            renderTabs(); // 순서 변경 후 탭 UI 즉시 업데이트
        }
    });
}

// --- アクション関数 ---

function addNewTab(name) {
  const newTabId = `tab-${Date.now()}`;
  appData.tabs[newTabId] = { name: name, tasks: [] };
  appData.tabOrder.push(newTabId);
  appData.activeTabId = newTabId; // 新しいタブをアクティブにする

  saveDataToLocalStorage();
  renderTabs();
  renderTasks(newTabId); // 新しいタブの(空の)タスクリスト領域を作成・表示
  // 新しいタブに対応するタスクリストのDOMがなければここで作られる
  if (!document.getElementById(newTabId)) {
      const listElement = document.createElement('div');
      listElement.className = 'task-list'; // hiddenはrenderTasks内で制御
      listElement.id = newTabId;
      taskListsContainer.appendChild(listElement);
      Sortable.create(listElement, { /* ... sortable options ... */ });
  }
  switchTab(newTabId); // 表示を確実に切り替える
}

function deleteTab(tabIdToDelete) {
  // タブデータ削除
  delete appData.tabs[tabIdToDelete];
  // タブ順序から削除
  appData.tabOrder = appData.tabOrder.filter(id => id !== tabIdToDelete);

  // DOMからタスクリストを削除
  const taskListElement = document.getElementById(tabIdToDelete);
  if (taskListElement) {
    taskListElement.remove();
  }

  // アクティブタブの処理
  if (appData.activeTabId === tabIdToDelete) {
    appData.activeTabId = appData.tabOrder.length > 0 ? appData.tabOrder[0] : null;
  }

  saveDataToLocalStorage();
  renderTabs();
  if (appData.activeTabId) {
    renderTasks(appData.activeTabId);
  } else {
    taskListsContainer.innerHTML = ''; // 表示するタブがない場合
  }
}

function renameTab(tabId, newName) {
  if (appData.tabs[tabId]) {
    appData.tabs[tabId].name = newName;
    saveDataToLocalStorage();
    renderTabs();
  }
}

function switchTab(tabId) {
  if (appData.tabs[tabId]) {
    appData.activeTabId = tabId;
    saveDataToLocalStorage(); // アクティブタブの情報を保存
    renderTabs(); // タブのactiveクラス更新
    renderTasks(tabId); // 正しいタスクリストを表示
  }
}

function addNewTask(text) {
  if (!appData.activeTabId || !appData.tabs[appData.activeTabId]) {
    alert('タスクを追加するタブが選択されていません。');
    return;
  }
  const activeTab = appData.tabs[appData.activeTabId];
  const newTask = {
    id: `task-${Date.now()}-${activeTab.tasks.length}`, // ユニークなタスクID
    text: text,
    done: false
  };
  activeTab.tasks.push(newTask);
  saveDataToLocalStorage();
  renderTasks(appData.activeTabId);
}

function deleteTask(tabId, taskId) {
  const tab = appData.tabs[tabId];
  if (tab) {
    tab.tasks = tab.tasks.filter(task => task.id !== taskId);
    saveDataToLocalStorage();
    renderTasks(tabId);
  }
}

function toggleTaskDone(tabId, taskId) {
  const tab = appData.tabs[tabId];
  if (tab) {
    const task = tab.tasks.find(t => t.id === taskId);
    if (task) {
      task.done = !task.done;
      saveDataToLocalStorage();
      renderTasks(tabId); // DOMのクラスを更新するために再描画
    }
  }
}

// --- イベントリスナー ---
addTabBtn.addEventListener('click', () => {
  const newTabNameBase = '新しいリスト';
  let newTabName = newTabNameBase;
  let counter = 1;
  const existingNames = Object.values(appData.tabs).map(t => t.name);
  while (existingNames.includes(newTabName)) {
    newTabName = `${newTabNameBase} ${counter + 1}`;
    counter++;
  }
  const userNewTabName = prompt('新しいタブの名前を入力してください:', newTabName);
  if (userNewTabName && userNewTabName.trim()) {
    addNewTab(userNewTabName.trim());
  }
});

addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (text) {
    addNewTask(text);
    taskInput.value = '';
  } else if (!appData.activeTabId) {
    alert('タスクを追加するタブを選択または作成してください。');
  }
});

taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTaskBtn.click();
  }
});

// --- 初期化処理 ---
window.addEventListener('load', () => {
  loadDataFromLocalStorage();

  if (appData.tabOrder.length === 0) {
    // 初回起動時または全タブ削除後の場合、デフォルトタブを作成
    addNewTab('リスト1');
  } else {
    if (!appData.activeTabId || !appData.tabs[appData.activeTabId]) {
        // アクティブなタブが無効な場合、最初のタブをアクティブにする
        appData.activeTabId = appData.tabOrder[0] || null;
    }
  }
  renderTabs();
  if (appData.activeTabId) {
    renderTasks(appData.activeTabId);
  }
});
