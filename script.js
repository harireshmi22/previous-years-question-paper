import { papers, defaultFilters } from "./index.js";

const state = { ...defaultFilters };
const ITEMS_PER_PAGE = 8;
const DEFAULT_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
let currentPage = 1;
let activePaper = null;
let renderTimer = null;

const searchInput = document.querySelector("#search-input");
const yearFilter = document.querySelector("#year-filter");
const semesterFilter = document.querySelector("#semester-filter");
const paperGrid = document.querySelector("#paper-grid");
const emptyState = document.querySelector("#empty-state");
const resultMeta = document.querySelector("#result-meta");
const quickPapers = document.querySelector("#quick-papers");
const statsWrap = document.querySelector("#stats");
const courseTabs = document.querySelector("#course-tabs");
const paginationWrap = document.querySelector("#pagination");
const paperModal = document.querySelector("#paper-modal");
const paperModalFrame = document.querySelector("#paper-modal-frame");
const paperModalTitle = document.querySelector("#paper-modal-title");
const paperModalMeta = document.querySelector("#paper-modal-meta");
const paperModalClose = document.querySelector("#paper-modal-close");
const paperModalDownload = document.querySelector("#paper-modal-download");
const paperModalOpenNew = document.querySelector("#paper-modal-open-new");
const paperDetailModal = document.querySelector("#paper-detail-modal");
const detailModalClose = document.querySelector("#detail-modal-close");
const detailOpenBtn = document.querySelector("#detail-open-btn");
const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");
const navLinks = [...document.querySelectorAll(".nav-link")];
let lastFocusedElement = null;

function getUniqueValues(key, fallbackLabel, sortFn) {
    const values = [...new Set(papers.map((item) => item[key]))];
    if (sortFn) values.sort(sortFn);
    return [fallbackLabel, ...values];
}

function fillSelect(select, items) {
    select.innerHTML = items
        .map((item) => `<option value="${item}">${item}</option>`)
        .join("");
}

function initializeFilters() {
    fillSelect(yearFilter, getUniqueValues("year", "All Years", (a, b) => b - a));
    fillSelect(
        semesterFilter,
        getUniqueValues("semester", "All Semesters", (a, b) => a.localeCompare(b, undefined, { numeric: true }))
    );
}

function hydrateStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const course = params.get("course");
    const year = params.get("year");
    const semester = params.get("semester");
    const page = Number(params.get("page"));

    const courses = new Set(["All Courses", ...papers.map((paper) => paper.course)]);
    const years = new Set(["All Years", ...papers.map((paper) => String(paper.year))]);
    const semesters = new Set(["All Semesters", ...papers.map((paper) => paper.semester)]);

    if (query !== null) state.search = query;
    if (course && courses.has(course)) state.course = course;
    if (year && years.has(year)) state.year = year;
    if (semester && semesters.has(semester)) state.semester = semester;
    if (Number.isInteger(page) && page > 0) currentPage = page;
}

function syncFormControls() {
    searchInput.value = state.search;

    yearFilter.value = state.year;
    if (yearFilter.value !== state.year) {
        state.year = defaultFilters.year;
        yearFilter.value = state.year;
    }

    semesterFilter.value = state.semester;
    if (semesterFilter.value !== state.semester) {
        state.semester = defaultFilters.semester;
        semesterFilter.value = state.semester;
    }
}

function updateUrlState() {
    const params = new URLSearchParams();

    if (state.search.trim()) params.set("q", state.search.trim());
    if (state.course !== defaultFilters.course) params.set("course", state.course);
    if (state.year !== defaultFilters.year) params.set("year", state.year);
    if (state.semester !== defaultFilters.semester) params.set("semester", state.semester);
    if (currentPage > 1) params.set("page", String(currentPage));

    const queryString = params.toString();
    const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", url);
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

function formatPapers(data, totalCount) {
    if (!data.length) {
        paperGrid.innerHTML = "";
        paperGrid.setAttribute("aria-busy", "false");
        paginationWrap.innerHTML = "";
        emptyState.hidden = false;
        resultMeta.textContent = "No results for selected filters.";
        return;
    }

    emptyState.hidden = true;
    paperGrid.setAttribute("aria-busy", "false");
    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
    resultMeta.innerHTML = `
        <span class="result-meta-chip">Showing ${start}-${end}</span>
        <span class="result-meta-total">of ${totalCount} papers</span>
    `;

    paperGrid.innerHTML = data
        .map(
            (paper, index) => `
				<article class="paper-card reveal">
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
                        <button class="paper-link paper-open-btn" type="button" data-paper-id="${paper.id}" data-action="view" aria-label="View details for ${paper.subject} question paper">
                            Details
                            <span aria-hidden="true">→</span>
                        </button>
                        <button class="paper-link paper-open-btn" type="button" data-paper-id="${paper.id}" data-action="open" aria-label="Open ${paper.subject} question paper">
                            View
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                    <div class="paper-note">No screenshots allowed</div>
				</article>
			`
        )
        .join("");

    revealOnView();
}

function renderSkeletons(count) {
    paperGrid.setAttribute("aria-busy", "true");
    emptyState.hidden = true;
    paginationWrap.innerHTML = "";
    resultMeta.textContent = "Loading papers...";

    paperGrid.innerHTML = Array.from({ length: count }, () => `
        <article class="paper-card skeleton-card" aria-hidden="true">
            <div class="skeleton-line skeleton-line-short"></div>
            <div class="skeleton-line skeleton-line-title"></div>
            <div class="skeleton-line skeleton-line-title medium"></div>
            <div class="skeleton-line skeleton-line-meta"></div>
            <div class="skeleton-actions">
                <span class="skeleton-chip"></span>
                <span class="skeleton-chip"></span>
            </div>
        </article>
    `).join("");
}

function resolvePaperLink(paper) {
    return paper.link && paper.link !== "#" ? paper.link : DEFAULT_PDF_URL;
}

function openDetailModal(paper) {
    const badge = document.querySelector("#detail-badge");
    const title = document.querySelector("#detail-modal-title");
    const course = document.querySelector("#detail-course");
    const year = document.querySelector("#detail-year");
    const semester = document.querySelector("#detail-semester");
    const exam = document.querySelector("#detail-exam");

    badge.textContent = paper.course;
    title.textContent = paper.subject;
    course.textContent = paper.course;
    year.textContent = paper.year;
    semester.textContent = paper.semester;
    exam.textContent = paper.exam;
    if (detailOpenBtn) {
        detailOpenBtn.dataset.paperId = String(paper.id);
    }

    paperDetailModal.hidden = false;
    paperDetailModal.classList.remove("is-closing");
    requestAnimationFrame(() => {
        paperDetailModal.classList.add("is-open");
    });
    paperDetailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    lastFocusedElement = document.activeElement;

    if (detailModalClose) {
        setTimeout(() => {
            detailModalClose.focus();
        }, 20);
    }
}

function closeDetailModal() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finalizeClose = () => {
        paperDetailModal.hidden = true;
        paperDetailModal.classList.remove("is-open", "is-closing");
        paperDetailModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    };

    if (prefersReducedMotion) {
        finalizeClose();
        return;
    }

    paperDetailModal.classList.remove("is-open");
    paperDetailModal.classList.add("is-closing");
    setTimeout(finalizeClose, 300);
}

function getPaperById(id) {
    return papers.find((paper) => paper.id === id);
}

function getDownloadName(paper) {
    return `${paper.course}-${paper.subject}-${paper.year}`.replace(/[^a-z0-9\-]+/gi, "-").replace(/-+/g, "-").toLowerCase() + ".pdf";
}

function openPaperModal(paper) {
    const link = resolvePaperLink(paper);
    activePaper = paper;
    lastFocusedElement = document.activeElement;
    paperModalTitle.textContent = `${paper.subject} (${paper.course} ${paper.year})`;
    if (paperModalMeta) {
        paperModalMeta.textContent = `${paper.semester} • ${paper.exam}`;
    }
    paperModalFrame.src = link;
    paperModalOpenNew.href = link;
    paperModal.hidden = false;
    paperModal.classList.remove("is-closing");
    requestAnimationFrame(() => {
        paperModal.classList.add("is-open");
    });
    paperModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (paperModalClose) {
        setTimeout(() => {
            paperModalClose.focus();
        }, 20);
    }
}

function closePaperModal() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finalizeClose = () => {
        paperModal.hidden = true;
        paperModal.classList.remove("is-open", "is-closing");
        paperModal.setAttribute("aria-hidden", "true");
        paperModalFrame.src = "";
        activePaper = null;
        document.body.classList.remove("modal-open");
        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    };

    if (prefersReducedMotion) {
        finalizeClose();
        return;
    }

    paperModal.classList.remove("is-open");
    paperModal.classList.add("is-closing");
    setTimeout(finalizeClose, 220);
}

function trapFocusInModal(event) {
    if (event.key !== "Tab" || paperModal.hidden) return;

    const selectors = [
        "button:not([disabled])",
        "a[href]",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
    ];

    const focusableElements = [...paperModal.querySelectorAll(selectors.join(","))].filter(
        (element) => !element.hasAttribute("hidden")
    );

    if (!focusableElements.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

async function downloadPaper(paper) {
    const link = resolvePaperLink(paper);

    try {
        const response = await fetch(link);
        if (!response.ok) throw new Error("Download request failed.");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = getDownloadName(paper);
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
    } catch {
        // Fallback when direct fetching is blocked by server policy.
        window.open(link, "_blank", "noopener,noreferrer");
    }
}

function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
        paginationWrap.innerHTML = "";
        return;
    }

    const maxVisible = 5;
    const pageNumbers = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let page = start; page <= end; page += 1) {
        pageNumbers.push(`
            <button type="button" class="page-btn ${currentPage === page ? "is-active" : ""}" data-page="${page}">${page}</button>
        `);
    }

    paginationWrap.innerHTML = `
        <button type="button" class="page-btn" data-page="prev" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
        ${pageNumbers.join("")}
        <button type="button" class="page-btn" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;

    paginationWrap.querySelectorAll(".page-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.page;
            if (target === "prev" && currentPage > 1) currentPage -= 1;
            if (target === "next" && currentPage < totalPages) currentPage += 1;
            if (!Number.isNaN(Number(target))) currentPage = Number(target);
            applyAndRender();
            document.querySelector("#papers")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

function renderQuickPapers() {
    const latest = [...papers]
        .sort((a, b) => b.year - a.year)
        .slice(0, 5)
        .map(
            (paper) => `
			<li>
				<span>${paper.subject}</span>
				<span>${paper.year}</span>
			</li>
		`
        )
        .join("");

    quickPapers.innerHTML = latest;
}

function animateCounters() {
    const yearsCovered = new Set(papers.map((item) => item.year)).size;
    const courseCount = new Set(papers.map((item) => item.course)).size;

    const statItems = [
        { label: "Total Papers", value: papers.length },
        { label: "Programs", value: courseCount },
        { label: "Years Covered", value: yearsCovered }
    ];

    statsWrap.innerHTML = statItems
        .map(
            (stat) => `
			<div class="stat-item">
				<p class="stat-value" data-target="${stat.value}">0</p>
				<p class="stat-label">${stat.label}</p>
			</div>
		`
        )
        .join("");

    const values = statsWrap.querySelectorAll(".stat-value");
    values.forEach((node) => {
        const target = Number(node.dataset.target);
        let current = 0;
        const increment = Math.max(1, Math.round(target / 30));

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                node.textContent = String(target);
                clearInterval(timer);
                return;
            }
            node.textContent = String(current);
        }, 20);
    });
}

function revealOnView() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal:not(.is-visible)").forEach((item) => observer.observe(item));
}

function initializeNavActiveState() {
    if (!navLinks.length) return;
    const sectionIds = ["home", "about", "papers", "contact"];
    const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    const setActive = (id) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", isActive);
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    };

    setActive("home");

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const targetId = link.getAttribute("href")?.replace("#", "");
            if (targetId) setActive(targetId);
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible?.target?.id) setActive(visible.target.id);
        },
        { threshold: 0.35, rootMargin: "-15% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
}

function applyAndRender() {
    const filtered = getFilteredPapers();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (renderTimer) window.clearTimeout(renderTimer);
    renderSkeletons(Math.max(4, Math.min(ITEMS_PER_PAGE, filtered.length || ITEMS_PER_PAGE)));

    renderTimer = window.setTimeout(() => {
        formatPapers(paged, filtered.length);
        renderPagination(filtered.length);
        updateUrlState();
    }, 120);
}

paperGrid.addEventListener("click", async (event) => {
    const openBtn = event.target.closest(".paper-open-btn");
    if (openBtn) {
        const paperId = Number(openBtn.dataset.paperId);
        const action = openBtn.dataset.action;
        const paper = getPaperById(paperId);

        if (paper) {
            if (action === "view") {
                openDetailModal(paper);
            } else if (action === "open") {
                openPaperModal(paper);
            }
        }
        return;
    }

    const downloadBtn = event.target.closest(".paper-download-btn");
    if (downloadBtn) {
        const paperId = Number(downloadBtn.dataset.paperId);
        const paper = getPaperById(paperId);
        if (paper) await downloadPaper(paper);
    }
});

if (paperModalClose) {
    paperModalClose.addEventListener("click", closePaperModal);
}

if (detailModalClose) {
    detailModalClose.addEventListener("click", closeDetailModal);
}

if (detailOpenBtn) {
    detailOpenBtn.addEventListener("click", () => {
        closeDetailModal();
        setTimeout(() => {
            const paperId = Number(detailOpenBtn.dataset.paperId || 0);
            const paper = getPaperById(paperId);
            if (paper) openPaperModal(paper);
        }, 300);
    });
}

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

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            menuToggle.setAttribute("aria-expanded", "false");
            mainNav.classList.remove("is-open");
        }
    });
}

if (paperModal) {
    paperModal.addEventListener("click", (event) => {
        if (event.target === paperModal) closePaperModal();
    });
}

if (paperDetailModal) {
    paperDetailModal.addEventListener("click", (event) => {
        if (event.target === paperDetailModal) closeDetailModal();
    });
}

document.addEventListener("keydown", (event) => {
    trapFocusInModal(event);
    if (event.key === "Escape" && !paperModal.hidden) closePaperModal();
    if (event.key === "Escape" && !paperDetailModal.hidden) closeDetailModal();
    if (event.key === "Escape" && menuToggle && mainNav) {
        menuToggle.setAttribute("aria-expanded", "false");
        mainNav.classList.remove("is-open");
    }
});

if (paperModalDownload) {
    paperModalDownload.addEventListener("click", async () => {
        if (activePaper) await downloadPaper(activePaper);
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

window.addEventListener("popstate", () => {
    state.search = defaultFilters.search;
    state.course = defaultFilters.course;
    state.year = defaultFilters.year;
    state.semester = defaultFilters.semester;
    currentPage = 1;

    hydrateStateFromUrl();
    syncFormControls();
    renderCourseTabs();
    applyAndRender();
});

hydrateStateFromUrl();
initializeFilters();
syncFormControls();
renderCourseTabs();
renderQuickPapers();
animateCounters();
applyAndRender();
revealOnView();
initializeNavActiveState();
