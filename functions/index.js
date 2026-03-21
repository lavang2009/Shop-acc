const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function getUserProfile(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function requireAdmin(uid) {
  const profile = await getUserProfile(uid);
  if (!profile || profile.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Bạn không có quyền thực hiện thao tác này.');
  }
  return profile;
}

function cleanText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeImages(input) {
  if (Array.isArray(input)) {
    return input.map((x) => cleanText(x)).filter(Boolean);
  }
  return cleanText(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

exports.createProfileOnSignup = functions.auth.user().onCreate(async (user) => {
  const email = user.email || '';
  const username = (email.split('@')[0] || user.displayName || 'user').toLowerCase();

  await db.collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      username,
      email,
      balance: 100000,
      role: 'user',
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

exports.claimFirstAdmin = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }

  const adminSnap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (!adminSnap.empty) {
    return { message: 'Hệ thống đã có admin.' };
  }

  const ref = db.collection('users').doc(context.auth.uid);
  await ref.set({ role: 'admin' }, { merge: true });
  return { message: 'Bạn đã trở thành admin đầu tiên.' };
});

exports.purchaseProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }

  const productId = cleanText(data.productId);
  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu mã sản phẩm.');
  }

  const userRef = db.collection('users').doc(context.auth.uid);
  const productRef = db.collection('products').doc(productId);
  const orderRef = db.collection('orders').doc();

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const productSnap = await tx.get(productRef);

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Không tìm thấy hồ sơ người dùng.');
    }
    if (!productSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Không tìm thấy sản phẩm.');
    }

    const user = userSnap.data();
    const product = productSnap.data();

    if ((product.status || 'available') !== 'available') {
      throw new functions.https.HttpsError('failed-precondition', 'Sản phẩm đã được bán.');
    }

    const price = normalizeNumber(product.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Giá sản phẩm không hợp lệ.');
    }

    const balance = normalizeNumber(user.balance) || 0;
    if (balance < price) {
      throw new functions.https.HttpsError('failed-precondition', 'Số dư không đủ.');
    }

    const newBalance = balance - price;
    tx.update(userRef, { balance: newBalance });
    tx.update(productRef, {
      status: 'sold',
      soldAt: FieldValue.serverTimestamp(),
      soldBy: context.auth.uid,
    });

    const deliveryLogin = cleanText(product.accountLogin || product.deliveryLogin || product.username);
    const deliveryPassword = cleanText(product.accountPassword || product.deliveryPassword || product.password);
    const imageUrls = normalizeImages(product.imageUrls || product.galleryUrls);

    const orderData = {
      userId: context.auth.uid,
      productId: productRef.id,
      title: cleanText(product.title, 'Sản phẩm'),
      game: cleanText(product.game, '—'),
      price,
      imageUrl: cleanText(product.imageUrl || imageUrls[0] || ''),
      imageUrls,
      deliveryText: cleanText(product.deliveryText || 'Bàn giao ngay sau thanh toán'),
      deliveryLogin,
      deliveryPassword,
      createdAt: FieldValue.serverTimestamp(),
    };

    tx.set(orderRef, orderData);

    return {
      id: orderRef.id,
      ...orderData,
      createdAt: new Date().toISOString(),
      newBalance,
    };
  });

  return {
    message: 'Mua thành công.',
    order: result,
  };
});

exports.adminAddProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }
  await requireAdmin(context.auth.uid);

  const title = cleanText(data.title);
  const game = cleanText(data.game);
  const description = cleanText(data.description);
  const imageUrl = cleanText(data.imageUrl || data.image);
  const imageUrls = normalizeImages(data.imageUrls || data.galleryUrls);
  const deliveryText = cleanText(data.deliveryText || 'Bàn giao ngay sau thanh toán');
  const price = normalizeNumber(data.price);

  if (!title || !game || !Number.isFinite(price) || price < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu dữ liệu sản phẩm.');
  }

  const ref = await db.collection('products').add({
    title,
    game,
    description,
    price,
    imageUrl: imageUrl || imageUrls[0] || '',
    imageUrls,
    deliveryText,
    accountLogin: cleanText(data.accountLogin || data.deliveryLogin),
    accountPassword: cleanText(data.accountPassword || data.deliveryPassword),
    status: 'available',
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    message: 'Thêm sản phẩm thành công.',
    product: {
      id: ref.id,
      title,
      game,
      description,
      price,
      imageUrl: imageUrl || imageUrls[0] || '',
      imageUrls,
      deliveryText,
      status: 'available',
    },
  };
});

exports.adminDeleteProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }
  await requireAdmin(context.auth.uid);

  const productId = cleanText(data.productId);
  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu mã sản phẩm.');
  }

  const ref = db.collection('products').doc(productId);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Không tìm thấy sản phẩm.');
  }

  const product = snap.data();
  if ((product.status || 'available') !== 'available') {
    throw new functions.https.HttpsError('failed-precondition', 'Chỉ xóa được sản phẩm còn available.');
  }

  await ref.delete();
  return { message: 'Đã xóa sản phẩm.' };
});

exports.adminTopUpBalance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }
  await requireAdmin(context.auth.uid);

  const targetUid = cleanText(data.targetUid);
  const amount = normalizeNumber(data.amount);

  if (!targetUid || !Number.isFinite(amount) || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Dữ liệu cộng số dư không hợp lệ.');
  }

  const ref = db.collection('users').doc(targetUid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Không tìm thấy người dùng.');
  }

  await ref.update({ balance: FieldValue.increment(amount) });
  return { message: `Đã cộng ${amount.toLocaleString('vi-VN')} đ.` };
});

exports.adminSetRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }
  await requireAdmin(context.auth.uid);

  const targetUid = cleanText(data.targetUid);
  const role = cleanText(data.role, 'user');

  if (!targetUid || !['user', 'admin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Vai trò không hợp lệ.');
  }

  const ref = db.collection('users').doc(targetUid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Không tìm thấy người dùng.');
  }

  await ref.update({ role });
  return { message: `Đã cập nhật vai trò thành ${role}.` };
});

exports.seedDemoProducts = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập trước.');
  }
  await requireAdmin(context.auth.uid);

  const snap = await db.collection('products').limit(1).get();
  if (!snap.empty) {
    return { message: 'Đã có sản phẩm sẵn.' };
  }

  const samples = [
    {
      title: 'Free Fire VIP',
      game: 'Free Fire',
      description: 'Kho ảnh đẹp, giao hàng nhanh, thông tin rõ ràng.',
      price: 59000,
      imageUrl: 'https://images.unsplash.com/photo-1605902711622-cfb43c4437d1?auto=format&fit=crop&w=1200&q=80',
      imageUrls: [
        'https://images.unsplash.com/photo-1605902711622-cfb43c4437d1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      ],
      deliveryText: 'Bàn giao ngay sau thanh toán',
      accountLogin: 'ffvip01',
      accountPassword: 'ffpass01',
    },
    {
      title: 'Liên Quân S1',
      game: 'Liên Quân',
      description: 'Nhiều tướng, nhiều trang phục, giao dịch tự động.',
      price: 75000,
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      imageUrls: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      ],
      deliveryText: 'Giao ngay sau khi thanh toán',
      accountLogin: 'lqvip02',
      accountPassword: 'lqpass02',
    },
    {
      title: 'PUBG Elite',
      game: 'PUBG Mobile',
      description: 'Phong cách mạnh mẽ, có ảnh minh họa đẹp.',
      price: 69000,
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      imageUrls: [
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1200&q=80',
      ],
      deliveryText: 'Bàn giao ngay sau thanh toán',
      accountLogin: 'pubgvip03',
      accountPassword: 'pubgpass03',
    },
  ];

  const batch = db.batch();
  samples.forEach((item) => {
    const ref = db.collection('products').doc();
    batch.set(ref, {
      ...item,
      status: 'available',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  return { message: 'Đã tạo dữ liệu mẫu.' };
});

// ==================== NẠP THẺ THẬT QUA API THESIEURE ====================
exports.topupCard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Phải đăng nhập');
  }

  const provider = cleanText(data.provider);
  const amount = normalizeNumber(data.amount);
  const code = cleanText(data.code);
  const serial = cleanText(data.serial);

  if (!provider || !Number.isFinite(amount) || amount < 10000 || !code || !serial) {
    throw new functions.https.HttpsError('invalid-argument', 'Dữ liệu nạp thẻ không hợp lệ.');
  }

  const telcoMap = { Viettel: 'VT', Mobifone: 'MB', Vinaphone: 'VN' };
  const telco = telcoMap[provider];
  if (!telco) {
    throw new functions.https.HttpsError('invalid-argument', 'Nhà mạng không hợp lệ');
  }

  const partner_id = functions.config().thesieure.partner_id;
  const partner_key = functions.config().thesieure.partner_key;

  if (!partner_id || !partner_key) {
    throw new functions.https.HttpsError('internal', 'Chưa cấu hình Thesieure');
  }

  const sign = crypto.createHash('md5')
    .update(partner_id + 'sendcard' + telco + code + serial + amount + partner_key)
    .digest('hex');

  const payload = {
    partner_id,
    command: 'sendcard',
    telco,
    code,
    serial,
    amount,
    sign,
    request_id: Date.now().toString()
  };

  try {
    const response = await axios.post('https://thesieure.com/api/card', payload, { timeout: 15000 });
    const res = response.data;

    if (res.status === 1 || res.code === 1) {
      const realAmount = normalizeNumber(res.real_amount || amount);

      const userRef = db.collection('users').doc(context.auth.uid);
      const userSnap = await userRef.get();
      const current = normalizeNumber(userSnap.data().balance) || 0;

      await userRef.update({ balance: current + realAmount });

      const orderRef = db.collection('orders').doc();
      await orderRef.set({
        userId: context.auth.uid,
        title: `[NẠP THẺ] ${provider}`,
        game: 'Thẻ cào',
        price: realAmount,
        deliveryText: 'Nạp thành công qua Thesieure',
        deliveryLogin: '—',
        deliveryPassword: '—',
        createdAt: FieldValue.serverTimestamp(),
        newBalance: current + realAmount
      });

      return { success: true, added: realAmount, message: 'Nạp thành công' };
    } else {
      return { success: false, message: res.message || 'Thẻ không hợp lệ hoặc đã sử dụng' };
    }
  } catch (error) {
    console.error('Thesieure error:', error);
    return { success: false, message: 'Lỗi kết nối Thesieure' };
  }
});