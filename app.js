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
const prioritySelect = document.getElementById('priority-select');
const addTaskGroupEl = document.getElementById('add-task-group');
const addBtn = document.getElementById('add-btn');
const voiceBtn = document.getElementById('voice-btn');
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

const GROUP_OPTIONS = [
  { value: '', label: '未分组' },
  { value: '工作', label: '工作' },
  { value: '学习', label: '学习' },
  { value: '生活', label: '生活' },
  { value: '其他', label: '其他' }
];
const PRIORITY_OPTIONS = [
  { value: '高', label: '高' },
  { value: '中', label: '中' },
  { value: '低', label: '低' }
];

function priorityOrder(p) {
  const o = { '高': 0, '中': 1, '低': 2 };
  return o[p || '中'] ?? 1;
}

// 未完成任务按分组顺序的索引（与列表展示顺序一致，用于拖拽重排）
function getPendingIndicesInDisplayOrder(tasks) {
  const order = [];
  for (const opt of GROUP_OPTIONS) {
    const groupValue = opt.value;
    const indices = tasks.map((t, i) => i).filter(i => !tasks[i].completed && ((tasks[i].group || '').trim() === groupValue));
    indices.sort((a, b) => priorityOrder(tasks[a].priority) - priorityOrder(tasks[b].priority));
    order.push(...indices);
  }
  return order;
}

// 渲染任务列表：未完成按分组（工作/学习/生活等）展示，已完成一块；组内按优先级排序，可拖拽排序
function renderTasks(tasks) {
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>暂无任务</p>
        <span>在上方输入框添加今日计划</span>
      </div>
    `;
    return;
  }

  const done = tasks.map((t, i) => ({ task: t, index: i })).filter(x => x.task.completed);
  done.sort((a, b) => priorityOrder(a.task.priority) - priorityOrder(b.task.priority));

  function renderItem({ task, index }, section, groupValue) {
    const currentGroup = (task.group && task.group.trim()) || '';
    const currentPriority = task.priority || '中';
    const groupOpts = GROUP_OPTIONS.map(opt =>
      `<option value="${escapeHtml(opt.value)}" ${opt.value === currentGroup ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
    ).join('');
    const priorityOpts = PRIORITY_OPTIONS.map(opt =>
      `<option value="${escapeHtml(opt.value)}" ${opt.value === currentPriority ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
    ).join('');
    const dataGroup = (section === 'pending' && groupValue !== undefined) ? ` data-group="${escapeHtml(groupValue)}"` : '';
    return `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-index="${index}" data-section="${section}"${dataGroup} draggable="true">
        <span class="task-drag" aria-hidden="true">⋮⋮</span>
        <button type="button" class="task-checkbox" aria-label="切换完成状态"></button>
        <span class="priority-cell">
          <span class="priority-dot" data-priority="${escapeHtml(currentPriority)}" aria-hidden="true"></span>
          <select class="task-priority-select task-priority-${escapeHtml(currentPriority)}" aria-label="修改优先级" title="点击修改优先级（当前：${escapeHtml(currentPriority)}）" data-index="${index}">${priorityOpts}</select>
        </span>
        <span class="task-text" role="button" tabindex="0" aria-label="点击编辑">${escapeHtml(task.text)}</span>
        <select class="task-group-select" aria-label="修改分组" data-index="${index}">${groupOpts}</select>
        <button type="button" class="task-delete" aria-label="删除">×</button>
      </li>
    `;
  }

  let html = '';
  html += '<div class="task-section task-section-pending"><h3 class="task-section-title">未完成</h3>';
  for (const opt of GROUP_OPTIONS) {
    const groupValue = opt.value;
    const groupLabel = opt.label;
    const pendingInGroup = tasks.map((t, i) => ({ task: t, index: i })).filter(x => !x.task.completed && ((x.task.group || '').trim() === groupValue));
    pendingInGroup.sort((a, b) => priorityOrder(a.task.priority) - priorityOrder(b.task.priority));
    if (pendingInGroup.length === 0) continue;
    html += `<div class="task-group-block" data-group="${escapeHtml(groupValue)}"><h4 class="task-group-title">${escapeHtml(groupLabel)}</h4><ul class="task-ul">`;
    pendingInGroup.forEach(x => { html += renderItem(x, 'pending', groupValue); });
    html += '</ul></div>';
  }
  html += '</div>';
  html += '<div class="task-section task-section-done"><h3 class="task-section-title">已完成</h3><ul class="task-ul">';
  done.forEach(x => { html += renderItem(x, 'done'); });
  html += '</ul></div>';

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
  taskList.querySelectorAll('.task-priority-select').forEach(sel => {
    sel.addEventListener('change', handlePriorityChange);
    sel.addEventListener('change', () => {
      const dot = sel.closest('.task-item')?.querySelector('.priority-dot');
      if (dot) dot.setAttribute('data-priority', sel.value || '中');
    });
  });
  taskList.querySelectorAll('.task-text').forEach(span => {
    span.addEventListener('click', handleTaskTextClick);
    span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); span.click(); } });
    // iOS/触摸设备上 click 可能不触发，用 touchend 直接进入编辑
    span.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length && !span.closest('.task-text-input')) {
        e.preventDefault();
        handleTaskTextClick({ currentTarget: span });
      }
    }, { passive: false });
  });
  taskList.querySelectorAll('.task-item[draggable]').forEach(li => {
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);
    bindTouchDrag(li);
  });
}

function handleTaskTextClick(e) {
  const span = e.currentTarget;
  const li = span.closest('.task-item');
  const index = parseInt(li.dataset.index, 10);
  const original = span.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-text-input';
  input.value = original;
  input.setAttribute('maxlength', '100');
  span.replaceWith(input);
  input.focus();
  input.select();

  function save() {
    const newText = input.value.trim();
    const dateStr = dateInput.value;
    const data = loadData();
    const tasks = getTasksForDate(data, dateStr);
    if (index >= 0 && index < tasks.length) {
      tasks[index].text = newText || original;
    }
    saveData(setTasksForDate(data, dateStr, tasks));
    refreshView();
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = original; input.blur(); }
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
  const priority = (prioritySelect ? prioritySelect.value : '') || '中';

  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  tasks.push({ text, completed: false, group, priority });
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

// 修改任务优先级
function handlePriorityChange(e) {
  const select = e.target;
  const index = parseInt(select.dataset.index, 10);
  const newPriority = (select.value || '中').trim();
  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  if (index >= 0 && index < tasks.length) {
    tasks[index].priority = newPriority;
    saveData(setTasksForDate(data, dateStr, tasks));
    refreshView();
  }
}

// 同模块内拖拽排序（未完成按分组展示顺序）
function reorderTasksInSection(section, draggedIndex, targetIndex) {
  const dateStr = dateInput.value;
  const data = loadData();
  const tasks = getTasksForDate(data, dateStr);
  const pendingIndices = getPendingIndicesInDisplayOrder(tasks);
  const doneIndices = tasks.map((t, i) => i).filter(i => tasks[i].completed);
  const indices = section === 'pending' ? pendingIndices : doneIndices;
  const fromPos = indices.indexOf(draggedIndex);
  const toPos = indices.indexOf(targetIndex);
  if (fromPos < 0 || toPos < 0 || fromPos === toPos) return;
  const moved = indices.splice(fromPos, 1)[0];
  indices.splice(toPos, 0, moved);
  const newTasks = pendingIndices.map(i => tasks[i]).concat(doneIndices.map(i => tasks[i]));
  saveData(setTasksForDate(data, dateStr, newTasks));
  refreshView();
}

let draggedElement = null;

// iOS 不支持 HTML5 拖拽，用 touch 事件实现同块内排序
function bindTouchDrag(li) {
  const dragHandle = li.querySelector('.task-drag');
  if (!dragHandle) return;
  let startY = 0;
  let touchActive = false;
  let lastOver = null;

  function clearOver() {
    if (lastOver) {
      lastOver.classList.remove('task-drag-over');
      lastOver = null;
    }
  }

  dragHandle.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchActive = true;
    startY = e.touches[0].clientY;
    li.classList.add('task-dragging');
    clearOver();
    document.addEventListener('touchmove', onMove, { capture: true, passive: false });
    document.addEventListener('touchend', onEnd, true);
    document.addEventListener('touchcancel', onEnd, true);
  }, { passive: true });

  function onMove(e) {
    if (!touchActive || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    const x = e.touches[0].clientX;
    if (Math.abs(y - startY) < 8) return;
    e.preventDefault();
    const under = document.elementFromPoint(x, y);
    const targetLi = under?.closest('.task-item');
    const sameSection = targetLi && targetLi !== li && targetLi.dataset.section === li.dataset.section;
    const sameGroupOk = li.dataset.section !== 'pending' || targetLi?.dataset.group === li.dataset.group;
    if (sameSection && sameGroupOk) {
      clearOver();
      targetLi.classList.add('task-drag-over');
      lastOver = targetLi;
    } else {
      clearOver();
    }
  }

  function onEnd() {
    if (!touchActive) return;
    touchActive = false;
    li.classList.remove('task-dragging');
    const target = lastOver;
    clearOver();
    document.removeEventListener('touchmove', onMove, { capture: true });
    document.removeEventListener('touchend', onEnd, true);
    document.removeEventListener('touchcancel', onEnd, true);
    if (target && target !== li) {
      const draggedIndex = parseInt(li.dataset.index, 10);
      const targetIndex = parseInt(target.dataset.index, 10);
      reorderTasksInSection(li.dataset.section, draggedIndex, targetIndex);
    }
  }
}

function handleDragStart(e) {
  const li = e.currentTarget;
  if (li.classList.contains('task-item')) {
    draggedElement = li;
    e.dataTransfer.setData('text/plain', li.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    li.classList.add('task-dragging');
  }
}

function handleDragOver(e) {
  e.preventDefault();
  const li = e.currentTarget;
  if (!draggedElement || li === draggedElement) return;
  if (li.dataset.section !== draggedElement.dataset.section) return;
  if (li.dataset.section === 'pending' && li.dataset.group !== draggedElement.dataset.group) return;
  e.dataTransfer.dropEffect = 'move';
  li.classList.add('task-drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.classList.remove('task-drag-over');
  if (!draggedElement || target === draggedElement) return;
  if (target.dataset.section !== draggedElement.dataset.section) return;
  if (target.dataset.section === 'pending' && target.dataset.group !== draggedElement.dataset.group) return;
  const draggedIndex = parseInt(draggedElement.dataset.index, 10);
  const targetIndex = parseInt(target.dataset.index, 10);
  reorderTasksInSection(target.dataset.section, draggedIndex, targetIndex);
  draggedElement = null;
}

function handleDragEnd(e) {
  const li = e.currentTarget;
  li.classList.remove('task-dragging');
  li.classList.remove('task-drag-over');
  taskList.querySelectorAll('.task-drag-over').forEach(el => el.classList.remove('task-drag-over'));
  draggedElement = null;
}

// 检测语音输入是否可用（需支持 Web Speech API 且为安全上下文 HTTPS/localhost）
function isVoiceInputAvailable() {
  const hasAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isSecure = window.isSecureContext;
  return hasAPI && isSecure;
}

// 语音输入：支持时用 Web Speech API，否则聚焦输入框以唤起系统键盘（系统键盘带麦克风时可语音输入）
function startVoiceInput() {
  if (!isVoiceInputAvailable()) {
    taskInput.focus();
    taskInput.placeholder = '已打开输入框，请使用键盘上的麦克风进行语音输入';
    setTimeout(() => { if (taskInput.placeholder === '已打开输入框，请使用键盘上的麦克风进行语音输入') taskInput.placeholder = '添加新任务...'; }, 4000);
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = false;

  function setListening(on) {
    if (voiceBtn) voiceBtn.classList.toggle('listening', on);
    if (on) voiceBtn && (voiceBtn.title = '正在听…');
    else voiceBtn && (voiceBtn.title = '语音输入');
  }

  recognition.onstart = () => setListening(true);
  recognition.onend = () => setListening(false);
  recognition.onerror = (e) => {
    setListening(false);
    if (e.error === 'not-allowed') taskInput.placeholder = '请允许麦克风权限后重试';
    else if (e.error !== 'aborted') taskInput.placeholder = '添加新任务...';
  };
  recognition.onresult = (e) => {
    const text = (e.results[0] && e.results[0][0] && e.results[0][0].transcript) || '';
    if (text) {
      const current = (taskInput.value || '').trim();
      taskInput.value = current ? current + ' ' + text : text;
      taskInput.placeholder = '添加新任务...';
    }
  };

  try {
    recognition.start();
  } catch (err) {
    setListening(false);
    taskInput.placeholder = '无法启动语音识别，请检查麦克风权限';
  }
}

// 事件绑定
addBtn.addEventListener('click', addTask);
if (voiceBtn) {
  voiceBtn.addEventListener('click', startVoiceInput);
  // 不支持 Web Speech 时，按钮用于唤起带语音输入的系统键盘
  if (!isVoiceInputAvailable()) {
    voiceBtn.setAttribute('aria-label', '打开输入框，使用键盘上的麦克风进行语音输入');
    voiceBtn.title = '打开输入框，使用键盘上的麦克风进行语音输入';
  }
}
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
