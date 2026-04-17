

const EXCHANGE_RATE = 83;
const DISCOUNT_PCT = 0.18;


const $ = id => document.getElementById(id);
const productList = $('productList');
const cartToggle = $('cartToggle');
const cartPanel = $('cartPanel');
const cartOverlay = $('cartOverlay');
const cartCount = $('cartCount');
const cartItemsEl = $('cartItems');
const cartTotal = $('cartTotal');
const cartSubtotal = $('cartSubtotal');
const cartDiscount = $('cartDiscount');
const cartItemCount = $('cartItemCount');
const cartItemCount2 = $('cartItemCount2');
const cartEmpty = $('cartEmpty');
const cartFooter = $('cartFooter');
const savingsInfo = $('savingsInfo');
const closeCartBtn = $('closeCart');
const clearCartBtn = $('clearCart');
const checkoutBtn = $('checkout');
const emptyState = $('emptyState');
const resultCount = $('resultCount');
const searchInput = $('searchInput');
const resetSearch = $('resetSearch');
const toast = $('toast');
const deliveryCharge = $('deliveryCharge');

let products = [];
let cart = JSON.parse(localStorage.getItem('gymcart') || '{}');
let wishlist = JSON.parse(localStorage.getItem('gymwish') || '[]');
let currentSort = 'default';
let currentSearch = '';
let toastTimer;


function inr(usd) { return (usd * EXCHANGE_RATE).toFixed(2); }
function mrp(usd) { return (usd * EXCHANGE_RATE / (1 - DISCOUNT_PCT)).toFixed(2); }
function discAmt(usd) { return ((usd * EXCHANGE_RATE / (1 - DISCOUNT_PCT)) - (usd * EXCHANGE_RATE)).toFixed(2); }
function discPct(usd) { return Math.round(DISCOUNT_PCT * 100); }

function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function stars(rating) {
  const cls = rating >= 4 ? 'green' : rating >= 3 ? 'mid' : 'low';
  return `<span class="fk-stars ${cls}">★ ${rating}</span>`;
}

function badgeForId(id) {
  const map = { 1: 'sale', 2: 'top', 3: 'sale', 4: 'new', 5: 'top', 6: 'sale', 7: 'hot', 8: 'new', 9: 'sale', 10: 'new', 11: 'hot', 12: 'top' };
  const labels = { hot: '🔥 HOT', sale: '💰 SALE', new: '✨ NEW', top: '⭐ TOP' };
  const type = map[id] || 'hot';
  return `<span class="fk-card-badge ${type}">${labels[type]}</span>`;
}

function getRating(id) {
  const ratings = { 1: 4.4, 2: 4.2, 3: 4.6, 4: 4.1, 5: 4.3, 6: 4.5, 7: 3.9, 8: 4.7, 9: 4.0, 10: 4.3, 11: 3.8, 12: 4.5 };
  return ratings[id] || 4.0;
}

function getReviews(id) {
  const r = { 1: 2341, 2: 892, 3: 1567, 4: 743, 5: 429, 6: 1233, 7: 318, 8: 671, 9: 2015, 10: 3421, 11: 1102, 12: 988 };
  return (r[id] || 500).toLocaleString('en-IN');
}


function loadProducts() {

  productList.innerHTML = Array(8).fill(0).map(() => skeletonCard()).join('');

  fetch('products.json')
    .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
    .then(data => { products = data; renderProducts(); updateCartUI(); })
    .catch(() => {
      products = fallbackProducts();
      renderProducts();
      updateCartUI();
    });
}

function skeletonCard() {
  return `<div class="fk-card" style="pointer-events:none">
    <div class="fk-card-img-wrap"><div class="fk-skeleton" style="width:100%;height:100%"></div></div>
    <div class="fk-card-body" style="gap:10px">
      <div class="fk-skeleton" style="height:16px;width:80%"></div>
      <div class="fk-skeleton" style="height:14px;width:50%"></div>
      <div class="fk-skeleton" style="height:20px;width:60%"></div>
      <div class="fk-skeleton" style="height:36px;width:100%;margin-top:8px"></div>
    </div>
  </div>`;
}


function getFilteredSorted() {
  let filtered = [...products];


  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
  }


  const selectedPrice = document.querySelector('input[name="price"]:checked')?.value || 'all';
  if (selectedPrice !== 'all') {
    const [lo, hi] = selectedPrice.split('-').map(Number);
    filtered = filtered.filter(p => {
      const price = p.price * EXCHANGE_RATE;
      return price >= lo && price <= hi;
    });
  }


  if (currentSort === 'low') filtered.sort((a, b) => a.price - b.price);
  if (currentSort === 'high') filtered.sort((a, b) => b.price - a.price);
  if (currentSort === 'rating') filtered.sort((a, b) => getRating(b.id) - getRating(a.id));

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredSorted();
  productList.innerHTML = '';

  if (resultCount) {
    resultCount.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
  }

  if (filtered.length === 0) {
    emptyState && (emptyState.style.display = 'block');
    return;
  }
  emptyState && (emptyState.style.display = 'none');

  filtered.forEach((p, idx) => {
    const priceINR = parseFloat(inr(p.price));
    const mrpINR = parseFloat(mrp(p.price));
    const pct = discPct(p.price);
    const rating = getRating(p.id);
    const reviews = getReviews(p.id);
    const wished = wishlist.includes(p.id);

    const card = document.createElement('article');
    card.className = 'fk-card';
    card.style.animationDelay = `${idx * 40}ms`;
    card.setAttribute('data-id', p.id);

    card.innerHTML = `
      ${badgeForId(p.id)}
      <button class="fk-wish-btn ${wished ? 'wishlisted' : ''}" data-wish="${p.id}" aria-label="Wishlist">♥</button>
      <div class="fk-card-img-wrap">
        <img class="fk-card-img" src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.src='https://placehold.co/400x300/f0f0f0/999?text=${encodeURIComponent(p.name)}'">
      </div>
      <div class="fk-card-body">
        <div class="fk-card-name">${p.name}</div>
        <div class="fk-card-rating">
          ${stars(rating)}
          <span class="fk-rating-count">(${reviews})</span>
        </div>
        <div class="fk-card-price-row">
          <span class="fk-card-price">₹${priceINR.toLocaleString('en-IN')}</span>
          <span class="fk-card-mrp">₹${mrpINR.toLocaleString('en-IN')}</span>
          <span class="fk-card-discount">${pct}% off</span>
        </div>
        <div class="fk-offer-tag">🏷️ Bank offer: Extra 5% off on SBI Cards</div>
        <div class="fk-card-actions">
          <button class="fk-btn-view" data-id="${p.id}">View Details</button>
          <button class="fk-btn-add" data-add="${p.id}">🛒 Add to Cart</button>
        </div>
      </div>
    `;

    productList.appendChild(card);
  });


  productList.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.getAttribute('data-add'));
      addToCart(id);

      const b = e.currentTarget;
      b.textContent = '✓ Added!';
      b.style.background = '#388e3c';
      setTimeout(() => { b.textContent = '🛒 Add to Cart'; b.style.background = ''; }, 1400);
    });
  });

  productList.querySelectorAll('[data-wish]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Number(e.currentTarget.getAttribute('data-wish'));
      toggleWishlist(id, e.currentTarget);
    });
  });
}


function toggleWishlist(id, btn) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    btn.classList.add('wishlisted');
    showToast('❤️ Added to Wishlist');
  } else {
    wishlist.splice(idx, 1);
    btn.classList.remove('wishlisted');
    showToast('💔 Removed from Wishlist');
  }
  localStorage.setItem('gymwish', JSON.stringify(wishlist));
}


function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
  openCart();
  showToast(`🛒 "${p.name}" added to cart!`);
}

function saveCart() { localStorage.setItem('gymcart', JSON.stringify(cart)); }

function cartItemsArray() {
  return Object.entries(cart).map(([id, qty]) => {
    const prod = products.find(p => p.id === Number(id)) || { name: 'Item', price: 0, image: '' };
    return { id: Number(id), qty, ...prod };
  });
}

function updateCartUI() {
  const items = cartItemsArray();
  cartItemsEl.innerHTML = '';

  let totalUSD = 0;
  let count = 0;

  items.forEach(it => {
    totalUSD += it.price * it.qty;
    count += it.qty;

    const li = document.createElement('li');
    li.className = 'fk-cart-item';
    li.innerHTML = `
      <img class="fk-ci-img" src="${it.image}" alt="${it.name}"
           onerror="this.src='https://placehold.co/64x64/f0f0f0/999?text=IMG'">
      <div class="fk-ci-info">
        <div class="fk-ci-name">${it.name}</div>
        <div class="fk-ci-price">₹${inr(it.price * it.qty)}</div>
        <div class="fk-ci-unit">₹${inr(it.price)} each</div>
        <div class="fk-qty-row">
          <button class="fk-qty-btn" data-dec="${it.id}" aria-label="Decrease">−</button>
          <span class="fk-qty-num">${it.qty}</span>
          <button class="fk-qty-btn" data-inc="${it.id}" aria-label="Increase">+</button>
          <button class="fk-ci-remove" data-del="${it.id}">Remove</button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(li);
  });


  cartItemsEl.querySelectorAll('[data-inc]').forEach(b =>
    b.addEventListener('click', e => {
      const id = Number(e.currentTarget.getAttribute('data-inc'));
      cart[id] = (cart[id] || 0) + 1;
      saveCart(); updateCartUI();
    })
  );
  cartItemsEl.querySelectorAll('[data-dec]').forEach(b =>
    b.addEventListener('click', e => {
      const id = Number(e.currentTarget.getAttribute('data-dec'));
      if (!cart[id]) return;
      cart[id]--;
      if (cart[id] <= 0) delete cart[id];
      saveCart(); updateCartUI();
    })
  );
  cartItemsEl.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', e => {
      const id = Number(e.currentTarget.getAttribute('data-del'));
      delete cart[id];
      saveCart(); updateCartUI();
      showToast('Item removed from cart');
    })
  );


  const totalINR = parseFloat(inr(totalUSD));
  const mrpTotalINR = parseFloat((totalINR / (1 - DISCOUNT_PCT)).toFixed(2));
  const discINR = (mrpTotalINR - totalINR).toFixed(2);
  const isFreeDelivery = totalINR >= 2999;

  if (cartCount) cartCount.textContent = count;
  if (cartItemCount) cartItemCount.textContent = count > 0 ? `(${count})` : '';
  if (cartItemCount2) cartItemCount2.textContent = count;
  if (cartSubtotal) cartSubtotal.textContent = mrpTotalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (cartDiscount) cartDiscount.textContent = parseFloat(discINR).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (cartTotal) cartTotal.textContent = totalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (deliveryCharge) deliveryCharge.textContent = isFreeDelivery ? 'FREE' : '₹99';

  if (savingsInfo) {
    if (count > 0) {
      savingsInfo.style.display = 'block';
      savingsInfo.textContent = `🎉 You save ₹${parseFloat(discINR).toLocaleString('en-IN', { minimumFractionDigits: 2 })} on this order!`;
    } else {
      savingsInfo.style.display = 'none';
    }
  }


  if (cartEmpty) cartEmpty.style.display = count === 0 ? 'flex' : 'none';
  if (cartFooter) cartFooter.style.display = count === 0 ? 'none' : 'block';
}


function openCart() {
  cartPanel.classList.add('open');
  cartPanel.setAttribute('aria-hidden', 'false');
  cartOverlay && cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartPanel.setAttribute('aria-hidden', 'true');
  cartOverlay && cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

cartToggle && cartToggle.addEventListener('click', openCart);
closeCartBtn && closeCartBtn.addEventListener('click', closeCart);
cartOverlay && cartOverlay.addEventListener('click', closeCart);

clearCartBtn && clearCartBtn.addEventListener('click', () => {
  if (!Object.keys(cart).length) return;
  cart = {};
  saveCart();
  updateCartUI();
  showToast('Cart cleared');
});


checkoutBtn && checkoutBtn.addEventListener('click', () => {
  if (!Object.keys(cart).length) { showToast('Your cart is empty!'); return; }

  const modal = $('checkoutModal');
  const totEl = $('checkoutTotal');
  const summaryEl = $('modalOrderSummary');

  if (totEl) totEl.textContent = cartTotal?.textContent || '0';

  if (summaryEl) {
    const items = cartItemsArray();
    summaryEl.innerHTML = `<strong>Order Summary (${items.length} items)</strong><br>` +
      items.map(it => `${it.name} × ${it.qty} — ₹${inr(it.price * it.qty)}`).join('<br>');
  }

  modal?.setAttribute('aria-hidden', 'false');
  closeCart();
});

$('closeCheckout') && $('closeCheckout').addEventListener('click', () => {
  $('checkoutModal')?.setAttribute('aria-hidden', 'true');
});

$('checkoutForm') && $('checkoutForm').addEventListener('submit', async e => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const ogText = submitBtn.textContent;
  submitBtn.textContent = 'Processing...';
  submitBtn.disabled = true;

  try {
    const rawTotal = cartTotal?.textContent?.replace(/[^0-9.]/g, '') || '0';
    const totalINR = parseFloat(rawTotal) || 0;


    let subtotal = 0;
    const items = cartItemsArray().map(i => {
      const lineTotal = i.price * i.qty;
      subtotal += lineTotal;
      return {
        productId: i.id,
        name: i.name,
        priceINR: i.price,
        quantity: i.qty,
        image: i.image,
        subtotalINR: lineTotal
      };
    });

    const orderData = {
      customerName: $('fname')?.value || 'Guest',
      customerEmail: '',
      customerPhone: $('fphone')?.value || '',
      shippingAddress: $('faddress')?.value || 'N/A',
      city: $('fcity')?.value || '',
      pinCode: $('fpin')?.value || '',
      items,
      subtotalINR: subtotal,
      discountINR: Math.max(0, subtotal - totalINR),
      deliveryINR: 0,
      totalINR: totalINR,
      paymentMethod: $('fpayment')?.value || 'upi'
    };

    const res = typeof apiPlaceOrder === 'function'
      ? await apiPlaceOrder(orderData)
      : { success: true, message: 'Simulated Order Success (API not found)' };

    $('checkoutModal')?.setAttribute('aria-hidden', 'true');
    showToast(res.message || '🎉 Order placed successfully!');
    cart = {};
    saveCart();
    updateCartUI();
    e.target.reset();
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  } finally {
    submitBtn.textContent = ogText;
    submitBtn.disabled = false;
  }
});


$('checkoutModal')?.addEventListener('click', e => {
  if (e.target === $('checkoutModal')) $('checkoutModal').setAttribute('aria-hidden', 'true');
});

document.querySelectorAll('.fk-sort-opt').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.fk-sort-opt').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentSort = e.currentTarget.getAttribute('data-sort');
    renderProducts();
  });
});


function handleSearch() {
  currentSearch = searchInput?.value || '';
  renderProducts();
}

searchInput?.addEventListener('input', handleSearch);
$('searchBtn')?.addEventListener('click', handleSearch);
searchInput?.addEventListener('keydown', e => e.key === 'Enter' && handleSearch());


document.querySelectorAll('input[name="price"]').forEach(r =>
  r.addEventListener('change', renderProducts)
);
document.querySelectorAll('input[name="rating"]').forEach(r =>
  r.addEventListener('change', renderProducts)
);

$('clearFilters')?.addEventListener('click', () => {
  document.querySelector('input[name="price"][value="all"]').checked = true;
  document.querySelector('input[name="rating"][value="all"]').checked = true;
  document.querySelectorAll('.fk-filter-option input[type="checkbox"]').forEach(c => c.checked = false);
  currentSearch = '';
  if (searchInput) searchInput.value = '';
  renderProducts();
});

resetSearch?.addEventListener('click', () => {
  $('clearFilters')?.click();
});


document.querySelectorAll('.fk-cat-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.fk-cat-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const cat = link.getAttribute('data-cat');


    const catMap = {
      all: '',
      dumbbells: 'dumbbell',
      barbells: 'barbell',
      machines: 'machine',
      benches: 'bench',
      accessories: 'kettlebell mat roller band'
    };
    currentSearch = catMap[cat] || '';
    if (searchInput) searchInput.value = cat === 'accessories' ? '' : currentSearch;


    if (cat === 'accessories') {
      const keywords = ['kettlebell', 'mat', 'roller', 'band', 'wheel'];
      const origFilter = getFilteredSorted;

      const filtered = products.filter(p =>
        keywords.some(k => p.name.toLowerCase().includes(k))
      );
      productList.innerHTML = '';
      emptyState && (emptyState.style.display = filtered.length === 0 ? 'block' : 'none');
      if (resultCount) resultCount.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
      filtered.forEach((p, idx) => {

        currentSearch = p.name.split(' ')[0];
      });
      currentSearch = 'kettlebell';

      currentSearch = '';
      renderProducts();
      currentSearch = '';
      return;
    }

    renderProducts();
  });
});


function fallbackProducts() {
  return [
    { id: 1, name: 'Adjustable Dumbbells', price: 89.99, image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 2, name: 'Motorized Treadmill', price: 599.00, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 3, name: 'Olympic Barbell Set', price: 149.50, image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 4, name: 'Adjustable Weight Bench', price: 199.00, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 5, name: 'Magnetic Rowing Machine', price: 399.00, image: 'https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 6, name: 'Weight Plates Set 50kg', price: 129.00, image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 7, name: 'Multi-Function Cable Machine', price: 489.00, image: 'https://images.unsplash.com/photo-1637666062717-1c6bcfa4a4df?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 8, name: 'Power Squat Rack', price: 359.99, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 9, name: 'Cast Iron Kettlebell 24kg', price: 54.99, image: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 10, name: 'Resistance Bands Set', price: 34.99, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 11, name: 'Ab Wheel Roller', price: 29.99, image: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=500&h=400&fit=crop&auto=format&q=80' },
    { id: 12, name: 'Premium Yoga Mat', price: 44.99, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=400&fit=crop&auto=format&q=80' }
  ];
}


loadProducts();