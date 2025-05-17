document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  });
});

const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');

addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;

  const activeTab = document.querySelector('.task-list:not(.hidden)');

  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';

  const left = document.createElement('div');
  left.className = 'task-left';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  const taskText = document.createElement('span');
  taskText.textContent = text;
  taskText.className = 'task-text';

  checkbox.addEventListener('change', () => {
    taskText.classList.toggle('done');
  });

  left.appendChild(checkbox);
  left.appendChild(taskText);

  const delBtn = document.createElement('button');
  delBtn.textContent = '削除';
  delBtn.className = 'delete-btn';
  delBtn.addEventListener('click', () => taskItem.remove());

  taskItem.appendChild(left);
  taskItem.appendChild(delBtn);

  activeTab.appendChild(taskItem);
  input.value = '';
});
