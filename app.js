import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBNV2MzTq7-vHp92rqiQQqT5YbTX9CCQpo',
  authDomain: 'shopacc-1408e.firebaseapp.com',
  projectId: 'shopacc-1408e',
  storageBucket: 'shopacc-1408e.firebasestorage.app',
  messagingSenderId: '502620409879',
  appId: '1:502620409879:web:95cbfa5efae1ff6bf24c52',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const state = {
  user: null, profile: null, products: [], orders: [], users: [],
  searchTerm: '', gameFilter: 'all', editProductId: null, userSearchTerm: '', profileUnsubscribe: null,
  allOrders: [], allOrdersSearchTerm: '', isSpinning: false,
  cart: JSON.parse(localStorage.getItem('shopCart') || '[]') 
};

const el = (id) => document.getElementById(id);
const els = {
  authSection: el('authSection'), appSection: el('appSection'), authMessage: el('authMessage'),
  loginForm: el('loginForm'), registerForm: el('registerForm'), loginUsername: el('loginUsername'), loginPassword: el('loginPassword'),
  registerUsername: el('registerUsername'), registerPassword: el('registerPassword'), tabLogin: el('tabLogin'), tabRegister: el('tabRegister'),
  logoutBtn: el('logoutBtn'), statusPill: el('statusPill'), balanceValue: el('balanceValue'), roleValue: el('roleValue'), toast: el('toast'),
  profileAvatar: el('profileAvatar'), profileUsername: el('profileUsername'), profileEmail: el('profileEmail'), profileBalance: el('profileBalance'), profileRole: el('profileRole'), profileUid: el('profileUid'), profileLogoutBtn: el('profileLogoutBtn'),
  adminEntryZone: el('adminEntryZone'), welcomeModal: el('welcomeModal'), closeWelcomeBtn: el('closeWelcomeBtn'), hideWelcomeBtn: el('hideWelcomeBtn'),
  successModal: el('successModal'), successModalTitle: el('successModalTitle'), successModalBody: el('successModalBody'), closeSuccessModalBtn: el('closeSuccessModalBtn'),
  shopContainer: el('shopContainer'), searchInput: el('searchInput'), ordersList: el('ordersList'), wheelBox: el('wheelBox'), spinBtnImg: el('spinBtnImg'), 
  transferContent: el('transferContent'), copyTransferBtn: el('copyTransferBtn'), qrCodeImg: el('qrCodeImg'), adminPanel: el('adminPanel'), cmdLog: el('cmdLog'), 
  adminCmdInput: el('adminCmdInput'), execCmdBtn: el('execCmdBtn'), productForm: el('productForm'), pTitle: el('pTitle'), pGame: el('pGame'), 
  pDescription: el('pDescription'), pOriginalPrice: el('pOriginalPrice'), pPrice: el('pPrice'), pImageUrl: el('pImageUrl'), pGalleryUrls: el('pGalleryUrls'), 
  pDeliveryText: el('pDeliveryText'), pDeliveryLogin: el('pDeliveryLogin'), pDeliveryPassword: el('pDeliveryPassword'), productSubmitBtn: el('productSubmitBtn'), 
  cancelEditBtn: el('cancelEditBtn'), adminProductsTable: el('adminProductsTable'), btnRefreshAdminProducts: el('btnRefreshAdminProducts'),
  topupForm: el('topupForm'), userSelect: el('userSelect'), topupAmount: el('topupAmount'), usersTable: el('usersTable'), userSearchInput: el('userSearchInput'),
  allOrdersTable: el('allOrdersTable'), allOrdersSearchInput: el('allOrdersSearchInput'), topupLeaderboardList: el('topupLeaderboardList'),
  cartBadge: el('cartBadge'), cartModal: el('cartModal'), cartItemsList: el('cartItemsList'), cartTotal: el('cartTotal'), checkoutCartBtn: el('checkoutCartBtn'),
  productDetailModal: el('productDetailModal'), detailMainImg: el('detailMainImg'), detailThumbs: el('detailThumbs'), detailGame: el('detailGame'), detailTitle: el('detailTitle'),
  detailId: el('detailId'), detailPriceWrap: el('detailPriceWrap'), detailDesc: el('detailDesc'), detailAddToCart: el('detailAddToCart'), detailBuyNow: el('detailBuyNow')
};

let toastTimer = null;
window.showToast = function(message, type = 'success') {
  if (!els.toast) return; els.toast.textContent = message; els.toast.className = `toast ${type}`; els.toast.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2800);
};
window.copyText = function(text, msg) { navigator.clipboard.writeText(text).then(() => window.showToast(msg || 'Đã copy thành công!')).catch(() => window.showToast('Lỗi copy', 'error')); };
window.closeDetailModal = function() { els.productDetailModal?.classList.add('hidden'); };
window.openCartModal = function() { renderCartModal(); els.cartModal?.classList.remove('hidden'); };
window.closeCartModal = function() { els.cartModal?.classList.add('hidden'); };

function normalizeUsername(username) { return String(username || '').trim().toLowerCase(); }
function usernameToEmail(username) { return `${normalizeUsername(username)}@shopacc.local`; }
function formatMoney(value) { return `${Number(value || 0).toLocaleString('vi-VN')} đ`; }
function formatDate(value) { if (!value) return '—'; if (typeof value?.toDate === 'function') return value.toDate().toLocaleString('vi-VN'); return new Date(value?.seconds ? value.seconds * 1000 : value).toLocaleString('vi-VN'); }
function setAuthMessage(text, ok = false) { if (els.authMessage) { els.authMessage.textContent = text; els.authMessage.style.color = ok ? '#2de38b' : '#ff4757'; } }
function setLoading(button, loading, text) { if (!button) return; if (loading) { button.dataset.oldText = button.textContent; button.disabled = true; button.textContent = text || '...'; } else { button.disabled = false; button.textContent = button.dataset.oldText || button.textContent; } }
function getImageList(product) { if (Array.isArray(product.imageUrls) && product.imageUrls.length) return product.imageUrls.filter(Boolean); if (product.imageUrl) return [product.imageUrl]; return ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80']; }
function showSuccessModal(title, bodyHTML) { if (!els.successModal) return; const svgContainer = els.successModal.querySelector('.success-animation'); if (svgContainer) { const newSvg = svgContainer.innerHTML; svgContainer.innerHTML = newSvg; } els.successModalTitle.textContent = title; els.successModalBody.innerHTML = bodyHTML; els.successModal.classList.remove('hidden'); }
els.closeSuccessModalBtn?.addEventListener('click', () => els.successModal?.classList.add('hidden'));

if (els.welcomeModal) {
  const hideUntil = localStorage.getItem('hideWelcomeUntil');
  if (!hideUntil || Date.now() > parseInt(hideUntil)) els.welcomeModal.classList.remove('hidden');
  els.closeWelcomeBtn?.addEventListener('click', () => els.welcomeModal.classList.add('hidden'));
  els.hideWelcomeBtn?.addEventListener('click', () => { localStorage.setItem('hideWelcomeUntil', Date.now() + 2 * 60 * 60 * 1000); els.welcomeModal.classList.add('hidden'); });
}

window.updateCartUI = function() {
  if(els.cartBadge) {
    els.cartBadge.textContent = state.cart.length;
    els.cartBadge.style.display = state.cart.length > 0 ? 'block' : 'none';
  }
};
window.addToCart = function(id) {
  if (!state.user) return window.showToast('Vui lòng Đăng nhập để thêm vào giỏ.', 'error');
  const p = state.products.find(x => x.id === id);
  if(!p || p.status === 'sold') return window.showToast('Sản phẩm không tồn tại hoặc đã bán', 'error');
  if(state.cart.find(x => x.id === id)) return window.showToast('Sản phẩm đã có trong giỏ hàng', 'error');
  state.cart.push({ id: p.id, title: p.title, price: p.price, img: getImageList(p)[0] });
  localStorage.setItem('shopCart', JSON.stringify(state.cart));
  window.updateCartUI(); window.showToast('Đã thêm vào giỏ hàng!');
};
window.removeFromCart = function(id) {
  state.cart = state.cart.filter(x => x.id !== id);
  localStorage.setItem('shopCart', JSON.stringify(state.cart));
  window.updateCartUI(); renderCartModal();
};

function renderCartModal() {
  if (!els.cartItemsList) return;
  if (state.cart.length === 0) {
    els.cartItemsList.innerHTML = '<div class="text-center text-gray py-4">Giỏ hàng đang trống.</div>';
    if(els.cartTotal) els.cartTotal.textContent = '0 đ';
    if(els.checkoutCartBtn) els.checkoutCartBtn.disabled = true;
    return;
  }
  let total = 0;
  els.cartItemsList.innerHTML = state.cart.map(item => {
    total += item.price;
    return `<div class="cart-item"><img src="${item.img}" class="cart-item-img"><div class="cart-item-info"><div class="cart-item-title" title="${item.title}">${item.title}</div><div class="cart-item-price">${formatMoney(item.price)}</div></div><button class="btn-del-cart" onclick="removeFromCart('${item.id}')"><ion-icon name="trash-outline"></ion-icon></button></div>`;
  }).join('');
  if(els.cartTotal) els.cartTotal.textContent = formatMoney(total);
  if(els.checkoutCartBtn) els.checkoutCartBtn.disabled = false;
}

els.checkoutCartBtn?.addEventListener('click', async () => {
  if (!state.user) return window.showToast('Vui lòng Đăng nhập.', 'error');
  if (state.cart.length === 0) return window.showToast('Giỏ hàng trống', 'error');
  setLoading(els.checkoutCartBtn, true, 'Đang xử lý...');
  try {
    await refreshAll(); 
    let currentBalance = state.profile.balance;
    let totalCost = 0;
    for(const item of state.cart) {
       const pRef = doc(db, 'products', item.id);
       const pSnap = await getDoc(pRef);
       if(!pSnap.exists() || pSnap.data().status === 'sold') throw new Error(`Sản phẩm [${item.title}] đã bị mua trước. Vui lòng xóa khỏi giỏ.`);
       totalCost += pSnap.data().price;
    }
    if (currentBalance < totalCost) throw new Error('Số dư không đủ để thanh toán toàn bộ giỏ hàng.');
    
    const newBalance = currentBalance - totalCost;
    await updateDoc(doc(db, 'users', state.user.uid), { balance: newBalance });
    
    let receiptHtml = '';
    for(const item of state.cart) {
       const pRef = doc(db, 'products', item.id);
       const pSnap = await getDoc(pRef);
       await updateDoc(pRef, { status: 'sold' });
       const pData = pSnap.data();
       const od = { userId: state.user.uid, productId: item.id, title: pData.title, game: pData.game, price: pData.price, deliveryText: pData.deliveryText||'—', deliveryLogin: pData.deliveryLogin||'—', deliveryPassword: pData.deliveryPassword||'—', createdAt: serverTimestamp(), newBalance: newBalance };
       await addDoc(collection(db, 'orders'), od);
       receiptHtml += `<div style="border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 10px;"><div class="text-purple fw-bold mb-1" style="font-size:14px;">${od.title}</div><div class="receipt-item" style="padding:4px 0"><span>Tài khoản</span> <strong style="color:#2de38b">${od.deliveryLogin}</strong></div><div class="receipt-item" style="padding:4px 0"><span>Mật khẩu</span> <strong style="color:#ff4757">${od.deliveryPassword}</strong></div></div>`;
    }
    
    state.cart = []; localStorage.setItem('shopCart', JSON.stringify(state.cart));
    window.updateCartUI(); window.closeCartModal();
    showSuccessModal('THANH TOÁN GIỎ HÀNG THÀNH CÔNG!', receiptHtml);
    await refreshAll();
  } catch (e) { window.showToast(e.message, 'error'); } finally { setLoading(els.checkoutCartBtn, false); }
});

window.viewProductDetails = function(id) {
  const p = state.products.find(x => x.id === id);
  if(!p || !els.productDetailModal) return;
  
  const imgs = getImageList(p);
  els.detailMainImg.src = imgs[0];
  els.detailThumbs.innerHTML = imgs.map((src, idx) => `<img src="${src}" class="detail-thumb ${idx===0?'active':''}" onclick="changeDetailMainImg(this, '${src}')">`).join('');
  els.detailGame.textContent = p.game || 'Game Khác';
  els.detailTitle.textContent = p.title;
  els.detailId.textContent = p.id;
  
  let priceHtml = `<span class="price">${formatMoney(p.price)}</span>`;
  if (p.originalPrice && p.originalPrice > p.price) {
     const percent = Math.round((1 - (p.price / p.originalPrice)) * 100);
     priceHtml = `<div class="price-wrap" style="align-items:center;"><span class="old-price" style="font-size:16px;">${formatMoney(p.originalPrice)}</span><span class="price text-green">${formatMoney(p.price)}</span> <span style="background:var(--red); padding: 2px 6px; border-radius:6px; font-size:12px; font-weight:bold; margin-left:10px;">-${percent}%</span></div>`;
  }
  els.detailPriceWrap.innerHTML = priceHtml;
  els.detailDesc.innerHTML = (p.description || 'Chưa có mô tả').replace(/\n/g, '<br>');
  
  const sold = p.status === 'sold';
  els.detailAddToCart.style.display = sold ? 'none' : 'block';
  els.detailAddToCart.onclick = () => window.addToCart(p.id);
  els.detailBuyNow.className = `btn ${sold ? 'btn-disabled' : 'btn-glow'} flex-1`;
  els.detailBuyNow.textContent = sold ? 'ĐÃ BÁN' : 'MUA NGAY';
  els.detailBuyNow.disabled = sold;
  els.detailBuyNow.onclick = () => window.buySingleProduct(p.id, els.detailBuyNow);
  
  els.productDetailModal.classList.remove('hidden');
};

window.changeDetailMainImg = function(el, src) {
  els.detailMainImg.src = src;
  document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
};

window.buySingleProduct = async function(id, btnElement) {
  if (!state.user) return window.showToast('Vui lòng Đăng nhập.', 'error');
  setLoading(btnElement, true, 'Đang mua...');
  try {
    const pRef = doc(db, 'products', id); const pSnap = await getDoc(pRef);
    if (!pSnap.exists() || pSnap.data().status === 'sold') throw new Error('Sản phẩm đã bán hoặc không tồn tại.');
    if (state.profile.balance < pSnap.data().price) throw new Error('Số dư của bạn không đủ.');
    
    const newBalance = state.profile.balance - pSnap.data().price;
    await updateDoc(doc(db, 'users', state.user.uid), { balance: newBalance });
    await updateDoc(pRef, { status: 'sold' });
    const od = { userId: state.user.uid, productId: pSnap.id, title: pSnap.data().title, game: pSnap.data().game, price: pSnap.data().price, deliveryText: pSnap.data().deliveryText||'—', deliveryLogin: pSnap.data().deliveryLogin||'—', deliveryPassword: pSnap.data().deliveryPassword||'—', createdAt: serverTimestamp(), newBalance };
    await addDoc(collection(db, 'orders'), od);
    
    window.closeDetailModal();
    showSuccessModal('MUA HÀNG THÀNH CÔNG', `<div class="receipt-item"><span>Sản phẩm</span> <span class="text-purple">${od.title}</span></div><div class="receipt-item"><span>Ghi chú</span> <span>${od.deliveryText}</span></div><div class="receipt-item"><span>Tài khoản</span> <strong style="color:#2de38b; font-size:16px;">${od.deliveryLogin}</strong></div><div class="receipt-item"><span>Mật khẩu</span> <strong style="color:#ff4757; font-size:16px;">${od.deliveryPassword}</strong></div>`);
    await refreshAll();
  } catch (e) { window.showToast(e.message, 'error'); } finally { setLoading(btnElement, false); }
};

async function processAdminCommand(rawCmd) {
  if (!state.user || state.profile?.role !== 'admin') return;
  const parts = rawCmd.trim().split(' '); const cmd = parts[0].toLowerCase(); const args = parts.slice(1);
  const log = (msg, isError = false) => { if (els.cmdLog) { els.cmdLog.textContent = `> ${msg}`; els.cmdLog.style.color = isError ? '#ff4757' : '#2de38b'; } };
  try {
    switch (cmd) {
      case '/help': log('Lệnh: /setbal [uid], /addbal [uid], /giveall, /ban [uid], /unban [uid], /role [uid], /del_sold'); break;
      case '/setbal': await updateDoc(doc(db, 'users', args[0]), { balance: Number(args[1]) || 0 }); log(`Set số dư ${args[0]} thành ${formatMoney(args[1])}`); break;
      case '/addbal': const addAmt = Number(args[1]); const uRef = await getDoc(doc(db, 'users', args[0])); await updateDoc(doc(db, 'users', args[0]), { balance: (uRef.data().balance || 0) + addAmt }); log(`Cộng ${formatMoney(addAmt)} cho ${args[0]}`); break;
      case '/giveall': const amount = Number(args[0]); const allUsers = await getDocs(collection(db, 'users')); await Promise.all(allUsers.docs.map(u => updateDoc(u.ref, { balance: (u.data().balance || 0) + amount }))); log(`Tặng ${formatMoney(amount)} cho toàn Server.`); break;
      case '/ban': await updateDoc(doc(db, 'users', args[0]), { banned: true, banReason: args.slice(1).join(' ') || 'Vi phạm' }); log(`Đã BAN ${args[0]}`); break;
      case '/unban': await updateDoc(doc(db, 'users', args[0]), { banned: false, banReason: '' }); log(`Đã UNBAN ${args[0]}`); break;
      case '/role': await updateDoc(doc(db, 'users', args[0]), { role: args[1] }); log(`Set Role ${args[1]} cho ${args[0]}`); break;
      case '/del_sold': const sold = await getDocs(query(collection(db, 'products'), where('status', '==', 'sold'))); await Promise.all(sold.docs.map(d => deleteDoc(d.ref))); log(`Dọn dẹp ${sold.size} Acc rác.`); break;
      default: log('Lệnh không tồn tại.', true);
    }
    await loadUsers();
  } catch (error) { log(error.message, true); }
}

function renderProducts() {
  if (!els.shopContainer) return;
  let list = [...state.products];
  if (state.gameFilter !== 'all') list = list.filter(p => String(p.game || '').toLowerCase().includes(state.gameFilter.toLowerCase()));
  if (state.searchTerm) list = list.filter(p => `${p.title||''} ${p.game||''} ${p.description||''}`.toLowerCase().includes(state.searchTerm.toLowerCase()));
  
  if (!list.length) {
    els.shopContainer.innerHTML = '<div class="text-gray text-center w-100" style="padding: 40px">Chưa có sản phẩm nào cho mục này.</div>';
    return;
  }
  const grouped = list.reduce((acc, p) => { const game = p.game || 'Khác'; if (!acc[game]) acc[game] = []; acc[game].push(p); return acc; }, {});

  let html = '';
  for (const [game, prods] of Object.entries(grouped)) {
    html += `
      <div class="game-section">
        <div class="game-section-header"><h3>🎮 KHO NICK ${game}</h3></div>
        <div class="products-grid">
          ${prods.map(p => {
            const sold = p.status === 'sold';
            let priceHtml = `<span class="price">${formatMoney(p.price)}</span>`;
            let badgeHtml = '';
            if (p.originalPrice && p.originalPrice > p.price) {
               const percent = Math.round((1 - (p.price / p.originalPrice)) * 100);
               badgeHtml = `<div class="discount-badge">-${percent}%</div>`;
               priceHtml = `<div class="price-wrap"><span class="old-price">${formatMoney(p.originalPrice)}</span><span class="price text-green">${formatMoney(p.price)}</span></div>`;
            }
            return `
              <article class="product-card">
                <div class="card-img-wrap" onclick="window.viewProductDetails('${p.id}')">
                  ${badgeHtml}
                  <img class="product-img" src="${getImageList(p)[0]}" loading="lazy" />
                  <span class="status-badge ${sold ? 'sold' : 'ok'}">${sold ? 'Đã Bán' : 'Sẵn Sàng'}</span>
                </div>
                <div class="card-body">
                  <h3 class="product-title" onclick="window.viewProductDetails('${p.id}')" style="cursor:pointer;" title="${p.title}">${p.title}</h3>
                  <div class="product-id-text">Mã số: #${p.id.slice(-5)}</div>
                  <div class="price-row">${priceHtml}</div>
                  <div class="flex-row" style="gap: 10px; pointer-events:auto;">
                    <button class="btn btn-outline" style="flex:0.3; padding:12px 0;" onclick="window.addToCart('${p.id}')" ${sold ? 'disabled' : ''}>🛒</button>
                    <button class="btn ${sold ? 'btn-disabled' : 'btn-glow'}" style="flex:0.7;" onclick="window.buySingleProduct('${p.id}', this)" ${sold ? 'disabled' : ''}>${sold ? 'HẾT HÀNG' : 'MUA NGAY'}</button>
                  </div>
                </div>
              </article>`;
          }).join('')}
        </div>
      </div>
    `;
  }
  els.shopContainer.innerHTML = html;
}

function renderOrders() {
  if (!els.ordersList) return;
  if (!state.orders.length) return els.ordersList.innerHTML = '<div class="text-center text-gray py-4">Bạn chưa có giao dịch nào.</div>';
  els.ordersList.innerHTML = state.orders.map(o => `
    <div class="inner-box" style="padding:16px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <div><strong style="font-size:16px; display:block;">${o.title}</strong><span class="text-purple" style="font-size:13px">${o.game||'—'}</span></div>
        <div style="text-align:right"><div style="font-size:18px; font-weight:bold;">${o.title?.includes('Bơm Tiền') || o.title?.includes('NẠP') || o.title?.includes('TRÚNG') ? `<span class="text-green">+${formatMoney(o.price)}</span>` : `<span class="text-red">-${formatMoney(o.price)}</span>`}</div><div class="small text-gray">${formatDate(o.createdAt)}</div></div>
      </div>
      <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:12px; font-family:monospace; font-size:13px; display:grid; gap:8px;">
        <div style="display:flex; justify-content:space-between"><span class="text-gray">Nội dung/Tài khoản:</span> <strong style="color:#2de38b">${o.deliveryLogin || o.deliveryText || '—'}</strong></div>
        <div style="display:flex; justify-content:space-between"><span class="text-gray">Mật khẩu:</span> <strong style="color:#ff4757">${o.deliveryPassword || '—'}</strong></div>
      </div>
    </div>
  `).join('');
}

function renderAllOrders() {
  if (!els.allOrdersTable) return;
  let filtered = state.allOrders;
  const term = state.allOrdersSearchTerm.toLowerCase();
  if (term) {
    filtered = filtered.filter(o => {
       const u = state.users.find(x => x.id === o.userId);
       const uName = u ? u.username.toLowerCase() : '';
       return `${o.title||''} ${o.game||''} ${o.userId||''} ${uName}`.toLowerCase().includes(term);
    });
  }
  if (!filtered.length) return els.allOrdersTable.innerHTML = '<tr><td colspan=\"5\" class=\"text-center text-gray\">Không có giao dịch nào.</td></tr>';
  els.allOrdersTable.innerHTML = filtered.map(o => {
    const u = state.users.find(x => x.id === o.userId);
    const uName = u ? u.username : 'Unknown User';
    const isPlus = o.title?.includes('Bơm Tiền') || o.title?.includes('NẠP');
    const priceHtml = isPlus ? `<span class=\"text-green\">+${formatMoney(o.price)}</span>` : `<span class=\"text-red\">-${formatMoney(o.price)}</span>`;
    return `
      <tr>
        <td class=\"text-gray\" style=\"font-size: 13px; white-space: nowrap;\">${formatDate(o.createdAt)}</td>
        <td><strong style=\"font-size: 14px; color: var(--primary);\">${uName}</strong><br><span class=\"uid-text\" title=\"Copy UID\" onclick=\"window.copyText('${o.userId}', 'Đã copy UID: ${o.userId}')\">UID: ${o.userId.substring(0,8)}...</span></td>
        <td><strong style=\"font-size: 14px;\">${o.title}</strong><br><span class=\"text-purple\" style=\"font-size:12px\">${o.game||'—'}</span></td>
        <td style=\"font-size: 15px; font-weight: bold;\">${priceHtml}</td>
        <td style=\"font-size:12px; line-height: 1.6; max-width: 200px; overflow: hidden; text-overflow: ellipsis;\">TK: <span class=\"text-green\">${o.deliveryLogin||'—'}</span><br>MK: <span class=\"text-red\">${o.deliveryPassword||'—'}</span></td>
      </tr>`;
  }).join('');
}

function renderAdminProducts() {
  if (!els.adminProductsTable) return;
  if (!state.products.length) return els.adminProductsTable.innerHTML = '<tr><td colspan="6" class="text-center text-gray">Kho hàng trống.</td></tr>';
  els.adminProductsTable.innerHTML = state.products.map(p => {
    const mainImg = getImageList(p)[0]; const sold = p.status === 'sold';
    return `
      <tr>
        <td><img src="${mainImg}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid var(--border)"></td>
        <td><strong style="font-size:15px; display:block; margin-bottom:4px;">${p.title}</strong><span class="uid-text" onclick="window.copyText('${p.id}', 'Đã copy ID Sản Phẩm')">ID: ${p.id}</span></td>
        <td class="text-purple" style="font-weight:600">${p.game || '—'}</td>
        <td class="text-green" style="font-weight:bold">${formatMoney(p.price)} <br><span class="text-gray" style="font-size:11px; text-decoration:line-through">${p.originalPrice ? formatMoney(p.originalPrice) : ''}</span></td>
        <td><span class="pill ${sold ? 'pill-muted' : 'pill-admin'}" style="font-size:10px">${sold ? 'ĐÃ BÁN' : 'SẴN SÀNG'}</span></td>
        <td class="text-right"><button class="btn btn-outline btn-sm mb-1" data-edit="${p.id}">Sửa</button><br><button class="btn btn-sm" style="background:#ff4757; color:#fff" data-delete="${p.id}">Xóa</button></td>
      </tr>`;
  }).join('');
  
  els.adminProductsTable.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Xóa vĩnh viễn sản phẩm này?')) return;
    setLoading(b, true, '...'); try { await deleteDoc(doc(db, 'products', b.dataset.delete)); window.showToast('Đã xóa thành công'); await refreshAll(); } catch (e) { window.showToast(e.message, 'error'); } finally { setLoading(b, false); }
  }));
  els.adminProductsTable.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
    const p = state.products.find(x => x.id === b.dataset.edit); if (!p) return;
    state.editProductId = p.id; 
    els.pTitle.value = p.title || ''; els.pGame.value = p.game || ''; els.pDescription.value = p.description || '';
    if(els.pOriginalPrice) els.pOriginalPrice.value = p.originalPrice || '';
    els.pPrice.value = p.price || ''; els.pImageUrl.value = p.imageUrl || ''; els.pGalleryUrls.value = (p.imageUrls || []).join(', ');
    els.pDeliveryText.value = p.deliveryText || ''; els.pDeliveryLogin.value = p.deliveryLogin || ''; els.pDeliveryPassword.value = p.deliveryPassword || '';
    els.productSubmitBtn.textContent = 'Lưu Thay Đổi'; els.cancelEditBtn.classList.remove('hidden'); window.scrollTo({ top: els.productForm.offsetTop - 50, behavior: 'smooth' });
  }));
}

function renderUsers() {
  if (!els.usersTable && !els.userSelect) return;
  let filtered = state.users.filter(u => `${u.username||''} ${u.id||''} ${u.email||''}`.toLowerCase().includes(state.userSearchTerm.toLowerCase()));
  if (els.usersTable) {
    if (!filtered.length) {
      els.usersTable.innerHTML = '<tr><td colspan="5" class="text-center text-gray">Không tìm thấy user.</td></tr>';
    } else {
      els.usersTable.innerHTML = filtered.map(u => `
        <tr>
          <td><strong style="font-size:15px">${u.username || '—'}</strong>${u.banned ? '<span class="badge-pro" style="position:static; margin-left:8px; font-size:10px">BANNED</span>' : ''}<br><span class="uid-text" title="Click copy UID" onclick="window.copyText('${u.id}', 'Đã copy UID: ${u.id}')">UID: ${u.id} 📋</span></td>
          <td class="text-gray">${u.email || '—'}</td>
          <td class="text-green" style="font-weight:bold; font-size:16px">${formatMoney(u.balance)}</td>
          <td><span class="pill ${u.role==='admin' ? 'pill-admin' : 'pill-muted'}">${u.role || 'user'}</span></td>
          <td class="text-right"><button class="btn btn-outline btn-sm mb-2" data-role="toggle" data-uid="${u.id}">${u.role==='admin' ? 'Hạ Quyền User' : 'Nâng Cấp Admin'}</button><br><button class="btn btn-sm" style="background:#ff4757; color:#fff" data-reset="${u.id}">Reset Số dư 0đ</button></td>
        </tr>`).join('');
      els.usersTable.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', async () => {
        if(!confirm('Xác nhận đổi quyền?')) return;
        try { await updateDoc(doc(db, 'users', b.dataset.uid), { role: b.textContent.includes('Hạ') ? 'user' : 'admin' }); window.showToast('Cập nhật quyền thành công'); await refreshAll(); } catch (e) { window.showToast(e.message, 'error'); }
      }));
      els.usersTable.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Xóa sạch số dư user này về 0đ?')) return;
        try { await updateDoc(doc(db, 'users', b.dataset.reset), { balance: 0 }); window.showToast('Đã tịch thu số dư'); await refreshAll(); } catch (e) { window.showToast(e.message, 'error'); }
      }));
    }
  }
  if (els.userSelect) {
    if (!filtered.length) els.userSelect.innerHTML = '<option value="">Không tìm thấy ai...</option>';
    else els.userSelect.innerHTML = filtered.map(u => `<option value="${u.id}">Tên: ${u.username} | Mã: ${u.id.substring(0,8)}... | Dư: ${formatMoney(u.balance)}</option>`).join('');
  }
}

async function loadLeaderboard() {
  if (!els.topupLeaderboardList) return;
  try {
    const snap = await getDocs(collection(db, 'users'));
    let users = snap.docs.map(d => d.data());
    users = users.filter(u => u.role !== 'admin');
    const getVal = u => u.totalTopup || u.balance || 0;
    users.sort((a, b) => getVal(b) - getVal(a));
    const top100 = users.filter(u => getVal(u) > 0).slice(0, 100);
    
    if (!top100.length) {
      els.topupLeaderboardList.innerHTML = '<div class="text-center text-gray py-4">Chưa có người chơi nào nạp thẻ.</div>';
      return;
    }
    els.topupLeaderboardList.innerHTML = top100.map((u, i) => {
      let rank = `<span class="rank-number">${i+1}</span>`;
      if (i === 0) rank = `<span class="rank-medal" style="filter: drop-shadow(0 0 10px #FFD700);">🥇</span>`;
      if (i === 1) rank = `<span class="rank-medal" style="filter: drop-shadow(0 0 10px #C0C0C0);">🥈</span>`;
      if (i === 2) rank = `<span class="rank-medal" style="filter: drop-shadow(0 0 10px #CD7F32);">🥉</span>`;
      const isMe = state.user && state.user.uid === u.uid;
      const meStyle = isMe ? 'border: 1px solid var(--primary); background: rgba(110,141,255,0.1);' : '';
      return `
        <div class="leaderboard-item" style="${meStyle}">
          <div class="lb-left">
            ${rank}
            <img class="lb-avatar" src="https://ui-avatars.com/api/?name=${u.username || 'U'}&background=random&color=fff" />
            <div class="lb-info">
              <strong class="lb-name">${u.username} ${isMe ? '<span class="text-green text-sm">(Bạn)</span>' : ''}</strong>
              <span class="lb-role">${u.role === 'admin' ? 'Quản Trị Viên' : 'Thành viên'}</span>
            </div>
          </div>
          <div class="lb-right text-green fw-bold">${formatMoney(getVal(u))}</div>
        </div>`;
    }).join('');
  } catch (e) { console.log('Lỗi tải BXH:', e); }
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  const fallback = { uid, username: state.user?.email?.split('@')?.[0] || 'user', email: state.user?.email || `${uid}@shopacc.local`, balance: 0, totalTopup: 0, role: 'user', banned: false, createdAt: serverTimestamp() };
  await setDoc(doc(db, 'users', uid), fallback, { merge: true }); return fallback;
}
async function loadProducts() {
  const snap = await getDocs(collection(db, 'products')); state.products = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  renderProducts(); renderAdminProducts();
}
async function loadOrders() {
  if (!state.user) return; const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', state.user.uid)));
  state.orders = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); renderOrders();
}
async function loadUsers() {
  if (!state.profile || state.profile.role !== 'admin') return;
  const snap = await getDocs(collection(db, 'users')); state.users = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); renderUsers();
}
async function loadAllOrders() {
  if (!state.profile || state.profile.role !== 'admin') return;
  const snap = await getDocs(collection(db, 'orders'));
  state.allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  renderAllOrders();
}

async function refreshAll() {
  if (!state.user) return;
  const d = await loadProfile(state.user.uid);
  state.profile = d;
  
  if (els.balanceValue) els.balanceValue.textContent = formatMoney(d.balance);
  if (els.roleValue) els.roleValue.textContent = d.role || 'user';
  if (els.statusPill) els.statusPill.textContent = `${d.username || 'user'} · ${d.role || 'user'}`;
  if (els.adminPanel) els.adminPanel.classList.toggle('hidden', d.role !== 'admin');
  if (els.adminEntryZone) els.adminEntryZone.classList.toggle('hidden', d.role !== 'admin');
  if (els.profileUsername) els.profileUsername.textContent = d.username || 'Người dùng';
  if (els.profileEmail) els.profileEmail.textContent = d.email || 'Không có email';
  if (els.profileBalance) els.profileBalance.textContent = formatMoney(d.balance);
  if (els.profileRole) els.profileRole.textContent = (d.role || 'user').toUpperCase();
  if (els.profileUid) els.profileUid.textContent = d.id;
  if (els.transferContent) els.transferContent.textContent = d.id;
  if (els.qrCodeImg) {
    const encodedText = encodeURIComponent(d.id);
    els.qrCodeImg.src = `https://img.vietqr.io/image/MB-0333096434-compact2.png?amount=0&addInfo=${encodedText}&accountName=LAU%20A%20VANG`;
  }
  if (els.profileAvatar) els.profileAvatar.src = `https://ui-avatars.com/api/?name=${d.username || 'U'}&background=6e8dff&color=fff&size=100`;

  window.updateCartUI();

  await Promise.all([loadProducts(), loadOrders(), loadUsers(), loadLeaderboard()]);
  if (state.profile.role === 'admin') await loadAllOrders();
}

onAuthStateChanged(auth, async (user) => {
  state.user = user;
  const path = window.location.pathname;
  const isIndex = path.endsWith('/') || path.endsWith('index.html');
  const isAdminPage = path.includes('admin.html');
  
  if (state.profileUnsubscribe) { state.profileUnsubscribe(); state.profileUnsubscribe = null; }

  if (!user) {
    if (!isIndex) return window.location.href = 'index.html';
    els.authSection?.classList.remove('hidden'); els.appSection?.classList.add('hidden'); els.logoutBtn?.classList.add('hidden'); els.bottomNav?.classList.add('hidden');
    if(els.statusPill) els.statusPill.textContent = 'Chưa đăng nhập'; return;
  }

  if (isIndex) { els.authSection?.classList.add('hidden'); els.appSection?.classList.remove('hidden'); els.logoutBtn?.classList.remove('hidden'); els.bottomNav?.classList.remove('hidden'); }
  state.profile = await loadProfile(user.uid);

  const allUsersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
  if (allUsersSnap.empty) { await updateDoc(doc(db, 'users', user.uid), { role: 'admin' }); state.profile.role = 'admin'; }

  if (isAdminPage && state.profile.role !== 'admin') {
    window.showToast('Từ chối truy cập! Bạn không phải Quản Trị Viên.', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  state.profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
    if (snap.exists()) {
      const d = { id: snap.id, ...snap.data() };
      if (d.banned) { alert(`Tài khoản bị khóa: ${d.banReason}`); await signOut(auth); return; }
      
      if (state.profile && d.balance > state.profile.balance && !state.isSpinning) {
         const diff = d.balance - state.profile.balance;
         showSuccessModal('NẠP TIỀN THÀNH CÔNG', `<div class="receipt-item"><span>Số tiền cộng</span> <strong class="text-green">+${formatMoney(diff)}</strong></div><div class="receipt-item"><span>Số dư hiện tại</span> <strong class="text-white">${formatMoney(d.balance)}</strong></div>`);
         await loadOrders();
         await loadLeaderboard();
      }
      state.profile = d;
      
      if (isAdminPage && d.role !== 'admin') { window.location.href = 'index.html'; return; }
      if (els.balanceValue) els.balanceValue.textContent = formatMoney(d.balance);
      if (els.roleValue) els.roleValue.textContent = d.role || 'user';
      if (els.statusPill) els.statusPill.textContent = `${d.username} · ${d.role}`;
      if (els.adminPanel) els.adminPanel.classList.toggle('hidden', d.role !== 'admin');
      if (els.adminEntryZone) els.adminEntryZone.classList.toggle('hidden', d.role !== 'admin');
      if (els.profileBalance) els.profileBalance.textContent = formatMoney(d.balance);
      if (els.profileRole) els.profileRole.textContent = (d.role || 'user').toUpperCase();
    }
  });
  
  await refreshAll();
});

els.tabLogin?.addEventListener('click', () => { els.tabLogin.classList.add('active'); els.tabRegister.classList.remove('active'); els.loginForm.classList.remove('hidden'); els.registerForm.classList.add('hidden'); setAuthMessage(''); });
els.tabRegister?.addEventListener('click', () => { els.tabRegister.classList.add('active'); els.tabLogin.classList.remove('active'); els.registerForm.classList.remove('hidden'); els.loginForm.classList.add('hidden'); setAuthMessage(''); });

els.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); const u = els.loginUsername.value.trim(); const p = els.loginPassword.value;
  try { await signInWithEmailAndPassword(auth, usernameToEmail(u), p); setAuthMessage('Đăng nhập thành công.', true); } catch (e) { setAuthMessage('Sai tài khoản hoặc mật khẩu.'); }
});
els.registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); const u = normalizeUsername(els.registerUsername.value); const p = els.registerPassword.value;
  if (!u || p.length < 6) return setAuthMessage('Tên đăng nhập hợp lệ và Mật khẩu > 6 ký tự.');
  try {
    const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(u), p); await updateProfile(cred.user, { displayName: u });
    await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, username: u, email: usernameToEmail(u), balance: 0, totalTopup: 0, role: 'user', banned: false, createdAt: serverTimestamp() }, { merge: true });
    window.showToast('Tạo tài khoản thành công!');
  } catch (e) { setAuthMessage('Tài khoản đã tồn tại.'); }
});

els.logoutBtn?.addEventListener('click', () => signOut(auth));
els.profileLogoutBtn?.addEventListener('click', () => signOut(auth));

document.querySelectorAll('.cat-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    state.gameFilter = item.dataset.filter;
    renderProducts();
  });
});
els.searchInput?.addEventListener('input', () => { state.searchTerm = els.searchInput.value; renderProducts(); });

let currentRotation = 0;
els.spinBtnImg?.addEventListener('click', async () => {
  if (!state.user || state.profile.balance < 20000) return window.showToast('Số dư cần tối thiểu 20.000đ', 'error');
  if (els.spinBtnImg.style.pointerEvents === 'none') return;
  
  state.isSpinning = true; 
  els.spinBtnImg.style.pointerEvents = 'none';
  els.spinBtnImg.style.filter = 'brightness(0.7)';

  const cost = 20000;
  const initialBal = state.profile.balance;
  const balAfterCost = initialBal - cost;
  
  const rand = Math.random() * 100;
  let targetSlice = 0;
  let prizeName = '';
  let prizeValue = 0;

  if (rand <= 0.1) {
    prizeName = 'Chúc bạn may mắn lần sau';
    prizeValue = 0;
    targetSlice = Math.random() > 0.5 ? 0 : 180; 
  } else if (rand <= 10.1) {
    prizeName = '30.000 đ';
    prizeValue = 30000;
    targetSlice = Math.random() > 0.5 ? 135 : 315; 
  } else if (rand <= 60.1) {
    prizeName = '10.000 đ';
    prizeValue = 10000;
    targetSlice = Math.random() > 0.5 ? 90 : 270; 
  } else {
    prizeName = '20.000 đ';
    prizeValue = 20000;
    targetSlice = Math.random() > 0.5 ? 45 : 225; 
  }

  const offset = Math.floor(Math.random() * 20) - 10;
  const finalRotation = (360 * 5) + targetSlice + offset; 

  await updateDoc(doc(db, 'users', state.user.uid), { balance: balAfterCost });

  if(els.wheelBox) {
    els.wheelBox.style.transition = 'transform 4s cubic-bezier(0.15, 0.83, 0.25, 1)';
    els.wheelBox.style.transform = `rotate(${finalRotation}deg)`;
  }

  setTimeout(async () => {
    const finalBal = balAfterCost + prizeValue;
    
    if(prizeValue > 0) {
      const od = { userId: state.user.uid, title: `[TRÚNG THƯỞNG] ${prizeName}`, game: 'Vòng Quay Nhân Phẩm', price: prizeValue, deliveryText: 'Cộng trực tiếp vào số dư', deliveryLogin: '—', deliveryPassword: '—', createdAt: serverTimestamp(), newBalance: finalBal };
      await addDoc(collection(db, 'orders'), od);
      await updateDoc(doc(db, 'users', state.user.uid), { balance: finalBal });
      
      showSuccessModal('BẠN ĐÃ TRÚNG THƯỞNG!', `<div class="receipt-item"><span>Phần thưởng nhận được</span> <strong class="text-green">+${formatMoney(prizeValue)}</strong></div><div class="receipt-item"><span>Số dư hiện tại</span> <strong class="text-white">${formatMoney(finalBal)}</strong></div>`);
    } else {
      await addDoc(collection(db, 'orders'), { userId: state.user.uid, title: '[TRƯỢT] Vòng Quay', game: 'Vòng Quay', price: cost, deliveryText: '—', deliveryLogin: '—', deliveryPassword: '—', createdAt: serverTimestamp(), newBalance: balAfterCost });
      window.showToast('Tiếc quá! Chúc bạn may mắn lần sau', 'error');
    }
    
    setTimeout(() => {
      if(els.wheelBox) {
        els.wheelBox.style.transition = 'transform 1.5s ease-out';
        els.wheelBox.style.transform = 'rotate(0deg)';
      }
      setTimeout(() => {
        if(els.spinBtnImg) {
          els.spinBtnImg.style.pointerEvents = 'auto';
          els.spinBtnImg.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))';
        }
        state.isSpinning = false;
      }, 1500);
    }, 3000);
    
    await refreshAll();
  }, 4000);
});

els.btnRefreshAdminProducts?.addEventListener('click', async () => { await loadProducts(); window.showToast('Đã tải lại kho'); });
els.execCmdBtn?.addEventListener('click', () => { if(els.adminCmdInput.value) { processAdminCommand(els.adminCmdInput.value); els.adminCmdInput.value=''; } });
els.adminCmdInput?.addEventListener('keypress', (e) => { if(e.key==='Enter' && e.target.value) { e.preventDefault(); processAdminCommand(e.target.value); e.target.value=''; } });

els.userSearchInput?.addEventListener('input', () => { state.userSearchTerm = els.userSearchInput.value; renderUsers(); });
els.allOrdersSearchInput?.addEventListener('input', () => { state.allOrdersSearchTerm = els.allOrdersSearchInput.value; renderAllOrders(); });

els.productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  let originalPriceValue = 0;
  if(els.pOriginalPrice && els.pOriginalPrice.value) { originalPriceValue = Number(els.pOriginalPrice.value); }

  const pl = { title: els.pTitle.value.trim(), game: els.pGame.value.trim(), description: els.pDescription.value.trim(), price: Number(els.pPrice.value), originalPrice: originalPriceValue, imageUrl: els.pImageUrl.value.trim(), imageUrls: String(els.pGalleryUrls.value).split(',').map(s=>s.trim()).filter(Boolean), deliveryText: els.pDeliveryText.value.trim(), deliveryLogin: els.pDeliveryLogin.value.trim(), deliveryPassword: els.pDeliveryPassword.value.trim(), status: 'available', createdAt: serverTimestamp() };
  try {
    if (state.editProductId) { await updateDoc(doc(db, 'products', state.editProductId), pl); window.showToast('Cập nhật thành công'); state.editProductId = null; els.productSubmitBtn.textContent='Thêm Sản Phẩm Mới'; els.cancelEditBtn.classList.add('hidden'); }
    else { await addDoc(collection(db, 'products'), pl); window.showToast('Đã xuất bản sản phẩm mới'); }
    els.productForm.reset(); await refreshAll();
  } catch (e) { window.showToast(e.message, 'error'); }
});
els.cancelEditBtn?.addEventListener('click', () => { state.editProductId = null; els.productForm.reset(); els.productSubmitBtn.textContent='Thêm Sản Phẩm Mới'; els.cancelEditBtn.classList.add('hidden'); });

els.copyTransferBtn?.addEventListener('click', () => {
  const content = els.transferContent?.textContent;
  if (content && !content.includes('Đang tải') && !content.includes('undefined')) { window.copyText(content, 'Đã copy nội dung chuyển khoản!'); } 
  else { window.showToast('Mã nạp chưa sẵn sàng, vui lòng đợi!', 'error'); }
});

els.topupForm?.addEventListener('submit', async (e) => {
  e.preventDefault(); const uid = els.userSelect.value; const amt = Number(els.topupAmount.value);
  if (!uid || !amt) return window.showToast('Hãy nhập đủ số tiền và chọn Người cần nạp', 'error');
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) { 
      const newBal = (snap.data().balance||0) + amt;
      const newTotalTopup = (snap.data().totalTopup||0) + amt; 
      await updateDoc(doc(db, 'users', uid), { balance: newBal, totalTopup: newTotalTopup }); 
      
      await addDoc(collection(db, 'orders'), { userId: uid, title: '[HỆ THỐNG] Bơm Tiền', game: 'Admin Giao Dịch', price: amt, deliveryText: 'Admin nạp tiền vào tài khoản', deliveryLogin: '—', deliveryPassword: '—', createdAt: serverTimestamp(), newBalance: newBal });
      els.topupAmount.value = ''; 
      showSuccessModal('BƠM TIỀN THÀNH CÔNG', `<div class="receipt-item"><span>Người nhận</span> <strong class="text-white">${snap.data().username || uid}</strong></div><div class="receipt-item"><span>Số tiền nạp</span> <strong class="text-green">+${formatMoney(amt)}</strong></div>`);
      await refreshAll(); 
    }
  } catch (e) { window.showToast(e.message, 'error'); }
});