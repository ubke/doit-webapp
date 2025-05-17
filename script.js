```javascript
document.getElementById('add-btn').addEventListener('click', () => {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (text === '') return;

  const li = document.createElement('li');
  li.textContent = text;

  const delBtn = document.createElement('button');
  delBtn.textContent = '削除';
  delBtn.addEventListener('click', () => li.remove());

  li.addEventListener('click', () => li.classList.toggle('done'));
  li.appendChild(delBtn);

  document.getElementById('task-list').appendChild(li);
  input.value = '';
});
```