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
        tabs: [],
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
        appState.tabs.forEach(tab => {
            if (!tab.tasks) {
                tab.tasks = [];
            }
            tab.tasks.forEach(task => {
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
        tabsContainer.innerHTML = '';
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
            deleteButton.innerHTML = '&times;';
            deleteButton.title = 'このタブを削除';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
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
        taskListContainer.innerHTML = '';
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);

        if (activeTab) {
            currentTabTitle.textContent = activeTab.name;
            if (activeTab.tasks && activeTab.tasks.length > 0) {
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
            }
            initializeTasksSortable();
        } else {
            currentTabTitle.textContent = '';
            if (tasksSortableInstance) {
                tasksSortableInstance.destroy();
                tasksSortableInstance = null;
            }
        }
    }

    function updateNoActiveTabMessage() {
        noActiveTabMessage.style.display = appState.activeTabId ? 'none' : 'block';
    }
    function updateCurrentTabContentVisibility() {
        currentTabContent.style.display = appState.activeTabId ? 'block' : 'none';
    }

    let tabsSortableInstance = null;
    function initializeTabsSortable() {
        if (tabsSortableInstance) {
            tabsSortableInstance.destroy();
        }
        tabsSortableInstance = Sortable.create(tabsContainer, {
            animation: 150,
            draggable: '.tab-button',
            delay: 150, // タップ競合を防ぐために遅延を追加
            delayOnTouchOnly: true, // この遅延をタッチ操作のみに適用

            // 1. オートスクロールの設定を追加
            scroll: true,        // 画面端に来たら自動でスクロールする機能を有効化
            scrollSensitivity: 150, // 画面の端から150pxの範囲に入ったらスクロール開始（広めに取ると操作しやすいです）
            scrollSpeed: 20,     // スクロールのスピード

            // 2. ドラッグ開始時の処理（スクロールロック）
            onStart: function(evt) {
                // ドラッグ中は、画面全体の「指によるスクロール」を禁止する
                document.body.style.overflow = 'hidden'; 
                // iOSなどでバウンス（引っ張り）効果が出るのを防ぐ
                document.body.style.touchAction = 'none';
            },

            // 3. ドラッグ終了時の処理（ロック解除）
            onEnd: (event) => {
                // ドラッグが終わったら、スクロール禁止を解除して元に戻す
                document.body.style.overflow = '';
                document.body.style.touchAction = '';

                // データの並び替え処理
                const movedTab = appState.tabs.splice(event.oldDraggableIndex, 1)[0];
                appState.tabs.splice(event.newDraggableIndex, 0, movedTab);
                saveState();
                render();
            }
        });
    }

    let tasksSortableInstance = null;
    function initializeTasksSortable() {
        if (tasksSortableInstance) {
            tasksSortableInstance.destroy();
            tasksSortableInstance = null;
        }
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
        if (activeTab && taskListContainer.children.length > 0) {
            tasksSortableInstance = Sortable.create(taskListContainer, {
                animation: 150,
                draggable: '.task-item',
                delay: 150, // ★★★ タップ競合を防ぐために遅延を追加 ★★★
                delayOnTouchOnly: true, // ★★★ この遅延をタッチ操作のみに適用 ★★★
                onEnd: (event) => {
                    const currentActiveTabForSort = appState.tabs.find(tab => tab.id === appState.activeTabId);
                    if (currentActiveTabForSort && currentActiveTabForSort.tasks) {
                        const movedTask = currentActiveTabForSort.tasks.splice(event.oldDraggableIndex, 1)[0];
                        currentActiveTabForSort.tasks.splice(event.newDraggableIndex, 0, movedTask);
                        saveState();
                        renderTasksForActiveTab();
                    }
                }
            });
        }
    }

    // --- イベントハンドラ ---
    function handleAddTab() {
        const newTabName = newTabNameInput.value.trim();
        if (newTabName) {
            const newTab = { id: generateId(), name: newTabName, tasks: [] };
            appState.tabs.push(newTab);
            appState.activeTabId = newTab.id;
            newTabNameInput.value = '';
            saveState();
            render();
        } else {
            alert('タブ名を入力してください。');
        }
    }

    function handleDeleteTab(tabIdToDelete) {
        const tabToDelete = appState.tabs.find(t => t.id === tabIdToDelete);
        if (!tabToDelete) return;

        if (!confirm(`タブ「${tabToDelete.name}」を削除しますか？このタブのタスクも全て削除されます。`)) {
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
            const newTask = { id: generateId(), text: newTaskText, done: false };
            activeTab.tasks.push(newTask);
            newTaskTextInput.value = '';
            saveState();
            renderTasksForActiveTab();
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
        if (event.key === 'Enter') handleAddTab();
    });
    addTaskButton.addEventListener('click', handleAddTask);
    newTaskTextInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleAddTask();
    });

    // --- 初期化 ---
    loadState();
    if (!appState.activeTabId && appState.tabs.length > 0) {
        appState.activeTabId = appState.tabs[0].id;
    }
    render();
});

