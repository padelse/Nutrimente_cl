(() => {
  "use strict";

  /* ---------------------------------------------------------
     CONSTANTES
  --------------------------------------------------------- */
  const DAY_KEYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const DAY_LABELS = {
    lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
    jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo"
  };
  const DAY_SHORT = {
    lunes: "Lun", martes: "Mar", miercoles: "Mié",
    jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom"
  };
  const CATEGORIES = [
    { id: "almuerzo-entrante", label: "Almuerzo · Entrante" },
    { id: "almuerzo-principal", label: "Almuerzo · Principal" },
    { id: "cena-entrante", label: "Cena · Entrante" },
    { id: "cena-principal", label: "Cena · Principal" }
  ];
  const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));
  const LS_FAVS = "menu_favoritos";
  const LS_WEEK = "menu_semana_activa";

  /* ---------------------------------------------------------
     ESTADO
  --------------------------------------------------------- */
  const state = {
    recipesById: new Map(),
    weeks: [],           // array en orden
    weeksById: new Map(),
    favorites: new Set(JSON.parse(localStorage.getItem(LS_FAVS) || "[]")),
    activeWeekId: localStorage.getItem(LS_WEEK) || null,
    semanaViewDay: null, // día seleccionado en la vista "Semana"
    recetasFilter: "todas",
    recetasQuery: ""
  };

  const $view = document.getElementById("view");
  const $topbarTitle = document.getElementById("topbarTitle");
  const $backBtn = document.getElementById("backBtn");
  const $favToggleBtn = document.getElementById("favToggleBtn");
  const $tabbar = document.getElementById("tabbar");

  function todayKey() {
    const jsDay = new Date().getDay(); // 0 domingo .. 6 sábado
    return DAY_KEYS[(jsDay + 6) % 7];
  }

  function saveFavs() {
    localStorage.setItem(LS_FAVS, JSON.stringify([...state.favorites]));
  }

  function toggleFav(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    saveFavs();
  }

  /* ---------------------------------------------------------
     CARGA DE DATOS
  --------------------------------------------------------- */
  async function loadData() {
    const [recipesRes, weeksRes] = await Promise.all([
      fetch("data/recipes.json"),
      fetch("data/weeks.json")
    ]);
    const recipesJson = await recipesRes.json();
    const weeksJson = await weeksRes.json();

    recipesJson.recipes.forEach(r => state.recipesById.set(r.id, r));
    state.weeks = weeksJson.weeks;
    weeksJson.weeks.forEach(w => state.weeksById.set(w.id, w));

    if (!state.activeWeekId || !state.weeksById.has(state.activeWeekId)) {
      state.activeWeekId = state.weeks[0]?.id || null;
    }
    state.semanaViewDay = todayKey();
  }

  /* ---------------------------------------------------------
     COMPONENTES HTML
  --------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function recipeCardHTML(recipe, { preview = true } = {}) {
    const isFav = state.favorites.has(recipe.id);
    const ingredientsPreview = recipe.ingredientes.slice(0, 4).join(" · ");
    return `
      <a href="#/receta/${recipe.id}" class="recipe-card cat-${recipe.categoria}${isFav ? " is-fav" : ""}">
        <div class="row">
          <div>
            <span class="tag">${escapeHtml(CATEGORY_LABEL[recipe.categoria] || recipe.categoria)}</span>
            <h3>${escapeHtml(recipe.nombre)}</h3>
            ${preview ? `<p class="ingredient-preview">${escapeHtml(ingredientsPreview)}</p>` : ""}
          </div>
          <span class="fav-mark">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21s-6.7-4.35-9.4-8.28C.86 10.1 1.4 6.6 4.3 5.06 6.5 3.9 9 4.6 12 7.5c3-2.9 5.5-3.6 7.7-2.44 2.9 1.54 3.44 5.04 1.7 7.66C18.7 16.65 12 21 12 21z" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
          </span>
        </div>
      </a>`;
  }

  function mealSectionHTML(title, ids) {
    const recipes = ids.map(id => state.recipesById.get(id)).filter(Boolean);
    if (!recipes.length) return "";
    return `
      <h2 class="section-label">${title} <span class="count">${recipes.length} plato${recipes.length > 1 ? "s" : ""}</span></h2>
      ${recipes.map(r => recipeCardHTML(r)).join("")}
    `;
  }

  function weekSelectHTML(selectedId, selectId = "weekSelect") {
    if (state.weeks.length <= 1) return "";
    return `
      <div class="week-select-wrap">
        <select class="week-select" id="${selectId}">
          ${state.weeks.map(w => `<option value="${w.id}" ${w.id === selectedId ? "selected" : ""}>${escapeHtml(w.nombre)}</option>`).join("")}
        </select>
      </div>`;
  }

  /* ---------------------------------------------------------
     VISTAS
  --------------------------------------------------------- */
  function renderHoy() {
    setTopbar("Mi Menú", false);
    const week = state.weeksById.get(state.activeWeekId);
    const key = todayKey();

    if (!week) {
      $view.innerHTML = emptyStateHTML("Todavía no hay ningún plan semanal cargado.");
      return;
    }

    const dia = week.dias[key];
    const now = new Date();
    const fecha = now.toLocaleDateString("es-ES", { weekday: undefined, day: "numeric", month: "long" });

    $view.innerHTML = `
      ${weekSelectHTML(state.activeWeekId)}
      <div class="today-hero">
        <div class="eyebrow">${escapeHtml(week.nombre)}</div>
        <div class="weekday">${DAY_LABELS[key]}</div>
        <div class="datestr">${fecha}</div>
      </div>
      ${dia ? (mealSectionHTML("Almuerzo", dia.almuerzo) + mealSectionHTML("Cena", dia.cena)) : emptyStateHTML("No hay comidas planificadas para hoy en esta semana.")}
    `;

    const sel = document.getElementById("weekSelect");
    if (sel) sel.addEventListener("change", e => {
      state.activeWeekId = e.target.value;
      localStorage.setItem(LS_WEEK, state.activeWeekId);
      renderHoy();
    });
  }

  function renderSemana() {
    setTopbar("Esta semana", false);
    const week = state.weeksById.get(state.activeWeekId);
    if (!week) {
      $view.innerHTML = emptyStateHTML("Todavía no hay ningún plan semanal cargado.");
      return;
    }
    if (!state.semanaViewDay) state.semanaViewDay = todayKey();
    const key = state.semanaViewDay;
    const dia = week.dias[key];
    const isToday = key === todayKey();

    $view.innerHTML = `
      ${weekSelectHTML(state.activeWeekId, "weekSelect2")}
      <div class="day-strip" id="dayStrip">
        ${DAY_KEYS.map(d => `
          <button class="day-chip${d === key ? " active" : ""}" data-day="${d}">
            ${DAY_SHORT[d]}${d === todayKey() ? '<span class="dot"></span>' : ""}
          </button>`).join("")}
      </div>
      <div class="eyebrow">${escapeHtml(week.nombre)}${isToday ? " · Hoy" : ""}</div>
      <h2 class="page-heading" style="font-size:1.5rem;margin-bottom:18px;">${DAY_LABELS[key]}</h2>
      ${dia ? (mealSectionHTML("Almuerzo", dia.almuerzo) + mealSectionHTML("Cena", dia.cena)) : emptyStateHTML("No hay comidas planificadas para este día.")}
    `;

    const sel = document.getElementById("weekSelect2");
    if (sel) sel.addEventListener("change", e => {
      state.activeWeekId = e.target.value;
      localStorage.setItem(LS_WEEK, state.activeWeekId);
      renderSemana();
    });

    document.getElementById("dayStrip").addEventListener("click", e => {
      const btn = e.target.closest(".day-chip");
      if (!btn) return;
      state.semanaViewDay = btn.dataset.day;
      renderSemana();
    });
  }

  function renderRecetas() {
    setTopbar("Recetas", false);
    const all = [...state.recipesById.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const q = state.recetasQuery.trim().toLowerCase();

    const filtered = all.filter(r => {
      const matchesCat = state.recetasFilter === "todas" || r.categoria === state.recetasFilter;
      if (!matchesCat) return false;
      if (!q) return true;
      const haystack = (r.nombre + " " + r.ingredientes.join(" ")).toLowerCase();
      return haystack.includes(q);
    });

    $view.innerHTML = `
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.2" y2="16.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input type="search" class="search-input" id="recipeSearch" placeholder="Buscar receta o ingrediente…" value="${escapeHtml(state.recetasQuery)}" autocomplete="off" autocorrect="off" spellcheck="false">
      </div>
      <div class="filter-row" id="filterRow">
        <button class="chip${state.recetasFilter === "todas" ? " active" : ""}" data-cat="todas">Todas</button>
        ${CATEGORIES.map(c => `<button class="chip${state.recetasFilter === c.id ? " active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
      </div>
      ${filtered.length
        ? filtered.map(r => recipeCardHTML(r)).join("")
        : emptyStateHTML("No hay recetas que coincidan con tu búsqueda.")}
    `;

    document.getElementById("recipeSearch").addEventListener("input", e => {
      state.recetasQuery = e.target.value;
      renderRecetas();
      // devuelve el foco al buscador tras el re-render
      const input = document.getElementById("recipeSearch");
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });

    document.getElementById("filterRow").addEventListener("click", e => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      state.recetasFilter = btn.dataset.cat;
      renderRecetas();
    });
  }

  function renderFavoritos() {
    setTopbar("Favoritos", false);
    const favs = [...state.recipesById.values()]
      .filter(r => state.favorites.has(r.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    $view.innerHTML = favs.length
      ? favs.map(r => recipeCardHTML(r)).join("")
      : emptyStateHTML("Aún no tienes recetas favoritas.", "Pulsa el corazón dentro de cualquier receta para guardarla aquí.");
  }

  function renderRecetaDetalle(id) {
    const r = state.recipesById.get(id);
    if (!r) {
      setTopbar("Receta", true);
      $view.innerHTML = emptyStateHTML("No se ha encontrado esta receta.");
      return;
    }
    setTopbar("Receta", true, r.id);

    const usedIn = [];
    state.weeks.forEach(w => {
      DAY_KEYS.forEach(d => {
        const dia = w.dias[d];
        if (!dia) return;
        if (dia.almuerzo?.includes(id)) usedIn.push(`${DAY_LABELS[d]} · Almuerzo (${w.nombre})`);
        if (dia.cena?.includes(id)) usedIn.push(`${DAY_LABELS[d]} · Cena (${w.nombre})`);
      });
    });

    $view.innerHTML = `
      <div class="recipe-detail cat-${r.categoria}">
        <span class="tag">${escapeHtml(CATEGORY_LABEL[r.categoria] || r.categoria)}</span>
        <h2>${escapeHtml(r.nombre)}</h2>

        <h3 class="detail-section-title">Ingredientes</h3>
        <ul class="ingredient-list">
          ${r.ingredientes.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>

        <h3 class="detail-section-title">Elaboración</h3>
        <div class="elaboracion-text">${escapeHtml(r.elaboracion).split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>

        ${usedIn.length ? `<div class="used-in"><b>Aparece en:</b><br>${usedIn.map(escapeHtml).join("<br>")}</div>` : ""}
      </div>
    `;
  }

  function emptyStateHTML(msg, sub = "") {
    return `
      <div class="empty-state">
        <div class="big">${escapeHtml(msg)}</div>
        ${sub ? `<p>${escapeHtml(sub)}</p>` : ""}
      </div>`;
  }

  /* ---------------------------------------------------------
     TOPBAR / NAV
  --------------------------------------------------------- */
  function setTopbar(title, showBack, favId) {
    $topbarTitle.textContent = title;
    $backBtn.hidden = !showBack;
    if (favId) {
      $favToggleBtn.hidden = false;
      $favToggleBtn.classList.toggle("is-fav", state.favorites.has(favId));
      $favToggleBtn.onclick = () => {
        toggleFav(favId);
        $favToggleBtn.classList.toggle("is-fav", state.favorites.has(favId));
      };
    } else {
      $favToggleBtn.hidden = true;
      $favToggleBtn.onclick = null;
    }
  }

  function setActiveTab(tab) {
    document.querySelectorAll(".tab-item").forEach(el => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });
    $tabbar.style.display = tab ? "flex" : "none";
  }

  /* ---------------------------------------------------------
     ROUTER
  --------------------------------------------------------- */
  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);
    return parts;
  }

  function router() {
    const parts = parseHash();
    const route = parts[0] || "hoy";

    window.scrollTo(0, 0);

    switch (route) {
      case "hoy":
        setActiveTab("hoy");
        renderHoy();
        break;
      case "semana":
        setActiveTab("semana");
        renderSemana();
        break;
      case "recetas":
        setActiveTab("recetas");
        renderRecetas();
        break;
      case "favoritos":
        setActiveTab("favoritos");
        renderFavoritos();
        break;
      case "receta":
        setActiveTab(null);
        renderRecetaDetalle(parts[1]);
        break;
      default:
        location.hash = "#/hoy";
    }
  }

  $backBtn.addEventListener("click", () => {
    history.back();
  });

  window.addEventListener("hashchange", router);

  /* ---------------------------------------------------------
     ARRANQUE
  --------------------------------------------------------- */
  loadData().then(() => {
    if (!location.hash) location.hash = "#/hoy";
    router();
  }).catch(err => {
    $view.innerHTML = emptyStateHTML("No se han podido cargar los datos.", String(err && err.message || err));
    console.error(err);
  });

})();
