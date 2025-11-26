// frontend/app.js
document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Определение базового URL API (для продакшена можно задать через data-атрибут в HTML)
  const API_BASE = document.documentElement.dataset.apiBase || '';

  function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const opts = { ...options, signal: controller.signal, credentials: 'include' };
    return fetch(url, opts).finally(() => clearTimeout(id));
  }

  const storageKeyUsers = 'rtlite_users';
  const storageKeyAuth = 'rtlite_auth_user';

  const readUsers = () => JSON.parse(localStorage.getItem(storageKeyUsers) || '[]');
  const writeUsers = (users) => localStorage.setItem(storageKeyUsers, JSON.stringify(users));
  const readAuth = () => JSON.parse(localStorage.getItem(storageKeyAuth) || 'null');
  const writeAuth = (user) => localStorage.setItem(storageKeyAuth, JSON.stringify(user));
  const clearAuth = () => localStorage.removeItem(storageKeyAuth);

  const authUserEl = qs('#auth-user');
  const logoutEl = qs('#logout');
  const openLoginEl = qs('#open-login');
  const openRegisterEl = qs('#open-register');

  function updateAuthUI() {
    const auth = readAuth();
    if (auth && auth.email) {
      if (authUserEl) { authUserEl.textContent = `Здравствуйте, ${auth.name || auth.email}`; authUserEl.style.display = 'inline'; }
      if (logoutEl) { logoutEl.style.display = 'inline'; }
      if (openLoginEl) openLoginEl.style.display = 'none';
      if (openRegisterEl) openRegisterEl.style.display = 'none';
    } else {
      if (authUserEl) { authUserEl.textContent = ''; authUserEl.style.display = 'none'; }
      if (logoutEl) { logoutEl.style.display = 'none'; }
      if (openLoginEl) openLoginEl.style.display = 'inline';
      if (openRegisterEl) openRegisterEl.style.display = 'inline';
    }
  }

  if (logoutEl) {
    logoutEl.addEventListener('click', async (e) => {
      e.preventDefault();
      // попробуем разлогинить на сервере
      try {
        await fetchWithTimeout(`${API_BASE}/api/logout`, { method: 'POST' }, 4000).catch(()=>{});
      } catch(e){}
      clearAuth();
      updateAuthUI();
    });
  }

  const modalLogin = qs('#modal-login');
  const modalRegister = qs('#modal-register');
  const modalSubmitNews = qs('#modal-submit-news');
  const modalPurchase = qs('#modal-purchase');

  function showModal(modal) { if (modal) modal.classList.add('active'); }
  function hideModal(modal) { if (modal) modal.classList.remove('active'); }

  if (openLoginEl) openLoginEl.addEventListener('click', (e) => { e.preventDefault(); showModal(modalLogin); });
  if (openRegisterEl) openRegisterEl.addEventListener('click', (e) => { e.preventDefault(); showModal(modalRegister); });
  const openSubmitEl = qs('#open-submit-news');
  if (openSubmitEl) openSubmitEl.addEventListener('click', (e) => { e.preventDefault(); showModal(modalSubmitNews); });

  qsa('[data-close]').forEach(btn => btn.addEventListener('click', () => {
    const backdrop = btn.closest('.modal-backdrop');
    hideModal(backdrop);
  }));

  qsa('.modal-backdrop').forEach(backdrop => {
    if (backdrop.dataset.lockBackdrop === 'true') return;
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) hideModal(backdrop);
    });
  });

  const formLogin = qs('#form-login');
  const formRegister = qs('#form-register');
  const formSubmitNews = qs('#form-submit-news');
  const formPurchase = qs('#form-purchase');

  // Toast уведомления
  function showToast(msg, type = '') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3300);
  }

  // Helper: try server API, fallback to localStorage
  async function tryApiOrFallback(apiCallFn, fallbackFn) {
    try {
      return await apiCallFn();
    } catch (err) {
      // сервер недоступен — используем fallback
      return fallbackFn();
    }
  }

  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = qs('#reg-name')?.value.trim();
        const email = qs('#reg-email')?.value.trim().toLowerCase();
        const password = qs('#reg-password')?.value;
        const passwordConfirm = qs('#reg-password-confirm')?.value;
        
        // Проверка совпадения паролей
        if (password !== passwordConfirm) {
          showToast('Пароли не совпадают', 'error');
          return;
        }
        
        if (password.length < 6) {
          showToast('Пароль должен содержать минимум 6 символов', 'error');
          return;
        }
        
        // сначала пробуем регистрация через API
        const apiResult = await tryApiOrFallback(
          async () => {
            const res = await fetchWithTimeout(`${API_BASE}/api/register`, {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ name, email, password })
            }, 7000);
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Ошибка регистрации' }));
              throw new Error(errorData.message || 'api register failed');
            }
            return res.json();
          },
          () => {
            // fallback: localStorage
            const users = readUsers();
            if (users.find(u => u.email === email)) throw new Error('exists');
            const newUser = { name, email, password };
            users.push(newUser);
            writeUsers(users);
            writeAuth({ name, email });
            return { source: 'local' };
          }
        );

        writeAuth({ name, email });
        updateAuthUI();
        hideModal(modalRegister);
        formRegister.reset();
        showToast('Регистрация успешна! Вы вошли в систему.');
      } catch (err) {
        if (err.message === 'exists') {
          showToast('Пользователь с таким email уже существует', 'error');
        } else {
          showToast(err.message || 'Ошибка регистрации. Попробуйте снова.', 'error');
        }
      }
    });
  }

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const email = qs('#login-email')?.value.trim().toLowerCase();
        const password = qs('#login-password')?.value;
        if (!email || !password) return showToast('Заполните поля', 'error');

        const apiResult = await tryApiOrFallback(
          async () => {
            const res = await fetchWithTimeout(`${API_BASE}/api/login`, {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ email, password })
            }, 7000);
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Неверный email или пароль' }));
              throw new Error(errorData.message || 'invalid');
            }
            return res.json();
          },
          () => {
            const users = readUsers();
            const found = users.find(u => u.email === email && u.password === password);
            if (!found) throw new Error('invalid');
            return { name: found.name, email: found.email, source: 'local' };
          }
        );

        // apiResult may contain user object or message
        const user = apiResult.user || { name: apiResult.name || apiResult.name, email };
        writeAuth({ name: user.name || email, email });
        updateAuthUI();
        hideModal(modalLogin);
        formLogin.reset();
        showToast('Вход выполнен!');
      } catch (err) {
        showToast(err.message || 'Неверный email или пароль', 'error');
      }
    });
  }

  if (formSubmitNews) {
    formSubmitNews.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = qs('#sn-title')?.value.trim();
      const link = qs('#sn-link')?.value.trim();
      const text = qs('#sn-text')?.value.trim();
      if (!title || !text) return showToast('Пожалуйста, заполните заголовок и описание', 'error');

      // отправка на сервер, или fallback: localStorage
      try {
        await tryApiOrFallback(
          async () => {
            const res = await fetchWithTimeout(`${API_BASE}/api/news-suggest`, {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ name: qs('#sn-name')?.value, email: qs('#sn-email')?.value, title, text })
            }, 7000);
            if (!res.ok) throw new Error('api fail');
            return res.json();
          },
          () => {
            // fallback: сохраняем в localStorage как "news_suggestions"
            const arr = JSON.parse(localStorage.getItem('news_suggestions') || '[]');
            arr.push({ id: Date.now(), name: qs('#sn-name')?.value, email: qs('#sn-email')?.value, title, text, created_at: new Date().toISOString() });
            localStorage.setItem('news_suggestions', JSON.stringify(arr));
            return { source: 'local' };
          }
        );

        hideModal(modalSubmitNews);
        showToast('Спасибо! Ваша новость отправлена на рассмотрение.');
        formSubmitNews.reset();
      } catch (err) {
        showToast('Ошибка отправки. Попробуйте позже.', 'error');
      }
    });
  }

  updateAuthUI();

  function fillPurchaseFormWithAuth() {
    if (!modalPurchase) return;
    const auth = readAuth();
    if (!auth) return;
    const nameInput = qs('#purchase-name', modalPurchase);
    const emailInput = qs('#purchase-email', modalPurchase);
    if (nameInput) nameInput.value = auth.name || auth.email || '';
    if (emailInput) emailInput.value = auth.email || '';
  }

  // Обработка кнопок "Купить"
  qsa('.btn-buy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const movieName = btn.dataset.movie || '';
      const moviePrice = btn.dataset.price || '0';
      
      if (modalPurchase) {
        qs('#purchase-movie', modalPurchase).value = movieName;
        qs('#purchase-price', modalPurchase).value = moviePrice + ' ₽';
        qs('#purchase-quantity', modalPurchase).value = 1;
        fillPurchaseFormWithAuth();
        updatePurchaseTotal();
        showModal(modalPurchase);
      }
    });
  });

  // Обновление итоговой суммы при изменении количества
  const purchaseQuantity = qs('#purchase-quantity');
  if (purchaseQuantity && modalPurchase) {
    purchaseQuantity.addEventListener('input', updatePurchaseTotal);
  }

  function updatePurchaseTotal() {
    if (!modalPurchase) return;
    const priceEl = qs('#purchase-price', modalPurchase);
    const quantityEl = qs('#purchase-quantity', modalPurchase);
    const totalEl = qs('#purchase-total', modalPurchase);
    
    if (priceEl && quantityEl && totalEl) {
      const price = parseFloat(priceEl.value.replace(/[^\d.]/g, '')) || 0;
      const quantity = parseInt(quantityEl.value) || 1;
      const total = (price * quantity).toFixed(2);
      totalEl.value = total + ' ₽';
    }
  }

  // Обработка формы покупки
  if (formPurchase) {
    formPurchase.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const movieName = qs('#purchase-movie', formPurchase)?.value.trim();
        const moviePrice = qs('#purchase-price', formPurchase)?.value.replace(/[^\d.]/g, '');
        const quantity = qs('#purchase-quantity', formPurchase)?.value;
        const customerName = qs('#purchase-name', formPurchase)?.value.trim();
        const customerEmail = qs('#purchase-email', formPurchase)?.value.trim().toLowerCase();
        const customerPhone = qs('#purchase-phone', formPurchase)?.value.trim();
        const deliveryAddress = qs('#purchase-address', formPurchase)?.value.trim();
        const paymentMethod = qs('#purchase-payment', formPurchase)?.value;

        // Валидация
        if (!movieName || !moviePrice || !quantity || !customerName || !customerEmail || !customerPhone || !deliveryAddress || !paymentMethod) {
          showToast('Пожалуйста, заполните все поля', 'error');
          return;
        }

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
          showToast('Некорректный email адрес', 'error');
          return;
        }

        // Валидация телефона
        const phoneDigits = customerPhone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
          showToast('Некорректный номер телефона (минимум 10 цифр)', 'error');
          return;
        }

        // Отправка на сервер
        const apiResult = await tryApiOrFallback(
          async () => {
            const res = await fetchWithTimeout(`${API_BASE}/api/order`, {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({
                movieName,
                moviePrice,
                quantity: parseInt(quantity),
                customerName,
                customerEmail,
                customerPhone,
                deliveryAddress,
                paymentMethod
              })
            }, 7000);
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Ошибка оформления заказа' }));
              throw new Error(errorData.message || 'api order failed');
            }
            return res.json();
          },
          () => {
            // fallback: сохраняем в localStorage
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push({
              id: Date.now(),
              movieName,
              moviePrice: parseFloat(moviePrice),
              quantity: parseInt(quantity),
              customerName,
              customerEmail,
              customerPhone,
              deliveryAddress,
              paymentMethod,
              created_at: new Date().toISOString()
            });
            localStorage.setItem('orders', JSON.stringify(orders));
            return { message: 'Заказ сохранен локально', source: 'local' };
          }
        );

        hideModal(modalPurchase);
        formPurchase.reset();
        showToast(apiResult.message || 'Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
      } catch (err) {
        showToast(err.message || 'Ошибка оформления заказа. Попробуйте позже.', 'error');
      }
    });
  }

  const newsGrid = qs('#news-grid[data-dynamic="true"]');
  if (newsGrid) {
    const NEWS_API_KEY = 'c158ba374c354be4abcc2803fb6c9fd5';
    const endpoint = 'https://newsapi.org/v2/top-headlines?language=en&pageSize=6';

    function renderNews(items) {
      newsGrid.innerHTML = items.map((item, idx) => {
        const title = item.title || `Новость ${idx+1}`;
        const href = item.url || 'article.html';
        const img = item.urlToImage || `https://picsum.photos/seed/rtlite-${idx+1}/800/600`;
        const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
          <article class="news-item">
            <a class="thumb" href="${href}" target="_blank" rel="noopener" aria-label="Читать подробнее">
              <img src="${img}" alt="Изображение новости ${idx+1}">
            </a>
            <div class="overlay"></div>
            <h4 class="title"><a href="${href}" target="_blank" rel="noopener">${safeTitle}</a></h4>
          </article>
        `;
      }).join('');
    }

    fetchWithTimeout(endpoint, { headers: { 'X-Api-Key': NEWS_API_KEY } }, 8000)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(data => {
        const items = Array.isArray(data.articles) ? data.articles.filter(a => a && a.title) : [];
        if (items.length === 0) throw new Error('EMPTY');
        renderNews(items);
      })
      .catch(() => {
        const fallback = Array.from({ length: 6 }).map((_, idx) => ({
          title: `Новость дня №${idx + 1}`,
          url: 'article.html',
          urlToImage: `https://picsum.photos/seed/rtlite-fb-${idx+1}/800/600`
        }));
        renderNews(fallback);
      });
  }

  const addressEl = qs('#address');
  const mapFrame = qs('#map-frame');
  if (addressEl && mapFrame) {
    const text = addressEl.textContent || '';
    const addr = (text.split(':')[1] || '').trim();
    if (addr) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;
      fetchWithTimeout(url, { headers: { 'Accept-Language': 'ru' } }, 7000)
        .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
        .then(results => {
          if (!Array.isArray(results) || results.length === 0) return;
          const r0 = results[0];
          const bbox = r0.boundingbox;
          if (bbox && bbox.length === 4) {
            const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox[2]}%2C${bbox[0]}%2C${bbox[3]}%2C${bbox[1]}&layer=mapnik&marker=${r0.lat}%2C${r0.lon}`;
            mapFrame.setAttribute('src', src);
          }
        })
        .catch(() => {
        });
    }
  }

// ======== Яндекс.Карта для contacts.html ========
if (document.getElementById('ymap') && window.ymaps) {
  ymaps.ready(() => {
    const mapContainer = document.getElementById('ymap');
    const addrEl = document.getElementById('address');
    const lat = parseFloat(addrEl.dataset.lat);
    const lon = parseFloat(addrEl.dataset.lon);

    const map = new ymaps.Map(mapContainer, {
      center: [lat, lon],
      zoom: 16,
      controls: ['zoomControl', 'fullscreenControl']
    });

    const placemark = new ymaps.Placemark([lat, lon], {
      balloonContent: addrEl.textContent
    }, {
      preset: 'islands#redDotIcon'
    });

    map.geoObjects.add(placemark);
  });
}

});
