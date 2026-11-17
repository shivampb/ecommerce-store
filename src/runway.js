const BRANDING_METHODS = {
  blank: { id: 'blank', label: 'Unbranded Blank', fee: 0, leadDays: '3–5 business days' },
  embroidery: { id: 'embroidery', label: 'Chest / Bib Embroidery', fee: 4.5, leadDays: '7–10 business days' },
  screenprint: { id: 'screenprint', label: 'Screen Print', fee: 2.5, leadDays: '6–8 business days' },
  woven: { id: 'woven', label: 'Woven Corner Label', fee: 2.0, leadDays: '7–10 business days' },
};

function getDiscountRate(totalQty) {
  if (totalQty >= 50) return 0.25;
  if (totalQty >= 25) return 0.18;
  if (totalQty >= 10) return 0.10;
  return 0;
}

const CATALOG = {
  items: [
    {
      id: 'apron-basic',
      name: 'Core Poly-Cotton Bib Apron',
      tierLabel: 'Basic Series · 195 GSM',
      specSummary: 'Stain-release 65/35 twill · Bleach-safe · Front center pocket',
      price: 18.0,
      image: '/src/assets/images/prod_apron_basic_1794902223099.jpg',
      sizes: ['Regular (32")', 'Tall (35")'],
      defaultSize: 'Regular (32")',
    },
    {
      id: 'apron-waist',
      name: 'Half-Bistro Twill Waist Apron',
      tierLabel: 'Pro Series · 260 GSM',
      specSummary: 'Oatmeal cotton twill · Deep tablet/order pocket · Long wrap ties',
      price: 26.0,
      image: '/src/assets/images/prod_apron_waist_1794902224429.jpg',
      sizes: ['One Size', 'Wide Wrap'],
      defaultSize: 'One Size',
    },
    {
      id: 'apron-twill',
      name: 'Pro 280 GSM Twill Bistro Apron',
      tierLabel: 'Pro Series · 280 GSM',
      specSummary: 'Combed cotton twill · Antique brass grommets · Pen & utility slots',
      price: 34.0,
      image: '/src/assets/images/prod_apron_twill_1794902222364.jpg',
      sizes: ['Regular (32")', 'Tall (35")'],
      defaultSize: 'Regular (32")',
    },
    {
      id: 'apron-premium',
      name: 'Heritage Waxed Canvas Cross-Back',
      tierLabel: 'Premium Craft · 380 GSM',
      specSummary: 'Water-repellent duck canvas · Detachable leather cross-back straps',
      price: 68.0,
      image: '/src/assets/images/prod_apron_premium_1794902222471.jpg',
      sizes: ['Regular', 'Extended Fit'],
      defaultSize: 'Regular',
    },
    {
      id: 'tee-classic',
      name: 'Classic 180 GSM Corporate Tee',
      tierLabel: 'Corporate Tees · 180 GSM',
      specSummary: 'Pre-shrunk combed cotton · Tear-away neck tag · Screen print ready',
      price: 16.0,
      image: '/src/assets/images/prod_tee_corporate_white_1794902223449.jpg',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      defaultSize: 'M',
    },
    {
      id: 'tee-heavy',
      name: 'Heavyweight 220 GSM Uniform Tee',
      tierLabel: 'Corporate Tees · 220 GSM',
      specSummary: 'Structured ring-spun jersey · Double-needle hem · Embroidery ready',
      price: 22.0,
      image: '/src/assets/images/prod_tee_corporate_pack_1794902224065.jpg',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      defaultSize: 'M',
    },
  ],
  looks: [
    {
      name: 'Basic Utility Kit',
      tierKey: 'basic',
      jumpTab: 0,
      products: ['apron-basic', 'tee-classic', 'tee-heavy'],
    },
    {
      name: 'Café & Barista Twill',
      tierKey: 'pro',
      jumpTab: 1,
      products: ['apron-twill', 'tee-heavy', 'apron-basic'],
    },
    {
      name: 'Executive Waxed Canvas',
      tierKey: 'premium',
      jumpTab: 2,
      products: ['apron-premium', 'tee-heavy', 'apron-twill'],
    },
    {
      name: 'Corporate Uniform Crew',
      tierKey: 'tees',
      jumpTab: 3,
      products: ['tee-heavy', 'apron-twill', 'tee-classic'],
    },
    {
      name: 'Bakery Half-Bistro',
      tierKey: 'pro',
      jumpTab: 1,
      products: ['apron-waist', 'tee-classic', 'apron-basic'],
    },
    {
      name: 'Atelier Heritage',
      tierKey: 'premium',
      jumpTab: 2,
      products: ['apron-premium', 'tee-heavy', 'apron-waist'],
    },
  ],
};

const BAG_KEY = 'loom-stitch-quote-bag-v1';
const META_KEY = 'loom-stitch-quote-meta-v1';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function getItemById(id) {
  return CATALOG.items.find((it) => it.id === id) || null;
}

class QuoteBag {
  constructor() {
    this.entries = this.load();
    this.meta = this.loadMeta();
    this.toastTimer = 0;

    this.dialog = document.getElementById('bag-dialog');
    this.itemsEl = document.getElementById('bag-items');
    this.summaryEl = document.getElementById('bag-summary');
    this.exportBtn = document.getElementById('export-bag');
    this.copyBtn = document.getElementById('copy-bag');
    this.companyInput = document.getElementById('bag-company');
    this.notesInput = document.getElementById('bag-notes');
    this.statusEl = document.getElementById('bag-status');
    this.openBtn = document.getElementById('open-bag');
    this.closeBtn = document.getElementById('close-bag');

    this.bindUI();
    this.updateCount();
  }

  load() {
    try {
      const raw = localStorage.getItem(BAG_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (e) =>
          e &&
          typeof e.itemId === 'string' &&
          getItemById(e.itemId) &&
          typeof e.size === 'string' &&
          typeof e.branding === 'string' &&
          BRANDING_METHODS[e.branding] &&
          Number.isFinite(e.quantity) &&
          e.quantity >= 1
      ).map((e) => ({
        key: `${e.itemId}::${e.size}::${e.branding}`,
        itemId: e.itemId,
        size: e.size,
        branding: e.branding,
        quantity: clamp(Math.round(e.quantity), 1, 500),
      }));
    } catch {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(this.entries));
    } catch {
      // ignore storage errors
    }
  }

  loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return { company: '', notes: '' };
      const p = JSON.parse(raw);
      return {
        company: typeof p?.company === 'string' ? p.company : '',
        notes: typeof p?.notes === 'string' ? p.notes : '',
      };
    } catch {
      return { company: '', notes: '' };
    }
  }

  saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(this.meta));
    } catch {
      // ignore
    }
  }

  updateCount() {
    const total = this.entries.reduce((sum, e) => sum + e.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(total);
    });
  }

  toast(msg) {
    if (!this.statusEl) return;
    this.statusEl.textContent = msg;
    this.statusEl.classList.remove('is-on');
    void this.statusEl.offsetWidth;
    this.statusEl.classList.add('is-on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.statusEl.classList.remove('is-on');
    }, 2600);
  }

  add(items, silent = false) {
    let totalAdded = 0;
    for (const req of items) {
      const item = getItemById(req.itemId);
      if (!item) continue;
      const size = req.size || item.defaultSize;
      const branding = BRANDING_METHODS[req.branding] ? req.branding : 'blank';
      const qty = clamp(Math.round(Number(req.quantity) || 1), 1, 500);
      const key = `${item.id}::${size}::${branding}`;
      const existing = this.entries.find((e) => e.key === key);
      if (existing) {
        existing.quantity = clamp(existing.quantity + qty, 1, 500);
      } else {
        this.entries.push({ key, itemId: item.id, size, branding, quantity: qty });
      }
      totalAdded += qty;
    }
    this.save();
    this.updateCount();
    if (this.dialog?.open) {
      this.renderDialog();
    }
    if (!silent && totalAdded > 0) {
      this.toast(`Added ${totalAdded} ${totalAdded === 1 ? 'garment' : 'garments'} to Quote Bag`);
    }
  }

  setQty(key, nextQty) {
    const entry = this.entries.find((e) => e.key === key);
    if (!entry) return;
    entry.quantity = clamp(Math.round(nextQty), 1, 500);
    this.save();
    this.updateCount();
    this.renderDialog();
  }

  remove(key) {
    this.entries = this.entries.filter((e) => e.key !== key);
    this.save();
    this.updateCount();
    this.renderDialog();
  }

  computeTotals() {
    const totalUnits = this.entries.reduce((s, e) => s + e.quantity, 0);
    const discountRate = getDiscountRate(totalUnits);
    let baseMerch = 0;
    let brandingTotal = 0;

    for (const e of this.entries) {
      const item = getItemById(e.itemId);
      if (!item) continue;
      const b = BRANDING_METHODS[e.branding] || BRANDING_METHODS.blank;
      baseMerch += item.price * e.quantity;
      brandingTotal += b.fee * e.quantity;
    }

    const savings = baseMerch * discountRate;
    const discountedMerch = baseMerch - savings;
    const grandTotal = discountedMerch + brandingTotal;
    return { totalUnits, discountRate, baseMerch, savings, brandingTotal, grandTotal };
  }

  renderDialog() {
    if (!this.itemsEl || !this.summaryEl) return;
    this.itemsEl.innerHTML = '';

    if (this.companyInput && this.companyInput.value !== this.meta.company) {
      this.companyInput.value = this.meta.company;
    }
    if (this.notesInput && this.notesInput.value !== this.meta.notes) {
      this.notesInput.value = this.meta.notes;
    }

    if (this.entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'bag-note';
      empty.textContent = 'Your Quote Bag is empty. Pick an apron, corporate tee, or full team kit from the Lookbook or Team Calculator.';
      this.itemsEl.appendChild(empty);
      this.summaryEl.innerHTML = '';
      if (this.exportBtn) this.exportBtn.disabled = true;
      if (this.copyBtn) this.copyBtn.disabled = true;
      return;
    }

    const totals = this.computeTotals();

    for (const entry of this.entries) {
      const item = getItemById(entry.itemId);
      if (!item) continue;
      const brand = BRANDING_METHODS[entry.branding] || BRANDING_METHODS.blank;
      const discountedUnit = item.price * (1 - totals.discountRate) + brand.fee;
      const lineTotal = discountedUnit * entry.quantity;

      const row = document.createElement('div');
      row.className = 'bag-row';

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      img.width = 56;
      img.height = 74;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';

      const details = document.createElement('div');
      const h3 = document.createElement('h3');
      h3.textContent = item.name;

      const meta = document.createElement('p');
      meta.textContent = `Size ${entry.size} · ${brand.label} · ${usd.format(discountedUnit)}/ea`;

      const controls = document.createElement('div');
      controls.className = 'bag-qty-controls';

      const minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.className = 'bag-qty-btn';
      minusBtn.textContent = '−';
      minusBtn.setAttribute('aria-label', `Decrease quantity for ${item.name}`);
      minusBtn.addEventListener('click', () => {
        if (entry.quantity <= 1) this.remove(entry.key);
        else this.setQty(entry.key, entry.quantity - 1);
      });

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.max = '500';
      qtyInput.value = String(entry.quantity);
      qtyInput.setAttribute('aria-label', `Quantity for ${item.name}`);
      qtyInput.style.width = '58px';
      qtyInput.style.textAlign = 'center';
      qtyInput.style.border = '1px solid var(--hairline)';
      qtyInput.style.borderRadius = '0px';
      qtyInput.style.height = '28px';
      qtyInput.addEventListener('change', () => {
        const val = Number(qtyInput.value);
        if (Number.isFinite(val) && val >= 1) {
          this.setQty(entry.key, val);
        } else {
          qtyInput.value = String(entry.quantity);
        }
      });

      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = 'bag-qty-btn';
      plusBtn.textContent = '+';
      plusBtn.setAttribute('aria-label', `Increase quantity for ${item.name}`);
      plusBtn.addEventListener('click', () => this.setQty(entry.key, entry.quantity + 1));

      const lineAmt = document.createElement('span');
      lineAmt.className = 'bag-line-total';
      lineAmt.textContent = usd.format(lineTotal);

      controls.append(minusBtn, qtyInput, plusBtn, lineAmt);
      details.append(h3, meta, controls);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'bag-remove';
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', `Remove ${item.name}`);
      removeBtn.addEventListener('click', () => this.remove(entry.key));

      row.append(img, details, removeBtn);
      this.itemsEl.appendChild(row);
    }

    const discountPct = Math.round(totals.discountRate * 100);
    this.summaryEl.innerHTML = `
      <div class="bag-sum-line"><span>Total units</span><span>${totals.totalUnits} garments</span></div>
      <div class="bag-sum-line"><span>Catalog merchandise</span><span>${usd.format(totals.baseMerch)}</span></div>
      <div class="bag-sum-line"><span>Bulk tier discount (${discountPct}%)</span><span>−${usd.format(totals.savings)}</span></div>
      <div class="bag-sum-line"><span>Custom logo application</span><span>${usd.format(totals.brandingTotal)}</span></div>
      <div class="bag-sum-line is-grand"><span>Estimated team total</span><span>${usd.format(totals.grandTotal)}</span></div>
    `;

    if (this.exportBtn) this.exportBtn.disabled = false;
    if (this.copyBtn) this.copyBtn.disabled = false;
  }

  buildQuoteText() {
    const totals = this.computeTotals();
    const lines = [
      'LOOM & STITCH — UNIFORM & APRON QUOTE SUMMARY',
      `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
    ];
    if (this.meta.company) lines.push(`Company / Venue: ${this.meta.company}`);
    if (this.meta.notes) lines.push(`Size Split & Logo Notes: ${this.meta.notes}`);
    lines.push('');

    for (const e of this.entries) {
      const item = getItemById(e.itemId);
      if (!item) continue;
      const brand = BRANDING_METHODS[e.branding] || BRANDING_METHODS.blank;
      const unit = item.price * (1 - totals.discountRate) + brand.fee;
      lines.push(
        `- ${item.name} (${item.tierLabel}) | Size: ${e.size} | Branding: ${brand.label} | Qty: ${e.quantity} @ ${usd.format(unit)} = ${usd.format(unit * e.quantity)}`
      );
    }

    lines.push('');
    lines.push(`Total Garments: ${totals.totalUnits}`);
    lines.push(`Bulk Savings (${Math.round(totals.discountRate * 100)}%): -${usd.format(totals.savings)}`);
    lines.push(`Logo Customization: ${usd.format(totals.brandingTotal)}`);
    lines.push(`ESTIMATED TEAM TOTAL: ${usd.format(totals.grandTotal)}`);
    return lines.join('\n');
  }

  exportShortlist() {
    if (this.entries.length === 0) return;
    const text = this.buildQuoteText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loom-and-stitch-quote.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast('Quote summary downloaded');
  }

  async copySummary() {
    if (this.entries.length === 0) return;
    const text = this.buildQuoteText();
    try {
      await navigator.clipboard.writeText(text);
      this.toast('Quote summary copied to clipboard');
    } catch {
      this.toast('Use Download Quote (.txt) to save locally');
    }
  }

  bindUI() {
    if (this.openBtn && this.dialog) {
      this.openBtn.addEventListener('click', () => {
        this.renderDialog();
        this.dialog.showModal();
      });
    }

    if (this.closeBtn && this.dialog) {
      this.closeBtn.addEventListener('click', () => this.dialog.close());
    }

    if (this.dialog) {
      this.dialog.addEventListener('click', (e) => {
        if (e.target !== this.dialog) return;
        const rect = this.dialog.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (!inside) {
          this.dialog.close();
        }
      });
    }

    this.companyInput?.addEventListener('input', (e) => {
      this.meta.company = e.target.value;
      this.saveMeta();
    });

    this.notesInput?.addEventListener('input', (e) => {
      this.meta.notes = e.target.value;
      this.saveMeta();
    });

    this.exportBtn?.addEventListener('click', () => this.exportShortlist());
    this.copyBtn?.addEventListener('click', () => this.copySummary());
  }
}

const bag = new QuoteBag();

const SHEET_TOKENS = [
  '--rw-panel',
  '--rw-text',
  '--rw-muted',
  '--rw-line',
  '--rw-accent',
  '--rw-on-accent',
  '--rw-btn-bg',
  '--rw-btn-fg',
  '--rw-btn-radius',
  '--rw-pill-radius',
  '--rw-bar-r',
  '--rw-thumb-radius',
  '--rw-pt-size',
  '--rw-price',
  '--rw-opt',
  '--rw-ease',
  '--rw-ease-sheet',
  '--rw-ease-spring',
];

class RunwaySection extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.panelHost = this.querySelector('#rw-panel-host');
    this.buildLookPanels();

    this.stageEl = this.querySelector('[data-rw-stage]');
    this.actorsEl = this.querySelector('[data-rw-actors]');
    this.heroes = [...this.querySelectorAll('[data-rw-hero]')];
    this.ticks = [...this.querySelectorAll('[data-rw-tick]')];
    this.panels = [...this.querySelectorAll('[data-rw-panel]')];
    this.piecesEl = this.querySelector('[data-rw-pieces]');
    this.liveEl = this.querySelector('[data-rw-live]');
    this.autoBtn = this.querySelector('[data-rw-auto]');
    this.cursorEl = this.querySelector('[data-rw-cursor]');
    this.panelWrap = this.querySelector('.rw__panel');
    this.lbEl = this.querySelector('[data-rw-lb]');
    this.lbStage = this.querySelector('[data-rw-lb-stage]');
    this.lbKicker = this.querySelector('[data-rw-lb-kicker]');
    this.lbName = this.querySelector('[data-rw-lb-name]');
    this.lbClose = this.querySelector('[data-rw-zoom-close]');

    this.n = this.heroes.length;
    this.N = this.n * Math.ceil(8 / this.n); // 12
    this.K = 95;
    this.C = 2 * Math.sqrt(this.K);
    this.speed = Math.max(1000, Number(this.dataset.speed) || 5200);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.index = 0;
    this.target = 0;
    this.cur = 0;
    this.vel = 0;
    this.still = false;
    this.visible = true;
    this.dragging = false;
    this.playing = false;
    this.engaged = false;
    this.panelHover = false;
    this.zoomed = false;
    this.suppressClickUntil = 0;
    this.wheelAcc = 0;
    this.wheelLockUntil = 0;
    this.rafId = 0;
    this.measureRaf = 0;
    this.lastFrameTime = 0;
    this.autoTimer = 0;
    this.zoomTimer = 0;
    this.resizeTimer = 0;
    this.lastW = 0;
    this.lastVh = 0;
    this.lastFrameH = 0;
    this.W = 0;
    this.H = 0;
    this.mode = 'ring';
    this.measuredMode = '';
    this.mobile = false;
    this.useSheet = false;
    this.stageRect = null;
    this.stageRectDirty = true;
    this.headerEls = [...document.querySelectorAll('.site-header')].filter((h) => !h.contains(this));

    this.pickerHome = new Map();
    this.cardToPicker = new Map();
    this.openSheetPicker = null;
    this.sheetHost = null;

    this.cursor = {
      active: false,
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      raf: 0,
      jumped: false,
      on: false,
      view: false,
      link: false,
    };

    this.setupBodies();
    this.setupImages();
    this.detectFeet();
    this.initPickers();
    this.initCursor();
    this.bindEvents();
    this.measure();
    this.initSpringStart();
    this.setIndex(0, true);
    this.renderAll();
    this.initReveal();
    this.kick();
  }

  buildLookPanels() {
    if (!this.panelHost) return;
    CATALOG.looks.forEach((look, lookIdx) => {
      const panel = document.createElement('div');
      panel.className = `rw__look-panel${lookIdx === 0 ? ' is-in' : ''}`;
      panel.dataset.rwPanel = String(lookIdx);
      panel.dataset.kitQty = '1';
      if (lookIdx !== 0) panel.hidden = true;

      const lookItems = look.products.map((pid) => getItemById(pid)).filter(Boolean);
      const baseSum = lookItems.reduce((s, it) => s + it.price, 0);
      const bundleSingle = baseSum * 0.9; // 10% kit savings on single kit

      const mhead = document.createElement('div');
      mhead.className = 'rw__mhead';
      mhead.innerHTML = `
        <span class="rw__mhead-title">${look.name}</span>
        <span class="rw__label">${lookItems.length} pieces</span>
      `;
      panel.appendChild(mhead);

      const ul = document.createElement('ul');
      ul.className = 'rw__items';
      ul.setAttribute('role', 'list');

      lookItems.forEach((item, idx) => {
        const cardNum = idx + 1;
        const li = document.createElement('li');
        li.className = 'rw__item';
        li.dataset.rwCard = String(cardNum);
        li.dataset.itemId = item.id;
        li.dataset.title = item.name;
        li.style.setProperty('--i', String(cardNum));

        const pickerId = `Picker-${lookIdx}-${cardNum}`;
        const radioNameSize = `Size-${lookIdx}-${cardNum}`;
        const radioNamePack = `Pack-${lookIdx}-${cardNum}`;
        const radioNameLogo = `Logo-${lookIdx}-${cardNum}`;

        const sizesHtml = item.sizes
          .map(
            (sz, sIdx) => `
              <label class="rw__pill">
                <input type="radio" name="${radioNameSize}" value="${sz.replace(/"/g, '&quot;')}" data-rw-opt="size" ${sz === item.defaultSize || sIdx === 0 ? 'checked' : ''}>
                <span class="rw__pill-label">${sz}</span>
              </label>
            `
          )
          .join('');

        const packsHtml = [
          { q: 1, label: '1 pc' },
          { q: 10, label: '10 pcs · -10%' },
          { q: 25, label: '25 pcs · -18%' },
          { q: 50, label: '50 pcs · -25%' },
        ]
          .map(
            (pk, pIdx) => `
              <label class="rw__pill">
                <input type="radio" name="${radioNamePack}" value="${pk.q}" data-rw-opt="qty" ${pIdx === 0 ? 'checked' : ''}>
                <span class="rw__pill-label">${pk.label}</span>
              </label>
            `
          )
          .join('');

        const logosHtml = [
          { id: 'blank', label: 'Unbranded' },
          { id: 'embroidery', label: 'Embroidery +$4.50' },
          { id: 'screenprint', label: 'Print +$2.50' },
        ]
          .map(
            (lg, lIdx) => `
              <label class="rw__pill">
                <input type="radio" name="${radioNameLogo}" value="${lg.id}" data-rw-opt="branding" ${lIdx === 0 ? 'checked' : ''}>
                <span class="rw__pill-label">${lg.label}</span>
              </label>
            `
          )
          .join('');

        li.innerHTML = `
          <div class="rw__media">
            <img src="${item.image}" alt="${item.name}" width="300" height="400" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            <span class="rw__num">${cardNum}</span>
          </div>
          <div class="rw__info">
            <span class="rw__type">${item.tierLabel}</span>
            <span class="rw__name">${item.name}</span>
            <span class="rw__price"><span>${usd.format(item.price)}</span><span class="rw__spec-note">· ${usd.format(item.price * 0.75)} at 50+</span></span>
          </div>
          <button class="rw__add" type="button" data-rw-add aria-expanded="false" aria-controls="${pickerId}" aria-label="Configure &amp; quote: ${item.name}" data-added-label="Added to quote: ${item.name}">
            <svg class="rw__add-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>
            <svg class="rw__add-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5L19.5 7"/></svg>
          </button>
          <div class="rw__picker" id="${pickerId}" data-rw-picker hidden>
            <div class="rw__picker-head">
              <img class="rw__picker-thumb" src="${item.image}" width="120" height="160" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="">
              <div class="rw__picker-meta">
                <span class="rw__picker-title">${item.name}</span>
                <span class="rw__picker-price" data-rw-pick-live>${usd.format(item.price)} / pc</span>
              </div>
              <button class="rw__picker-close" type="button" data-rw-pick-close aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
              </button>
            </div>
            <fieldset class="rw__opt">
              <legend class="rw__opt-name">Size</legend>
              <div class="rw__pills">${sizesHtml}</div>
            </fieldset>
            <fieldset class="rw__opt">
              <legend class="rw__opt-name">Pack Quantity (Volume Break)</legend>
              <div class="rw__pills">${packsHtml}</div>
            </fieldset>
            <fieldset class="rw__opt">
              <legend class="rw__opt-name">Logo Application</legend>
              <div class="rw__pills">${logosHtml}</div>
            </fieldset>
            <button class="rw__confirm" type="button" data-rw-confirm>
              <span data-rw-confirm-label>Add 1 pc to Quote — ${usd.format(item.price)}</span>
            </button>
          </div>
        `;
        ul.appendChild(li);
      });

      panel.appendChild(ul);

      const bundle = document.createElement('div');
      bundle.className = 'rw__bundle has-rule';
      bundle.innerHTML = `
        <p class="rw__msg" data-rw-msg role="status" aria-live="polite"></p>
        <div class="rw__bundle-row">
          <div class="rw__bundle-copy">
            <span class="rw__bundle-title">Outfit full uniform kit</span>
            <span class="rw__bundle-note" data-rw-kit-note>10% kit discount on all 3 pieces</span>
          </div>
          <div class="rw__bundle-price" data-rw-kit-price><s>${usd.format(baseSum)}</s><strong>${usd.format(bundleSingle)}</strong></div>
        </div>
        <div class="rw__kit-qty" role="group" aria-label="Uniform kit team quantity">
          <button type="button" class="rw__kit-qty-btn is-active" data-rw-kit-qty="1">1 kit</button>
          <button type="button" class="rw__kit-qty-btn" data-rw-kit-qty="10">10 · -10%</button>
          <button type="button" class="rw__kit-qty-btn" data-rw-kit-qty="25">25 · -18%</button>
          <button type="button" class="rw__kit-qty-btn" data-rw-kit-qty="50">50 · -25%</button>
        </div>
        <button class="rw__cta" type="button" data-rw-all>
          <span class="rw__cta-add" data-rw-cta-d>Add uniform kit to Quote Bag</span>
          <span class="rw__cta-m" data-rw-cta-m>Add kit — ${usd.format(bundleSingle)}</span>
          <svg class="rw__cta-arrow" width="22" height="12" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h24M19 1l6 6-6 6"/></svg>
        </button>
      `;
      panel.appendChild(bundle);
      this.panelHost.appendChild(panel);
    });
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.rafId);
    cancelAnimationFrame(this.measureRaf);
    cancelAnimationFrame(this.cursor.raf);
    clearTimeout(this.autoTimer);
    clearTimeout(this.zoomTimer);
    clearTimeout(this.resizeTimer);
    this.visObs?.disconnect();
    this.revealObs?.disconnect();
    this.resizeObs?.disconnect();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onScroll);
    document.removeEventListener('visibilitychange', this._onVisChange);
    this.dockSheet();
    this.sheetHost?.remove();
    this.sheetHost = null;
  }

  setupBodies() {
    const orig = [...this.actorsEl.querySelectorAll('[data-rw-model]')];
    for (let a = this.n; a < this.N; a++) {
      const clone = orig[a % this.n].cloneNode(true);
      clone.setAttribute('data-rw-clone', '');
      const img = clone.querySelector('img');
      if (img) {
        img.setAttribute('loading', 'lazy');
        img.removeAttribute('fetchpriority');
      }
      this.actorsEl.appendChild(clone);
    }

    this.bodies = [...this.actorsEl.querySelectorAll('[data-rw-model]')].map((el, a) => ({
      a,
      index: a % this.n,
      el,
      hit: el.querySelector('.rw__hit'),
      w: 0,
      x: 0,
      g: 0,
      v: 0,
      goal: 0,
      trip: false,
      from: 0,
      lastBlur: -1,
      lastHidden: null,
      lastOpacity: '',
      lastZ: '',
      lastPointer: '',
      lastTransform: '',
    }));
  }

  setupImages() {
    this.querySelectorAll('[data-model-image]').forEach((img) => this.decodeModelImage(img));
  }

  decodeModelImage(img) {
    if (!img) return;
    const mark = () => img.classList.add('is-decoded');
    if (img.complete && img.naturalWidth > 0) {
      mark();
      return;
    }
    if (typeof img.decode === 'function') {
      img.decode().then(mark).catch(() => {
        img.addEventListener('load', mark, { once: true });
      });
    } else {
      img.addEventListener('load', mark, { once: true });
    }
  }

  detectFeet() {
    this.heroes.forEach((hero, idx) => {
      const probeSrc = hero.dataset.probe;
      if (!probeSrc) return;
      const probe = new Image();
      probe.decoding = 'async';
      probe.onload = () => {
        try {
          const nw = probe.naturalWidth;
          const nh = probe.naturalHeight;
          if (!nw || !nh) return;
          const w = Math.min(48, nw);
          const h = Math.max(1, Math.round((nh / nw) * w));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(probe, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let lastOpaqueRow = h - 1;
          outer: for (let y = h - 1; y >= 0; y--) {
            const rowStart = y * w * 4;
            for (let x = 0; x < w; x++) {
              if (data[rowStart + x * 4 + 3] > 12) {
                lastOpaqueRow = y;
                break outer;
              }
            }
          }
          const footPad = Math.max(0, (h - 1 - lastOpaqueRow) / h);
          if (footPad > 0.002 && footPad < 0.25) {
            const val = footPad.toFixed(4);
            hero.style.setProperty('--rw-foot', val);
            this.bodies.forEach((b) => {
              if (b.index === idx) b.el.style.setProperty('--rw-foot', val);
            });
          }
        } catch {
          // ignore canvas errors
        }
      };
      probe.src = probeSrc;
    });
  }

  initSpringStart() {
    const start = this.reducedMotion ? 0 : 1.15;
    this.target = 0;
    this.cur = -start;
    this.vel = 0;
    for (const b of this.bodies) {
      const goal = this.wrapN(b.a - this.target);
      b.goal = goal;
      b.x = goal + start;
      b.g = goal + start;
      b.v = 0;
      b.trip = false;
      b.from = b.x;
    }
  }

  initReveal() {
    this.classList.add('rw--js');
    if (this.reducedMotion) {
      this.classList.add('is-revealed');
      this.setStill(true);
      this.renderAll();
      return;
    }

    this.revealObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.revealObs.disconnect();
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                this.classList.add('is-revealed');
                if (this.dataset.autoplay === 'true') {
                  this.play(true);
                }
              });
            });
            break;
          }
        }
      },
      { threshold: 0 }
    );
    this.revealObs.observe(this);
  }

  initCursor() {
    if (!this.finePointer || !this.cursorEl) {
      this.cursorEl?.remove();
      this.cursorEl = null;
      return;
    }
    this.classList.add('rw--cursor');
  }

  bindEvents() {
    this.visObs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        this.visible = entry.isIntersecting;
        if (this.visible) {
          this.kick();
          if (this.playing) this.scheduleAutoplay();
        } else {
          clearTimeout(this.autoTimer);
        }
      },
      { threshold: 0 }
    );
    this.visObs.observe(this);

    if (this.stageEl) {
      this.resizeObs = new ResizeObserver(() => this.scheduleMeasure());
      this.resizeObs.observe(this.stageEl);
    }

    this._onResize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.scheduleMeasure(), 120);
    };
    window.addEventListener('resize', this._onResize, { passive: true });

    this._onScroll = () => {
      this.stageRectDirty = true;
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });

    this._onVisChange = () => {
      if (!document.hidden && this.visible) {
        this.lastFrameTime = 0;
        this.kick();
        if (this.playing) this.restartBar();
      } else {
        clearTimeout(this.autoTimer);
      }
    };
    document.addEventListener('visibilitychange', this._onVisChange);

    if (this.panelWrap) {
      this.panelWrap.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        this.panelHover = true;
      });
      this.panelWrap.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        this.panelHover = false;
        if (this.playing && !this.engaged && !this.zoomed) {
          this.restartBar();
        }
      });
      this.panelWrap.addEventListener('click', (e) => {
        if (e.target.closest('button, a, input, select, label')) {
          this.engage();
        }
      });
      this.panelWrap.addEventListener('change', (e) => {
        this.engage();
        this.handleOptionChange(e);
      });
      this.panelWrap.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('[data-rw-card]');
        if (card) {
          this.hot(Number(card.dataset.rwCard), false);
        }
      });
      this.panelWrap.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('[data-rw-card]');
        if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
          this.clearHot();
        }
      });
    }

    this.addEventListener('click', (e) => {
      if (performance.now() < this.suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.routeClick(e);
    }, true);

    if (this.stageEl) {
      this.stageEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        }
      });
    }

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.openSheetPicker) {
          e.preventDefault();
          const card = this.closeSheet(true);
          card?.querySelector('[data-rw-add]')?.focus();
        } else if (this.zoomed) {
          e.preventDefault();
          this.closeZoom();
        }
      }
    });

    this.bindStagePointer();
  }

  routeClick(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const kitQtyBtn = t.closest('[data-rw-kit-qty]');
    if (kitQtyBtn) {
      e.preventDefault();
      const panel = kitQtyBtn.closest('[data-rw-panel]');
      if (panel) {
        this.setPanelKitQty(panel, Number(kitQtyBtn.dataset.rwKitQty || 1));
      }
      return;
    }

    const pickClose = t.closest('[data-rw-pick-close]');
    if (pickClose) {
      e.preventDefault();
      this.closeSheet(true);
      return;
    }

    const zoomClose = t.closest('[data-rw-zoom-close]');
    if (zoomClose) {
      e.preventDefault();
      this.closeZoom();
      return;
    }

    if (this.zoomed && t.closest('[data-rw-lb]') && !t.closest('.rw__lb-model') && !t.closest('.rw__lb-top')) {
      e.preventDefault();
      this.closeZoom();
      return;
    }

    const zoomTrigger = t.closest('[data-rw-zoom]');
    if (zoomTrigger) {
      e.preventDefault();
      this.openZoom();
      return;
    }

    const nextBtn = t.closest('[data-rw-next]');
    if (nextBtn) {
      e.preventDefault();
      this.next();
      return;
    }

    const prevBtn = t.closest('[data-rw-prev]');
    if (prevBtn) {
      e.preventDefault();
      this.prev();
      return;
    }

    const tickBtn = t.closest('[data-rw-tick]');
    if (tickBtn) {
      e.preventDefault();
      this.go(Number(tickBtn.dataset.rwTick));
      return;
    }

    const autoBtn = t.closest('[data-rw-auto]');
    if (autoBtn) {
      e.preventDefault();
      if (!this.playing) this.engaged = false;
      this.play(!this.playing);
      return;
    }

    const pinBtn = t.closest('[data-rw-pin]');
    if (pinBtn) {
      e.preventDefault();
      this.engage();
      this.hot(Number(pinBtn.dataset.rwPin), true);
      return;
    }

    const goBtn = t.closest('[data-rw-go]');
    if (goBtn) {
      e.preventDefault();
      const bodyEl = goBtn.closest('[data-rw-model]');
      const body = this.bodies.find((b) => b.el === bodyEl);
      if (body) {
        const k = this.bodyRank(body);
        if (k === 0) {
          this.openZoom();
        } else if (Math.abs(k) < 6) {
          this.moveTo(Math.round(this.target) + k);
        }
      }
      return;
    }

    const confirmBtn = t.closest('[data-rw-confirm]');
    if (confirmBtn) {
      e.preventDefault();
      const picker = confirmBtn.closest('[data-rw-picker]');
      const card = this.getCardForPicker(picker);
      if (card) {
        this.confirmSingle(card);
      }
      return;
    }

    const addBtn = t.closest('[data-rw-add]');
    if (addBtn) {
      e.preventDefault();
      const card = addBtn.closest('[data-rw-card]');
      if (card) {
        this.toggleCardPicker(card);
      }
      return;
    }

    const allBtn = t.closest('[data-rw-all]');
    if (allBtn) {
      e.preventDefault();
      const panel = allBtn.closest('[data-rw-panel]');
      if (panel) {
        this.addFullLook(panel, allBtn);
      }
    }
  }

  bindStagePointer() {
    if (!this.stageEl) return;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startTarget = 0;
    let isDrag = false;
    let abandoned = false;
    let samples = [];

    const refreshStageRect = () => {
      if (!this.stageRect || this.stageRectDirty) {
        this.stageRect = this.stageEl.getBoundingClientRect();
        this.stageRectDirty = false;
      }
      return this.stageRect;
    };

    const updateCursorTarget = (e) => {
      if (!this.cursorEl || e.pointerType !== 'mouse') return;
      const rect = refreshStageRect();
      this.cursor.tx = e.clientX - rect.left;
      this.cursor.ty = e.clientY - rect.top;
      if (!this.cursor.jumped) {
        this.cursor.x = this.cursor.tx;
        this.cursor.y = this.cursor.ty;
        this.cursor.jumped = true;
        this.cursorEl.style.transform = `translate3d(${this.cursor.x.toFixed(2)}px, ${this.cursor.y.toFixed(2)}px, 0)`;
      }
      if (!this.cursor.on) {
        this.cursor.on = true;
        this.cursorEl.classList.add('is-on');
      }

      const el = e.target instanceof Element ? e.target : null;
      const isZoom = Boolean(!isDrag && el && el.closest('[data-rw-zoom]') && el.closest('.rw__hero.is-on'));
      const isLink = Boolean(!isDrag && !isZoom && el && el.closest('[data-rw-pin], [data-rw-go]'));
      if (isZoom !== this.cursor.view) {
        this.cursor.view = isZoom;
        this.cursorEl.classList.toggle('is-view', isZoom);
      }
      if (isLink !== this.cursor.link) {
        this.cursor.link = isLink;
        this.cursorEl.classList.toggle('is-link', isLink);
      }

      if (!this.cursor.raf) {
        const tickCursor = () => {
          this.cursor.raf = 0;
          const f = this.reducedMotion ? 1 : 0.18;
          this.cursor.x += (this.cursor.tx - this.cursor.x) * f;
          this.cursor.y += (this.cursor.ty - this.cursor.y) * f;
          this.cursorEl.style.transform = `translate3d(${this.cursor.x.toFixed(2)}px, ${this.cursor.y.toFixed(2)}px, 0)`;
          if (Math.hypot(this.cursor.tx - this.cursor.x, this.cursor.ty - this.cursor.y) >= 0.2) {
            this.cursor.raf = requestAnimationFrame(tickCursor);
          }
        };
        this.cursor.raf = requestAnimationFrame(tickCursor);
      }
    };

    this.stageEl.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !this.cursorEl) return;
      this.stageRectDirty = true;
      refreshStageRect();
    });

    this.stageEl.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || !this.cursorEl) return;
      cancelAnimationFrame(this.cursor.raf);
      this.cursor.raf = 0;
      this.cursorEl.classList.remove('is-on', 'is-link', 'is-view');
      this.cursor.jumped = false;
      this.cursor.on = false;
      this.cursor.view = false;
      this.cursor.link = false;
    });

    this.stageEl.addEventListener('pointerdown', (e) => {
      if (this.zoomed) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest('.rw__view-btn')) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTarget = this.target;
      isDrag = false;
      abandoned = false;
      samples = [{ x: e.clientX, time: performance.now() }];
    });

    this.stageEl.addEventListener('pointermove', (e) => {
      updateCursorTarget(e);
      if (pointerId !== e.pointerId || abandoned) return;
      if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) {
        finishDrag(e);
        return;
      }
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!isDrag) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
          abandoned = true;
          pointerId = null;
          return;
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
          isDrag = true;
          this.dragging = true;
          this.classList.add('is-dragging');
          this.setStill(false);
          try {
            this.stageEl.setPointerCapture(pointerId);
          } catch {
            // ignore
          }
        } else {
          return;
        }
      }

      samples.push({ x: e.clientX, time: performance.now() });
      if (samples.length > 6) samples.shift();

      const unit = this.getDragUnit();
      this.target = startTarget - dx / unit;
      this.kick();
    });

    const finishDrag = (e) => {
      if (pointerId !== e.pointerId) return;
      const wasDrag = isDrag;
      const dx = e.clientX - startX;
      pointerId = null;
      isDrag = false;
      abandoned = false;

      if (!wasDrag) return;

      this.dragging = false;
      this.classList.remove('is-dragging');
      this.suppressClickUntil = performance.now() + 60;
      try {
        this.stageEl.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      const first = samples[0] || { x: startX, time: performance.now() };
      const last = samples[samples.length - 1] || { x: e.clientX, time: performance.now() };
      const dt = Math.max(1, last.time - first.time);
      const vx = (last.x - first.x) / dt;
      const sign = -1;
      const from = Math.round(startTarget);
      const unit = this.getDragUnit();

      if (this.mobile) {
        if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) {
          this.moveTo(from + sign * (dx > 0 ? 1 : -1));
        } else {
          this.moveTo(from);
        }
      } else {
        let i = Math.round(this.target + (sign * vx * 160) / unit);
        if (i === from && Math.abs(vx) > 0.3) {
          i = from + (vx < 0 ? 1 : -1);
        }
        i = clamp(i, from - 2, from + 2);
        this.moveTo(i);
      }
    };

    this.stageEl.addEventListener('pointerup', finishDrag);
    this.stageEl.addEventListener('pointercancel', finishDrag);

    this.stageEl.addEventListener(
      'wheel',
      (e) => {
        if (this.zoomed) return;
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        const now = performance.now();
        if (now < this.wheelLockUntil) {
          this.wheelAcc = 0;
          return;
        }
        this.wheelAcc += e.deltaX;
        if (Math.abs(this.wheelAcc) > 45) {
          if (this.wheelAcc > 0) this.next();
          else this.prev();
          this.wheelAcc = 0;
          this.wheelLockUntil = now + 520;
        }
      },
      { passive: false }
    );
  }

  getDragUnit() {
    if (this.mode === 'ring') {
      return Math.max(this.mobile ? 90 : 120, 0.3 * this.W);
    }
    return Math.max(90, this.W * 0.32 * 1.6);
  }

  wrapN(v) {
    return ((v % this.N) + this.N) % this.N;
  }

  wrapLook(v) {
    return ((v % this.n) + this.n) % this.n;
  }

  wrapPi(phi) {
    let p = ((phi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    if (p <= -Math.PI) p += 2 * Math.PI;
    return p;
  }

  bodyRank(body) {
    if (this.mode === 'ring') {
      const step = (2 * Math.PI) / this.N;
      const phi = this.wrapPi((body.a - this.target) * step);
      return Math.round(phi / step);
    }
    return Math.round(this.wrapN(body.a - this.target));
  }

  scheduleMeasure() {
    if (this.measureRaf) return;
    this.measureRaf = requestAnimationFrame(() => {
      this.measureRaf = 0;
      this.measure();
    });
  }

  measure() {
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const mobile = iw <= 749;
    const useSheet = mobile || (iw >= 750 && iw <= 1099 && ih > iw);
    const wasMobile = this.mobile;
    const wasUseSheet = this.useSheet;
    const prevMode = this.measuredMode;
    this.mobile = mobile;
    this.useSheet = useSheet;
    this.mode = mobile ? (this.dataset.mstyle || 'ring') : (this.dataset.style || 'ring');

    if (!useSheet && wasUseSheet) {
      this.dockAllPickers();
    }

    if (!this.lastW || iw !== this.lastW || Math.abs(ih - this.lastVh) >= 160) {
      this.lastW = iw;
      this.lastVh = ih;
    }

    let headerH = 0;
    for (const h of this.headerEls) {
      if (h.isConnected) {
        const rect = h.getBoundingClientRect();
        if (rect.height > 0) headerH += rect.height;
      }
    }

    const minFrameH = ih <= 520 ? 340 : 480;
    let frameH;
    if (!mobile && this.dataset.fit === 'true') {
      frameH = Math.max(minFrameH, ih - headerH);
    } else if (mobile && this.dataset.mheightMode === 'custom') {
      const pct = clamp(Number(this.dataset.mheightVh) || 109, 50, 120);
      frameH = Math.max(540, (this.lastVh * pct) / 100);
    } else {
      frameH = Math.max(minFrameH, ih - headerH);
    }
    const roundedFrameH = Math.round(frameH);
    if (roundedFrameH !== this.lastFrameH) {
      this.lastFrameH = roundedFrameH;
      this.style.setProperty('--rw-frame-h', `${roundedFrameH}px`);
    }

    if (!this.stageEl) return;
    const rect = this.stageEl.getBoundingClientRect();
    this.stageRect = rect;
    this.stageRectDirty = false;

    const dimsChanged =
      rect.width !== this.W ||
      rect.height !== this.H ||
      mobile !== wasMobile ||
      this.mode !== prevMode;

    this.W = rect.width;
    this.H = rect.height;

    if (!dimsChanged) return;
    this.measuredMode = this.mode;

    const fs = this.mode === 'ring' ? (mobile ? 1.12 : 1.10) : 1;
    this.stageEl.style.setProperty('--rw-fs', String(fs));

    const hy = this.mode === 'ring' ? (mobile ? 18 : 26) : (mobile ? 16 : 26);
    const topGap = mobile ? 8 : 12;
    const maxByH =
      this.mode === 'ring'
        ? Math.round(((this.H - hy - topGap) * 1.12) / fs)
        : Math.round((this.H - hy - topGap) * 1.10);
    const maxByW = Math.round(((this.W * (mobile ? 0.96 : 0.72)) / 0.5581) / fs);
    const modelH = Math.max(220, Math.min(maxByH, maxByW));
    this.stageEl.style.setProperty('--rw-model-h', `${modelH}px`);

    const hx = this.mode === 'ring' ? 0.5 * this.W : (mobile ? 0.3 : 0.4) * this.W;
    this.stageEl.style.setProperty('--rw-hx', `${hx.toFixed(1)}px`);
    this.stageEl.style.setProperty('--rw-hy', `${hy}px`);
    this.style.setProperty('--rw-ax', `${(this.W > 0 ? (hx / this.W) * 100 : 40).toFixed(2)}%`);

    const bodyW = this.bodies[0]?.el.offsetWidth || modelH * 0.5581;
    for (const b of this.bodies) {
      b.w = bodyW;
    }

    if (this.zoomed) {
      this.sizeLightboxModel();
    }

    if (this.mode !== prevMode) {
      this.updateBodyAccessibility();
    }
    this.renderAll();
  }

  setStill(val) {
    if (this.still === val) return;
    this.still = val;
    this.classList.toggle('rw--still', val);
  }

  updateBodyAccessibility() {
    for (const b of this.bodies) {
      const k = this.bodyRank(b);
      const maxK = this.mode === 'ring' ? (this.mobile ? 1 : 2) : 3;
      const active = k !== 0 && Math.abs(k) <= maxK;
      if (active) {
        b.el.removeAttribute('aria-hidden');
        if (b.hit) b.hit.tabIndex = 0;
      } else {
        b.el.setAttribute('aria-hidden', 'true');
        if (b.hit) b.hit.tabIndex = -1;
      }
    }
  }

  setIndex(i, silent = false) {
    const nextIdx = this.wrapLook(i);
    const prevIdx = this.index;
    this.index = nextIdx;
    this.wheelAcc = 0;
    this.kick();
    this.updateBodyAccessibility();

    if (!silent) {
      if (this.zoomed) this.closeZoom();
      if (this.openSheetPicker) this.closeSheet(false);
    }

    this.style.setProperty('--rw-progress', ((nextIdx + 1) / this.n).toFixed(3));

    this.heroes.forEach((hero, idx) => {
      const on = idx === nextIdx;
      const was = !silent && idx === prevIdx && prevIdx !== nextIdx;
      hero.classList.toggle('is-on', on);
      hero.classList.toggle('was', was);
      hero.setAttribute('aria-hidden', on ? 'false' : 'true');
      const zoomBtn = hero.querySelector('[data-rw-zoom]');
      if (zoomBtn) zoomBtn.tabIndex = on ? 0 : -1;
    });

    this.ticks.forEach((tick, idx) => {
      tick.setAttribute('aria-current', idx === nextIdx ? 'true' : 'false');
      tick.classList.toggle('is-past', idx < nextIdx);
    });

    if (!silent) {
      if (!this.reducedMotion && this.stageEl) {
        this.stageEl.classList.remove('is-sweep');
        void this.stageEl.offsetWidth;
        this.stageEl.classList.add('is-sweep');
      }

      const hero = this.heroes[nextIdx];
      if (this.liveEl && hero) {
        this.liveEl.textContent = hero.dataset.label || `Kit ${nextIdx + 1}`;
      }

      this.panels.forEach((panel, idx) => {
        const show = idx === nextIdx;
        panel.hidden = !show;
        panel.classList.remove('is-in');
      });
      const activePanel = this.panels[nextIdx];
      if (activePanel) {
        if (!this.reducedMotion) void activePanel.offsetWidth;
        activePanel.classList.add('is-in');
      }

      this.clearHot();
      if (this.playing) {
        this.restartBar();
      }
    }
  }

  moveTo(T) {
    this.target = T;
    this.setStill(false);
    this.setIndex(Math.round(T));
  }

  next() {
    this.moveTo(Math.round(this.target) + 1);
  }

  prev() {
    this.moveTo(Math.round(this.target) - 1);
  }

  go(i) {
    let d = (i - this.index) % this.n;
    if (d < 0) d += this.n;
    if (d > this.n / 2) d -= this.n;
    this.moveTo(Math.round(this.target) + d);
  }

  play(on) {
    this.playing = Boolean(on);
    if (this.autoBtn) {
      const label = this.playing ? 'Pause autoplay' : 'Play autoplay';
      this.autoBtn.classList.toggle('is-playing', this.playing);
      this.autoBtn.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
      this.autoBtn.setAttribute('aria-label', label);
      this.autoBtn.setAttribute('title', label);
    }
    clearTimeout(this.autoTimer);
    if (this.playing) {
      this.restartBar();
    } else {
      this.ticks.forEach((t) => t.classList.remove('is-run'));
    }
  }

  restartBar() {
    this.ticks.forEach((t) => t.classList.remove('is-run'));
    if (!this.reducedMotion && this.ticks.length) void this.ticks[0].offsetWidth;
    if (this.playing) {
      this.ticks[this.index]?.classList.add('is-run');
      this.scheduleAutoplay();
    }
  }

  scheduleAutoplay() {
    clearTimeout(this.autoTimer);
    if (!this.playing || !this.visible) return;
    this.autoTimer = window.setTimeout(() => {
      if (
        this.playing &&
        this.visible &&
        !this.dragging &&
        !document.hidden &&
        !this.panelHover &&
        !this.zoomed &&
        !this.engaged
      ) {
        this.next();
      } else if (this.playing) {
        this.restartBar();
      }
    }, this.speed);
  }

  engage() {
    if (this.engaged) return;
    this.engaged = true;
    this.play(false);
  }

  kick() {
    if (this.rafId || !this.visible || document.hidden) return;
    this.lastFrameTime = 0;
    this.rafId = requestAnimationFrame((now) => this.loop(now));
  }

  loop(now) {
    this.rafId = 0;
    if (!this.visible || document.hidden) return;

    const dt = this.lastFrameTime ? Math.min(0.034, (now - this.lastFrameTime) / 1000) : 1 / 60;
    this.lastFrameTime = now;

    if (this.reducedMotion) {
      this.cur = this.target;
      this.vel = 0;
      this.setStill(true);
      this.renderAll();
      return;
    }

    let moving = this.dragging;
    const h = dt / 3;
    for (let s = 0; s < 3; s++) {
      const acc = -this.K * (this.cur - this.target) - this.C * this.vel;
      this.vel += acc * h;
      this.cur += this.vel * h;
    }
    if (!this.dragging && Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005) {
      this.cur = this.target;
      this.vel = 0;
    } else {
      moving = true;
    }

    if (moving) {
      this.setStill(false);
      this.renderAll();
      this.rafId = requestAnimationFrame((t) => this.loop(t));
    } else {
      this.setStill(true);
      this.renderAll();
    }
  }

  put(b, x, bottom, scale, opacity, blur, z) {
    const halfW = (b.w * scale) / 2;
    if (x + halfW < -4 || x - halfW > this.W + 4) {
      opacity = 0;
    }

    const hidden = opacity < 0.01;
    if (hidden) {
      if (b.lastHidden !== true) {
        b.lastHidden = true;
        b.el.style.visibility = 'hidden';
        if (b.lastOpacity !== '0') {
          b.lastOpacity = '0';
          b.el.style.opacity = '0';
        }
        if (b.lastPointer !== 'none') {
          b.lastPointer = 'none';
          b.el.style.pointerEvents = 'none';
        }
      }
      return;
    }

    if (b.lastHidden !== false) {
      b.lastHidden = false;
      b.el.style.visibility = '';
    }

    const transform = `translate3d(${x.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    if (transform !== b.lastTransform) {
      b.lastTransform = transform;
      b.el.style.transform = transform;
    }

    const opStr = opacity >= 0.999 ? '1' : opacity.toFixed(3);
    if (opStr !== b.lastOpacity) {
      b.lastOpacity = opStr;
      b.el.style.opacity = opStr;
    }

    const zStr = String(Math.round(z));
    if (zStr !== b.lastZ) {
      b.lastZ = zStr;
      b.el.style.zIndex = zStr;
    }

    const ptr = opacity < 0.5 ? 'none' : '';
    if (ptr !== b.lastPointer) {
      b.lastPointer = ptr;
      b.el.style.pointerEvents = ptr;
    }

    const blurOn = this.mobile ? this.dataset.mblur === 'true' : this.dataset.blur === 'true';
    const roundedBlur = blurOn ? Math.round(blur * 4) / 4 : 0;
    if (roundedBlur !== b.lastBlur) {
      b.lastBlur = roundedBlur;
      b.el.style.filter = roundedBlur > 0.05 ? `blur(${roundedBlur}px)` : '';
    }
  }

  renderAll() {
    if (!this.W || !this.H) return;

    const cx = 0.5 * this.W;
    const R = (this.mobile ? 0.56 : 0.62) * this.W;
    const P = (this.mobile ? 0.85 : 1.65) * this.W;
    const floor = this.H - (this.mobile ? 18 : 26);
    const horizon = 0.34 * this.H;
    const step = (2 * Math.PI) / this.N;
    const fs = this.mobile ? 1.12 : 1.10;

    for (const b of this.bodies) {
      const phi = this.wrapPi((b.a - this.cur) * step);
      const z = R * (1 - Math.cos(phi));
      const persp = P / (P + z);
      const sl = Math.abs(phi) / step;
      const scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
      const x = cx + R * Math.sin(phi) * persp;
      const feet = horizon + (floor - horizon) * persp;
      const bottom = this.H - feet;
      const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      let opacity = this.mobile
        ? clamp((Math.cos(phi) - 0.58) / 0.22, 0, 1)
        : clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
      if (this.still && sl < 0.02) {
        opacity = 0;
      }
      const zIndex = Math.round(scale * 1000);
      this.put(b, x, bottom, scale, opacity, blur, zIndex);
    }
  }

  clearHot() {
    this.querySelectorAll('.is-hot').forEach((el) => el.classList.remove('is-hot'));
  }

  hot(n, scroll = false) {
    this.clearHot();
    const pinScope = this.zoomed ? this.lbStage : this.heroes[this.index];
    pinScope?.querySelector(`[data-rw-pin="${n}"]`)?.classList.add('is-hot');
    const panel = this.panels[this.index];
    const card = panel?.querySelector(`[data-rw-card="${n}"]`);
    if (card) {
      card.classList.add('is-hot');
      if (scroll) {
        this.revealCard(card, panel);
      }
    }
  }

  revealCard(card, panel) {
    const list = panel.querySelector('.rw__items');
    if (!list) return;
    const behavior = this.reducedMotion ? 'auto' : 'smooth';

    if (list.scrollWidth > list.clientWidth + 2) {
      const cardRect = card.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      list.scrollTo({
        left: list.scrollLeft + (cardRect.left - listRect.left) - 16,
        behavior,
      });
    } else if (list.scrollHeight > list.clientHeight + 2) {
      list.scrollTo({
        top: Math.max(0, card.offsetTop - list.offsetTop - 10),
        behavior,
      });
    }
  }

  initPickers() {
    this.querySelectorAll('[data-rw-card]').forEach((card) => {
      const picker = card.querySelector('[data-rw-picker]');
      if (!picker) return;
      this.pickerHome.set(picker, { card, next: picker.nextSibling });
      this.cardToPicker.set(card, picker);
      this.syncPicker(card);
    });
  }

  getPickerForCard(card) {
    if (!card) return null;
    return this.cardToPicker.get(card) || card.querySelector('[data-rw-picker]');
  }

  getCardForPicker(picker) {
    if (!picker) return null;
    const home = this.pickerHome.get(picker);
    return home ? home.card : picker.closest('[data-rw-card]');
  }

  handleOptionChange(e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || !target.matches('[data-rw-opt]')) return;
    const picker = target.closest('[data-rw-picker]');
    const card = this.getCardForPicker(picker);
    if (card) {
      this.syncPicker(card);
    }
  }

  readPickerSelection(card) {
    const picker = this.getPickerForCard(card);
    const item = getItemById(card?.dataset.itemId || '');
    if (!picker || !item) return null;

    const sizeInput = picker.querySelector('input[data-rw-opt="size"]:checked');
    const qtyInput = picker.querySelector('input[data-rw-opt="qty"]:checked');
    const logoInput = picker.querySelector('input[data-rw-opt="branding"]:checked');

    const size = sizeInput ? sizeInput.value : item.defaultSize;
    const quantity = qtyInput ? Number(qtyInput.value) || 1 : 1;
    const branding = logoInput ? logoInput.value : 'blank';

    return { item, size, quantity, branding, picker };
  }

  syncPicker(card) {
    const sel = this.readPickerSelection(card);
    if (!sel) return;
    const { item, quantity, branding, picker } = sel;
    const brandObj = BRANDING_METHODS[branding] || BRANDING_METHODS.blank;
    const disc = getDiscountRate(quantity);
    const unit = item.price * (1 - disc) + brandObj.fee;
    const lineTotal = unit * quantity;

    const livePrice = picker.querySelector('[data-rw-pick-live]');
    if (livePrice) {
      livePrice.textContent = `${usd.format(unit)} / pc${disc > 0 ? ` (${Math.round(disc * 100)}% bulk off)` : ''}`;
    }
    const label = picker.querySelector('[data-rw-confirm-label]');
    if (label) {
      label.textContent = `Add ${quantity} ${quantity === 1 ? 'pc' : 'pcs'} to Quote — ${usd.format(lineTotal)}`;
    }
  }

  setPanelKitQty(panel, kitQty) {
    const lookIdx = Number(panel.dataset.rwPanel);
    const look = CATALOG.looks[lookIdx];
    if (!look) return;

    panel.dataset.kitQty = String(kitQty);
    panel.querySelectorAll('[data-rw-kit-qty]').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.rwKitQty) === kitQty);
    });

    const items = look.products.map((pid) => getItemById(pid)).filter(Boolean);
    const totalUnits = kitQty * items.length;
    const bulkDisc = Math.max(0.1, getDiscountRate(totalUnits)); // minimum 10% kit discount
    const retailSum = items.reduce((s, it) => s + it.price, 0) * kitQty;
    const finalSum = retailSum * (1 - bulkDisc);

    const noteEl = panel.querySelector('[data-rw-kit-note]');
    if (noteEl) {
      noteEl.textContent = `${Math.round(bulkDisc * 100)}% kit + team savings · ${totalUnits} total garments`;
    }
    const priceEl = panel.querySelector('[data-rw-kit-price]');
    if (priceEl) {
      priceEl.innerHTML = `<s>${usd.format(retailSum)}</s><strong>${usd.format(finalSum)}</strong>`;
    }
    const ctaD = panel.querySelector('[data-rw-cta-d]');
    if (ctaD) {
      ctaD.textContent = kitQty === 1 ? 'Add uniform kit to Quote Bag' : `Add ${kitQty}x team kits to Quote Bag`;
    }
    const ctaM = panel.querySelector('[data-rw-cta-m]');
    if (ctaM) {
      ctaM.textContent = `Add ${kitQty} ${kitQty === 1 ? 'kit' : 'kits'} — ${usd.format(finalSum)}`;
    }
  }

  toggleCardPicker(card) {
    const picker = this.getPickerForCard(card);
    if (!picker) return;
    const isOpen = this.useSheet ? this.openSheetPicker === picker : !picker.hidden;
    if (isOpen) {
      if (this.useSheet) this.closeSheet(true);
      else this.closeInlinePicker(card, picker);
      return;
    }
    if (this.useSheet) this.openSheet(card, picker);
    else this.openInlinePicker(card, picker);
  }

  openInlinePicker(card, picker) {
    picker.hidden = false;
    card.classList.add('is-picking');
    card.querySelector('[data-rw-add]')?.setAttribute('aria-expanded', 'true');
    const panel = card.closest('[data-rw-panel]');
    if (panel) this.revealCard(card, panel);
  }

  closeInlinePicker(card, picker) {
    picker.hidden = true;
    card.classList.remove('is-picking');
    card.querySelector('[data-rw-add]')?.setAttribute('aria-expanded', 'false');
  }

  ensureSheetHost() {
    if (!this.sheetHost) {
      const host = document.createElement('div');
      host.className = 'rw-sheet-host';

      const scrim = document.createElement('button');
      scrim.className = 'rw__pick-scrim';
      scrim.type = 'button';
      scrim.setAttribute('data-rw-pick-close', '');
      scrim.tabIndex = -1;
      scrim.setAttribute('aria-hidden', 'true');
      host.appendChild(scrim);

      host.addEventListener('click', (e) => this.routeClick(e));
      host.addEventListener('change', (e) => {
        this.engage();
        this.handleOptionChange(e);
      });
      host.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.openSheetPicker) {
          e.preventDefault();
          const card = this.closeSheet(true);
          card?.querySelector('[data-rw-add]')?.focus();
        }
      });

      document.body.appendChild(host);
      this.sheetHost = host;
    }

    const cs = getComputedStyle(this);
    for (const token of SHEET_TOKENS) {
      const val = cs.getPropertyValue(token).trim();
      if (val) this.sheetHost.style.setProperty(token, val);
    }
    return this.sheetHost;
  }

  openSheet(card, picker) {
    if (this.openSheetPicker) this.closeSheet(false);
    const host = this.ensureSheetHost();
    picker.hidden = false;
    host.appendChild(picker);
    void host.offsetWidth;
    host.classList.add('is-open');
    this.classList.add('rw--picking');
    this.openSheetPicker = picker;
    card.classList.add('is-picking');
    card.querySelector('[data-rw-add]')?.setAttribute('aria-expanded', 'true');
  }

  dockPickerToHome(picker) {
    const home = this.pickerHome.get(picker);
    if (!home) return null;
    picker.hidden = true;
    home.card.classList.remove('is-picking');
    home.card.querySelector('[data-rw-add]')?.setAttribute('aria-expanded', 'false');
    if (picker.parentNode !== home.card) {
      if (home.next && home.next.parentNode === home.card) {
        home.card.insertBefore(picker, home.next);
      } else {
        home.card.appendChild(picker);
      }
    }
    return home.card;
  }

  closeSheet(restoreFocus) {
    if (!this.openSheetPicker) return null;
    const picker = this.openSheetPicker;
    this.openSheetPicker = null;
    this.sheetHost?.classList.remove('is-open');
    this.classList.remove('rw--picking');

    const card = this.dockPickerToHome(picker);
    if (card && restoreFocus) {
      card.querySelector('[data-rw-add]')?.focus({ preventScroll: true });
    }
    return card;
  }

  dockSheet() {
    this.closeSheet(false);
  }

  dockAllPickers() {
    this.closeSheet(false);
    for (const picker of this.pickerHome.keys()) {
      this.dockPickerToHome(picker);
    }
  }

  markCardAdded(card) {
    const picker = this.getPickerForCard(card);
    if (picker) {
      if (this.openSheetPicker === picker) this.closeSheet(false);
      else this.closeInlinePicker(card, picker);
    }
    card.classList.remove('is-picking');
    card.classList.add('is-added');
  }

  confirmSingle(card) {
    const sel = this.readPickerSelection(card);
    if (!sel) return;
    bag.add([
      {
        itemId: sel.item.id,
        size: sel.size,
        quantity: sel.quantity,
        branding: sel.branding,
      },
    ]);
    this.markCardAdded(card);
  }

  addFullLook(panel) {
    const kitQty = Number(panel.dataset.kitQty || 1);
    const cards = [...panel.querySelectorAll('[data-rw-card]')];
    const itemsToAdd = [];
    for (const c of cards) {
      const sel = this.readPickerSelection(c);
      if (sel) {
        itemsToAdd.push({
          itemId: sel.item.id,
          size: sel.size,
          quantity: kitQty,
          branding: sel.branding,
        });
        this.markCardAdded(c);
      }
    }
    if (itemsToAdd.length > 0) {
      bag.add(itemsToAdd);
      const msgEl = panel.querySelector('[data-rw-msg]');
      if (msgEl) {
        msgEl.textContent = `${kitQty}x uniform kit added — open Quote Bag to customize size splits.`;
      }
    }
  }

  sizeLightboxModel() {
    if (!this.lbStage) return;
    const modelWrap = this.lbStage.querySelector('.rw__lb-model');
    if (!modelWrap) return;
    const rect = this.lbStage.getBoundingClientRect();
    const h = Math.max(200, Math.min(rect.height * 1.10, (rect.width * 0.96) / 0.5581));
    modelWrap.style.setProperty('--rw-model-h', `${Math.round(h)}px`);
    const lbFig = modelWrap.querySelector('.rw__figure');
    if (lbFig && !modelWrap.style.transform) {
      modelWrap._restRect = lbFig.getBoundingClientRect();
    }
  }

  openZoom() {
    if (this.zoomed || !this.lbEl || !this.lbStage) return;
    const hero = this.heroes[this.index];
    if (!hero) return;

    this.engage();
    this.clearHot();
    clearTimeout(this.zoomTimer);

    this.lbStage.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'rw__lb-model';
    const foot = hero.style.getPropertyValue('--rw-foot');
    if (foot) wrap.style.setProperty('--rw-foot', foot);

    const shadow = hero.querySelector('.rw__shadow')?.cloneNode(true);
    const figure = hero.querySelector('.rw__figure')?.cloneNode(true);
    if (!figure) return;

    figure.querySelector('[data-rw-zoom]')?.remove();
    figure.querySelectorAll('[data-rw-pin]').forEach((pin) => {
      pin.tabIndex = 0;
    });
    const img = figure.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
      this.decodeModelImage(img);
    }

    if (shadow) wrap.appendChild(shadow);
    wrap.appendChild(figure);
    this.lbStage.appendChild(wrap);

    this.sizeLightboxModel();

    if (this.lbKicker) {
      const word = this.lbEl.dataset.word || 'Kit';
      this.lbKicker.textContent = `${word} ${String(this.index + 1).padStart(2, '0')}`;
    }
    if (this.lbName) {
      this.lbName.textContent = hero.dataset.name || '';
    }

    const a = hero.querySelector('.rw__figure')?.getBoundingClientRect();
    const b = figure.getBoundingClientRect();
    wrap._restRect = b;

    this.zoomed = true;
    this.classList.add('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'false');

    if (!this.reducedMotion && a && b && b.height > 0) {
      wrap.style.transition = 'none';
      wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
      void wrap.offsetWidth;
      wrap.style.transition = '';
      wrap.style.transform = '';
    }

    this.lbClose?.focus({ preventScroll: true });
  }

  closeZoom() {
    if (!this.zoomed || !this.lbEl || !this.lbStage) return;
    this.zoomed = false;
    this.clearHot();

    const wrap = this.lbStage.querySelector('.rw__lb-model');
    const heroFig = this.heroes[this.index]?.querySelector('.rw__figure');
    const lbFig = wrap?.querySelector('.rw__figure');

    if (!this.reducedMotion && wrap && heroFig && lbFig) {
      const a = heroFig.getBoundingClientRect();
      const b = wrap._restRect || lbFig.getBoundingClientRect();
      if (b.height > 0) {
        wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
      }
    }

    const hadFocus = this.lbEl.contains(document.activeElement);
    this.classList.remove('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'true');

    if (hadFocus) {
      this.stageEl?.focus({ preventScroll: true });
    }

    clearTimeout(this.zoomTimer);
    this.zoomTimer = window.setTimeout(
      () => {
        if (!this.zoomed && this.lbStage) {
          this.lbStage.innerHTML = '';
        }
      },
      this.reducedMotion ? 0 : 800
    );

    if (this.playing && !this.engaged) {
      this.restartBar();
    }
  }
}

if (!customElements.get('runway-section')) {
  customElements.define('runway-section', RunwaySection);
}

/* Wire Tier Guide quick actions & Live Team Uniform Calculator */
function initBusinessTools() {
  const runway = document.getElementById('Runway-Uniforms');

  document.querySelectorAll('[data-jump-look]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.jumpLook || 0);
      document.getElementById('lookbook')?.scrollIntoView({ behavior: 'smooth' });
      if (runway && typeof runway.go === 'function') {
        runway.engage();
        runway.go(idx);
      }
    });
  });

  document.querySelectorAll('[data-quick-sku]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.quickSku;
      if (!itemId) return;
      bag.add([{ itemId, quantity: 10, branding: 'blank' }]);
    });
  });

  const apronSelect = document.getElementById('est-apron');
  const teeSelect = document.getElementById('est-tee');
  const qtyInput = document.getElementById('est-qty');
  const brandingSelect = document.getElementById('est-branding');
  const qtyReadout = document.getElementById('est-qty-readout');
  const discountLabel = document.getElementById('est-discount-label');
  const perStaffEl = document.getElementById('est-per-staff');
  const merchSubEl = document.getElementById('est-merch-sub');
  const logoSubEl = document.getElementById('est-logo-sub');
  const savingsEl = document.getElementById('est-savings');
  const leadtimeEl = document.getElementById('est-leadtime');
  const grandTotalEl = document.getElementById('est-grand-total');
  const addEstBtn = document.getElementById('est-add-to-bag');
  const presetBtns = [...document.querySelectorAll('[data-est-qty]')];

  if (!apronSelect || !teeSelect || !qtyInput || !brandingSelect) return;

  const updateEstimator = () => {
    const qty = clamp(Number(qtyInput.value) || 1, 1, 500);
    const apronItem = apronSelect.value !== 'none' ? getItemById(apronSelect.value) : null;
    const teeItem = teeSelect.value !== 'none' ? getItemById(teeSelect.value) : null;
    const brandObj = BRANDING_METHODS[brandingSelect.value] || BRANDING_METHODS.blank;

    const piecesPerStaff = (apronItem ? 1 : 0) + (teeItem ? 1 : 0);
    const totalGarments = qty * piecesPerStaff;
    const discountRate = getDiscountRate(totalGarments);

    const kitBaseMerch = (apronItem ? apronItem.price : 0) + (teeItem ? teeItem.price : 0);
    const merchSubtotal = kitBaseMerch * qty;
    const savings = merchSubtotal * discountRate;
    const logoSubtotal = brandObj.fee * totalGarments;
    const grandTotal = merchSubtotal - savings + logoSubtotal;
    const perStaff = qty > 0 ? grandTotal / qty : 0;

    if (qtyReadout) qtyReadout.textContent = `${qty} ${qty === 1 ? 'kit' : 'kits'}`;
    if (discountLabel) {
      discountLabel.textContent = discountRate > 0 ? `${Math.round(discountRate * 100)}% Volume Discount` : 'Standard Rate (10+ saves)';
    }
    if (perStaffEl) perStaffEl.textContent = `${usd.format(perStaff)} / staff`;
    if (merchSubEl) merchSubEl.textContent = usd.format(merchSubtotal);
    if (logoSubEl) logoSubEl.textContent = usd.format(logoSubtotal);
    if (savingsEl) savingsEl.textContent = `−${usd.format(savings)}`;
    if (leadtimeEl) leadtimeEl.textContent = `Est. dispatch: ${brandObj.leadDays}`;
    if (grandTotalEl) grandTotalEl.textContent = usd.format(grandTotal);

    if (addEstBtn) {
      addEstBtn.disabled = piecesPerStaff === 0;
    }

    presetBtns.forEach((b) => {
      b.classList.toggle('is-active', Number(b.dataset.estQty) === qty);
    });
  };

  [apronSelect, teeSelect, brandingSelect].forEach((el) => el.addEventListener('change', updateEstimator));
  qtyInput.addEventListener('input', updateEstimator);

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      qtyInput.value = btn.dataset.estQty || '25';
      updateEstimator();
    });
  });

  addEstBtn?.addEventListener('click', () => {
    const qty = clamp(Number(qtyInput.value) || 1, 1, 500);
    const branding = brandingSelect.value;
    const batch = [];
    if (apronSelect.value !== 'none') {
      batch.push({ itemId: apronSelect.value, quantity: qty, branding });
    }
    if (teeSelect.value !== 'none') {
      batch.push({ itemId: teeSelect.value, quantity: qty, branding });
    }
    if (batch.length > 0) {
      bag.add(batch, true);
      bag.renderDialog();
      bag.dialog?.showModal();
      bag.toast(`Added ${qty}x custom team kit to Quote Bag`);
    }
  });

  updateEstimator();
}

initBusinessTools();
