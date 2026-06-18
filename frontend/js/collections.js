if (!api.isAuthenticated()) {
  window.location.href = "login.html"
}

const collectionsEl = document.getElementById("collections")
const errorEl = document.getElementById("error")
const modal = document.getElementById("modal")

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

async function loadCollections() {
  clearError(errorEl)
  try {
    const collections = await api.getCollections()
    renderCollections(collections)
  } catch (err) {
    showError(errorEl, err.message)
  }
}

function renderCollections(collections) {
  if (!collections.length) {
    collectionsEl.innerHTML =
      '<p class="muted">Пока нет коллекций. Создайте первую!</p>'
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
          <button class="btn btn-small btn-danger" data-delete="${
            c.id
          }">Удалить</button>
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

function openModal() {
  clearError(modalError)
  titleInput.value = ""
  descInput.value = ""
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
  if (!title) {
    showError(modalError, "Введите название")
    return
  }
  try {
    await api.createCollection(title, description || null)
    closeModal()
    loadCollections()
  } catch (err) {
    showError(modalError, err.message)
  }
})

loadCollections()
