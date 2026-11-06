/* ============================================================
   «Точка антистресса» — магазин слаймов
   js/main.js — интерактив: меню, тема, корзина, анимации
   ============================================================ */
'use strict';

(() => {
  // ---------- Утилиты ----------
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const STORAGE_KEYS = {
    cart: 'slime-cart',
    theme: 'slime-theme',
  };

  // ---------- 1. Бургер-меню ----------
  const initBurger = () => {
    const burger = $('.nav-burger');
    const nav = $('.nav');
    if (!burger || !nav) return;

    const close = () => {
      burger.classList.remove('is-active');
      nav.classList.remove('is-open');
    };

    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      nav.classList.toggle('is-open');
    });

    // Закрытие при клике по ссылке
    $$('.nav__link', nav).forEach((link) => link.addEventListener('click', close));

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  };

  // ---------- 2. Тёмная тема ----------
  const initTheme = () => {
    const toggle = $('.theme-toggle');
    if (!toggle) return;

    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');

    document.documentElement.dataset.theme = initial;
    toggle.textContent = initial === 'dark' ? '☀️' : '🌙';
    toggle.setAttribute('aria-pressed', String(initial === 'dark'));

    toggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem(STORAGE_KEYS.theme, next);
      toggle.textContent = next === 'dark' ? '☀️' : '🌙';
      toggle.setAttribute('aria-pressed', String(next === 'dark'));
    });
  };

  // ---------- 3. Тень шапки при прокрутке ----------
  const initHeaderShadow = () => {
    const header = $('.header');
    if (!header) return;

    const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  // ---------- 4. Кнопка «Наверх» ----------
  const initBackToTop = () => {
    const btn = $('.back-to-top');
    if (!btn) return;

    const onScroll = () => {
      const visible = window.scrollY > 500;
      btn.classList.toggle('is-visible', visible);
      btn.setAttribute('aria-hidden', String(!visible));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  // ---------- 5. Плавное появление секций ----------
  const initReveal = () => {
    const items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((item) => observer.observe(item));
  };

  // ---------- 6. Корзина (localStorage) ----------
  const initCart = () => {
    const modal = $('.cart-modal');
    const panel = $('.cart-modal__panel');
    const badge = $('.cart-btn__badge');
    const cartBtn = $('.cart-btn');
    const closeBtn = $('.cart-modal__close');
    const body = $('.cart-modal__body');
    const sumEl = $('.cart-modal__sum-value');
    const checkoutBtn = $('.cart-checkout-btn');

    if (!modal || !body || !sumEl) return;

    const PRODUCTS = {};
    $$('.card').forEach((card) => {
      const btn = $('.btn--add', card);
      if (!btn) return;
      PRODUCTS[btn.dataset.id] = {
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
        emoji: btn.dataset.emoji,
      };
    });

    // Состояние корзины
    let cart = loadCart();

    function loadCart() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.cart);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    }

    function saveCart() {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    }

    function cartCount() {
      return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
    }

    function cartTotal() {
      return Object.values(cart).reduce((sum, item) => sum + item.qty * item.price, 0);
    }

    function updateBadge() {
      const count = cartCount();
      badge.textContent = count;
      badge.classList.toggle('is-visible', count > 0);
    }

    function renderCart() {
      const entries = Object.entries(cart);
      if (!entries.length) {
        body.innerHTML = `
          <div class="cart-empty">
            <span class="cart-empty__icon">🛒</span>
            <p>В корзине пока пусто.<br>Выберите слайм — и загляните сюда!</p>
          </div>`;
        sumEl.textContent = '0 ₽';
        checkoutBtn.disabled = true;
        return;
      }

      body.innerHTML = entries
        .map(([id, item]) => {
          const product = PRODUCTS[id] || { name: item.name, price: item.price, emoji: '🧸' };
          return `
            <div class="cart-item" data-id="${id}">
              <span class="cart-item__emoji" aria-hidden="true">${product.emoji}</span>
              <div class="cart-item__info">
                <div class="cart-item__name">${product.name}</div>
                <div class="cart-item__price">${product.price} ₽ / шт</div>
                <div class="cart-item__qty">
                  <button class="qty-btn" data-action="dec" aria-label="Уменьшить">−</button>
                  <span class="cart-item__qty-value">${item.qty}</span>
                  <button class="qty-btn" data-action="inc" aria-label="Увеличить">+</button>
                </div>
              </div>
              <div class="cart-item__total">${item.qty * product.price} ₽</div>
              <button class="btn btn--danger" data-action="remove" aria-label="Удалить">✕</button>
            </div>`;
        })
        .join('');

      sumEl.textContent = `${cartTotal()} ₽`;
      checkoutBtn.disabled = false;
    }

    function addToCart(id) {
      const product = PRODUCTS[id];
      if (!product) return;
      cart[id] = cart[id] ? { ...cart[id], qty: cart[id].qty + 1 } : { qty: 1 };
      saveCart();
      updateBadge();
      renderCart();
      showToast(`«${product.name}» добавлен в корзину 🛒`);
    }

    function changeQty(id, delta) {
      if (!cart[id]) return;
      cart[id].qty += delta;
      if (cart[id].qty <= 0) delete cart[id];
      saveCart();
      updateBadge();
      renderCart();
    }

    function removeItem(id) {
      delete cart[id];
      saveCart();
      updateBadge();
      renderCart();
    }

    function openCart() {
      renderCart();
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeCart() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    // События
    $$('.btn--add').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });

    cartBtn.addEventListener('click', openCart);
    closeBtn.addEventListener('click', closeCart);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCart();
    });

    body.addEventListener('click', (e) => {
      const btn = e.target.closest('.qty-btn, .btn--danger');
      if (!btn) return;
      const id = btn.closest('.cart-item').dataset.id;
      const action = btn.dataset.action;
      if (action === 'inc') changeQty(id, 1);
      if (action === 'dec') changeQty(id, -1);
      if (action === 'remove') removeItem(id);
    });

    checkoutBtn.addEventListener('click', () => {
      cart = {};
      saveCart();
      updateBadge();
      renderCart();
      closeCart();
      showToast('Заказ оформлен! Свяжемся с вами в ближайшее время 🎉');
    });

    // Инициализация
    updateBadge();
  };

  // ---------- 7. Уведомления (toast) ----------
  const showToast = (message) => {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  // ---------- 8. Форма обратной связи ----------
  const initForm = () => {
    const form = $('.form');
    if (!form) return;

    const fields = {
      name: { el: $('[name="name"]', form), test: (v) => v.trim().length >= 2 },
      contact: {
        el: $('[name="contact"]', form),
        test: (v) => /^[+@\w.\- ]{5,}$/.test(v.trim()),
      },
      message: {
        el: $('[name="message"]', form),
        test: (v) => v.trim().length >= 10,
      },
    };

    const status = $('.form__status', form);

    const validateField = (field) => {
      const { el, test } = field;
      const error = $('.form__error', el.parentElement);
      const valid = test(el.value);
      el.classList.toggle('is-invalid', !valid);
      error?.classList.toggle('is-visible', !valid);
      return valid;
    };

    Object.values(fields).forEach((field) => {
      field.el.addEventListener('input', () => validateField(field));
      field.el.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = Object.values(fields).map(validateField);
      if (results.some((valid) => !valid)) {
        status.className = 'form__status form__status--error is-visible';
        status.textContent = '⚠️ Пожалуйста, заполните все поля корректно.';
        setTimeout(() => status.classList.remove('is-visible'), 3000);
        return;
      }

      status.className = 'form__status form__status--success is-visible';
      status.textContent = '✅ Спасибо! Ваше сообщение отправлено — мы ответим в течение дня.';
      form.reset();
      setTimeout(() => status.classList.remove('is-visible'), 5000);
    });
  };

  // ---------- 9. Год в копирайте ----------
  const initYear = () => {
    $$('.js-year').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  };

  // ---------- Старт ----------
  document.addEventListener('DOMContentLoaded', () => {
    initBurger();
    initTheme();
    initHeaderShadow();
    initBackToTop();
    initReveal();
    initCart();
    initForm();
    initYear();
  });
})();
