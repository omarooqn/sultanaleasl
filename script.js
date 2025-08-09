// script.js
(() => {
  const STORAGE_KEY = 'orders_sultan_alasal_v1';
  const PASSWORD = '6410'; // كلمة السر التي طلبتها

  // elements
  const loginOverlay = document.getElementById('loginOverlay');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const app = document.getElementById('app');
  const logoutBtn = document.getElementById('logoutBtn');

  const form = document.getElementById('orderForm');
  const orderNumber = document.getElementById('orderNumber');
  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const paymentStatus = document.getElementById('paymentStatus');
  const sentStatus = document.getElementById('sentStatus');
  const receivedStatus = document.getElementById('receivedStatus');
  const notes = document.getElementById('notes');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');

  const ordersTableBody = document.querySelector('#ordersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const clearAllBtn = document.getElementById('clearAll');

  let orders = [];
  let editingId = null;

  // --- authentication ---
  function showApp() {
    loginOverlay.style.display = 'none';
    app.style.display = '';
  }

  function lockApp() {
    loginOverlay.style.display = '';
    app.style.display = 'none';
    passwordInput.value = '';
  }

  loginBtn.addEventListener('click', () => {
    const val = passwordInput.value.trim();
    if (val === PASSWORD) {
      localStorage.setItem('sultan_logged_in', '1');
      showApp();
      loadOrders();
    } else {
      loginError.textContent = 'كلمة السر خاطئة';
      setTimeout(()=> loginError.textContent = '', 2000);
    }
  });

  // allow Enter key on password
  passwordInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') loginBtn.click(); });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('sultan_logged_in');
    lockApp();
  });

  // auto-login if previously logged in
  if (localStorage.getItem('sultan_logged_in') === '1') {
    showApp();
  } else {
    // show overlay
    lockApp();
  }

  // --- storage ---
  function saveToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
  function loadFromStorage() { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }

  // --- CRUD ---
  function renderTable(filter = ''){
    ordersTableBody.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const list = orders.filter(o => {
      if(!q) return true;
      return o.orderNumber.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q) || o.clientPhone.includes(q);
    });

    if(list.length === 0){
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8; td.textContent = 'لا يوجد طلبات.'; td.className = 'small';
      tr.appendChild(td); ordersTableBody.appendChild(tr); return;
    }

    list.forEach(o => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(o.orderNumber)}</td>
        <td>${escapeHtml(o.clientName)}</td>
        <td>${escapeHtml(o.clientPhone)}</td>
        <td>${escapeHtml(o.paymentStatus)}</td>
        <td>${escapeHtml(o.sentStatus)}</td>
        <td>${escapeHtml(o.receivedStatus)}</td>
        <td>${escapeHtml(o.notes || '')}</td>
        <td class="actions-cell">
          <button data-id="${o.id}" class="editBtn">تعديل</button>
          <button data-id="${o.id}" class="printBtn">طباعة</button>
          <button data-id="${o.id}" class="deleteBtn">حذف</button>
        </td>
      `;
      ordersTableBody.appendChild(tr);
    });

    // attach events
    document.querySelectorAll('.editBtn').forEach(b => b.addEventListener('click', e => startEdit(e.target.dataset.id)));
    document.querySelectorAll('.deleteBtn').forEach(b => b.addEventListener('click', e => removeOrder(e.target.dataset.id)));
    document.querySelectorAll('.printBtn').forEach(b => b.addEventListener('click', e => printOrder(e.target.dataset.id)));
  }

  function addOrder(data){
    data.id = Date.now().toString();
    orders.unshift(data);
    saveToStorage();
    renderTable(searchInput.value);
  }

  function updateOrder(id, data){
    const idx = orders.findIndex(x => x.id === id); if(idx === -1) return;
    orders[idx] = Object.assign({id}, data);
    saveToStorage();
    renderTable(searchInput.value);
  }

  function removeOrder(id){
    if(!confirm('هل تريد حذف هذا الطلب؟')) return;
    orders = orders.filter(x => x.id !== id);
    saveToStorage();
    renderTable(searchInput.value);
  }

  function clearAll(){
    if(!confirm('حذف كل الطلبات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    orders = [];
    saveToStorage();
    renderTable();
  }

  // --- edit flow ---
  function startEdit(id){
    const o = orders.find(x => x.id === id); if(!o) return;
    editingId = id;
    orderNumber.value = o.orderNumber;
    clientName.value = o.clientName;
    clientPhone.value = o.clientPhone;
    paymentStatus.value = o.paymentStatus;
    sentStatus.value = o.sentStatus;
    receivedStatus.value = o.receivedStatus;
    notes.value = o.notes || '';
    saveBtn.textContent = 'تحديث الطلب';
  }

  // --- print ---
  function printOrder(id){
    const o = orders.find(x => x.id === id); if(!o) return;
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>طباعة الطلب ${escapeHtml(o.orderNumber)}</title></head><body><h1>طلب رقم ${escapeHtml(o.orderNumber)}</h1><p><strong>العميل:</strong> ${escapeHtml(o.clientName)}</p><p><strong>الجوال:</strong> ${escapeHtml(o.clientPhone)}</p><p><strong>الدفع:</strong> ${escapeHtml(o.paymentStatus)}</p><p><strong>الإرسال:</strong> ${escapeHtml(o.sentStatus)}</p><p><strong>الاستلام:</strong> ${escapeHtml(o.receivedStatus)}</p><p><strong>ملاحظات:</strong> ${escapeHtml(o.notes || '-')}</p><p>تم الطباعة من لوحة سلطان العسل</p></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // --- helpers ---
  function escapeHtml(s){ if(!s && s !== 0) return ''; return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function resetForm(){ editingId = null; form.reset(); saveBtn.textContent = 'حفظ الطلب'; }

  // --- init/load ---
  function loadOrders(){ orders = loadFromStorage(); renderTable(); }

  // event handlers
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      orderNumber: orderNumber.value.trim(),
      clientName: clientName.value.trim(),
      clientPhone: clientPhone.value.trim(),
      paymentStatus: paymentStatus.value,
      sentStatus: sentStatus.value,
      receivedStatus: receivedStatus.value,
      notes: notes.value.trim(),
      updatedAt: new Date().toISOString()
    };
    if(editingId){ updateOrder(editingId, data); }
    else { addOrder(data); }
    resetForm();
  });

  resetBtn.addEventListener('click', resetForm);
  clearAllBtn.addEventListener('click', clearAll);

  searchInput.addEventListener('input', (e) => renderTable(e.target.value));

  // load if already logged in
  if (localStorage.getItem('sultan_logged_in') === '1') loadOrders();
})();