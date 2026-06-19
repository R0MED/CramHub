const API_BASE = "http://201.51.28.93:8000"
const TOKEN_KEY = "cramhub_token"

const api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
  isAuthenticated() {
    return Boolean(this.getToken())
  },

  async request(path, { method = "GET", body = null, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" }
    if (auth) {
      const token = this.getToken()
      if (token) headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    })

    if (response.status === 401) {
      this.clearToken()
      throw new Error("Сессия истекла, войдите снова")
    }

    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    if (!response.ok) {
      throw new Error(this._extractError(data, response.status))
    }
    return data
  },

  _extractError(data, status) {
    if (data && typeof data === "object" && "detail" in data) {
      const detail = data.detail
      if (typeof detail === "string") return detail
      if (Array.isArray(detail)) {
        return detail.map((e) => e.msg || "Ошибка валидации").join(", ")
      }
    }
    return `Ошибка ${status}`
  },

  register(username, email, password) {
    return this.request("/auth/register", {
      method: "POST",
      body: { username, email, password },
    })
  },

  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    })
    this.setToken(data.access_token)
    return data
  },

  getMe() {
    return this.request("/me", { auth: true })
  },

  // Обновлено: добавлен поиск
  getCollections(search = "") {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request(`/collections${query}`, { auth: true })
  },
  // Новое: получение публичных коллекций
  getPublicCollections(search = "") {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request(`/collections/public${query}`, { auth: true })
  },
  getCollection(id) {
    return this.request(`/collections/${id}`, { auth: true })
  },
  // Обновлено: добавлено поле is_public
  createCollection(title, description, is_public = false) {
    return this.request("/collections", {
      method: "POST",
      auth: true,
      body: { title, description, is_public },
    })
  },
  updateCollection(id, data) {
    return this.request(`/collections/${id}`, {
      method: "PUT",
      auth: true,
      body: data,
    })
  },
  deleteCollection(id) {
    return this.request(`/collections/${id}`, {
      method: "DELETE",
      auth: true,
    })
  },

  getCards(collectionId) {
    return this.request(`/cards/collection/${collectionId}`, { auth: true })
  },
  createCard(collectionId, front, back, difficulty = 1) {
    return this.request(`/cards/?collection_id=${collectionId}`, {
      method: "POST",
      auth: true,
      body: { front, back, difficulty },
    })
  },
  updateCard(cardId, data) {
    return this.request(`/cards/${cardId}`, {
      method: "PUT",
      auth: true,
      body: data,
    })
  },
  deleteCard(cardId) {
    return this.request(`/cards/${cardId}`, {
      method: "DELETE",
      auth: true,
    })
  },
}