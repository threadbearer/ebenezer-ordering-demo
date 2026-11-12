// ==========================================================================
// Restaurante Salvadoreño Ebenezer — Direct Online Ordering System Logic
// ==========================================================================

(function() {
  'use strict';

  // --- STATE ---
  let currentLang = localStorage.getItem('ebenezer_lang') || 'es';
  let cart = JSON.parse(localStorage.getItem('ebenezer_cart') || '[]');
  let activeCategory = 'all';
  let activePupusaItem = null;

  // Constants
  const TAX_RATE = 0.095; // 9.5% Los Angeles County sales tax
  const RESTAURANT_PHONE = '17472453571'; // (747) 245-3571

  // Text Dictionaries
  const I18N = {
    es: {
      topBannerBadge: "Sitio Oficial",
      topBannerText: "¡Ordene Directo y Ahorre! Precios originales de tienda sin tarifas de intermediarios ($0 Comisiones a Terceros).",
      btnLang: "English",
      btnCall: "Llamar",
      cartBtnText: "Mi Pedido",
      heroTag: "Auténtico Sabor Salvadoreño • Northridge, CA",
      heroTitle: "Pupusas Artesanales y Tradición Salvadoreña",
      heroDesc: "Hechas a mano al momento con masa fresca de maíz o arroz. Precios justos de tienda sin sobreprecios ni comisiones abusivas.",
      heroMetaLocation: "8672 Lindley Ave, Northridge, CA",
      heroMetaHours: "Abierto Hoy: 6:00 AM – 8:00 PM",
      heroMetaRating: "4.3★ en Google (350+ Reseñas)",
      heroBtnOrder: "Pedir para Recoger",
      heroBtnCall: "Llamar al Restaurante",
      value1Title: "Precios Reales de Tienda",
      value1Desc: "Pupusas a $3.75 (Ahorre $2.40 por pupusa)",
      value2Title: "0% Comisiones a Terceros",
      value2Desc: "100% de apoyo directo a negocio familiar",
      value3Title: "Recogida Rápida (Pickup)",
      value3Desc: "Listo en 20-25 mins • Calientito en mostrador",
      catAll: "Todos los Platillos",
      searchPlaceholder: "Buscar pupusas, caldos, tamales...",
      addToCart: "+ Ordenar",
      customizePupusa: "Personalizar Pupusa",
      cartTitle: "Su Pedido para Recoger",
      cartEmptyTitle: "Su carrito está vacío",
      cartEmptyDesc: "Agregue sus pupusas y platillos favoritos para comenzar su pedido.",
      savingsCallout: "¡Usted está ahorrando ",
      savingsCalloutEnd: " ordenando directo hoy!",
      summarySubtotal: "Subtotal",
      summaryTax: "Impuestos Locales (9.5%)",
      summaryFees: "Tarifa de Servicio a Terceros",
      summaryFeesValue: "$0.00 (Gratis)",
      summaryTotal: "Total a Pagar",
      btnProceedCheckout: "Continuar con el Pedido",
      btnWhatsAppOrder: "Enviar Pedido por WhatsApp",
      modalPupusaTitle: "Personalice su Pupusa",
      doughTitle: "Seleccione su Masa:",
      doughCorn: "Maíz Tradicional",
      doughRice: "Harina de Arroz (+ $0.50)",
      extrasTitle: "Acompañamientos y Extras:",
      extraCurtido: "Curtido Artesanal Extra",
      extraSalsaRoja: "Salsa de Tomate Casera Extra",
      extraSalsaPicante: "Salsa Picante Roja",
      cookingStyleTitle: "Punto de Cocción:",
      cookingNormal: "Normal / Suave",
      cookingWellDone: "Bien Doradita / Tostadita",
      notesPlaceholder: "Instrucciones especiales para la cocina...",
      btnAddModal: "Agregar al Carrito",
      checkoutModalTitle: "Detalles para Recoger (Pickup)",
      nameLabel: "Nombre y Apellido:",
      namePlaceholder: "Ej. Carlos Martínez",
      phoneLabel: "Teléfono Móvil (para aviso por SMS/WhatsApp):",
      phonePlaceholder: "Ej. (818) 555-0192",
      pickupTimeLabel: "Hora de Recogida:",
      pickupAsap: "Lo antes posible (20-25 minutos)",
      pickup30: "En 35-40 minutos",
      pickup60: "En 60 minutos",
      paymentMethodLabel: "Método de Pago:",
      payAtStore: "Pagar al Recoger (Efectivo o Tarjeta en Tienda)",
      payCardOnline: "Tarjeta de Crédito / Débito / Apple Pay (Stripe)",
      btnConfirmOrder: "Confirmar Pedido para Recoger",
      orderSuccessTitle: "¡Pedido Recibido con Éxito!",
      orderNumberLabel: "Número de Pedido:",
      orderPrepMessage: "Su orden fue enviada por SMS al restaurante y sincronizada con la cocina / Clover POS en 8672 Lindley Ave, Northridge.",
      btnCallStoreConfirm: "Llamar al Restaurante",
      btnDirections: "Ver Ruta en Google Maps",
      btnClose: "Cerrar"
    },
    en: {
      topBannerBadge: "Official Site",
      topBannerText: "Order Direct & Save! Real in-store prices with zero middleman markups ($0 Third-Party Fees).",
      btnLang: "Español",
      btnCall: "Call Us",
      cartBtnText: "My Order",
      heroTag: "Authentic Salvadoran Cuisine • Northridge, CA",
      heroTitle: "Handcrafted Pupusas & Salvadoran Tradition",
      heroDesc: "Made fresh to order with handmade corn or rice flour dough. Fair in-store prices with zero parasitic markups.",
      heroMetaLocation: "8672 Lindley Ave, Northridge, CA",
      heroMetaHours: "Open Today: 6:00 AM – 8:00 PM",
      heroMetaRating: "4.3★ on Google (350+ Reviews)",
      heroBtnOrder: "Order for Pickup",
      heroBtnCall: "Call Restaurant",
      value1Title: "Real In-Store Prices",
      value1Desc: "Pupusas from $3.75 (Save $2.40 per pupusa)",
      value2Title: "0% Third-Party Fees",
      value2Desc: "100% direct support to local family kitchen",
      value3Title: "Quick Curbside / Pickup",
      value3Desc: "Ready in 20-25 mins • Steaming hot at counter",
      catAll: "All Dishes",
      searchPlaceholder: "Search pupusas, soups, tamales...",
      addToCart: "+ Order",
      customizePupusa: "Customize Pupusa",
      cartTitle: "Your Pickup Order",
      cartEmptyTitle: "Your cart is empty",
      cartEmptyDesc: "Add your favorite pupusas and Salvadoran specialties to start.",
      savingsCallout: "You are saving ",
      savingsCalloutEnd: " ordering direct today!",
      summarySubtotal: "Subtotal",
      summaryTax: "Local Sales Tax (9.5%)",
      summaryFees: "Third-Party Platform Fee",
      summaryFeesValue: "$0.00 (Free)",
      summaryTotal: "Total Due",
      btnProceedCheckout: "Proceed to Pickup Details",
      btnWhatsAppOrder: "Send Order via WhatsApp",
      modalPupusaTitle: "Customize Your Pupusa",
      doughTitle: "Select Dough:",
      doughCorn: "Traditional Corn Masa",
      doughRice: "Rice Flour Masa (+ $0.50)",
      extrasTitle: "Sides & Extras:",
      extraCurtido: "Extra Artisanal Curtido Slaw",
      extraSalsaRoja: "Extra Homestyle Tomato Sauce",
      extraSalsaPicante: "Spicy Red Salsa",
      cookingStyleTitle: "Griddle Style:",
      cookingNormal: "Classic / Tender",
      cookingWellDone: "Well Done / Crispy Brown",
      notesPlaceholder: "Special instructions for the kitchen...",
      btnAddModal: "Add to Order",
      checkoutModalTitle: "Pickup & Customer Details",
      nameLabel: "Full Name:",
      namePlaceholder: "e.g. Carlos Martinez",
      phoneLabel: "Mobile Phone (for SMS/WhatsApp update):",
      phonePlaceholder: "e.g. (818) 555-0192",
      pickupTimeLabel: "Pickup Time:",
      pickupAsap: "As soon as possible (20-25 minutes)",
      pickup30: "In 35-40 minutes",
      pickup60: "In 60 minutes",
      paymentMethodLabel: "Payment Method:",
      payAtStore: "Pay at Pickup (Cash or Card in Store)",
      payCardOnline: "Credit / Debit Card / Apple Pay (Stripe)",
      btnConfirmOrder: "Confirm Pickup Order",
      orderSuccessTitle: "Order Placed Successfully!",
      orderNumberLabel: "Order Number:",
      orderPrepMessage: "Your order was sent via SMS to the restaurant and synced with the Clover kitchen system at 8672 Lindley Ave, Northridge.",
      btnCallStoreConfirm: "Call Restaurant",
      btnDirections: "Get Directions on Google Maps",
      btnClose: "Close"
    }
  };

  function t(key) {
    return I18N[currentLang][key] || key;
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    renderCategories();
    renderMenu();
    updateCartUI();
    setupEventListeners();
  });

  // --- LANGUAGE SWITCHER ---
  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        el.textContent = I18N[currentLang][key];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (I18N[currentLang][key]) {
        el.setAttribute('placeholder', I18N[currentLang][key]);
      }
    });

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.innerHTML = `🌐 ${t('btnLang')}`;
    }
  }

  window.toggleLanguage = function() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    localStorage.setItem('ebenezer_lang', currentLang);
    applyLanguage();
    renderCategories();
    renderMenu();
    updateCartUI();
  };

  // --- RENDER CATEGORIES ---
  function renderCategories() {
    const nav = document.getElementById('categoriesNav');
    if (!nav || !window.EBENEZER_CATALOG) return;

    let html = `
      <button class="cat-pill ${activeCategory === 'all' ? 'active' : ''}" onclick="filterCategory('all')">
        🍽️ ${t('catAll')}
      </button>
    `;

    window.EBENEZER_CATALOG.forEach(cat => {
      const name = currentLang === 'es' ? cat.name_es : cat.name_en;
      const isActive = activeCategory === cat.id ? 'active' : '';
      html += `
        <button class="cat-pill ${isActive}" onclick="filterCategory('${cat.id}')">
          ${cat.icon} ${name}
        </button>
      `;
    });

    nav.innerHTML = html;
  }

  window.filterCategory = function(catId) {
    activeCategory = catId;
    renderCategories();
    renderMenu();

    if (catId !== 'all') {
      const target = document.getElementById(`cat-${catId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // --- RENDER MENU ---
  function renderMenu() {
    const container = document.getElementById('menuCatalogContainer');
    if (!container || !window.EBENEZER_CATALOG) return;

    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

    let html = '';
    window.EBENEZER_CATALOG.forEach(cat => {
      if (activeCategory !== 'all' && activeCategory !== cat.id) return;

      const catName = currentLang === 'es' ? cat.name_es : cat.name_en;

      // Filter items
      const items = cat.items.filter(it => {
        const name = (currentLang === 'es' ? it.name_es : it.name_en).toLowerCase();
        const desc = (currentLang === 'es' ? it.description_es : it.description_en).toLowerCase();
        return name.includes(searchTerm) || desc.includes(searchTerm);
      });

      if (items.length === 0) return;

      html += `
        <section class="category-section" id="cat-${cat.id}">
          <div class="category-header">
            <h2 class="category-title">${cat.icon} ${catName}</h2>
            <span class="category-count">(${items.length} ${currentLang === 'es' ? 'platillos' : 'items'})</span>
          </div>
          <div class="items-grid">
      `;

      items.forEach(it => {
        const name = currentLang === 'es' ? it.name_es : it.name_en;
        const desc = currentLang === 'es' ? it.description_es : it.description_en;
        const savingsBadge = it.savings > 1.5 
          ? `<div class="item-badge-top">${currentLang === 'es' ? `Ahorras $${it.savings.toFixed(2)}` : `Save $${it.savings.toFixed(2)}`}</div>`
          : '';

        const pupusaTag = it.is_pupusa 
          ? `<span class="pupusa-tag">🌽 ${currentLang === 'es' ? 'Hecha a mano' : 'Handmade'}</span>`
          : '';

        const actionBtn = it.is_pupusa
          ? `<button class="btn-add" onclick="openPupusaModal(${it.id})">🫓 ${t('customizePupusa')}</button>`
          : `<button class="btn-add" onclick="quickAddItem(${it.id})">${t('addToCart')}</button>`;

        html += `
          <div class="item-card ${it.is_pupusa ? 'highlight' : ''}">
            ${savingsBadge}
            <div class="item-main">
              <div class="item-header">
                <h3 class="item-name">${name}</h3>
              </div>
              <p class="item-desc">${desc}</p>
              <div class="item-pricing">
                <span class="price-current">$${it.price.toFixed(2)}</span>
                ${it.old_price > it.price ? `<span class="price-old">$${it.old_price.toFixed(2)}</span>` : ''}
                ${it.savings > 1.5 ? `<span class="price-savings">-${Math.round((it.savings / it.old_price) * 100)}%</span>` : ''}
              </div>
            </div>
            <div class="item-footer">
              ${pupusaTag}
              ${actionBtn}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </section>
      `;
    });

    if (html === '') {
      html = `
        <div style="text-align:center; padding: 60px 20px; color:#64748b;">
          <h3>${currentLang === 'es' ? 'No se encontraron platillos con esa búsqueda.' : 'No dishes matched your search.'}</h3>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // --- CART MANAGEMENT ---
  function findItem(id) {
    for (const cat of window.EBENEZER_CATALOG) {
      for (const it of cat.items) {
        if (it.id === id) return it;
      }
    }
    return null;
  }

  window.quickAddItem = function(id) {
    const item = findItem(id);
    if (!item) return;

    const existing = cart.find(ci => ci.id === id && !ci.customizations);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: item.id,
        name_es: item.name_es,
        name_en: item.name_en,
        price: item.price,
        old_price: item.old_price,
        qty: 1,
        customizations: null
      });
    }

    saveCart();
    updateCartUI();
    showCartDrawer();
  };

  window.openPupusaModal = function(id) {
    const item = findItem(id);
    if (!item) return;

    activePupusaItem = item;
    const name = currentLang === 'es' ? item.name_es : item.name_en;
    document.getElementById('pupusaModalItemName').textContent = name;
    document.getElementById('pupusaModalPrice').textContent = `$${item.price.toFixed(2)}`;

    // Reset fields
    document.getElementById('doughCorn').checked = true;
    document.getElementById('doughRice').checked = false;
    document.getElementById('extraCurtido').checked = false;
    document.getElementById('extraSalsaRoja').checked = false;
    document.getElementById('extraSalsaPicante').checked = false;
    document.getElementById('pupusaStyleNormal').checked = true;
    document.getElementById('pupusaStyleCrispy').checked = false;
    document.getElementById('pupusaNotes').value = '';
    document.getElementById('pupusaQtyModal').value = '1';

    updatePillStyles();
    document.getElementById('pupusaModal').classList.add('open');
  };

  window.closePupusaModal = function() {
    document.getElementById('pupusaModal').classList.remove('open');
  };

  window.updatePillStyles = function() {
    document.querySelectorAll('.choice-pill').forEach(pill => {
      const radio = pill.querySelector('input');
      if (radio && radio.checked) {
        pill.classList.add('selected');
      } else {
        pill.classList.remove('selected');
      }
    });
  };

  window.addCustomizedPupusaToCart = function() {
    if (!activePupusaItem) return;

    const isRice = document.getElementById('doughRice').checked;
    const extraCurtido = document.getElementById('extraCurtido').checked;
    const extraSalsaRoja = document.getElementById('extraSalsaRoja').checked;
    const extraSalsaPicante = document.getElementById('extraSalsaPicante').checked;
    const isCrispy = document.getElementById('pupusaStyleCrispy').checked;
    const notes = document.getElementById('pupusaNotes').value.trim();
    const qty = parseInt(document.getElementById('pupusaQtyModal').value) || 1;

    let unitPrice = activePupusaItem.price;
    let doughLabel = isRice ? (currentLang === 'es' ? 'Harina de Arroz (+$0.50)' : 'Rice Flour (+$0.50)') : (currentLang === 'es' ? 'Masa de Maíz' : 'Corn Masa');
    if (isRice) {
      unitPrice += 0.50;
    }

    let extras = [];
    if (extraCurtido) extras.push(currentLang === 'es' ? 'Curtido Extra' : 'Extra Curtido');
    if (extraSalsaRoja) extras.push(currentLang === 'es' ? 'Salsa Roja Extra' : 'Extra Tomato Salsa');
    if (extraSalsaPicante) extras.push(currentLang === 'es' ? 'Salsa Picante' : 'Spicy Salsa');
    if (isCrispy) extras.push(currentLang === 'es' ? 'Bien Doradita' : 'Well Done Crispy');

    cart.push({
      id: activePupusaItem.id,
      name_es: activePupusaItem.name_es,
      name_en: activePupusaItem.name_en,
      price: unitPrice,
      old_price: activePupusaItem.old_price,
      qty: qty,
      customizations: {
        dough: doughLabel,
        extras: extras.join(', '),
        notes: notes
      }
    });

    saveCart();
    updateCartUI();
    closePupusaModal();
    showCartDrawer();
  };

  function saveCart() {
    localStorage.setItem('ebenezer_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    const badge = document.getElementById('cartBadgeCount');
    const totalItems = cart.reduce((acc, it) => acc + it.qty, 0);
    if (badge) badge.textContent = totalItems;

    const list = document.getElementById('cartItemsList');
    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🫓</div>
          <h4>${t('cartEmptyTitle')}</h4>
          <p>${t('cartEmptyDesc')}</p>
        </div>
      `;
      document.getElementById('cartFooter').style.display = 'none';
      return;
    }

    document.getElementById('cartFooter').style.display = 'block';

    let subtotal = 0;
    let oldSubtotal = 0;
    let html = '';

    cart.forEach((item, index) => {
      const name = currentLang === 'es' ? item.name_es : item.name_en;
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      oldSubtotal += item.old_price * item.qty;

      let metaHtml = '';
      if (item.customizations) {
        let parts = [];
        if (item.customizations.dough) parts.push(`<strong>${item.customizations.dough}</strong>`);
        if (item.customizations.extras) parts.push(item.customizations.extras);
        if (item.customizations.notes) parts.push(`<em>"${item.customizations.notes}"</em>`);
        metaHtml = `<div class="cart-item-meta">${parts.join(' • ')}</div>`;
      }

      html += `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <div class="cart-item-title">${name}</div>
            ${metaHtml}
            <div class="qty-controls">
              <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
              <span class="qty-display">${item.qty}</span>
              <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
              <button class="qty-btn" style="color:#ef4444; margin-left:8px;" onclick="removeItem(${index})">🗑️</button>
            </div>
          </div>
          <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
        </div>
      `;
    });

    list.innerHTML = html;

    // Totals calculation
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const totalSavings = Math.max(0, oldSubtotal - subtotal);

    document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summaryTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;

    const savingsBanner = document.getElementById('cartSavingsBanner');
    if (savingsBanner) {
      if (totalSavings > 0) {
        savingsBanner.style.display = 'flex';
        savingsBanner.innerHTML = `🎉 ${t('savingsCallout')}<strong>$${totalSavings.toFixed(2)}</strong> ${t('savingsCalloutEnd')}`;
      } else {
        savingsBanner.style.display = 'none';
      }
    }
  }

  window.changeQty = function(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
  };

  window.removeItem = function(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  };

  window.showCartDrawer = function() {
    document.getElementById('cartDrawerOverlay').classList.add('open');
  };

  window.closeCartDrawer = function() {
    document.getElementById('cartDrawerOverlay').classList.remove('open');
  };

  // --- CHECKOUT & WHATSAPP INTEGRATION ---
  window.openCheckoutModal = function() {
    if (cart.length === 0) return;
    closeCartDrawer();
    document.getElementById('checkoutModal').classList.add('open');
  };

  window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').classList.remove('open');
  };

  window.confirmOrder = function(e) {
    if (e) e.preventDefault();

    const name = document.getElementById('custName').value.trim() || 'Cliente';
    const phone = document.getElementById('custPhone').value.trim() || 'No provisto';
    const time = document.getElementById('pickupTimeSelect').value;
    const payment = document.querySelector('input[name="paymentMethod"]:checked').value;

    let subtotal = 0;
    cart.forEach(it => subtotal += it.price * it.qty);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const orderNumber = `EBZ-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderObj = {
      orderNumber,
      createdAt: new Date().toISOString(),
      customer: { name, phone },
      pickupTime: time,
      paymentMethod: payment,
      items: cart,
      subtotal,
      tax,
      total,
      status: 'new'
    };

    // Store in active orders array for the Kitchen view
    const allOrders = JSON.parse(localStorage.getItem('ebenezer_kitchen_orders') || '[]');
    allOrders.unshift(orderObj);
    localStorage.setItem('ebenezer_kitchen_orders', JSON.stringify(allOrders));

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();

    // Show Confirmation Modal
    document.getElementById('confirmOrderNum').textContent = orderNumber;
    document.getElementById('confirmOrderTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('confirmOrderTime').textContent = time;
    document.getElementById('orderSuccessModal').classList.add('open');
  };

  window.closeSuccessModal = function() {
    document.getElementById('orderSuccessModal').classList.remove('open');
  };

  // WhatsApp formatted direct order message
  window.sendOrderByWhatsApp = function() {
    if (cart.length === 0) return;

    let subtotal = 0;
    cart.forEach(it => subtotal += it.price * it.qty);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    let msg = `*NUEVO PEDIDO DIRECTO — RESTAURANTE EBENEZER*\n`;
    msg += `----------------------------------------\n`;
    cart.forEach(it => {
      const name = currentLang === 'es' ? it.name_es : it.name_en;
      msg += `• *${it.qty}x* ${name} ($${(it.price * it.qty).toFixed(2)})\n`;
      if (it.customizations) {
        if (it.customizations.dough) msg += `   - Masa: ${it.customizations.dough}\n`;
        if (it.customizations.extras) msg += `   - Extras: ${it.customizations.extras}\n`;
        if (it.customizations.notes) msg += `   - Nota: ${it.customizations.notes}\n`;
      }
    });
    msg += `----------------------------------------\n`;
    msg += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
    msg += `*Impuesto (9.5%):* $${tax.toFixed(2)}\n`;
    msg += `*Tarifa Servicio:* $0.00 (Orden Directa Sin Comisión)\n`;
    msg += `*TOTAL A PAGAR:* $${total.toFixed(2)}\n`;
    msg += `----------------------------------------\n`;
    msg += `*Tipo de Pedido:* Para Recoger en Mostrador (8672 Lindley Ave)\n`;
    msg += `*Tiempo Estimado:* 20 - 25 minutos\n`;
    msg += `¡Muchas gracias!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${RESTAURANT_PHONE}?text=${encoded}`, '_blank');
  };

  // Event Listeners
  function setupEventListeners() {
    const search = document.getElementById('searchInput');
    if (search) {
      search.addEventListener('input', () => renderMenu());
    }
  }

})();

