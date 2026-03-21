import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBNV2MzTq7-vHp92rqiQQqT5YbTX9CCQpo',
  authDomain: 'shopacc-1408e.firebaseapp.com',
  projectId: 'shopacc-1408e',
  storageBucket: 'shopacc-1408e.firebasestorage.app',
  messagingSenderId: '502620409879',
  appId: '1:502620409879:web:95cbfa5efae1ff6bf24c52',
  measurementId: 'G-3559MW5CW1',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const state = {
  user: null,
  profile: null,
  products: [],
  orders: [],
  users: [],
  lastReceipt: null,
  searchTerm: '',
  gameFilter: 'all',
  editProductId: null,
  userSearchTerm: '',
  profileUnsubscribe: null,
};

const els = {
  authSection: document.getElementById('authSection'),
  appSection: document.getElementById('appSection'),
  authMessage: document.getElementById('authMessage'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  registerUsername: document.getElementById('registerUsername'),
  registerPassword: document.getElementById('registerPassword'),
  tabLogin: document.getElementById('tabLogin'),
  tabRegister: document.getElementById('tabRegister'),
  logoutBtn: document.getElementById('logoutBtn'),
  statusPill: document.getElementById('statusPill'),
  balanceValue: document.getElementById('balanceValue'),
  roleValue: document.getElementById('roleValue'),
  productCount: document.getElementById('productCount'),
  orderCount: document.getElementById('orderCount'),
  productsGrid: document.getElementById('productsGrid'),
  ordersList: document.getElementById('ordersList'),
  refreshProductsBtn: document.getElementById('refreshProductsBtn'),
  searchInput: document.getElementById('searchInput'),
  chipsWrap: document.getElementById('chipsWrap'),
  adminPanel: document.getElementById('adminPanel'),
  productForm: document.getElementById('productForm'),
  pTitle: document.getElementById('pTitle'),
  pGame: document.getElementById('pGame'),
  pDescription: document.getElementById('pDescription'),
  pPrice: document.getElementById('pPrice'),
  pImageUrl: document.getElementById('pImageUrl'),
  pGalleryUrls: document.getElementById('pGalleryUrls'),
  pDeliveryText: document.getElementById('pDeliveryText'),
  pDeliveryLogin: document.getElementById('pDeliveryLogin'),
  pDeliveryPassword: document.getElementById('pDeliveryPassword'),
  productSubmitBtn: document.getElementById('productSubmitBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  topupForm: document.getElementById('topupForm'),
  userSelect: document.getElementById('userSelect'),
  topupAmount: document.getElementById('topupAmount'),
  usersTable: document.getElementById('usersTable'),
  toast: document.getElementById('toast'),
  receiptModal: document.getElementById('receiptModal'),
  receiptBody: document.getElementById('receiptBody'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  copyReceiptBtn: document.getElementById('copyReceiptBtn'),
  spinBtn: document.getElementById('spinBtn'),
  wheel: document.getElementById('wheel'),
  historyModal: document.getElementById('historyModal'),
  showHistoryBtn: document.getElementById('showHistoryBtn'),
  closeHistoryBtn: document.getElementById('closeHistoryBtn'),
  topupSection: document.getElementById('topupSection'),
  tabCard: document.getElementById('tabCard'),
  tabBank: document.getElementById('tabBank'),
  cardTopupForm: document.getElementById('cardTopupForm'),
  bankTopupForm: document.getElementById('bankTopupForm'),
  cardProvider: document.getElementById('cardProvider'),
  cardAmount: document.getElementById('cardAmount'),
  cardCode: document.getElementById('cardCode'),
  cardSerial: document.getElementById('cardSerial'),
  cardTopupBtn: document.getElementById('cardTopupBtn'),
  bankAmount: document.getElementById('bankAmount'),
  bankTopupBtn: document.getElementById('bankTopupBtn'),
  transferContent: document.getElementById('transferContent'),
  copyTransferBtn: document.getElementById('copyTransferBtn'),
  userSearchInput: document.getElementById('userSearchInput'),
  topupUserSearch: document.getElementById('topupUserSearch'),
  topupSuccessModal: document.getElementById('topupSuccessModal'),
  topupSuccessText: document.getElementById('topupSuccessText'),
  closeTopupSuccessBtn: document.getElementById('closeTopupSuccessBtn'),
  adminCmdInput: document.getElementById('adminCmdInput'),
  execCmdBtn: document.getElementById('execCmdBtn'),
  cmdLog: document.getElementById('cmdLog'),
  adminProductsTable: document.getElementById('adminProductsTable'),
  btnRefreshAdminProducts: document.getElementById('btnRefreshAdminProducts')
};

let toastTimer = null;

function normalizeUsername(username) { return String(username || '').trim().toLowerCase(); }
function usernameToEmail(username) { return `${normalizeUsername(username)}@shopacc.local`; }
function isValidUsername(username) { return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(username)); }
function formatMoney(value) { return `${Number(value || 0).toLocaleString('vi-VN')} đ`; }

function formatDate(value) {
  if (!value) return '—';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString('vi-VN');
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString('vi-VN');
  return new Date(value).toLocaleString('vi-VN');
}

function showToast(message, type = 'success') {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.className = `toast ${type}`;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2800);
}

function setAuthMessage(text, ok = false) {
  if (!els.authMessage) return;
  els.authMessage.textContent = text;
  els.authMessage.style.color = ok ? '#2de38b' : '#ff4757';
}

function openModal() { els.receiptModal?.classList.remove('hidden'); }
function closeModal() { els.receiptModal?.classList.add('hidden'); }
function openTopupSuccessModal() { els.topupSuccessModal?.classList.remove('hidden'); }
function closeTopupSuccessModal() { els.topupSuccessModal?.classList.add('hidden'); }

function setLoading(button, loading, text) {
  if (!button) return;
  if (loading) {
    button.dataset.oldText = button.textContent;
    button.disabled = true;
    button.textContent = text || 'Đang xử lý...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.oldText || button.textContent;
  }
}

function splitImageUrls(raw) { return String(raw || '').split(',').map(s => s.trim()).filter(Boolean); }
function getImageList(product) {
  if (Array.isArray(product.imageUrls) && product.imageUrls.length) return product.imageUrls.filter(Boolean);
  if (product.imageUrl) return [product.imageUrl];
  return ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'];
}

function renderReceipt(receipt) {
  if (!receipt || !els.receiptBody) return;
  const items = [
    ['Sản phẩm/Dịch vụ', `<span class="text-purple">${receipt.title}</span>`],
    ['Chi phí', `<span class="text-green">${formatMoney(receipt.price)}</span>`],
    ['Ghi chú bàn giao', receipt.deliveryText || '—'],
    ['Tài khoản Game', `<strong style="color:#fff">${receipt.deliveryLogin || '—'}</strong>`],
    ['Mật khẩu Game', `<strong style="color:#fff">${receipt.deliveryPassword || '—'}</strong>`],
    ['Số dư còn lại', formatMoney(receipt.newBalance)],
  ];
  els.receiptBody.innerHTML = items.map(([label, value]) => `
    <div class="receipt-item">
      <span>${label}</span>
      <div style="max-width: 60%; text-align:right">${value}</div>
    </div>
  `).join('');
}

async function loadProfile(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const fallback = {
    uid,
    username: state.user?.displayName || state.user?.email?.split('@')?.[0] || 'user',
    email: state.user?.email || `${uid}@shopacc.local`,
    balance: 0, // ĐÃ SỬA: Số dư ban đầu = 0đ
    role: 'user',
    banned: false,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, fallback, { merge: true });
  return fallback;
}

async function loadProducts() {
  const snap = await getDocs(collection(db, 'products'));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  state.products = list;
  if (els.productCount) els.productCount.textContent = String(list.length);
  renderProducts();
  renderAdminProducts();
}

async function loadOrders() {
  if (!state.user) return;
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', state.user.uid)));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  state.orders = list;
  if (els.orderCount) els.orderCount.textContent = String(list.length);
  renderOrders();
}

async function loadUsers() {
  if (!state.profile || state.profile.role !== 'admin') return;
  const snap = await getDocs(collection(db, 'users'));
  state.users = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  renderUsers();
}

// TERMINAL LOGIC
async function processAdminCommand(rawCmd) {
  if (!state.user || state.profile?.role !== 'admin') return;
  const parts = rawCmd.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const log = (msg, isError = false) => {
    if (els.cmdLog) {
      els.cmdLog.textContent = `> ${msg}`;
      els.cmdLog.style.color = isError ? '#ff4757' : '#2de38b';
    }
  };

  try {
    switch (cmd) {
      case '/help': log('Lệnh: /setbal [uid] [tiền], /addbal [uid] [tiền], /giveall [tiền], /ban [uid] [lý do], /unban [uid], /role [uid] [admin/user], /del_sold'); break;
      case '/setbal': 
        if (args.length < 2) throw new Error('Cú pháp: /setbal [UID] [Số tiền]');
        await updateDoc(doc(db, 'users', args[0]), { balance: Number(args[1]) || 0 });
        log(`Đã đặt lại số dư của ${args[0]} thành ${formatMoney(args[1])}`);
        break;
      case '/addbal': 
        if (args.length < 2) throw new Error('Cú pháp: /addbal [UID] [Số tiền]');
        const addAmount = Number(args[1]);
        if (isNaN(addAmount)) throw new Error('Số tiền không hợp lệ!');
        const snap = await getDoc(doc(db, 'users', args[0]));
        await updateDoc(doc(db, 'users', args[0]), { balance: (snap.data().balance || 0) + addAmount });
        log(`Đã ${addAmount > 0 ? 'cộng' : 'trừ'} ${formatMoney(Math.abs(addAmount))} cho user ${args[0]}`);
        break;
      case '/giveall':
        if (!args[0]) throw new Error('Cú pháp: /giveall [Số tiền]');
        const amount = Number(args[0]);
        const allUsers = await getDocs(collection(db, 'users'));
        await Promise.all(allUsers.docs.map(u => updateDoc(u.ref, { balance: (u.data().balance || 0) + amount })));
        log(`Đã cộng ${formatMoney(amount)} cho toàn bộ ${allUsers.size} user.`);
        break;
      case '/ban': 
        if (!args[0]) throw new Error('Cú pháp: /ban [UID] [Lý do]');
        const reason = args.slice(1).join(' ') || 'Vi phạm nội quy';
        await updateDoc(doc(db, 'users', args[0]), { banned: true, banReason: reason });
        log(`Đã KHÓA user ${args[0]}. Lý do: ${reason}`);
        break;
      case '/unban': 
        if (!args[0]) throw new Error('Cú pháp: /unban [UID]');
        await updateDoc(doc(db, 'users', args[0]), { banned: false, banReason: '' });
        log(`Đã MỞ KHÓA cho user ${args[0]}`);
        break;
      case '/role':
        if (args.length < 2) throw new Error('Cú pháp: /role [UID] [admin/user]');
        await updateDoc(doc(db, 'users', args[0]), { role: args[1] });
        log(`Đã đổi quyền của ${args[0]} thành ${args[1]}`);
        break;
      case '/del_sold':
        const soldSnaps = await getDocs(query(collection(db, 'products'), where('status', '==', 'sold')));
        await Promise.all(soldSnaps.docs.map(d => deleteDoc(d.ref)));
        log(`Đã dọn dẹp ${soldSnaps.size} sản phẩm đã bán.`);
        break;
      default: log('Lệnh không tồn tại. Gõ /help để xem.', true);
    }
    await loadUsers(); 
  } catch (error) { log(error.message, true); }
}

function renderAdminProducts() {
  if (!els.adminProductsTable) return;
  if (!state.products.length) {
    els.adminProductsTable.innerHTML = '<tr><td colspan="6" class="text-center text-gray">Kho hàng trống.</td></tr>';
    return;
  }
  els.adminProductsTable.innerHTML = state.products.map(p => {
    const mainImg = getImageList(p)[0];
    const sold = p.status === 'sold';
    return `
      <tr>
        <td><img src="${mainImg}" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.1)"></td>
        <td>
          <strong style="font-size:15px">${p.title || '—'}</strong>
          <div class="uid-text">ID: ${p.id}</div>
        </td>
        <td class="text-purple" style="font-weight:600">${p.game || '—'}</td>
        <td class="text-green" style="font-weight:bold">${formatMoney(p.price)}</td>
        <td><span class="pill ${sold ? 'pill-muted' : 'pill-admin'}" style="font-size:10px">${sold ? 'ĐÃ BÁN' : 'SẴN SÀNG'}</span></td>
        <td class="text-right">
          <button class="btn btn-outline btn-sm" data-edit="${p.id}">Sửa</button>
          <button class="btn btn-sm" style="background:#ff4757; color:#fff" data-delete="${p.id}">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');

  els.adminProductsTable.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Xóa vĩnh viễn sản phẩm này?')) return;
    setLoading(b, true, '...');
    try { await deleteDoc(doc(db, 'products', b.dataset.delete)); showToast('Đã xóa'); await refreshAll(); } 
    catch (e) { showToast(e.message, 'error'); } finally { setLoading(b, false); }
  }));
  els.adminProductsTable.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
    const p = state.products.find(x => x.id === b.dataset.edit);
    if (!p) return;
    state.editProductId = p.id;
    els.pTitle.value = p.title || ''; els.pGame.value = p.game || ''; els.pDescription.value = p.description || '';
    els.pPrice.value = p.price || ''; els.pImageUrl.value = p.imageUrl || ''; els.pGalleryUrls.value = (p.imageUrls || []).join(', ');
    els.pDeliveryText.value = p.deliveryText || ''; els.pDeliveryLogin.value = p.deliveryLogin || ''; els.pDeliveryPassword.value = p.deliveryPassword || '';
    els.productSubmitBtn.textContent = 'Cập Nhật'; els.cancelEditBtn.classList.remove('hidden'); els.adminPanel.scrollIntoView({ behavior: 'smooth' });
  }));
}

function renderProducts() {
  if (!els.productsGrid) return;
  const search = state.searchTerm.trim().toLowerCase();
  let list = [...state.products];
  if (state.gameFilter !== 'all') list = list.filter(p => String(p.game || '').toLowerCase().includes(state.gameFilter.toLowerCase()));
  if (search) list = list.filter(p => `${p.title || ''} ${p.game || ''} ${p.description || ''}`.toLowerCase().includes(search));

  if (!list.length) {
    els.productsGrid.innerHTML = '<div class="text-gray text-center w-100" style="grid-column: 1/-1; padding: 40px">Không tìm thấy sản phẩm nào.</div>';
    return;
  }

  els.productsGrid.innerHTML = list.map(p => {
    const sold = p.status === 'sold';
    const main = getImageList(p)[0];
    return `
      <article class="product-card">
        <div class="card-img-wrap">
          <img class="product-img" src="${main}" alt="${p.title}" loading="lazy" />
          <span class="status-badge ${sold ? 'sold' : 'ok'}">${sold ? 'Đã Bán' : 'Sẵn Sàng'}</span>
        </div>
        <div class="card-body">
          <div class="product-game">${p.game || '—'}</div>
          <h3 class="product-title" title="${p.title}">${p.title || 'Sản phẩm'}</h3>
          <p class="product-desc">${p.description || 'Không có mô tả chi tiết cho sản phẩm này.'}</p>
          <div class="price-row">
            <span class="price">${formatMoney(p.price)}</span>
            <span class="small">Mã: ${p.id.slice(-5)}</span>
          </div>
          <button class="btn ${sold ? 'btn-disabled' : 'btn-glow'} w-100" data-buy="${p.id}" ${sold ? 'disabled' : ''}>
            ${sold ? 'HẾT HÀNG' : 'MUA NGAY'}
          </button>
        </div>
      </article>
    `;
  }).join('');

  els.productsGrid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.user) return showToast('Bạn cần đăng nhập trước.', 'error');
      const productId = btn.dataset.buy;
      setLoading(btn, true, 'Đang mua...');
      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) throw new Error('Sản phẩm không tồn tại.');
        const pData = productSnap.data();
        if (pData.status === 'sold') throw new Error('Sản phẩm đã được bán.');

        const userRef = doc(db, 'users', state.user.uid);
        const userSnap = await getDoc(userRef);
        const uData = userSnap.data();
        if (uData.balance < pData.price) throw new Error('Số dư không đủ để mua.');

        const newBalance = uData.balance - pData.price;
        await updateDoc(userRef, { balance: newBalance });
        await updateDoc(productRef, { status: 'sold' });

        const orderData = {
          userId: state.user.uid, productId: productId, title: pData.title, game: pData.game, price: pData.price,
          deliveryText: pData.deliveryText || '—', deliveryLogin: pData.deliveryLogin || '—', deliveryPassword: pData.deliveryPassword || '—',
          createdAt: serverTimestamp(), newBalance: newBalance
        };
        await addDoc(collection(db, 'orders'), orderData);
        state.lastReceipt = orderData; renderReceipt(orderData); openModal(); showToast('Mua thành công'); await refreshAll();
      } catch (error) { showToast(error.message, 'error'); } finally { setLoading(btn, false); }
    });
  });
}

function renderOrders() {
  if (!els.ordersList) return;
  if (!state.orders.length) { els.ordersList.innerHTML = '<div class="text-center text-gray py-4">Chưa có đơn hàng nào.</div>'; return; }
  
  els.ordersList.innerHTML = state.orders.map(o => {
    const isTopup = o.title?.includes('[NẠP');
    const isLose = o.title?.includes('TRƯỢT');
    let priceHTML = `<span>${formatMoney(o.price)}</span>`;
    if (isTopup) priceHTML = `<span class="text-green">+ ${formatMoney(o.price)}</span>`;
    else if (isLose) priceHTML = `<span class="text-red">- ${formatMoney(o.price)}</span>`;

    return `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <strong style="font-size:16px; display:block; margin-bottom:4px;">${o.title || 'Đơn hàng'}</strong>
            <span class="text-purple" style="font-size:13px; font-weight:600">${o.game || '—'}</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px; font-weight:bold; margin-bottom:4px;">${priceHTML}</div>
            <div class="small">${formatDate(o.createdAt)}</div>
          </div>
        </div>
        <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:12px; font-family:monospace; font-size:13px; display:grid; gap:8px;">
          <div style="display:flex; justify-content:space-between"><span class="text-gray">Bàn giao:</span> <span style="color:#fff">${o.deliveryText || '—'}</span></div>
          <div style="display:flex; justify-content:space-between"><span class="text-gray">Tài khoản:</span> <strong style="color:#2de38b">${o.deliveryLogin || '—'}</strong></div>
          <div style="display:flex; justify-content:space-between"><span class="text-gray">Mật khẩu:</span> <strong style="color:#ff4757">${o.deliveryPassword || '—'}</strong></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderUsers() {
  if (!els.usersTable) return;
  let filtered = state.users.filter(u => `${u.username||''} ${u.id||''}`.toLowerCase().includes((state.userSearchTerm||'').toLowerCase().trim()));
  
  if (!filtered.length) {
    els.usersTable.innerHTML = '<tr><td colspan="5" class="text-center text-gray">Không tìm thấy user.</td></tr>';
    if (els.userSelect) els.userSelect.innerHTML = '<option value="">Trống</option>'; return;
  }

  els.usersTable.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <strong style="font-size:15px">${u.username || '—'}</strong>
        ${u.banned ? '<span class="badge-pro" style="position:static; margin-left:8px; font-size:10px">BANNED</span>' : ''}
        <br>
        <span class="uid-text" title="Click copy" onclick="navigator.clipboard.writeText('${u.id}'); alert('Đã copy UID')">UID: ${u.id} 📋</span>
      </td>
      <td class="text-gray">${u.email || '—'}</td>
      <td class="text-green" style="font-weight:bold; font-size:16px">${formatMoney(u.balance)}</td>
      <td><span class="pill ${u.role==='admin' ? 'pill-admin glow-purple' : 'pill-muted'}">${u.role || 'user'}</span></td>
      <td class="text-right">
        <button class="btn btn-outline btn-sm" data-role="toggle" data-uid="${u.id}">${u.role==='admin' ? 'Hạ Quyền' : 'Lên Admin'}</button>
        <button class="btn btn-sm" style="background:#ff4757; color:#fff" data-reset="${u.id}">Reset 0đ</button>
      </td>
    </tr>
  `).join('');

  if (els.userSelect) els.userSelect.innerHTML = filtered.map(u => `<option value="${u.id}">${u.username} · ${formatMoney(u.balance)}</option>`).join('');

  els.usersTable.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', async () => {
    try { await updateDoc(doc(db, 'users', b.dataset.uid), { role: b.textContent.includes('Hạ') ? 'user' : 'admin' }); showToast('Cập nhật quyền thành công'); await refreshAll(); } catch (e) { showToast(e.message, 'error'); }
  }));
  els.usersTable.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Xóa sạch số dư user này về 0đ?')) return;
    try { await updateDoc(doc(db, 'users', b.dataset.reset), { balance: 0 }); showToast('Đã reset về 0đ'); await refreshAll(); } catch (e) { showToast(e.message, 'error'); }
  }));
}

function updateBankTransferContent() { if (state.user && els.transferContent) els.transferContent.textContent = `NAP ${state.user.uid}`; }
async function maybeSeedAdmin() {
  if (!state.user) return;
  try {
    const snaps = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    if (snaps.empty) { await updateDoc(doc(db, 'users', state.user.uid), { role: 'admin' }); state.profile.role = 'admin'; }
  } catch (e) {}
}

async function refreshAll() {
  if (!state.user) return;
  state.profile = await loadProfile(state.user.uid);
  if (els.balanceValue) els.balanceValue.textContent = formatMoney(state.profile.balance);
  if (els.roleValue) els.roleValue.textContent = state.profile.role || 'user';
  if (els.statusPill) els.statusPill.textContent = `${state.profile.username || 'user'} · ${state.profile.role || 'user'}`;
  if (els.adminPanel) els.adminPanel.classList.toggle('hidden', state.profile.role !== 'admin');
  updateBankTransferContent(); await maybeSeedAdmin(); await Promise.all([loadProducts(), loadOrders(), loadUsers()]);
}

function showApp() { els.authSection?.classList.add('hidden'); els.appSection?.classList.remove('hidden'); els.logoutBtn?.classList.remove('hidden'); }
function showAuth() { els.authSection?.classList.remove('hidden'); els.appSection?.classList.add('hidden'); els.logoutBtn?.classList.add('hidden'); if(els.statusPill) els.statusPill.textContent='Chưa đăng nhập'; }

els.tabLogin?.addEventListener('click', () => { els.tabLogin.classList.add('active'); els.tabRegister.classList.remove('active'); els.loginForm.classList.remove('hidden'); els.registerForm.classList.add('hidden'); setAuthMessage(''); });
els.tabRegister?.addEventListener('click', () => { els.tabRegister.classList.add('active'); els.tabLogin.classList.remove('active'); els.registerForm.classList.remove('hidden'); els.loginForm.classList.add('hidden'); setAuthMessage(''); });

els.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); const u = els.loginUsername.value.trim(); const p = els.loginPassword.value;
  if (!u || !p) return setAuthMessage('Vui lòng nhập đủ thông tin.');
  try { await signInWithEmailAndPassword(auth, usernameToEmail(u), p); setAuthMessage('Đăng nhập thành công.', true); } catch (e) { setAuthMessage(e.message || 'Đăng nhập thất bại.'); }
});

els.registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); const u = normalizeUsername(els.registerUsername.value); const p = els.registerPassword.value;
  if (!u || !p) return setAuthMessage('Vui lòng nhập đủ thông tin.'); if (!isValidUsername(u)) return setAuthMessage('Username không hợp lệ.'); if (p.length < 6) return setAuthMessage('Mật khẩu >= 6 ký tự.');
  try {
    const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(u), p); await updateProfile(cred.user, { displayName: u });
    
    // ĐÃ SỬA: Đưa balance về 0 khi đăng ký
    await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, username: u, email: usernameToEmail(u), balance: 0, role: 'user', banned: false, createdAt: serverTimestamp() }, { merge: true });
    
    setAuthMessage('Đăng ký thành công.', true); showToast('Đã tạo tài khoản thành công!');
  } catch (e) { setAuthMessage(e.message || 'Đăng ký thất bại.'); }
});

els.logoutBtn?.addEventListener('click', () => signOut(auth));
els.refreshProductsBtn?.addEventListener('click', async () => { await loadProducts(); showToast('Đã làm mới'); });
els.btnRefreshAdminProducts?.addEventListener('click', async () => { await loadProducts(); showToast('Đã làm mới kho'); });
els.searchInput?.addEventListener('input', () => { state.searchTerm = els.searchInput.value; renderProducts(); });
els.chipsWrap?.addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]'); if (!b) return; state.gameFilter = b.dataset.filter;
  els.chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); b.classList.add('active'); renderProducts();
});

els.productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = { title: els.pTitle.value.trim(), game: els.pGame.value.trim(), description: els.pDescription.value.trim(), price: Number(els.pPrice.value), imageUrl: els.pImageUrl.value.trim(), imageUrls: splitImageUrls(els.pGalleryUrls.value), deliveryText: els.pDeliveryText.value.trim(), deliveryLogin: els.pDeliveryLogin.value.trim()||'—', deliveryPassword: els.pDeliveryPassword.value.trim()||'—', status: 'available', createdAt: serverTimestamp() };
  if (!payload.title || !payload.price) return showToast('Nhập thiếu thông tin', 'error');
  try {
    if (state.editProductId) { await updateDoc(doc(db, 'products', state.editProductId), payload); showToast('Cập nhật thành công'); state.editProductId = null; els.productSubmitBtn.textContent='Lưu Sản Phẩm'; els.cancelEditBtn.classList.add('hidden'); }
    else { await addDoc(collection(db, 'products'), payload); showToast('Đã thêm sản phẩm mới'); }
    els.productForm.reset(); await refreshAll();
  } catch (e) { showToast(e.message, 'error'); }
});
els.cancelEditBtn?.addEventListener('click', () => { state.editProductId = null; els.productForm.reset(); els.productSubmitBtn.textContent='Lưu Sản Phẩm'; els.cancelEditBtn.classList.add('hidden'); });

els.topupForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); const target = els.userSelect.value; const amt = Number(els.topupAmount.value);
  if (!target || !amt) return showToast('Nhập thiếu', 'error');
  try {
    const snap = await getDoc(doc(db, 'users', target));
    if (snap.exists()) {
      await updateDoc(doc(db, 'users', target), { balance: (snap.data().balance||0) + amt });
      els.topupAmount.value = ''; showToast('Đã cộng tiền thành công'); await refreshAll();
    }
  } catch (e) { showToast(e.message, 'error'); }
});

els.closeModalBtn?.addEventListener('click', closeModal);
els.copyReceiptBtn?.addEventListener('click', async () => {
  if (!state.lastReceipt) return;
  const t = `Sản phẩm: ${state.lastReceipt.title}\nBàn giao: ${state.lastReceipt.deliveryText}\nTài khoản: ${state.lastReceipt.deliveryLogin}\nMật khẩu: ${state.lastReceipt.deliveryPassword}`;
  await navigator.clipboard.writeText(t); showToast('Đã copy!');
});
els.receiptModal?.addEventListener('click', (e) => { if(e.target===els.receiptModal) closeModal(); });

els.showHistoryBtn?.addEventListener('click', () => { els.historyModal.classList.remove('hidden'); renderOrders(); });
els.closeHistoryBtn?.addEventListener('click', () => els.historyModal.classList.add('hidden'));
els.historyModal?.addEventListener('click', (e) => { if(e.target===els.historyModal) els.historyModal.classList.add('hidden'); });

els.tabCard?.addEventListener('click', () => { els.tabCard.classList.add('active'); els.tabBank.classList.remove('active'); els.cardTopupForm.classList.remove('hidden'); els.bankTopupForm.classList.add('hidden'); });
els.tabBank?.addEventListener('click', () => { els.tabBank.classList.add('active'); els.tabCard.classList.remove('active'); els.bankTopupForm.classList.remove('hidden'); els.cardTopupForm.classList.add('hidden'); });

els.cardTopupBtn?.addEventListener('click', async () => {
  if(!state.user) return; const amount = Number(els.cardAmount.value);
  if(!amount) return showToast('Vui lòng nhập đủ thông tin', 'error');
  setLoading(els.cardTopupBtn, true, 'Đang xử lý...');
  try {
    const fn = httpsCallable(functions, 'topupCard');
    const res = await fn({ provider: els.cardProvider.value, amount, code: els.cardCode.value, serial: els.cardSerial.value });
    if(res.data.success) { showToast(`Nạp thành công +${formatMoney(res.data.added)}`); await refreshAll(); } else showToast(res.data.message, 'error');
  } catch(e) { showToast('Lỗi API thẻ', 'error'); } finally { setLoading(els.cardTopupBtn, false); }
});

els.bankTopupBtn?.addEventListener('click', async () => {
  if(!state.user) return; const amount = Number(els.bankAmount.value); if(!amount) return;
  setLoading(els.bankTopupBtn, true, 'Xác nhận...');
  try {
    const newBal = state.profile.balance + amount;
    await updateDoc(doc(db, 'users', state.user.uid), { balance: newBal });
    await addDoc(collection(db, 'orders'), { userId: state.user.uid, title: '[NẠP NGÂN HÀNG]', game: 'MBBank', price: amount, deliveryText: 'Nạp auto', deliveryLogin: '—', deliveryPassword: '—', createdAt: serverTimestamp(), newBalance: newBal });
    showToast(`Nạp thành công +${formatMoney(amount)}`); els.bankAmount.value=''; await refreshAll();
  } catch(e) {} finally { setLoading(els.bankTopupBtn, false); }
});
els.copyTransferBtn?.addEventListener('click', () => { navigator.clipboard.writeText(els.transferContent.textContent); showToast('Đã copy nội dung CK'); });
els.userSearchInput?.addEventListener('input', () => { state.userSearchTerm = els.userSearchInput.value; renderUsers(); });
els.topupUserSearch?.addEventListener('input', () => {
  const term = els.topupUserSearch.value.toLowerCase().trim();
  const f = state.users.filter(u => `${u.username||''} ${u.id||''}`.toLowerCase().includes(term));
  if(els.userSelect) els.userSelect.innerHTML = f.map(u => `<option value="${u.id}">${u.username} · ${formatMoney(u.balance)}</option>`).join('');
});
els.closeTopupSuccessBtn?.addEventListener('click', closeTopupSuccessModal);

els.spinBtn?.addEventListener('click', async () => {
  if (!state.user || state.profile.balance < 20000) return showToast('Số dư không đủ 20k', 'error');
  const avail = state.products.filter(p => p.status === 'available'); if (!avail.length) return showToast('Hết phần thưởng', 'error');
  setLoading(els.spinBtn, true, 'Đang quay...');
  const newBal = state.profile.balance - 20000; await updateDoc(doc(db, 'users', state.user.uid), { balance: newBal });
  const isWin = Math.random() < 0.05; // 5% trúng
  const p = avail[Math.floor(Math.random() * avail.length)];
  els.wheel.style.transform = `rotate(${1440 + Math.random()*720}deg)`;
  
  setTimeout(async () => {
    els.wheel.style.transition = 'none'; els.wheel.style.transform = 'rotate(0deg)';
    setTimeout(() => { els.wheel.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)'; }, 50);
    if(isWin) {
      await updateDoc(doc(db, 'products', p.id), { status: 'sold' });
      const od = { userId: state.user.uid, title:`[TRÚNG] ${p.title}`, game:'Vòng Quay', price:20000, deliveryText:p.deliveryText, deliveryLogin:p.deliveryLogin, deliveryPassword:p.deliveryPassword, createdAt:serverTimestamp(), newBalance:newBal };
      await addDoc(collection(db, 'orders'), od); state.lastReceipt = od; renderReceipt(od); openModal(); showToast('Trúng rồi!', 'success');
    } else {
      await addDoc(collection(db, 'orders'), { userId: state.user.uid, title:'[TRƯỢT] Chúc may mắn', game:'Vòng Quay', price:20000, deliveryText:'—', deliveryLogin:'—', deliveryPassword:'—', createdAt:serverTimestamp(), newBalance:newBal });
      showToast('Chúc may mắn lần sau', 'error');
    }
    await refreshAll(); setLoading(els.spinBtn, false);
  }, 3000);
});

els.execCmdBtn?.addEventListener('click', () => { if(els.adminCmdInput.value) { processAdminCommand(els.adminCmdInput.value); els.adminCmdInput.value=''; } });
els.adminCmdInput?.addEventListener('keypress', (e) => { if(e.key==='Enter' && e.target.value) { e.preventDefault(); processAdminCommand(e.target.value); e.target.value=''; } });

onAuthStateChanged(auth, async (user) => {
  state.user = user; state.profile = null; state.products = []; state.orders = []; state.users = []; state.editProductId = null; state.userSearchTerm = '';
  if (state.profileUnsubscribe) { state.profileUnsubscribe(); state.profileUnsubscribe = null; }
  if (!user) return showAuth();
  state.profile = await loadProfile(user.uid);
  
  state.profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
    if (snap.exists()) {
      const newData = { id: snap.id, ...snap.data() };
      if (newData.banned) { showToast(`Tài khoản bị khóa: ${newData.banReason}`, 'error'); await signOut(auth); return; }
      if (state.profile && state.profile.balance !== undefined) {
        const diff = newData.balance - state.profile.balance;
        if (diff > 0) { els.topupSuccessText.innerHTML = `Bạn được cộng <strong class="text-green">${formatMoney(diff)}</strong><br>Số dư: <strong class="text-white">${formatMoney(newData.balance)}</strong>`; openTopupSuccessModal(); }
      }
      state.profile = newData;
      if (els.balanceValue) els.balanceValue.textContent = formatMoney(state.profile.balance);
      if (els.roleValue) els.roleValue.textContent = state.profile.role || 'user';
      if (els.statusPill) els.statusPill.textContent = `${state.profile.username} · ${state.profile.role}`;
      if (els.adminPanel) els.adminPanel.classList.toggle('hidden', state.profile.role !== 'admin');
    }
  });
  showApp(); await refreshAll();
});
showAuth();