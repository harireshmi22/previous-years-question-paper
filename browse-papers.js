import { papers, defaultFilters } from "./index.js";

const ITEMS_PER_PAGE = 12;
const state = { ...defaultFilters, course: "All Courses" };
let currentPage = 1;

const searchInput = document.querySelector("#search-input");
const yearFilter = document.querySelector("#year-filter");
const semesterFilter = document.querySelector("#semester-filter");
const paperGrid = document.querySelector("#paper-grid");
const emptyState = document.querySelector("#empty-state");
const resultMeta = document.querySelector("#result-meta");
const courseTabs = document.querySelector("#course-tabs");
const paginationWrap = document.querySelector("#pagination");
const menuToggle = document.querySelector("#browse-menu-toggle");
const mainNav = document.querySelector("#browse-main-nav");

function getUniqueValues(key, fallbackLabel, sortFn) {
  const values = [...new Set(papers.map((item) => item[key]))];
  if (sortFn) values.sort(sortFn);
  return [fallbackLabel, ...values];
}

function fillSelect(select, items) {
  select.innerHTML = items.map((item) => `<option value="${item}">${item}</option>`).join("");
}

function initializeFilters() {
  fillSelect(yearFilter, getUniqueValues("year", "All Years", (a, b) => b - a));
  fillSelect(
    semesterFilter,
    getUniqueValues("semester", "All Semesters", (a, b) => a.localeCompare(b, undefined, { numeric: true }))
  );
}

function renderCourseTabs() {
  const courses = getUniqueValues("course", "All Courses", (a, b) => a.localeCompare(b));
  courseTabs.innerHTML = courses
    .map((course) => {
      const count = course === "All Courses" ? papers.length : papers.filter((paper) => paper.course === course).length;
      const isActive = state.course === course;
      return `
        <button class="course-tab ${isActive ? "is-active" : ""}" type="button" role="tab" aria-selected="${isActive}" data-course="${course}">
          <span>${course}</span>
          <small>${count}</small>
        </button>
      `;
    })
    .join("");

  courseTabs.querySelectorAll(".course-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.course = tab.dataset.course;
      currentPage = 1;
      renderCourseTabs();
      applyAndRender();
    });
  });
}

function getFilteredPapers() {
  const text = state.search.trim().toLowerCase();
  return papers.filter((paper) => {
    const matchesSearch =
      !text ||
      paper.subject.toLowerCase().includes(text) ||
      paper.course.toLowerCase().includes(text) ||
      paper.exam.toLowerCase().includes(text);
    const matchesCourse = state.course === "All Courses" || paper.course === state.course;
    const matchesYear = state.year === "All Years" || String(paper.year) === String(state.year);
    const matchesSemester = state.semester === "All Semesters" || paper.semester === state.semester;
    return matchesSearch && matchesCourse && matchesYear && matchesSemester;
  });
}

function renderPagination(totalCount) {
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    paginationWrap.innerHTML = "";
    return;
  }

  const pageButtons = Array.from({ length: totalPages }, (_, index) => index + 1)
    .map(
      (page) => `
        <button type="button" class="page-btn ${page === currentPage ? "is-active" : ""}" data-page="${page}">${page}</button>
      `
    )
    .join("");

  paginationWrap.innerHTML = pageButtons;
  paginationWrap.querySelectorAll(".page-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = Number(button.dataset.page);
      applyAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function applyAndRender() {
  const filtered = getFilteredPapers();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!paged.length) {
    resultMeta.textContent = "No results for selected filters.";
    paperGrid.innerHTML = "";
    paginationWrap.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  resultMeta.innerHTML = `
    <span class="result-meta-chip">Showing ${start}-${end}</span>
    <span class="result-meta-total">of ${filtered.length} papers</span>
  `;

  paperGrid.innerHTML = paged
    .map(
      (paper, index) => `
        <article class="paper-card">
          <div class="paper-card-head">
            <p class="paper-course">${paper.course}</p>
            <div class="paper-badges">
              <span class="paper-year">${paper.year}</span>
              <span class="paper-number">#${start + index}</span>
            </div>
          </div>
          <h3 class="paper-title">${paper.subject}</h3>
          <p class="paper-meta">${paper.semester} • ${paper.exam}</p>
          <div class="paper-actions">
            <button class="paper-link paper-open-btn" type="button" data-link="${paper.link && paper.link !== "#" ? paper.link : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}">Details</button>
            <a class="paper-link paper-open-btn" href="${paper.link && paper.link !== "#" ? paper.link : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}" target="_blank" rel="noopener noreferrer">View</a>
          </div>
          <div class="paper-note">No screenshots allowed</div>
        </article>
      `
    )
    .join("");

  renderPagination(filtered.length);

  paperGrid.querySelectorAll("button[data-link]").forEach((button) => {
    button.addEventListener("click", () => {
      window.open(button.dataset.link, "_blank", "noopener,noreferrer");
    });
  });
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  currentPage = 1;
  applyAndRender();
});

yearFilter.addEventListener("change", (event) => {
  state.year = event.target.value;
  currentPage = 1;
  applyAndRender();
});

semesterFilter.addEventListener("change", (event) => {
  state.semester = event.target.value;
  currentPage = 1;
  applyAndRender();
});

if (menuToggle && mainNav) {
  menuToggle.setAttribute("aria-expanded", "false");
  mainNav.classList.remove("is-open");

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    mainNav.classList.toggle("is-open", !isExpanded);
  });

  mainNav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    });
  });

  document.addEventListener("click", (event) => {
    if (!mainNav.classList.contains("is-open")) return;
    const clickedInsideNav = mainNav.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);
    if (!clickedInsideNav && !clickedToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    }
  });
}

initializeFilters();
renderCourseTabs();
applyAndRender();
