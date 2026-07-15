(() => {
  "use strict";

  const state = {
    content: null,
    activeCategory: "all",
    query: ""
  };

  const elements = {
    posts: document.querySelector("#posts"),
    filters: document.querySelector("#category-filters"),
    search: document.querySelector("#search-input"),
    count: document.querySelector("#results-count"),
    empty: document.querySelector("#empty-state"),
    reset: document.querySelector("#reset-filters"),
    template: document.querySelector("#post-template"),
    year: document.querySelector("#current-year"),
    heroEyebrow: document.querySelector("#hero-eyebrow"),
    heroIntro: document.querySelector("#hero-intro"),
    aboutText: document.querySelector("#about-text")
  };

  const categoryById = (id) =>
    state.content?.categories?.find((category) => category.id === id);

  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-AT", {
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function renderSiteCopy() {
    const site = state.content?.site ?? {};
    if (site.eyebrow) elements.heroEyebrow.textContent = site.eyebrow;
    if (site.intro) elements.heroIntro.textContent = site.intro;
    if (site.about) elements.aboutText.textContent = site.about;
  }

  function renderFilters() {
    const fragment = document.createDocumentFragment();

    for (const category of state.content.categories ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-button";
      button.dataset.category = category.id;
      button.setAttribute("aria-pressed", "false");
      button.textContent = category.label;
      fragment.append(button);
    }

    elements.filters.append(fragment);
  }

  function matches(post) {
    const categoryMatches =
      state.activeCategory === "all" || post.category === state.activeCategory;

    const haystack = [
      post.title,
      post.excerpt,
      post.badge,
      categoryById(post.category)?.label
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("de");

    const queryMatches = !state.query || haystack.includes(state.query);
    return categoryMatches && queryMatches && post.published !== false;
  }

  function createPostCard(post, index) {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    const category = categoryById(post.category);
    const destination = safeUrl(post.url);
    const imageUrl = safeUrl(post.image) || "assets/uploads/placeholder.svg";

    if (post.featured && index === 0) card.classList.add("is-featured");

    const image = card.querySelector(".post-image");
    image.src = imageUrl;
    image.alt = post.imageAlt || post.title || "Empfehlung";
    image.addEventListener("error", () => {
      image.src = "assets/uploads/placeholder.svg";
    }, { once: true });

    const imageLink = card.querySelector(".post-image-link");
    if (destination) imageLink.href = destination;

    card.querySelector(".post-badge").textContent = post.badge || "";
    card.querySelector(".post-category").textContent =
      category?.label || post.category || "Empfehlung";

    const date = card.querySelector(".post-date");
    date.textContent = formatDate(post.publishedAt);
    if (post.publishedAt) date.dateTime = post.publishedAt;

    card.querySelector(".post-title").textContent = post.title || "Ohne Titel";
    card.querySelector(".post-excerpt").textContent = post.excerpt || "";

    const link = card.querySelector(".post-link");
    if (destination) {
      link.href = destination;
      link.querySelector(".post-link-label").textContent =
        post.linkText || "Mehr erfahren";
    } else {
      link.hidden = true;
    }

    return card;
  }

  function renderPosts() {
    const visiblePosts = (state.content.posts ?? []).filter(matches);
    const fragment = document.createDocumentFragment();

    visiblePosts.forEach((post, index) => {
      fragment.append(createPostCard(post, index));
    });

    elements.posts.replaceChildren(fragment);
    elements.posts.setAttribute("aria-busy", "false");
    elements.empty.hidden = visiblePosts.length > 0;
    elements.posts.hidden = visiblePosts.length === 0;

    const label = visiblePosts.length === 1 ? "Empfehlung" : "Empfehlungen";
    elements.count.textContent = `${visiblePosts.length} ${label}`;
  }

  function setActiveCategory(category) {
    state.activeCategory = category;
    elements.filters.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.category === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderPosts();
  }

  function bindEvents() {
    elements.filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (button) setActiveCategory(button.dataset.category);
    });

    elements.search.addEventListener("input", (event) => {
      state.query = event.target.value.trim().toLocaleLowerCase("de");
      renderPosts();
    });

    elements.reset.addEventListener("click", () => {
      elements.search.value = "";
      state.query = "";
      setActiveCategory("all");
    });
  }

  async function loadContent() {
    try {
      const response = await fetch("content/posts.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.content = await response.json();
      renderSiteCopy();
      renderFilters();
      renderPosts();
    } catch (error) {
      console.error("Marketing-Kitchen konnte die Inhalte nicht laden:", error);
      elements.posts.setAttribute("aria-busy", "false");
      elements.posts.innerHTML = "";
      elements.count.textContent = "Inhalte konnten nicht geladen werden.";
      elements.empty.hidden = false;
      elements.empty.querySelector("h2").textContent =
        "Die Datei content/posts.json ist nicht erreichbar oder ungültig.";
    }
  }

  elements.year.textContent = new Date().getFullYear();
  bindEvents();
  loadContent();
})();
