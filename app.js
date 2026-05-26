/**
 * ============================================
 * 供应链供应商管理系统 — 核心业务逻辑
 * v3.0 — 多维度评分体系
 * ============================================
 */

;(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  const STORAGE_KEY = 'scm_suppliers';

  // 评分维度与项目定义
  const RATING_DIMENSIONS = {
    selection: {
      name: '前期选型合作适配',
      icon: '📋',
      items: [
        { field: 'communication', name: '沟通协作效率', desc: '对接响应速度、表达理解度、需求对齐能力、跨事项配合态度' },
        { field: 'sample', name: '样品试样配合度', desc: '打样周期、改样响应、按需调整能力、试样合格率、反复配合意愿' },
        { field: 'trackRecord', name: '过往合作案例', desc: '同品类服务经验、标杆客户履历、项目落地成果、行业口碑背书' },
        { field: 'businessFit', name: '商务契合度', desc: '合作理念匹配、合作模式灵活度、条款协商包容性、履约诚意' },
        { field: 'location', name: '地域与对接便利性', desc: '地理距离、上门踏勘、现场对接、物流通勤便捷性' }
      ]
    },
    product: {
      name: '产品核心实力',
      icon: '⚙️',
      items: [
        { field: 'quality', name: '品质管控水平', desc: '来料/制程/出厂检验标准、次品率、质量稳定性、异常整改能力' },
        { field: 'technology', name: '工艺技术能力', desc: '现有工艺水准、定制开发、技术迭代、适配定制化需求能力' }
      ]
    },
    cost: {
      name: '商务成本',
      icon: '💰',
      items: [
        { field: 'pricing', name: '报价性价比', desc: '定价合理性、横向比价优势、调价机制、综合采购总成本' },
        { field: 'payment', name: '付款账期条件', desc: '结算方式灵活性、账期政策、资金合作友好度' }
      ]
    },
    delivery: {
      name: '交付履约',
      icon: '🚚',
      items: [
        { field: 'deliveryTime', name: '交期保障能力', desc: '订单准时交付率、排单规划、延期预警、加急单处理能力' },
        { field: 'logistics', name: '物流仓储配套', desc: '发货时效、仓储备货、运输损耗管控' }
      ]
    },
    service: {
      name: '售后与长期运维',
      icon: '🛠️',
      items: [
        { field: 'afterSales', name: '问题处置能力', desc: '异常反馈响应、售后排查、返工补货、纠纷处理效率' }
      ]
    }
  };

  // 所有评分字段列表
  const ALL_RATING_FIELDS = [];
  Object.values(RATING_DIMENSIONS).forEach(dim => {
    dim.items.forEach(item => ALL_RATING_FIELDS.push(item.field));
  });

  /* ---------- 数据层 ---------- */
  const Store = {
    _data: [],

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        this._data = raw ? JSON.parse(raw) : [];
      } catch {
        this._data = [];
      }
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    },

    getAll() {
      return [...this._data];
    },

    getById(id) {
      return this._data.find(s => s.id === id) || null;
    },

    add(supplier) {
      supplier.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      supplier.createdAt = new Date().toISOString();
      supplier.updatedAt = new Date().toISOString();
      this._data.unshift(supplier);
      this.save();
      return supplier;
    },

    update(id, data) {
      const idx = this._data.findIndex(s => s.id === id);
      if (idx === -1) return null;
      this._data[idx] = { ...this._data[idx], ...data, updatedAt: new Date().toISOString() };
      this.save();
      return this._data[idx];
    },

    remove(id) {
      const idx = this._data.findIndex(s => s.id === id);
      if (idx === -1) return false;
      this._data.splice(idx, 1);
      this.save();
      return true;
    },

    getCategories() {
      const set = new Set();
      this._data.forEach(s => {
        (s.category || '').split(/[,，、]/).forEach(c => {
          const t = c.trim();
          if (t) set.add(t);
        });
      });
      return [...set].sort();
    },

    getChannels() {
      const set = new Set();
      this._data.forEach(s => {
        (s.channel || '').split(/[,，、]/).forEach(c => {
          const t = c.trim();
          if (t) set.add(t);
        });
      });
      return [...set].sort();
    }
  };

  /* ---------- DOM 引用 ---------- */
  const $ = (sel) => document.querySelector(sel);

  const DOM = {
    supplierCount:  $('#supplierCount'),
    supplierList:   $('#supplierList'),
    emptyState:     $('#emptyState'),
    // 筛选
    filterKeyword:  $('#filterKeyword'),
    filterCategory: $('#filterCategory'),
    filterChannel:  $('#filterChannel'),
    filterPriceMin: $('#filterPriceMin'),
    filterPriceMax: $('#filterPriceMax'),
    filterRating:   $('#filterRating'),
    btnResetFilter: $('#btnResetFilter'),
    // 按钮
    btnAddSupplier: $('#btnAddSupplier'),
    btnExportCSV:   $('#btnExportCSV'),
    // 模态框
    modalOverlay:   $('#modalOverlay'),
    modalTitle:     $('#modalTitle'),
    btnModalClose:  $('#btnModalClose'),
    btnCancel:      $('#btnCancel'),
    btnSubmit:      $('#btnSubmit'),
    supplierForm:   $('#supplierForm'),
    formId:         $('#formId'),
    // 基本信息
    formName:       $('#formName'),
    formContact:    $('#formContact'),
    formPhone:      $('#formPhone'),
    formEmail:      $('#formEmail'),
    formWechat:     $('#formWechat'),
    formCategory:   $('#formCategory'),
    // 合作信息
    formChannel:    $('#formChannel'),
    formSampleCycle:$('#formSampleCycle'),
    // 资质信息
    formCompanyName:       $('#formCompanyName'),
    formBusinessLicense:   $('#formBusinessLicense'),
    formTaxNumber:         $('#formTaxNumber'),
    formBankName:          $('#formBankName'),
    formBankAccount:       $('#formBankAccount'),
    formRegisteredAddress: $('#formRegisteredAddress'),
    // 评分面板
    ratingPanel:    $('#ratingPanel'),
    ratingSummary:  $('#ratingSummary'),
    // 关联项目
    formProjects:   $('#formProjects'),
    // 阶梯报价
    tierContainer:  $('#tierContainer'),
    btnAddTier:     $('#btnAddTier'),
    // 备注
    formNotes:      $('#formNotes'),
    // Toast
    toastContainer: $('#toastContainer'),
  };

  /* ---------- 当前表单评分值 ---------- */
  let currentRatings = {};

  /* ---------- Toast 通知 ---------- */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  /* ---------- 确认对话框 ---------- */
  function showConfirm(message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <p>${message}</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost confirm-cancel">取消</button>
            <button class="btn btn-danger-fill confirm-ok">确认删除</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('.confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
      overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
  }

  /* ---------- 评分计算 ---------- */
  function calculateDimensionScore(ratings, dimKey) {
    const items = RATING_DIMENSIONS[dimKey].items;
    const values = items.map(item => ratings[item.field] || 0).filter(v => v > 0);
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }

  function calculateTotalScore(ratings) {
    const values = Object.values(ratings).filter(v => v > 0);
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }

  /* ---------- 评分面板交互 ---------- */
  function initRatingPanel() {
    // 折叠/展开维度
    DOM.ratingPanel.querySelectorAll('.dimension-header').forEach(header => {
      header.addEventListener('click', () => {
        const dimension = header.closest('.rating-dimension');
        dimension.classList.toggle('collapsed');
      });
    });

    // 星级评分交互
    DOM.ratingPanel.querySelectorAll('.star-rating').forEach(container => {
      const field = container.dataset.field;
      const stars = container.querySelectorAll('.star');

      stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
          const val = parseInt(star.dataset.value);
          stars.forEach(s => {
            s.classList.toggle('hovered', parseInt(s.dataset.value) <= val);
          });
        });

        star.addEventListener('mouseleave', () => {
          stars.forEach(s => s.classList.remove('hovered'));
        });

        star.addEventListener('click', () => {
          const val = parseInt(star.dataset.value);
          currentRatings[field] = val;
          updateStarDisplay(container, val);
          updateAllDimensionScores();
        });
      });
    });
  }

  function updateStarDisplay(container, value) {
    container.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.value) <= value);
    });
  }

  function updateAllDimensionScores() {
    Object.keys(RATING_DIMENSIONS).forEach(dimKey => {
      const score = calculateDimensionScore(currentRatings, dimKey);
      const el = $(`#score_${dimKey}`);
      if (el) el.textContent = score !== null ? `${score}★` : '—';
    });

    const total = calculateTotalScore(currentRatings);
    DOM.ratingSummary.textContent = total !== null ? `综合评分：${total}★` : '综合评分：—';
  }

  function resetRatingPanel() {
    currentRatings = {};
    DOM.ratingPanel.querySelectorAll('.star-rating').forEach(container => {
      container.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    });
    Object.keys(RATING_DIMENSIONS).forEach(dimKey => {
      const el = $(`#score_${dimKey}`);
      if (el) el.textContent = '—';
    });
    DOM.ratingSummary.textContent = '综合评分：—';
    // 默认展开第一个维度
    DOM.ratingPanel.querySelectorAll('.rating-dimension').forEach((dim, i) => {
      dim.classList.toggle('collapsed', i !== 0);
    });
  }

  function loadRatingsToPanel(ratings) {
    currentRatings = ratings || {};
    DOM.ratingPanel.querySelectorAll('.star-rating').forEach(container => {
      const field = container.dataset.field;
      const val = currentRatings[field] || 0;
      updateStarDisplay(container, val);
    });
    updateAllDimensionScores();
    // 默认展开第一个维度
    DOM.ratingPanel.querySelectorAll('.rating-dimension').forEach((dim, i) => {
      dim.classList.toggle('collapsed', i !== 0);
    });
  }

  /* ---------- 模态框控制 ---------- */
  function openModal(supplier = null) {
    DOM.supplierForm.reset();
    DOM.formId.value = '';
    resetRatingPanel();
    DOM.tierContainer.innerHTML = createTierRowHTML();

    if (supplier) {
      DOM.modalTitle.textContent = '编辑供应商';
      DOM.formId.value = supplier.id;
      // 基本信息
      DOM.formName.value = supplier.name || '';
      DOM.formContact.value = supplier.contact || '';
      DOM.formPhone.value = supplier.phone || '';
      DOM.formEmail.value = supplier.email || '';
      DOM.formWechat.value = supplier.wechat || '';
      DOM.formCategory.value = supplier.category || '';
      // 合作信息
      DOM.formChannel.value = supplier.channel || '';
      DOM.formSampleCycle.value = supplier.sampleCycle || '';
      // 资质信息
      DOM.formCompanyName.value = supplier.companyName || '';
      DOM.formBusinessLicense.value = supplier.businessLicense || '';
      DOM.formTaxNumber.value = supplier.taxNumber || '';
      DOM.formBankName.value = supplier.bankName || '';
      DOM.formBankAccount.value = supplier.bankAccount || '';
      DOM.formRegisteredAddress.value = supplier.registeredAddress || '';
      // 评分
      loadRatingsToPanel(supplier.ratings || {});
      // 关联项目
      DOM.formProjects.value = supplier.projects || '';
      // 备注
      DOM.formNotes.value = supplier.notes || '';
      // 阶梯报价
      if (supplier.tiers && supplier.tiers.length) {
        DOM.tierContainer.innerHTML = supplier.tiers.map((t, i) =>
          createTierRowHTML(t.moq, t.price, i === 0)
        ).join('');
      }
    } else {
      DOM.modalTitle.textContent = '添加供应商';
    }

    DOM.modalOverlay.classList.add('active');
    setTimeout(() => DOM.formName.focus(), 200);
  }

  function closeModal() {
    DOM.modalOverlay.classList.remove('active');
  }

  /* ---------- 阶梯报价行 ---------- */
  function createTierRowHTML(moq = '', price = '', isFirst = false) {
    return `
      <div class="tier-row">
        <div class="form-group tier-moq">
          <label>MOQ (件)</label>
          <input type="number" name="tierMoq" min="1" value="${moq}" placeholder="起订量">
        </div>
        <div class="form-group tier-price">
          <label>单价 (¥)</label>
          <input type="number" name="tierPrice" min="0" step="0.01" value="${price}" placeholder="单价">
        </div>
        <button type="button" class="btn btn-icon btn-danger tier-remove" title="删除此阶梯"
                style="visibility:${isFirst ? 'hidden' : 'visible'};">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;
  }

  function collectTiers() {
    const rows = DOM.tierContainer.querySelectorAll('.tier-row');
    const tiers = [];
    rows.forEach(row => {
      const moq = parseInt(row.querySelector('[name="tierMoq"]').value) || 0;
      const price = parseFloat(row.querySelector('[name="tierPrice"]').value) || 0;
      if (moq > 0 || price > 0) tiers.push({ moq, price });
    });
    return tiers;
  }

  /* ---------- 筛选逻辑 ---------- */
  function getFilteredSuppliers() {
    let list = Store.getAll();

    const keyword = DOM.filterKeyword.value.trim().toLowerCase();
    const category = DOM.filterCategory.value;
    const channel = DOM.filterChannel.value;
    const priceMin = parseFloat(DOM.filterPriceMin.value);
    const priceMax = parseFloat(DOM.filterPriceMax.value);
    const ratingFilter = parseFloat(DOM.filterRating.value) || 0;

    if (keyword) {
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(keyword) ||
        (s.contact || '').toLowerCase().includes(keyword) ||
        (s.phone || '').includes(keyword) ||
        (s.email || '').toLowerCase().includes(keyword) ||
        (s.wechat || '').toLowerCase().includes(keyword) ||
        (s.notes || '').toLowerCase().includes(keyword) ||
        (s.companyName || '').toLowerCase().includes(keyword) ||
        (s.projects || '').toLowerCase().includes(keyword)
      );
    }

    if (category) {
      list = list.filter(s => (s.category || '').includes(category));
    }

    if (channel) {
      list = list.filter(s => (s.channel || '').includes(channel));
    }

    if (!isNaN(priceMin) && priceMin > 0) {
      list = list.filter(s => {
        if (!s.tiers || !s.tiers.length) return false;
        return s.tiers.some(t => t.price >= priceMin);
      });
    }

    if (!isNaN(priceMax) && priceMax > 0) {
      list = list.filter(s => {
        if (!s.tiers || !s.tiers.length) return false;
        return s.tiers.some(t => t.price <= priceMax);
      });
    }

    if (ratingFilter > 0) {
      list = list.filter(s => {
        const total = calculateTotalScore(s.ratings || {});
        return total !== null && parseFloat(total) >= ratingFilter;
      });
    }

    return list;
  }

  /* ---------- 渲染列表 ---------- */
  function renderList() {
    const suppliers = getFilteredSuppliers();
    DOM.supplierCount.textContent = `${Store.getAll().length} 家供应商`;

    if (suppliers.length === 0) {
      DOM.supplierList.innerHTML = '';
      DOM.emptyState.style.display = 'flex';
      if (Store.getAll().length > 0 && (DOM.filterKeyword.value || DOM.filterCategory.value || DOM.filterChannel.value || DOM.filterPriceMin.value || DOM.filterPriceMax.value || DOM.filterRating.value)) {
        DOM.emptyState.querySelector('p').textContent = '没有匹配的供应商';
        DOM.emptyState.querySelector('span').textContent = '尝试调整筛选条件';
      } else {
        DOM.emptyState.querySelector('p').textContent = '暂无供应商数据';
        DOM.emptyState.querySelector('span').textContent = '点击右上角「添加供应商」开始录入';
      }
      return;
    }

    DOM.emptyState.style.display = 'none';
    DOM.supplierList.innerHTML = suppliers.map(s => renderCard(s)).join('');
  }

  function renderStarsText(rating) {
    let text = '';
    for (let i = 1; i <= 5; i++) {
      text += i <= rating ? '★' : '☆';
    }
    return text;
  }

  function renderQualificationHTML(s) {
    const items = [];
    if (s.companyName)       items.push({ label: '公司', value: s.companyName, copy: false });
    if (s.businessLicense)   items.push({ label: '执照号', value: s.businessLicense, copy: true });
    if (s.taxNumber)         items.push({ label: '税号', value: s.taxNumber, copy: true });
    if (s.bankName)          items.push({ label: '开户行', value: s.bankName, copy: false });
    if (s.bankAccount)       items.push({ label: '银行账号', value: s.bankAccount, copy: true });
    if (s.registeredAddress) items.push({ label: '注册地址', value: s.registeredAddress, copy: false });

    if (items.length === 0) return '';

    return `
      <div class="card-qualification">
        <div class="qual-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          资质信息
        </div>
        <div class="qual-grid">
          ${items.map(item => `
            <div class="qual-item${item.copy ? ' copyable' : ''}" ${item.copy ? `data-copy="${escapeHTML(item.value)}" title="点击复制"` : ''}>
              <span class="qual-label">${item.label}:</span>
              <span class="qual-value" title="${escapeHTML(item.value)}">${escapeHTML(item.value)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderProjectsHTML(projects) {
    if (!projects) return '';
    const list = projects.split(/[,，、]/).map(p => p.trim()).filter(Boolean);
    if (list.length === 0) return '';
    return `
      <div class="card-projects">
        ${list.map(p => `<span class="tag tag-project">📋 ${escapeHTML(p)}</span>`).join('')}
      </div>`;
  }

  function renderRatingDetailHTML(s) {
    const ratings = s.ratings || {};
    const total = calculateTotalScore(ratings);

    if (total === null) return '';

    // 计算各维度分数
    const dimScores = {};
    Object.keys(RATING_DIMENSIONS).forEach(dimKey => {
      dimScores[dimKey] = calculateDimensionScore(ratings, dimKey);
    });

    // 生成各维度徽章
    const dimBadges = Object.entries(dimScores)
      .filter(([_, score]) => score !== null)
      .map(([dimKey, score]) => {
        const dim = RATING_DIMENSIONS[dimKey];
        return `<span class="dim-badge"><span class="dim-name">${dim.icon} ${dim.name}</span><span class="dim-val">${score}★</span></span>`;
      }).join('');

    // 生成详细评分列表
    const detailItems = [];
    Object.entries(RATING_DIMENSIONS).forEach(([dimKey, dim]) => {
      dim.items.forEach(item => {
        const val = ratings[item.field] || 0;
        if (val > 0) {
          detailItems.push(`<div class="expand-item"><span class="item-label">${item.name}</span><span class="item-stars">${renderStarsText(val)}</span></div>`);
        }
      });
    });

    return `
      <div class="card-rating-detail">
        <div class="rating-header">
          <span class="rating-title">📊 综合评分</span>
          <span class="rating-total">${total}★</span>
        </div>
        <div class="rating-dimensions">${dimBadges}</div>
        ${detailItems.length > 0 ? `
          <div class="card-rating-expand" id="ratingExpand_${s.id}">
            <div class="expand-grid">${detailItems.join('')}</div>
          </div>
          <span class="card-rating-toggle" data-id="${s.id}">展开详情 ▼</span>
        ` : ''}
      </div>`;
  }

  function renderCard(s) {
    const tiersHTML = (s.tiers && s.tiers.length)
      ? `<table class="tier-table">
           <thead><tr><th>阶梯</th><th>MOQ</th><th>单价</th></tr></thead>
           <tbody>${s.tiers.map((t, i) => `
             <tr>
               <td>${i + 1}</td>
               <td>${t.moq.toLocaleString()} 件</td>
               <td class="price">¥${t.price.toFixed(2)}</td>
             </tr>`).join('')}
           </tbody>
         </table>`
      : '';

    const contactItems = [];
    if (s.phone)  contactItems.push(`<div class="info-item copyable" data-copy="${s.phone}" title="点击复制">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span>${s.phone}</span></div>`);
    if (s.email) contactItems.push(`<div class="info-item copyable" data-copy="${s.email}" title="点击复制">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <span>${s.email}</span></div>`);
    if (s.wechat) contactItems.push(`<div class="info-item copyable" data-copy="${s.wechat}" title="点击复制">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      <span>${s.wechat}</span></div>`);

    const tagsHTML = [];
    if (s.category) tagsHTML.push(`<span class="tag tag-category">${escapeHTML(s.category)}</span>`);
    if (s.channel)  tagsHTML.push(`<span class="tag tag-channel">${escapeHTML(s.channel)}</span>`);
    if (s.sampleCycle) tagsHTML.push(`<span class="tag tag-sample">打样 ${escapeHTML(s.sampleCycle)}</span>`);

    const ratingHTML = renderRatingDetailHTML(s);
    const qualHTML = renderQualificationHTML(s);
    const projectsHTML = renderProjectsHTML(s.projects);

    return `
      <div class="supplier-card" data-id="${s.id}">
        <div class="card-header">
          <div class="card-name">${escapeHTML(s.name)}</div>
          <div class="card-actions">
            <button class="btn btn-icon btn-edit" data-id="${s.id}" title="编辑">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-icon btn-delete" data-id="${s.id}" title="删除">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="card-tags">${tagsHTML.join('')}</div>
        ${projectsHTML}
        <div class="card-info">
          <div class="info-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>${escapeHTML(s.contact || '—')}</span>
          </div>
          ${contactItems.join('')}
        </div>
        ${ratingHTML}
        ${qualHTML}
        ${tiersHTML}
        ${s.notes ? `<div class="card-notes">${escapeHTML(s.notes)}</div>` : ''}
      </div>`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- 更新筛选下拉选项 ---------- */
  function updateFilterOptions() {
    const categories = Store.getCategories();
    const channels = Store.getChannels();

    const catVal = DOM.filterCategory.value;
    DOM.filterCategory.innerHTML = '<option value="">全部品类</option>' +
      categories.map(c => `<option value="${escapeHTML(c)}"${c === catVal ? ' selected' : ''}>${escapeHTML(c)}</option>`).join('');

    const chVal = DOM.filterChannel.value;
    DOM.filterChannel.innerHTML = '<option value="">全部渠道</option>' +
      channels.map(c => `<option value="${escapeHTML(c)}"${c === chVal ? ' selected' : ''}>${escapeHTML(c)}</option>`).join('');
  }

  /* ---------- CSV 导出 ---------- */
  function exportCSV() {
    const suppliers = getFilteredSuppliers();
    if (suppliers.length === 0) {
      showToast('没有可导出的数据', 'error');
      return;
    }

    const BOM = '\uFEFF';
    const headers = [
      '供应商名称', '品类标签', '合作渠道', '联系人', '电话', '邮箱', '微信',
      '打样周期', '阶梯报价(MOQ-单价)',
      '公司名称', '营业执照号', '税号', '开户行', '银行账号', '注册地址',
      '综合评分', '关联项目', '备注',
      // 各评分项
      ...ALL_RATING_FIELDS.map(f => {
        for (const dim of Object.values(RATING_DIMENSIONS)) {
          const item = dim.items.find(i => i.field === f);
          if (item) return `评分-${item.name}`;
        }
        return f;
      })
    ];

    const rows = suppliers.map(s => {
      const tiersStr = (s.tiers || []).map(t => `${t.moq}件/¥${t.price}`).join('; ');
      const ratings = s.ratings || {};
      const total = calculateTotalScore(ratings);
      const ratingValues = ALL_RATING_FIELDS.map(f => ratings[f] || '');

      return [
        s.name, s.category, s.channel, s.contact,
        s.phone, s.email, s.wechat, s.sampleCycle,
        tiersStr,
        s.companyName, s.businessLicense, s.taxNumber,
        s.bankName, s.bankAccount, s.registeredAddress,
        total || '',
        s.projects, s.notes,
        ...ratingValues
      ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',');
    });

    const csv = BOM + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `供应商数据_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${suppliers.length} 条供应商数据`, 'success');
  }

  /* ---------- 一键复制 ---------- */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('已复制到剪贴板', 'success');
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
    ta.remove();
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    // 添加供应商
    DOM.btnAddSupplier.addEventListener('click', () => openModal());

    // 导出 CSV
    DOM.btnExportCSV.addEventListener('click', exportCSV);

    // 模态框关闭
    DOM.btnModalClose.addEventListener('click', closeModal);
    DOM.btnCancel.addEventListener('click', closeModal);
    DOM.modalOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.modalOverlay.classList.contains('active')) closeModal();
    });

    // 添加阶梯报价行
    DOM.btnAddTier.addEventListener('click', () => {
      DOM.tierContainer.insertAdjacentHTML('beforeend', createTierRowHTML());
      updateTierRemoveButtons();
    });

    // 表单提交
    DOM.supplierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = DOM.formId.value;
      const data = {
        // 基本信息
        name:        DOM.formName.value.trim(),
        contact:     DOM.formContact.value.trim(),
        phone:       DOM.formPhone.value.trim(),
        email:       DOM.formEmail.value.trim(),
        wechat:      DOM.formWechat.value.trim(),
        category:    DOM.formCategory.value.trim(),
        // 合作信息
        channel:     DOM.formChannel.value.trim(),
        sampleCycle: DOM.formSampleCycle.value.trim(),
        // 资质信息
        companyName:       DOM.formCompanyName.value.trim(),
        businessLicense:   DOM.formBusinessLicense.value.trim(),
        taxNumber:         DOM.formTaxNumber.value.trim(),
        bankName:          DOM.formBankName.value.trim(),
        bankAccount:       DOM.formBankAccount.value.trim(),
        registeredAddress: DOM.formRegisteredAddress.value.trim(),
        // 评分
        ratings: { ...currentRatings },
        // 关联项目
        projects: DOM.formProjects.value.trim(),
        // 阶梯报价
        tiers: collectTiers(),
        // 备注
        notes: DOM.formNotes.value.trim(),
      };

      if (!data.name) { showToast('请输入供应商名称', 'error'); return; }
      if (!data.contact) { showToast('请输入联系人', 'error'); return; }

      if (id) {
        Store.update(id, data);
        showToast('供应商信息已更新', 'success');
      } else {
        Store.add(data);
        showToast('供应商添加成功', 'success');
      }

      closeModal();
      updateFilterOptions();
      renderList();
    });

    // 阶梯报价删除按钮
    DOM.tierContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.tier-remove');
      if (btn) {
        btn.closest('.tier-row').remove();
        updateTierRemoveButtons();
      }
    });

    // 筛选事件
    DOM.filterKeyword.addEventListener('input', debounce(renderList, 250));
    DOM.filterCategory.addEventListener('change', renderList);
    DOM.filterChannel.addEventListener('change', renderList);
    DOM.filterPriceMin.addEventListener('input', debounce(renderList, 400));
    DOM.filterPriceMax.addEventListener('input', debounce(renderList, 400));
    DOM.filterRating.addEventListener('change', renderList);
    DOM.btnResetFilter.addEventListener('click', () => {
      DOM.filterKeyword.value = '';
      DOM.filterCategory.value = '';
      DOM.filterChannel.value = '';
      DOM.filterPriceMin.value = '';
      DOM.filterPriceMax.value = '';
      DOM.filterRating.value = '';
      renderList();
    });

    // 列表事件委托
    DOM.supplierList.addEventListener('click', (e) => {
      // 编辑
      const editBtn = e.target.closest('.btn-edit');
      if (editBtn) {
        const supplier = Store.getById(editBtn.dataset.id);
        if (supplier) openModal(supplier);
        return;
      }

      // 删除
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        const supplier = Store.getById(deleteBtn.dataset.id);
        if (supplier) {
          showConfirm(`确定要删除供应商「${supplier.name}」吗？`).then(ok => {
            if (ok) {
              Store.remove(supplier.id);
              showToast('供应商已删除', 'success');
              updateFilterOptions();
              renderList();
            }
          });
        }
        return;
      }

      // 评分详情展开/收起
      const toggleBtn = e.target.closest('.card-rating-toggle');
      if (toggleBtn) {
        const id = toggleBtn.dataset.id;
        const expand = $(`#ratingExpand_${id}`);
        if (expand) {
          expand.classList.toggle('show');
          toggleBtn.textContent = expand.classList.contains('show') ? '收起详情 ▲' : '展开详情 ▼';
        }
        return;
      }

      // 一键复制
      const copyItem = e.target.closest('.copyable');
      if (copyItem) {
        copyToClipboard(copyItem.dataset.copy);
      }
    });
  }

  function updateTierRemoveButtons() {
    const rows = DOM.tierContainer.querySelectorAll('.tier-row');
    rows.forEach((row) => {
      const btn = row.querySelector('.tier-remove');
      if (btn) btn.style.visibility = rows.length <= 1 ? 'hidden' : 'visible';
    });
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /* ---------- 初始化 ---------- */
  function init() {
    Store.load();
    updateFilterOptions();
    renderList();
    initRatingPanel();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
