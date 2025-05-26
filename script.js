document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const newTabNameInput = document.getElementById('new-tab-name-input');
    const addTabButton = document.getElementById('add-tab-button');
    const tabsContainer = document.getElementById('tabs-container');
    const currentTabContent = document.getElementById('current-tab-content');
    const currentTabTitle = document.getElementById('current-tab-title');
    const newTaskTextInput = document.getElementById('new-task-text-input');
    const addTaskButton = document.getElementById('add-task-button');
    const taskListContainer = document.getElementById('task-list-container');
    const noActiveTabMessage = document.getElementById('no-active-tab-message');

    // アプリケーションの状態
    let appState = {
        tabs: [], // { id: 'uuid', name: 'Tab Name', tasks: [{id: 'uuid', text: 'Task Text', done: false}] }
        activeTabId: null,
    };

    // --- ユーティリティ関数 ---
    function generateId() {
        return `id-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    }

    // --- localStorage関連 ---
    function saveState() {
        localStorage.setItem('todoAppState', JSON.stringify(appState));
    }

    function loadState() {
        const storedState = localStorage.getItem('todoAppState');
        if (storedState) {
            appState = JSON.parse(storedState);
        }
        // 互換性のため、古いデータ構造にtasksがない場合を考慮
        appState.tabs.forEach(tab => {
            if (!tab.tasks) {
                tab.tasks = [];
            }
            tab.tasks.forEach(task => { // タスクIDの付与（過去データ用）
                if (!task.id) task.id = generateId();
            });
        });

    }

    // --- レンダリング関数 ---
    function render() {
        renderTabs();
        renderTasksForActiveTab();
        updateNoActiveTabMessage();
        updateCurrentTabContentVisibility();
    }

    function renderTabs() {
        tabsContainer.innerHTML = ''; // コンテナをクリア
        appState.tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = 'tab-button';
            tabButton.dataset.tabId = tab.id;
            if (tab.id === appState.activeTabId) {
                tabButton.classList.add('active');
            }

            const tabNameSpan = document.createElement('span');
            tabNameSpan.className = 'tab-name';
            tabNameSpan.textContent = tab.name;
            tabNameSpan.addEventListener('dblclick', () => handleRenameTab(tab.id, tab.name));

            const deleteButton = document.createElement('button');
            deleteButton.className = 'tab-delete-button';
            deleteButton.innerHTML = '&times;'; // '×' 記号
            deleteButton.title = 'このタブを削除';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // タブ切り替えイベントの発火を防ぐ
                handleDeleteTab(tab.id);
            });

            tabButton.appendChild(tabNameSpan);
            tabButton.appendChild(deleteButton);
            tabButton.addEventListener('click', () => handleSwitchTab(tab.id));
            tabsContainer.appendChild(tabButton);
        });
        initializeTabsSortable();
    }

    function renderTasksForActiveTab() {
        taskListContainer.innerHTML = ''; // コンテナをクリア
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);

        if (activeTab) {
            currentTabTitle.textContent = activeTab.name;
            activeTab.tasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                taskItem.dataset.taskId = task.id;
                if (task.done) {
                    taskItem.classList.add('done');
                }

                const taskContentDiv = document.createElement('div');
                taskContentDiv.className = 'task-content';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.done;
                checkbox.addEventListener('change', () => handleToggleTaskDone(task.id));

                const taskTextSpan = document.createElement('span');
                taskTextSpan.className = 'task-text';
                taskTextSpan.textContent = task.text;

                taskContentDiv.appendChild(checkbox);
                taskContentDiv.appendChild(taskTextSpan);

                const deleteButton = document.createElement('button');
                deleteButton.className = 'task-delete-button';
                deleteButton.textContent = '削除';
                deleteButton.addEventListener('click', () => handleDeleteTask(task.id));

                taskItem.appendChild(taskContentDiv);
                taskItem.appendChild(deleteButton);
                taskListContainer.appendChild(taskItem);
            });
            initializeTasksSortable();
        } else {
            currentTabTitle.textContent = '';
        }
    }

    function updateNoActiveTabMessage() {
        noActiveTabMessage.style.display = appState.activeTabId ? 'none' : 'block';
    }
    function updateCurrentTabContentVisibility() {
        currentTabContent.style.display = appState.activeTabId ? 'block' : 'none';
    }


    // --- SortableJS 初期化 ---
    let tabsSortableInstance = null;
    function initializeTabsSortable() {
        if (tabsSortableInstance) {
            tabsSortableInstance.destroy();
        }
        tabsSortableInstance = Sortable.create(tabsContainer, {
            animation: 150,
            draggable: '.tab-button',
            onEnd: (event) => {
                const movedTab = appState.tabs.splice(event.oldDraggableIndex, 1)[0];
                appState.tabs.splice(event.newDraggableIndex, 0, movedTab);
                saveState();
                render(); // 順序変更をUIに即時反映
            }
        });
    }

    let tasksSortableInstance = null;
    function initializeTasksSortable() {
        if (tasksSortableInstance) {
            tasksSortableInstance.destroy();
        }
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
        if (activeTab && taskListContainer.children.length > 0) {
            tasksSortableInstance = Sortable.create(taskListContainer, {
                animation: 150,
                draggable: '.task-item',
                onEnd: (event) => {
                    const movedTask = activeTab.tasks.splice(event.oldDraggableIndex, 1)[0];
                    activeTab.tasks.splice(event.newDraggableIndex, 0, movedTask);
                    saveState();
                    renderTasksForActiveTab(); // DOM再描画で整合性担保
                }
            });
        }
    }

    // --- イベントハンドラ ---
    function handleAddTab() {
        const newTabName = newTabNameInput.value.trim();
        if (newTabName) {
            const newTab = {
                id: generateId(),
                name: newTabName,
                tasks: []
            };
            appState.tabs.push(newTab);
            appState.activeTabId = newTab.id; // 新しいタブをアクティブにする
            newTabNameInput.value = '';
            saveState();
            render();
        } else {
            alert('タブ名を入力してください。');
        }
    }

    function handleDeleteTab(tabIdToDelete) {
        if (!confirm(`タブ「${appState.tabs.find(t=>t.id === tabIdToDelete)?.name}」を削除しますか？このタブのタスクも全て削除されます。`)) {
            return;
        }
        appState.tabs = appState.tabs.filter(tab => tab.id !== tabIdToDelete);
        if (appState.activeTabId === tabIdToDelete) {
            appState.activeTabId = appState.tabs.length > 0 ? appState.tabs[0].id : null;
        }
        saveState();
        render();
    }

    function handleRenameTab(tabId, currentName) {
        const newName = prompt('新しいタブ名を入力してください:', currentName);
        if (newName !== null && newName.trim() !== '') {
            const tabToRename = appState.tabs.find(tab => tab.id === tabId);
            if (tabToRename) {
                tabToRename.name = newName.trim();
                saveState();
                render();
            }
        } else if (newName !== null && newName.trim() === '') {
            alert('タブ名は空にできません。');
        }
    }

    function handleSwitchTab(tabId) {
        appState.activeTabId = tabId;
        saveState();
        render();
    }

    function handleAddTask() {
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
        if (!activeTab) {
            alert('タスクを追加するタブを選択してください。');
            return;
        }
        const newTaskText = newTaskTextInput.value.trim();
        if (newTaskText) {
            const newTask = {
                id: generateId(),
                text: newTaskText,
                done: false
            };
            activeTab.tasks.push(newTask);
            newTaskTextInput.value = '';
            saveState();
            renderTasksForActiveTab(); // 現在のタブのタスクのみ再描画で十分
        } else {
            alert('タスクの内容を入力してください。');
        }
    }

    function handleDeleteTask(taskIdToDelete) {
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
        if (activeTab) {
            activeTab.tasks = activeTab.tasks.filter(task => task.id !== taskIdToDelete);
            saveState();
            renderTasksForActiveTab();
        }
    }

    function handleToggleTaskDone(taskIdToToggle) {
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
        if (activeTab) {
            const taskToToggle = activeTab.tasks.find(task => task.id === taskIdToToggle);
            if (taskToToggle) {
                taskToToggle.done = !taskToToggle.done;
                saveState();
                renderTasksForActiveTab();
            }
        }
    }

    // --- イベントリスナーの登録 ---
    addTabButton.addEventListener('click', handleAddTab);
    newTabNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleAddTab();
        }
    });

    addTaskButton.addEventListener('click', handleAddTask);
    newTaskTextInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleAddTask();
        }
    });

    // --- 初期化 ---
    loadState();
    // 最初のタブをアクティブにする（もし存在すれば）
    if (!appState.activeTabId && appState.tabs.length > 0) {
        appState.activeTabId = appState.tabs[0].id;
    }
    render();

});
