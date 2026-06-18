if (!api.isAuthenticated()) {
  window.location.href = "login.html"
}

const params = new URLSearchParams(window.location.search)
const collectionId = params.get("id")
if (!collectionId) {
  window.location.href = "index.html"
}

const cardsEl = document.getElementById("cards")
const errorEl = document.getElementById("error")
const modal = document.getElementById("modal")
const modalError = document.getElementById("modal-error")
const modalTitle = document.getElementById("modal-title")
const frontInput = document.getElementById("card-front")
const backInput = document.getElementById("card-back")
const difficultyInput = document.getElementById("card-difficulty")

let editingCardId = null

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

document.getElementById("study-link").href = `study.html?id=${collectionId}`

async function loadPage() {
  clearError(errorEl)
  try {
    const collection = await api.getCollection(collectionId)
    document.getElementById("collection-title").textContent = collection.title
    document.title = `${collection.title} - CramHub`
  } catch (err) {
    showError(errorEl, err.message)
    return
  }
  await loadCards()
}

async function loadCards() {
  try {
    const cards = await api.getCards(collectionId)
    renderCards(cards)
  } catch (err) {
    showError(errorEl, err.message)
  }
}

function renderCards(cards) {
  if (!cards.length) {
    cardsEl.innerHTML =
      '<p class="muted">В коллекции пока нет карточек. Добавьте первую!</p>'
    return
  }
  cardsEl.innerHTML = cards
    .map(
      (c) => `
    <div class="card-row">
      <div class="card-side">
        <span class="card-label">Вопрос</span>
        <p>${escapeHtml(c.front)}</p>
      </div>
      <div class="card-side">
        <span class="card-label">Ответ</span>
        <p>${escapeHtml(c.back)}</p>
      </div>
      <div class="card-row-actions">
        <button class="btn btn-small btn-ghost" data-edit="${
          c.id
        }">Изм.</button>
        <button class="btn btn-small btn-danger" data-delete="${
          c.id
        }">Удал.</button>
      </div>
    </div>
  `
    )
    .join("")

  cardsEl.querySelectorAll("[data-edit]").forEach((btn) => {
    const card = cards.find((c) => String(c.id) === btn.dataset.edit)
    btn.addEventListener("click", () => openEdit(card))
  })
  cardsEl.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.delete))
  })
}

async function handleDelete(id) {
  if (!confirm("Удалить карточку?")) return
  try {
    await api.deleteCard(id)
    loadCards()
  } catch (err) {
    showError(errorEl, err.message)
  }
}

function openCreate() {
  editingCardId = null
  modalTitle.textContent = "Новая карточка"
  frontInput.value = ""
  backInput.value = ""
  difficultyInput.value = "1"
  clearError(modalError)
  modal.classList.add("open")
  frontInput.focus()
}

function openEdit(card) {
  editingCardId = card.id
  modalTitle.textContent = "Редактирование карточки"
  frontInput.value = card.front
  backInput.value = card.back
  difficultyInput.value = card.difficulty
  clearError(modalError)
  modal.classList.add("open")
  frontInput.focus()
}

function closeModal() {
  modal.classList.remove("open")
}

document.getElementById("new-card-btn").addEventListener("click", openCreate)
document.getElementById("modal-cancel").addEventListener("click", closeModal)
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal()
})

document.getElementById("modal-save").addEventListener("click", async () => {
  clearError(modalError)
  const front = frontInput.value.trim()
  const back = backInput.value.trim()
  const difficulty = parseInt(difficultyInput.value, 10) || 1

  if (!front || !back) {
    showError(modalError, "Заполните обе стороны карточки")
    return
  }

  try {
    if (editingCardId === null) {
      await api.createCard(collectionId, front, back, difficulty)
    } else {
      await api.updateCard(editingCardId, { front, back, difficulty })
    }
    closeModal()
    loadCards()
  } catch (err) {
    showError(modalError, err.message)
  }
})

loadPage()
