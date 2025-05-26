document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得 (変更なし)
    const newTabNameInput = document.getElementById('new-tab-name-input');
    const addTabButton = document.getElementById('add-tab-button');
    const tabsContainer = document.getElementById('tabs-container');
    const currentTabContent = document.getElementById('current-tab-content');
    const currentTabTitle = document.getElementById('current-tab-title');
    const newTaskTextInput = document.getElementById('new-task-text-input');
    const addTaskButton = document.getElementById('add-task-button');
    const taskListContainer = document.getElementById('task-list-container');
    const noActiveTabMessage = document.getElementById('no-active-tab-message');

    // アプリケーションの状態 (変更なし)
    let appState = {
        tabs: [],
        activeTabId: null,
    };

    // --- ユーティリティ関数 --- (変更なし)
    function generateId() {
        return `id-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    }

    // --- localStorage関連 --- (変更なし)
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
        renderTasksForActiveTab(); // この中でタスクのSortableも初期化される
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
                    taskItem.dataset.taskId = task.id; // SortableJSがアイテムを識別するためにも利用可能
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
            } else {
                // タスクがない場合のメッセージなどをここに表示しても良い
            }
            initializeTasksSortable(); // ★タスクアイテムが描画された後にSortableを初期化
        } else {
            currentTabTitle.textContent = '';
            if (tasksSortableInstance) { // アクティブなタブがない場合はタスクのSortableインスタンスを破棄
                tasksSortableInstance.destroy();
                tasksSortableInstance = null;
            }
        }
    }

    function updateNoActiveTabMessage() { // (変更なし)
        noActiveTabMessage.style.display = appState.activeTabId ? 'none' : 'block';
    }
    function updateCurrentTabContentVisibility() { // (変更なし)
        currentTabContent.style.display = appState.activeTabId ? 'block' : 'none';
    }


    // --- SortableJS 初期化 ---
    let tabsSortableInstance = null;
    function initializeTabsSortable() { // (変更なし)
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
                render();
            }
        });
    }

    let tasksSortableInstance = null;
    function initializeTasksSortable() {
        if (tasksSortableInstance) {
            tasksSortableInstance.destroy();
            tasksSortableInstance = null; // 明示的にnullを代入
        }
        const activeTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
        // タスクリストコンテナに実際にタスクアイテムが存在する場合のみSortableを初期化
        if (activeTab && taskListContainer.children.length > 0) {
            tasksSortableInstance = Sortable.create(taskListContainer, {
                animation: 150,
                draggable: '.task-item', // このクラス名を持つ要素がドラッグ可能になる
                onEnd: (event) => {
                    // onEndイベント内で再度アクティブタブを取得して操作するのが安全
                    const currentActiveTabForSort = appState.tabs.find(tab => tab.id === appState.activeTabId);
                    if (currentActiveTabForSort && currentActiveTabForSort.tasks) {
                        // event.oldDraggableIndex と event.newDraggableIndex を使用
                        const movedTask = currentActiveTabForSort.tasks.splice(event.oldDraggableIndex, 1)[0];
                        currentActiveTabForSort.tasks.splice(event.newDraggableIndex, 0, movedTask);
                        saveState();
                        // UIの即時反映のため、タスクリストを再描画
                        // (SortableがDOMを直接変更するが、appStateとの一貫性のため再描画を推奨)
                        renderTasksForActiveTab();
                    }
                }
            });
        }
    }

    // --- イベントハンドラ --- (変更なし、ただしhandleAddTask/handleDeleteTask/handleToggleTaskDoneがrenderTasksForActiveTabを呼ぶことを確認)
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
        render(); // render全体を呼ぶことで、タブのactive状態とタスクリストが更新される
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
            renderTasksForActiveTab(); // 現在のタブのタスクのみ再描画
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

    // --- イベントリスナーの登録 --- (変更なし)
    addTabButton.addEventListener('click', handleAddTab);
    newTabNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleAddTab();
    });
    addTaskButton.addEventListener('click', handleAddTask);
    newTaskTextInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleAddTask();
    });

    // --- 初期化 --- (変更なし)
    loadState();
    if (!appState.activeTabId && appState.tabs.length > 0) {
        appState.activeTabId = appState.tabs[0].id;
    }
    render();
});
