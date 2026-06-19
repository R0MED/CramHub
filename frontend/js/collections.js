if (!api.isAuthenticated()) {
  window.location.href = "login.html"
}

const collectionsEl = document.getElementById("collections")
const errorEl = document.getElementById("error")
const modal = document.getElementById("modal")

// Новые переменные для поиска и вкладок
let currentTab = "my"; // "my" или "public"
let searchQuery = "";
let searchTimeout = null;

function showError(el, message) {
  el.textContent = message
  el.style.display = "block"
}
function clearError(el) {
  el.textContent = ""
  el.style.display = "none"
}

function escapeHtml(str) {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

;(async () => {
  try {
    const user = await api.getMe()
    document.getElementById("user-info").textContent = user.username
  } catch {
    api.clearToken()
    window.location.href = "login.html"
  }
})()

document.getElementById("logout-btn").addEventListener("click", () => {
  api.clearToken()
  window.location.href = "login.html"
})

// ЛОГИКА ВКЛАДОК И ПОИСКА 
const tabMy = document.getElementById("tab-my");
const tabPublic = document.getElementById("tab-public");
const searchInput = document.getElementById("search-input");
const newColBtn = document.getElementById("new-collection-btn");

tabMy.addEventListener("click", () => {
  currentTab = "my";
  tabMy.className = "btn btn-primary";
  tabPublic.className = "btn btn-ghost";
  tabPublic.style.color = "#475569";
  newColBtn.style.display = "block"; // Показываем кнопку создания
  loadCollections();
});

tabPublic.addEventListener("click", () => {
  currentTab = "public";
  tabPublic.className = "btn btn-primary";
  tabPublic.style.color = "";
  tabMy.className = "btn btn-ghost";
  tabMy.style.color = "#475569";
  newColBtn.style.display = "none"; // Прячем кнопку создания
  loadCollections();
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  // Ждем 400мс после ввода, чтобы не спамить сервер запросами 
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadCollections();
  }, 400);
});
// ===============================

async function loadCollections() {
  clearError(errorEl)
  collectionsEl.innerHTML = '<p class="muted">Загрузка…</p>';
  try {
    let collections = [];
    if (currentTab === "my") {
      collections = await api.getCollections(searchQuery);
    } else {
      collections = await api.getPublicCollections(searchQuery);
    }
    renderCollections(collections)
  } catch (err) {
    showError(errorEl, err.message)
  }
}

function renderCollections(collections) {
  if (!collections.length) {
    if (searchQuery) {
        collectionsEl.innerHTML = '<p class="muted">По вашему запросу ничего не найдено.</p>'
    } else {
        collectionsEl.innerHTML = currentTab === "my" 
            ? '<p class="muted">Пока нет коллекций. Создайте первую!</p>'
            : '<p class="muted">В публичной базе пока пусто.</p>';
    }
    return
  }

  collectionsEl.innerHTML = collections
    .map(
      (c) => `
      <div class="collection-card" data-id="${c.id}">
        <div>
          <div class="collection-head">
            <h3 class="collection-title">${escapeHtml(c.title)}</h3>
            <span class="badge ${
              c.is_public ? "badge-public" : "badge-private"
            }">
              ${c.is_public ? "Публичная" : "Приватная"}
            </span>
          </div>
          <p class="collection-desc">${
            escapeHtml(c.description) || "Без описания"
          }</p>
        </div>
        <div class="collection-actions">
          <a class="btn btn-small btn-primary" href="collection.html?id=${
            c.id
          }">Открыть</a>
          
          <!-- Кнопка удаления доступна только в "Моих наборах" -->
          ${currentTab === "my" ? `<button class="btn btn-small btn-danger" data-delete="${c.id}">Удалить</button>` : ''}
        </div>
      </div>`
    )
    .join("")

  collectionsEl.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.delete))
  })
}

async function handleDelete(id) {
  if (!confirm("Удалить коллекцию вместе со всеми карточками?")) return
  try {
    await api.deleteCollection(id)
    loadCollections()
  } catch (err) {
    showError(errorEl, err.message)
  }
}

const modalError = document.getElementById("modal-error")
const titleInput = document.getElementById("collection-title")
const descInput = document.getElementById("collection-description")
const publicCheckbox = document.getElementById("collection-public")

function openModal() {
  clearError(modalError)
  titleInput.value = ""
  descInput.value = ""
  publicCheckbox.checked = false // Сбрасываем галочку
  modal.classList.add("open")
  titleInput.focus()
}
function closeModal() {
  modal.classList.remove("open")
}

document
  .getElementById("new-collection-btn")
  .addEventListener("click", openModal)
document.getElementById("modal-cancel").addEventListener("click", closeModal)
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal()
})

document.getElementById("modal-save").addEventListener("click", async () => {
  clearError(modalError)
  const title = titleInput.value.trim()
  const description = descInput.value.trim()
  const isPublic = publicCheckbox.checked // Читаем статус галочки

  if (!title) {
    showError(modalError, "Введите название")
    return
  }
  try {
    await api.createCollection(title, description || null, isPublic)
    closeModal()
    loadCollections()
  } catch (err) {
    showError(modalError, err.message)
  }
})

loadCollections()