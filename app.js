const STORAGE_KEY = 'daily-plan-data';
const REVIEW_KEY = 'daily-plan-review';

// 获取今日日期字符串
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 从 localStorage 读取数据
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 保存到 localStorage
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 读取复盘数据
function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEW_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 保存复盘数据
function saveReviews(data) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(data));
}

// 获取指定日期的任务列表
function getTasksForDate(data, dateStr) {
  return data[dateStr] || [];
}

// 更新指定日期的任务列表
function setTasksForDate(data, dateStr, tasks) {
  const next = { ...data };
  next[dateStr] = tasks;
  return next;
}

// DOM 元素
const dateInput = document.getElementById('plan-date');
const taskInput = document.getElementById('task-input');
const groupSelect = document.getElementById('group-select');
const addTaskGroupEl = document.getElementById('add-task-group');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const prevSummary = document.getElementById('prev-summary');
const reviewInput = document.getElementById('review-input');

function getPrevDateStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 初始化日期为今天
dateInput.value = getTodayStr();

// 渲染任务列表
function renderTasks(tasks) {
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <li class="empty-state">
        <p>暂无任务</p>
        <span>在上方输入框添加今日计划</span>
      </li>
    `;
    return;
  }

  // 按分组组织任务
  const groups = {};
  const order = [];
  tasks.forEach((task, index) => {
    const name = (task.group && task.group.trim()) || '未分组';
    if (!groups[name]) {
      groups[name] = [];
      order.push(name);
    }
    groups[name].push({ task, index });
  });

  let html = '';
  order.forEach(groupName => {
    const list = groups[groupName];
    const done = list.filter(item => item.task.completed).length;
    html += `
      <li class="group-header">
        <span class="group-name">${escapeHtml(groupName)}</span>
        <span class="group-count">${done}/${list.length}</span>
      </li>
    `;
    const groupOptions = [
      { value: '', label: '未分组' },
      { value: '工作', label: '工作' },
      { value: '学习', label: '学习' },
      { value: '生活', label: '生活' },
      { value: '其他', label: '其他' }
    ];
    list.forEach(({ task, index }) => {
      const currentGroup = (task.group && task.group.trim()) || '';
      const optionsHtml = groupOptions.map(opt =>
        `<option value="${escapeHtml(opt.value)}" ${opt.value === currentGroup ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
      ).join('');
      html += `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-index="${index}">
          <button type="button" class="task-checkbox" aria-label="切换完成状态"></button>
          <span class="task-text">${escapeHtml(task.text)}</span>
          <select class="task-group-select" aria-label="修改分组" data-index="${index}">${optionsHtml}</select>
          <button type="button" class="task-delete" aria-label="删除">×</button>
        </li>
      `;
    });
  });

  taskList.innerHTML = html;

  // 绑定事件
  taskList.querySelectorAll('.task-checkbox').forEach(btn => {
    btn.addEventListener('click', handleToggle);
  });
  taskList.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', handleDelete);
  });
  taskList.querySelectorAll('.task-group-select').forEach(sel => {
    sel.addEventListener('change', handleGroupChange);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 更新统计
function updateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  totalCount.textContent = total;
  completedCount.textContent = completed;
  progressPercent.textContent = percent + '%';
  progressFill.style.width = percent + '%';
}

// 刷新当前日期视图
function refreshView() {
  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  renderTasks(tasks);
  updateStats(tasks);
  refreshReview(dateStr, data);
}

// 刷新昨日回顾视图
function refreshReview(currentDateStr, data) {
  const prevDateStr = getPrevDateStr(currentDateStr);
  if (!prevDateStr) {
    prevSummary.textContent = '暂无前一天数据';
  } else {
    const prevTasks = getTasksForDate(data, prevDateStr);
    if (!prevTasks.length) {
      prevSummary.textContent = `前一天（${prevDateStr}）没有任务记录。`;
    } else {
      const total = prevTasks.length;
      const completed = prevTasks.filter(t => t.completed).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      prevSummary.textContent = `前一天（${prevDateStr}）完成情况：${completed}/${total}，完成率 ${percent}%。`;
    }
  }

  const reviews = loadReviews();
  reviewInput.value = reviews[currentDateStr] || '';
}

// 添加任务
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  const group = (groupSelect ? groupSelect.value : '') || '';

  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  tasks.push({ text, completed: false, group });
  saveData(setTasksForDate(data, dateStr, tasks));

  taskInput.value = '';
  refreshView();
}

// 切换完成状态
function handleToggle(e) {
  const li = e.target.closest('.task-item');
  const index = parseInt(li.dataset.index, 10);
  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  if (index >= 0 && index < tasks.length) {
    tasks[index].completed = !tasks[index].completed;
    saveData(setTasksForDate(data, dateStr, tasks));
    refreshView();
  }
}

// 删除任务
function handleDelete(e) {
  const li = e.target.closest('.task-item');
  const index = parseInt(li.dataset.index, 10);
  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  if (index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
    saveData(setTasksForDate(data, dateStr, tasks));
    refreshView();
  }
}

// 修改任务分组
function handleGroupChange(e) {
  const select = e.target;
  const index = parseInt(select.dataset.index, 10);
  const newGroup = (select.value || '').trim();
  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  if (index >= 0 && index < tasks.length) {
    tasks[index].group = newGroup;
    saveData(setTasksForDate(data, dateStr, tasks));
    refreshView();
  }
}

// 事件绑定
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});
dateInput.addEventListener('change', refreshView);

reviewInput.addEventListener('input', () => {
  const dateStr = dateInput.value;
  const reviews = loadReviews();
  reviews[dateStr] = reviewInput.value;
  saveReviews(reviews);
});

// 添加任务时显示分组选择
if (addTaskGroupEl && taskInput) {
  taskInput.addEventListener('focus', () => {
    addTaskGroupEl.classList.add('is-visible');
    addTaskGroupEl.setAttribute('aria-hidden', 'false');
  });
  taskInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (!addTaskGroupEl.contains(document.activeElement)) {
        addTaskGroupEl.classList.remove('is-visible');
        addTaskGroupEl.setAttribute('aria-hidden', 'true');
      }
    }, 150);
  });
}

// 初始化
refreshView();
