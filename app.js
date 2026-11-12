/**
 * Restaurante Salvadoreño Ebenezer — Application Logic (v2)
 * Clean, fast, accessible state-driven ordering experience.
 */

(() => {
  'use strict';

  // --- 1. Internationalization Dictionary (Spec §6) ---
  const I18N = {
    es: {
      tagline: "Pupusas hechas a mano",
      openUntil: "Abierto · cierra {t}",
      closedUntil: "Cerrado · abre {t}",
      directions: "Cómo llegar",
      pupusasSub: "Hechas a mano · incluyen curtido y salsa",
      dough: "Masa",
      corn: "Maíz",
      rice: "Arroz",
      riceExtra: "+$0.50",
      viewOrder: "Ver pedido",
      yourOrder: "Tu pedido",
      emptyCart: "Agrega pupusas o platillos del menú",
      subtotal: "Subtotal",
      tax: "Impuesto (9.5%)",
      total: "Total",
      continue: "Continuar",
      pickupDetails: "Datos para recoger",
      name: "Nombre",
      namePh: "Tu nombre y apellido",
      phone: "Teléfono",
      phonePh: "(818) 000-0000",
      pickupTime: "Hora de recogida",
      asap: "Lo antes posible (~20 min)",
      plus30: "En 30 min",
      plus60: "En 60 min",
      note: "Nota para la cocina (opcional)",
      notePh: "Ej. bien doraditas, salsa picante aparte",
      payAtPickup: "Pagas al recoger · efectivo o tarjeta",
      send: "Enviar pedido",
      back: "Volver",
      sent: "¡Pedido enviado!",
      orderNo: "Pedido",
      readyAt: "Listo para recoger",
      alsoWhatsApp: "También enviar por WhatsApp",
      call: "Llamar",
      done: "Listo",
      hours: "Horario",
      location: "Ubicación",
      undo: "Deshacer",
      itemRemoved: "Artículo eliminado",
      enterNamePhone: "Por favor ingresa tu nombre y teléfono.",
      days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    },
    en: {
      tagline: "Handmade pupusas",
      openUntil: "Open · closes {t}",
      closedUntil: "Closed · opens {t}",
      directions: "Directions",
      pupusasSub: "Handmade · served with curtido & salsa",
      dough: "Dough",
      corn: "Corn",
      rice: "Rice",
      riceExtra: "+$0.50",
      viewOrder: "View order",
      yourOrder: "Your order",
      emptyCart: "Add pupusas or dishes from the menu",
      subtotal: "Subtotal",
      tax: "Tax (9.5%)",
      total: "Total",
      continue: "Continue",
      pickupDetails: "Pickup details",
      name: "Name",
      namePh: "Your full name",
      phone: "Phone",
      phonePh: "(818) 000-0000",
      pickupTime: "Pickup time",
      asap: "ASAP (~20 min)",
      plus30: "In 30 min",
      plus60: "In 60 min",
      note: "Note for the kitchen (optional)",
      notePh: "e.g. extra crispy, hot salsa on the side",
      payAtPickup: "Pay at pickup · cash or card",
      send: "Place order",
      back: "Back",
      sent: "Order placed!",
      orderNo: "Order",
      readyAt: "Ready for pickup",
      alsoWhatsApp: "Also send via WhatsApp",
      call: "Call",
      done: "Done",
      hours: "Hours",
      location: "Location",
      undo: "Undo",
      itemRemoved: "Item removed",
      enterNamePhone: "Please enter your name and phone number.",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    }
  };

  // --- 2. Application State ---
  const state = {
    lang: localStorage.getItem('ebenezer_lang') || 'es',
    dough: 'corn', // 'corn' | 'rice'
    cart: loadCart(), // [{ key, id, dough, qty }]
    step: 1, // 1: Cart, 2: Checkout, 3: Confirmation
    lastOrder: null,
    lastRemovedItem: null,
    undoTimer: null,
    pickupTimeChoice: 'asap',
    formData: { name: '', phone: '', note: '' }
  };

  function loadCart() {
    try {
      const saved = localStorage.getItem('ebenezer_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem('ebenezer_cart_v2', JSON.stringify(state.cart));
    } catch (e) {}
  }

  function t(key, params = {}) {
    let str = (I18N[state.lang] && I18N[state.lang][key]) || (I18N.es && I18N.es[key]) || key;
    Object.keys(params).forEach(k => {
      str = str.replace(`{${k}}`, params[k]);
    });
    return str;
  }

  // Find item by ID in catalog
  function findCatalogItem(id) {
    if (!window.EBENEZER_CATALOG) return null;
    for (const cat of window.EBENEZER_CATALOG) {
      for (const item of cat.items) {
        if (item.id === id) return item;
      }
    }
    return null;
  }

  // Calculate pricing for a cart item
  function getItemPrice(item, dough) {
    let base = item.price;
    if (item.is_pupusa && dough === 'rice') {
      base += (window.EBENEZER_INFO ? window.EBENEZER_INFO.riceSurcharge : 0.50);
    }
    return base;
  }

  function getCartTotals() {
    let subtotal = 0;
    let count = 0;
    state.cart.forEach(entry => {
      const item = findCatalogItem(entry.id);
      if (item) {
        const unit = getItemPrice(item, entry.dough);
        subtotal += unit * entry.qty;
        count += entry.qty;
      }
    });
    const taxRate = (window.EBENEZER_INFO && window.EBENEZER_INFO.taxRate) || 0.095;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + tax;
    return { subtotal, tax, total, count };
  }

  // --- 3. DOM Elements ---
  const el = {
    langBtn: document.getElementById('langBtn'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    categoryTabs: document.getElementById('categoryTabs'),
    menuColumn: document.getElementById('menuColumn'),
    desktopCartBody: document.getElementById('desktopCartBody'),
    sheetCartBody: document.getElementById('sheetCartBody'),
    mobileCartBar: document.getElementById('mobileCartBar'),
    mBarCount: document.getElementById('mBarCount'),
    mBarTotal: document.getElementById('mBarTotal'),
    cartDialog: document.getElementById('cartDialog'),
    closeSheetBtn: document.getElementById('closeSheetBtn'),
    hoursTable: document.getElementById('hoursTable'),
    toastUndo: document.getElementById('toastUndo'),
    toastText: document.getElementById('toastText'),
    toastUndoBtn: document.getElementById('toastUndoBtn')
  };

  // --- 4. Live Open / Closed Status ---
  function updateOpenStatus() {
    if (!window.EBENEZER_INFO || !window.EBENEZER_INFO.hours) return;
    const now = new Date();
    // Convert to America/Los_Angeles time
    const laString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const laDate = new Date(laString);
    const day = laDate.getDay();
    const hoursToday = window.EBENEZER_INFO.hours[day];

    if (!hoursToday) return;

    const [openH, openM] = hoursToday[0].split(':').map(Number);
    const [closeH, closeM] = hoursToday[1].split(':').map(Number);

    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const currentMin = laDate.getHours() * 60 + laDate.getMinutes();

    const isOpen = currentMin >= openMin && currentMin < closeMin;

    if (isOpen) {
      el.statusDot.classList.remove('closed');
      const closeDisplay = formatTimeDisplay(hoursToday[1]);
      el.statusText.textContent = t('openUntil', { t: closeDisplay });
    } else {
      el.statusDot.classList.add('closed');
      const nextDay = (day + 1) % 7;
      const nextOpen = window.EBENEZER_INFO.hours[nextDay] ? window.EBENEZER_INFO.hours[nextDay][0] : "6:00";
      const openDisplay = formatTimeDisplay(nextOpen);
      el.statusText.textContent = t('closedUntil', { t: openDisplay });
    }
  }

  function formatTimeDisplay(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m === 0 ? '' : `:${m < 10 ? '0' : ''}${m}`;
    return `${displayH}${displayM} ${ampm}`;
  }

  // --- 5. Render Hours Table ---
  function renderHoursTable() {
    if (!el.hoursTable || !window.EBENEZER_INFO) return;
    const now = new Date();
    const laString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const today = new Date(laString).getDay();
    const days = I18N[state.lang].days;

    let html = '';
    // Display Monday through Sunday (1 to 6, then 0)
    const order = [1, 2, 3, 4, 5, 6, 0];
    order.forEach(d => {
      const isToday = d === today;
      const hours = window.EBENEZER_INFO.hours[d];
      const timeStr = hours ? `${formatTimeDisplay(hours[0])} – ${formatTimeDisplay(hours[1])}` : 'Cerrado';
      html += `
        <tr class="${isToday ? 'today' : ''}">
          <td>${days[d]} ${isToday ? '•' : ''}</td>
          <td style="text-align: right;">${timeStr}</td>
        </tr>
      `;
    });
    el.hoursTable.innerHTML = html;
  }

  // --- 6. Render Tabs & ScrollSpy ---
  function renderTabs() {
    if (!el.categoryTabs || !window.EBENEZER_CATALOG) return;
    const html = window.EBENEZER_CATALOG.map((cat, idx) => {
      const name = state.lang === 'en' ? cat.name_en : cat.name_es;
      return `<a href="#${cat.id}" class="tab-link ${idx === 0 ? 'active' : ''}" data-cat="${cat.id}">${name}</a>`;
    }).join('');
    el.categoryTabs.innerHTML = html;
  }

  function setupScrollSpy() {
    const sections = document.querySelectorAll('.menu-section');
    const tabLinks = document.querySelectorAll('.tab-link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tabLinks.forEach(link => {
            if (link.getAttribute('data-cat') === id) {
              link.classList.add('active');
              // Smooth scroll tab into view horizontally
              link.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(sec => observer.observe(sec));
  }

  // --- 7. Render Menu ---
  function renderMenu() {
    if (!el.menuColumn || !window.EBENEZER_CATALOG) return;

    let html = '';
    window.EBENEZER_CATALOG.forEach(cat => {
      const catName = state.lang === 'en' ? cat.name_en : cat.name_es;
      const catSub = state.lang === 'en' ? (cat.sub_en || '') : (cat.sub_es || '');
      const isPupusaCat = cat.id === 'pupusas';

      html += `
        <section class="menu-section ${isPupusaCat ? 'pupusas-section' : ''}" id="${cat.id}">
          <header class="section-head">
            <h2 class="section-title">${catName}</h2>
            ${catSub ? `<p class="section-sub">${catSub}</p>` : ''}
          </header>
      `;

      if (isPupusaCat) {
        html += `
          <div class="dough-selector-wrap">
            <span class="dough-label">${t('dough')}:</span>
            <div class="dough-segmented" role="group" aria-label="${t('dough')}">
              <button class="dough-option ${state.dough === 'corn' ? 'active' : ''}" data-dough="corn">${t('corn')}</button>
              <button class="dough-option ${state.dough === 'rice' ? 'active' : ''}" data-dough="rice">${t('rice')} ${t('riceExtra')}</button>
            </div>
          </div>
        `;
      }

      html += `<div class="items-container ${!isPupusaCat ? 'grid-2col' : ''}">`;

      cat.items.forEach(item => {
        const primaryName = state.lang === 'en' ? item.name_en : item.name_es;
        const altName = state.lang === 'en' ? item.name_es : '';
        const desc = state.lang === 'en' ? item.description_en : item.description_es;
        const currentDough = item.is_pupusa ? state.dough : null;
        const itemKey = item.is_pupusa ? `${item.id}_${currentDough}` : `${item.id}`;
        const cartEntry = state.cart.find(c => c.key === itemKey);
        const qty = cartEntry ? cartEntry.qty : 0;
        const displayPrice = getItemPrice(item, currentDough);

        html += `
          <article class="item-row" data-id="${item.id}" data-is-pupusa="${item.is_pupusa}">
            <div class="item-info">
              <h3 class="item-name">${primaryName}</h3>
              ${altName ? `<p class="item-alt-name" lang="es">${altName}</p>` : ''}
              ${desc ? `<p class="item-desc">${desc}</p>` : ''}
            </div>
            <div class="item-action">
              <span class="item-price">$${displayPrice.toFixed(2)}</span>
              <div class="action-slot" data-key="${itemKey}" data-id="${item.id}">
                ${renderItemButtonOrStepper(item, itemKey, qty)}
              </div>
            </div>
          </article>
        `;
      });

      html += `</div></section>`;
    });

    el.menuColumn.innerHTML = html;
  }

  function renderItemButtonOrStepper(item, key, qty) {
    if (qty > 0) {
      return `
        <div class="stepper" role="group" aria-label="${item.name_es}">
          <button class="stepper-btn step-minus" data-key="${key}" data-id="${item.id}" aria-label="Quitar uno">−</button>
          <span class="stepper-qty">${qty}</span>
          <button class="stepper-btn step-plus" data-key="${key}" data-id="${item.id}" aria-label="Agregar uno">+</button>
        </div>
      `;
    } else {
      return `
        <button class="add-btn" data-key="${key}" data-id="${item.id}" aria-label="Agregar ${item.name_es}">+</button>
      `;
    }
  }

  // --- 8. Render Cart & Checkout (Shared Component) ---
  function renderCartComponent() {
    const { subtotal, tax, total, count } = getCartTotals();

    // Update mobile bottom bar
    if (count > 0) {
      el.mobileCartBar.classList.add('visible');
      el.mBarCount.textContent = count;
      el.mBarTotal.textContent = `$${total.toFixed(2)}`;
    } else {
      el.mobileCartBar.classList.remove('visible');
      if (el.cartDialog && el.cartDialog.open && state.step === 1) {
        el.cartDialog.close();
      }
    }

    const html = buildCartHTML(subtotal, tax, total, count);
    if (el.desktopCartBody) el.desktopCartBody.innerHTML = html;
    if (el.sheetCartBody) el.sheetCartBody.innerHTML = html;
  }

  function buildCartHTML(subtotal, tax, total, count) {
    if (state.step === 1) {
      if (count === 0) {
        return `
          <div class="cart-empty">
            <svg class="icon cart-empty-icon" style="width: 48px; height: 48px;"><use href="#icon-bag"></use></svg>
            <p>${t('emptyCart')}</p>
          </div>
        `;
      }

      let linesHtml = '<div class="cart-lines">';
      state.cart.forEach(entry => {
        const item = findCatalogItem(entry.id);
        if (!item) return;
        const itemName = state.lang === 'en' ? item.name_en : item.name_es;
        const doughLabel = entry.dough ? (entry.dough === 'rice' ? t('rice') : t('corn')) : '';
        const unit = getItemPrice(item, entry.dough);
        const lineTotal = unit * entry.qty;

        linesHtml += `
          <div class="cart-line">
            <div class="line-info">
              <div class="line-name">${itemName}</div>
              ${doughLabel ? `<div class="line-dough">${t('dough')}: ${doughLabel}</div>` : ''}
              <div class="stepper" style="margin-top: 6px;">
                <button class="stepper-btn step-minus" data-key="${entry.key}" data-id="${entry.id}">−</button>
                <span class="stepper-qty">${entry.qty}</span>
                <button class="stepper-btn step-plus" data-key="${entry.key}" data-id="${entry.id}">+</button>
              </div>
            </div>
            <div class="line-side">
              <span class="line-price">$${lineTotal.toFixed(2)}</span>
            </div>
          </div>
        `;
      });
      linesHtml += '</div>';

      return `
        ${linesHtml}
        <div class="cart-summary">
          <div class="summary-row">
            <span>${t('subtotal')}</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>${t('tax')}</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div class="summary-row total-row">
            <span>${t('total')}</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <button class="primary-btn" id="btnContinueCheckout">
            ${t('continue')} · $${total.toFixed(2)}
          </button>
        </div>
      `;
    }

    if (state.step === 2) {
      return `
        <div class="checkout-form">
          <div class="form-group">
            <label class="form-label" for="inputName">${t('name')}</label>
            <input type="text" id="inputName" class="form-input" placeholder="${t('namePh')}" value="${state.formData.name}" required autocomplete="name">
          </div>
          <div class="form-group">
            <label class="form-label" for="inputPhone">${t('phone')}</label>
            <input type="tel" id="inputPhone" class="form-input" placeholder="${t('phonePh')}" value="${state.formData.phone}" required autocomplete="tel">
          </div>
          <div class="form-group">
            <label class="form-label">${t('pickupTime')}</label>
            <div class="time-pills">
              <button class="time-pill ${state.pickupTimeChoice === 'asap' ? 'active' : ''}" data-time="asap">${t('asap')}</button>
              <button class="time-pill ${state.pickupTimeChoice === 'plus30' ? 'active' : ''}" data-time="plus30">${t('plus30')}</button>
              <button class="time-pill ${state.pickupTimeChoice === 'plus60' ? 'active' : ''}" data-time="plus60">${t('plus60')}</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="inputNote">${t('note')}</label>
            <textarea id="inputNote" class="form-textarea" placeholder="${t('notePh')}">${state.formData.note}</textarea>
          </div>
          <div class="payment-notice">
            <svg class="icon"><use href="#icon-check"></use></svg>
            <span>${t('payAtPickup')}</span>
          </div>
          <p class="field-error" id="formError">${t('enterNamePhone')}</p>
          <button class="primary-btn" id="btnPlaceOrder">
            ${t('send')} · $${total.toFixed(2)}
          </button>
          <a href="#" class="secondary-link" id="btnBackToCart">← ${t('back')}</a>
        </div>
      `;
    }

    if (state.step === 3 && state.lastOrder) {
      const order = state.lastOrder;
      const waText = encodeURIComponent(
        `¡Hola Ebenezer! Acabo de hacer el pedido ${order.orderId} para recoger.\n` +
        `Nombre: ${order.customerName}\n` +
        `Total: $${order.total.toFixed(2)}\n` +
        `Artículos: ${order.itemsSummary}`
      );
      const waLink = `https://wa.me/17472453571?text=${waText}`;

      return `
        <div class="confirm-wrap">
          <svg class="icon confirm-icon"><use href="#icon-check"></use></svg>
          <h3 class="confirm-title">${t('sent')}</h3>
          <div class="order-number">${order.orderId}</div>
          <div class="confirm-card">
            <div class="confirm-row">
              <span><strong>${t('readyAt')}:</strong></span>
              <span>${order.readyTime}</span>
            </div>
            <div class="confirm-row">
              <span><strong>${t('total')}:</strong></span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
            <div class="confirm-row">
              <span><strong>${t('location')}:</strong></span>
              <span>8672 Lindley Ave</span>
            </div>
          </div>
          <div class="confirm-actions">
            <a href="${waLink}" target="_blank" rel="noopener" class="primary-btn btn-whatsapp">
              ${t('alsoWhatsApp')}
            </a>
            <a href="tel:+17472453571" class="action-pill" style="justify-content: center; height: 44px;">
              <svg class="icon"><use href="#icon-phone"></use></svg>
              <span>${t('call')} (747) 245-3571</span>
            </a>
            <button class="secondary-link" id="btnDoneOrder">${t('done')}</button>
          </div>
        </div>
      `;
    }

    return '';
  }

  // --- 9. Cart Mutations & Event Handlers ---
  function addItem(id, customDough = null) {
    const item = findCatalogItem(id);
    if (!item) return;

    const dough = item.is_pupusa ? (customDough || state.dough) : null;
    const key = item.is_pupusa ? `${id}_${dough}` : `${id}`;

    const existing = state.cart.find(c => c.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ key, id, dough, qty: 1 });
    }

    saveCart();
    renderCartComponent();
    updateMenuRowButton(key);
  }

  function removeItem(key) {
    const idx = state.cart.findIndex(c => c.key === key);
    if (idx === -1) return;

    const entry = state.cart[idx];
    if (entry.qty > 1) {
      entry.qty -= 1;
      saveCart();
      renderCartComponent();
      updateMenuRowButton(key);
    } else {
      // Remove line completely & show Undo toast
      state.lastRemovedItem = { ...entry, index: idx };
      state.cart.splice(idx, 1);
      saveCart();
      renderCartComponent();
      updateMenuRowButton(key);
      showUndoToast();
    }
  }

  function updateMenuRowButton(key) {
    const slot = document.querySelector(`.action-slot[data-key="${key}"]`);
    if (!slot) return;
    const id = Number(slot.getAttribute('data-id'));
    const item = findCatalogItem(id);
    if (!item) return;
    const entry = state.cart.find(c => c.key === key);
    const qty = entry ? entry.qty : 0;
    slot.innerHTML = renderItemButtonOrStepper(item, key, qty);
  }

  function showUndoToast() {
    if (!el.toastUndo) return;
    el.toastText.textContent = t('itemRemoved');
    el.toastUndo.classList.add('visible');
    clearTimeout(state.undoTimer);
    state.undoTimer = setTimeout(() => {
      el.toastUndo.classList.remove('visible');
      state.lastRemovedItem = null;
    }, 4500);
  }

  function undoRemove() {
    if (!state.lastRemovedItem) return;
    const item = state.lastRemovedItem;
    state.cart.splice(item.index, 0, { key: item.key, id: item.id, dough: item.dough, qty: item.qty });
    state.lastRemovedItem = null;
    el.toastUndo.classList.remove('visible');
    saveCart();
    renderCartComponent();
    updateMenuRowButton(item.key);
  }

  // --- 10. Submit Order ---
  function submitOrder() {
    const nameInput = document.getElementById('inputName');
    const phoneInput = document.getElementById('inputPhone');
    const noteInput = document.getElementById('inputNote');
    const errEl = document.getElementById('formError');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!name || !phone) {
      if (errEl) errEl.classList.add('visible');
      return;
    }
    if (errEl) errEl.classList.remove('visible');

    state.formData.name = name;
    state.formData.phone = phone;
    state.formData.note = note;

    const { subtotal, tax, total } = getCartTotals();
    const orderId = `EB-${Math.floor(1000 + Math.random() * 9000)}`;

    // Calculate pickup ready time
    const readyMinOffset = state.pickupTimeChoice === 'plus60' ? 60 : (state.pickupTimeChoice === 'plus30' ? 30 : 20);
    const readyDate = new Date(Date.now() + readyMinOffset * 60000);
    const readyTimeStr = readyDate.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });

    // Item summary for kitchen and WhatsApp
    const itemsList = state.cart.map(c => {
      const it = findCatalogItem(c.id);
      const nameStr = it ? it.name_es : 'Artículo';
      const doughStr = c.dough ? ` (${c.dough === 'rice' ? 'Arroz' : 'Maíz'})` : '';
      return `${c.qty}x ${nameStr}${doughStr}`;
    });

    const orderPayload = {
      orderId,
      orderNumber: orderId,
      customerName: name,
      customer: { name, phone },
      phone,
      note,
      pickupTimeChoice: state.pickupTimeChoice,
      pickupTime: readyTimeStr,
      readyTime: readyTimeStr,
      subtotal,
      tax,
      total,
      items: state.cart.map(c => {
        const it = findCatalogItem(c.id) || {};
        return {
          id: c.id,
          key: c.key,
          name_es: it.name_es || '',
          name: it.name_es || '',
          dough: c.dough,
          qty: c.qty,
          price: getItemPrice(it, c.dough),
          unitPrice: getItemPrice(it, c.dough),
          customizations: c.dough ? {
            dough: c.dough === 'rice' ? 'Harina de Arroz (+$0.50)' : 'Masa de Maíz',
            notes: note || undefined
          } : (note ? { notes: note } : null)
        };
      }),
      itemsSummary: itemsList.join(', '),
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    // Save to localStorage for kitchen.html integration
    try {
      const existingOrders = JSON.parse(localStorage.getItem('ebenezer_kitchen_orders') || '[]');
      existingOrders.unshift(orderPayload);
      localStorage.setItem('ebenezer_kitchen_orders', JSON.stringify(existingOrders));
    } catch (e) {}

    state.lastOrder = orderPayload;
    state.cart = [];
    saveCart();
    state.step = 3;

    renderCartComponent();
    renderMenu(); // refresh steppers
  }

  // --- 11. Event Delegation Setup ---
  function initEvents() {
    // Language toggle
    if (el.langBtn) {
      el.langBtn.addEventListener('click', () => {
        state.lang = state.lang === 'es' ? 'en' : 'es';
        localStorage.setItem('ebenezer_lang', state.lang);
        document.documentElement.lang = state.lang;
        el.langBtn.textContent = state.lang === 'es' ? 'EN' : 'ES';

        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(node => {
          const key = node.getAttribute('data-i18n');
          node.textContent = t(key);
        });

        updateOpenStatus();
        renderHoursTable();
        renderTabs();
        renderMenu();
        renderCartComponent();
      });
    }

    // Mobile cart bar click -> open bottom sheet
    if (el.mobileCartBar) {
      el.mobileCartBar.addEventListener('click', () => {
        if (el.cartDialog) {
          el.cartDialog.showModal();
        }
      });
    }

    // Close sheet button
    if (el.closeSheetBtn) {
      el.closeSheetBtn.addEventListener('click', () => {
        if (el.cartDialog) el.cartDialog.close();
      });
    }

    // Close sheet when tapping backdrop
    if (el.cartDialog) {
      el.cartDialog.addEventListener('click', (e) => {
        const rect = el.cartDialog.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
          && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (e.target === el.cartDialog) {
          el.cartDialog.close();
        }
      });
    }

    // Undo toast button
    if (el.toastUndoBtn) {
      el.toastUndoBtn.addEventListener('click', undoRemove);
    }

    // Delegated clicks inside <main>
    document.addEventListener('click', (e) => {
      // Dough selector click
      const doughBtn = e.target.closest('.dough-option');
      if (doughBtn) {
        const chosen = doughBtn.getAttribute('data-dough');
        if (chosen && chosen !== state.dough) {
          state.dough = chosen;
          renderMenu();
        }
        return;
      }

      // Add button click
      const addBtn = e.target.closest('.add-btn');
      if (addBtn) {
        const id = Number(addBtn.getAttribute('data-id'));
        addItem(id);
        return;
      }

      // Stepper plus click
      const stepPlus = e.target.closest('.step-plus');
      if (stepPlus) {
        const key = stepPlus.getAttribute('data-key');
        const id = Number(stepPlus.getAttribute('data-id'));
        addItem(id, key.includes('rice') ? 'rice' : (key.includes('corn') ? 'corn' : null));
        return;
      }

      // Stepper minus click
      const stepMinus = e.target.closest('.step-minus');
      if (stepMinus) {
        const key = stepMinus.getAttribute('data-key');
        removeItem(key);
        return;
      }

      // Continue to checkout step 2
      const btnContinue = e.target.closest('#btnContinueCheckout');
      if (btnContinue) {
        state.step = 2;
        renderCartComponent();
        return;
      }

      // Back to cart step 1
      const btnBack = e.target.closest('#btnBackToCart');
      if (btnBack) {
        e.preventDefault();
        state.step = 1;
        renderCartComponent();
        return;
      }

      // Place order button
      const btnPlace = e.target.closest('#btnPlaceOrder');
      if (btnPlace) {
        submitOrder();
        return;
      }

      // Time pill click
      const timePill = e.target.closest('.time-pill');
      if (timePill) {
        state.pickupTimeChoice = timePill.getAttribute('data-time') || 'asap';
        renderCartComponent();
        return;
      }

      // Order confirmation "Done" button
      const btnDone = e.target.closest('#btnDoneOrder');
      if (btnDone) {
        state.step = 1;
        state.lastOrder = null;
        if (el.cartDialog && el.cartDialog.open) {
          el.cartDialog.close();
        }
        renderCartComponent();
        return;
      }
    });
  }

  // --- 12. Initialization ---
  function init() {
    document.documentElement.lang = state.lang;
    if (el.langBtn) el.langBtn.textContent = state.lang === 'es' ? 'EN' : 'ES';

    updateOpenStatus();
    renderHoursTable();
    renderTabs();
    renderMenu();
    renderCartComponent();
    setupScrollSpy();
    initEvents();

    // Check open status every 60s
    setInterval(updateOpenStatus, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
