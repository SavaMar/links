import "./books-page.css";
import { books } from "./data/books-en.js";

const searchInput = document.getElementById("search-input");
const clearFiltersBtn = document.getElementById("clear-filters");
const scoreFilterSelect = document.getElementById("score-filter");
const tagList = document.getElementById("tag-list");
const booksGrid = document.getElementById("books-grid");
const emptyState = document.getElementById("empty-state");
const toggleTagsBtn = document.getElementById("toggle-tags");

const modalEl = document.getElementById("book-modal");
const modalTitle = modalEl.querySelector("#modal-title");
const modalAuthor = modalEl.querySelector(".modal-author");
const modalScore = modalEl.querySelector(".modal-score");
const modalDescription = modalEl.querySelector(".modal-description");
const modalTags = modalEl.querySelector(".modal-tags");
const modalQuotes = modalEl.querySelector(".modal-quotes");

let activeTag = null;
let query = "";
let scoreFilter = "all";
let allTags = [];
let showAllTags = false;

const POPULAR_TAGS_LIMIT = 16;

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const scoreToLabel = (score) => {
  if (score === "lifechanging") {
    return "Life changing";
  }
  if (typeof score === "number" && score >= 5) {
    return "Top pick";
  }
  return null;
};

const scoreToFilterKey = (score) => {
  if (score === "lifechanging") return "lifechanging";
  if (typeof score === "number" && score >= 5) return "top-pick";
  return "other";
};

const collectTags = () => {
  const tags = new Map();
  books.forEach((book) => {
    (book.hashtags || []).forEach((tag) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });
  allTags = [...tags.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([tag]) => tag);
};

const matchesSearch = (book) => {
  if (!query) return true;

  const searchable = [
    book.title,
    book.author,
    book.description,
    ...(book.hashtags || []).map((tag) => `#${tag}`),
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(query);
};

const matchesTag = (book) => {
  if (!activeTag) return true;
  return (book.hashtags || []).includes(activeTag);
};

const matchesScore = (book) => {
  if (scoreFilter === "all") return true;
  return scoreToFilterKey(book["my-score"]) === scoreFilter;
};

const getFilteredBooks = () =>
  books
    .filter((book) => matchesSearch(book) && matchesTag(book) && matchesScore(book))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

const createTagButton = (tag) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tag-btn";
  btn.textContent = `#${tag}`;
  if (activeTag === tag) {
    btn.classList.add("is-active");
  }
  btn.addEventListener("click", () => {
    activeTag = activeTag === tag ? null : tag;
    render();
  });
  return btn;
};

const createBookCard = (book) => {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "book-card";

  const scoreLabel = scoreToLabel(book["my-score"]);
  const tags = (book.hashtags || []).slice(0, 2);

  card.innerHTML = `
    <div class="book-cover-wrap">
      <img class="book-cover" src="${book.cover || ""}" alt="${book.title} cover" loading="lazy" referrerpolicy="no-referrer" />
      <div class="book-cover-fallback" hidden>${book.title}</div>
      ${scoreLabel ? `<span class="score-badge">★ ${scoreLabel}</span>` : ""}
    </div>
    <div class="book-content">
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">by ${book.author}</p>
      <div class="book-meta">
        <div class="book-tags">
          ${tags.map((tag) => `<span class="book-tag">#${tag}</span>`).join("")}
        </div>
      </div>
    </div>
  `;

  const img = card.querySelector(".book-cover");
  const fallback = card.querySelector(".book-cover-fallback");

  const useFallback = () => {
    img.hidden = true;
    fallback.hidden = false;
  };

  const proxyUrl = book.cover
    ? `https://images.weserv.nl/?url=${encodeURIComponent(
        book.cover.replace(/^https?:\/\//, "")
      )}`
    : "";
  let didRetryViaProxy = false;

  if (!book.cover) {
    useFallback();
  } else {
    img.addEventListener("error", () => {
      if (!didRetryViaProxy && proxyUrl) {
        didRetryViaProxy = true;
        img.src = proxyUrl;
        return;
      }
      useFallback();
    });
  }

  card.addEventListener("click", () => openModal(book));
  return card;
};

const openModal = (book) => {
  modalTitle.textContent = book.title;
  modalAuthor.textContent = `Author: ${book.author}`;
  modalDescription.textContent = book.description || "No description yet.";

  const scoreLabel = scoreToLabel(book["my-score"]);
  if (scoreLabel) {
    modalScore.hidden = false;
    modalScore.textContent = `★ ${scoreLabel}`;
  } else {
    modalScore.hidden = true;
  }

  modalTags.innerHTML = (book.hashtags || [])
    .map((tag) => `<span class="modal-tag">#${tag}</span>`)
    .join("");

  modalQuotes.innerHTML = (book.quotes || [])
    .map((quote) => `<li>${quote}</li>`)
    .join("");

  modalEl.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  modalEl.hidden = true;
  document.body.style.overflow = "";
};

const renderTags = () => {
  tagList.innerHTML = "";
  const visibleTags = showAllTags ? allTags : allTags.slice(0, POPULAR_TAGS_LIMIT);
  visibleTags.forEach((tag) => tagList.appendChild(createTagButton(tag)));
  toggleTagsBtn.hidden = allTags.length <= POPULAR_TAGS_LIMIT;
  toggleTagsBtn.textContent = showAllTags ? "Show fewer tags" : "Show all tags";
};

const renderBooks = () => {
  booksGrid.innerHTML = "";
  const filtered = getFilteredBooks();

  filtered.forEach((book) => booksGrid.appendChild(createBookCard(book)));
  emptyState.hidden = filtered.length > 0;
};

const render = () => {
  renderTags();
  renderBooks();
};

searchInput.addEventListener("input", (event) => {
  query = normalizeText(event.target.value);
  renderBooks();
});

clearFiltersBtn.addEventListener("click", () => {
  query = "";
  activeTag = null;
  scoreFilter = "all";
  searchInput.value = "";
  scoreFilterSelect.value = "all";
  render();
});

toggleTagsBtn.addEventListener("click", () => {
  showAllTags = !showAllTags;
  renderTags();
});

scoreFilterSelect.addEventListener("change", (event) => {
  scoreFilter = event.target.value;
  renderBooks();
});

modalEl.addEventListener("click", (event) => {
  if (event.target.matches("[data-close]")) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalEl.hidden) {
    closeModal();
  }
});

collectTags();
render();
