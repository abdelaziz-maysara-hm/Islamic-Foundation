/* ============================================================
   وحدة القرآن الكريم — تتكامل مع Al Quran Cloud API (مجاني، بدون مفتاح)
   المصدر: https://alquran.cloud/api  — Base: https://api.alquran.cloud/v1
   بدون Backend: كل الطلبات بتتنادى مباشرة من متصفح المستخدم.
   ============================================================ */

const QURAN_API  = "https://api.alquran.cloud/v1";
const CDN_AYAH  = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";
const CDN_SURAH = "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy";
const EDITION_TEXT   = "quran-uthmani";
const EDITION_TAFSIR = "ar.muyassar";

let SURAH_LIST_CACHE = null;
let currentSurahNum  = 0;   // track which surah is open
let currentAudio     = null;
let audioPlaying     = false;

function q(sel, root = document) { return root.querySelector(sel); }

function setStatus(msg, isError = false) {
  const box = q("#qStatus");
  if (!box) return;
  box.textContent = msg || "";
  box.style.color = isError ? "#b5432f" : "var(--muted)";
}

/* ---------- قائمة السور ---------- */
async function loadSurahList() {
  if (SURAH_LIST_CACHE) return SURAH_LIST_CACHE;
  setStatus("جارِ تحميل قائمة السور...");
  const res = await fetch(`${QURAN_API}/surah`);
  if (!res.ok) throw new Error("تعذّر الاتصال بخادم القرآن");
  const data = await res.json();
  SURAH_LIST_CACHE = data.data;
  setStatus("");
  return SURAH_LIST_CACHE;
}

function renderSurahGrid(list) {
  const grid = q("#surahGrid");
  if (!grid) return;
  grid.innerHTML = list.map(s => `
    <button class="surah-card" data-surah="${s.number}">
      <span class="surah-num">${s.number}</span>
      <span class="surah-names">
        <b>${s.name}</b>
        <small>${s.englishName} · ${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · ${s.numberOfAyahs} آية</small>
      </span>
    </button>
  `).join("");
  grid.querySelectorAll(".surah-card").forEach(btn => {
    btn.addEventListener("click", () => openSurah(parseInt(btn.dataset.surah, 10)));
  });
}

/* ---------- مشغّل الصوت ---------- */
function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
    audioPlaying = false;
  }
}

function updatePlayBtn(btn, playing) {
  if (!btn) return;
  btn.textContent = playing
    ? "⏸ إيقاف مؤقت"
    : "🔊 استماع للسورة كاملة (العفاسي)";
}

function playSurahAudio(num) {
  const btn = q("#btnPlaySurah");
  if (currentAudio && audioPlaying) {
    currentAudio.pause();
    audioPlaying = false;
    updatePlayBtn(btn, false);
    return;
  }
  if (currentAudio && !audioPlaying) {
    currentAudio.play().catch(() => setStatus("تعذّر تشغيل الصوت.", true));
    audioPlaying = true;
    updatePlayBtn(btn, true);
    return;
  }
  stopAudio();
  currentAudio = new Audio(`${CDN_SURAH}/${num}.mp3`);
  currentAudio.play().catch(() => {
    setStatus("تعذّر تشغيل الصوت — تأكد من اتصالك بالإنترنت.", true);
  });
  audioPlaying = true;
  updatePlayBtn(btn, true);
  currentAudio.onended = () => { audioPlaying = false; updatePlayBtn(btn, false); };
  currentAudio.onerror = () => { audioPlaying = false; updatePlayBtn(btn, false); };
}

function playAyahAudio(globalNum, btn) {
  // Toggle for ayah buttons
  if (btn && btn.dataset.playing === "1") {
    stopAudio();
    btn.dataset.playing = "0";
    btn.textContent = "🔊 استماع";
    return;
  }
  stopAudio();
  // Reset all ayah buttons
  document.querySelectorAll("[data-play]").forEach(b => { b.textContent = "🔊 استماع"; b.dataset.playing = "0"; });
  currentAudio = new Audio(`${CDN_AYAH}/${globalNum}.mp3`);
  currentAudio.play().catch(() => setStatus("تعذّر تشغيل الصوت.", true));
  if (btn) { btn.textContent = "⏸ إيقاف"; btn.dataset.playing = "1"; }
  currentAudio.onended = () => {
    if (btn) { btn.textContent = "🔊 استماع"; btn.dataset.playing = "0"; }
    audioPlaying = false;
  };
}

/* ---------- فتح سورة ---------- */
async function openSurah(number) {
  const reader  = q("#surahReader");
  const browser = q("#surahBrowser");
  if (!reader || !browser) return;

  stopAudio();
  currentSurahNum = number;
  const list = SURAH_LIST_CACHE || [];

  browser.style.display = "none";
  reader.style.display  = "block";
  reader.innerHTML = `<p class="qa-loading">جارِ تحميل السورة ${number}...</p>`;
  window.scrollTo({ top: (reader.offsetTop || 0) - 90, behavior: "smooth" });

  try {
    const res = await fetch(`${QURAN_API}/surah/${number}/editions/${EDITION_TEXT},${EDITION_TAFSIR}`);
    if (!res.ok) throw new Error("تعذّر تحميل السورة");
    const data = await res.json();
    const [arabicEd, tafsirEd] = data.data;
    const meta = arabicEd;

    const prevNum = number > 1   ? number - 1 : null;
    const nextNum = number < 114 ? number + 1 : null;
    const prevName = prevNum && list[prevNum - 1] ? list[prevNum - 1].name : "";
    const nextName = nextNum && list[nextNum - 1] ? list[nextNum - 1].name : "";

    let html = `
      <div class="reader-head">
        <div style="display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; margin-bottom:16px;">
          <button class="btn-back" id="btnBackToList">→ رجوع لكل السور</button>
          ${nextNum ? `<button class="btn-nav" id="btnNext" data-to="${nextNum}">التالية: ${nextName} ←</button>` : ''}
          ${prevNum ? `<button class="btn-nav" id="btnPrev" data-to="${prevNum}">→ السابقة: ${prevName}</button>` : ''}
        </div>
        <h2>سورة ${meta.name.replace('سُورَةُ ', '')}</h2>
        <p class="reader-sub">${meta.englishName} · ${meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · ${meta.numberOfAyahs} آية</p>
        <button class="btn-calc" id="btnPlaySurah">🔊 استماع للسورة كاملة (العفاسي)</button>
      </div>
      <div class="ayah-list">
    `;

    meta.ayahs.forEach((ayah, i) => {
      const tafsirText = tafsirEd.ayahs[i] ? tafsirEd.ayahs[i].text : "";
      html += `
        <div class="ayah-block">
          <div class="ayah-text">
            ${ayah.text}
            <span class="ayah-badge">﴿${ayah.numberInSurah}﴾</span>
          </div>
          <div class="ayah-actions">
            <button class="mini-btn" data-play="${ayah.number}" data-playing="0">🔊 استماع</button>
            <button class="mini-btn" data-tafsir-toggle="${i}">📖 التفسير الميسّر</button>
          </div>
          <div class="ayah-tafsir" id="tafsir-${i}" style="display:none;">${tafsirText}</div>
        </div>
      `;
    });
    html += `</div>`;
    reader.innerHTML = html;

    // Back button
    q("#btnBackToList").addEventListener("click", () => {
      stopAudio();
      reader.style.display  = "none";
      browser.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Prev / Next
    [q("#btnPrev"), q("#btnNext")].forEach(btn => {
      if (btn) btn.addEventListener("click", () => openSurah(parseInt(btn.dataset.to, 10)));
    });

    // Play surah
    q("#btnPlaySurah").addEventListener("click", () => playSurahAudio(number));

    // Ayah audio buttons
    reader.querySelectorAll("[data-play]").forEach(btn => {
      btn.addEventListener("click", () => playAyahAudio(btn.dataset.play, btn));
    });

    // Tafsir toggle
    reader.querySelectorAll("[data-tafsir-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        const box = q(`#tafsir-${btn.dataset.tafsirToggle}`);
        if (box) box.style.display = box.style.display === "none" ? "block" : "none";
      });
    });

  } catch (err) {
    reader.innerHTML = `
      <p class="qa-loading" style="color:#b5432f;">تعذّر تحميل السورة — تأكد من اتصالك بالإنترنت.</p>
      <button class="btn-back" id="btnBackErr">→ رجوع</button>`;
    q("#btnBackErr") && q("#btnBackErr").addEventListener("click", () => {
      reader.style.display  = "none";
      browser.style.display = "block";
    });
  }
}

/* ---------- CSS للأزرار الجديدة (مضاف ديناميكيًا) ---------- */
(function injectCSS() {
  const style = document.createElement("style");
  style.textContent = `
    .btn-nav{
      background:var(--teal-soft); color:var(--teal-deep); border:1px solid var(--line);
      font-family:'Cairo'; font-weight:700; font-size:13px;
      padding:8px 16px; border-radius:20px; cursor:pointer; transition:background .2s;
    }
    .btn-nav:hover{background:var(--teal); color:#fff;}
  `;
  document.head.appendChild(style);
})();

/* ---------- البحث في القرآن ---------- */
let searchDebounce = null;
async function searchQuran(keyword) {
  const resultsBox = q("#qSearchResults");
  if (!resultsBox) return;
  if (!keyword || keyword.trim().length < 2) { resultsBox.innerHTML = ""; return; }
  resultsBox.innerHTML = `<p class="qa-loading">جارِ البحث...</p>`;
  try {
    const res  = await fetch(`${QURAN_API}/search/${encodeURIComponent(keyword.trim())}/all/${EDITION_TEXT}`);
    const data = await res.json();
    if (data.code !== 200 || !data.data.matches || data.data.matches.length === 0) {
      resultsBox.innerHTML = `<p class="qa-loading">لا توجد نتائج لـ "${keyword}".</p>`;
      return;
    }
    const matches = data.data.matches.slice(0, 20);
    resultsBox.innerHTML =
      `<p class="qa-count">${data.data.count} نتيجة (المعروض أول ${matches.length})</p>` +
      matches.map(m => `
        <div class="search-hit" data-surah="${m.surah.number}" style="cursor:pointer;">
          <span class="ayah-badge">سورة ${m.surah.name} ﴿${m.numberInSurah}﴾</span>
          <p>${m.text}</p>
        </div>
      `).join("");
    resultsBox.querySelectorAll(".search-hit").forEach(el => {
      el.addEventListener("click", () => openSurah(parseInt(el.dataset.surah, 10)));
    });
  } catch (err) {
    resultsBox.innerHTML = `<p class="qa-loading" style="color:#b5432f;">تعذّر البحث الآن، حاول مرة أخرى.</p>`;
  }
}

/* ---------- بدء التشغيل ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  if (!q("#surahGrid")) return;
  try {
    const list = await loadSurahList();
    renderSurahGrid(list);
  } catch (err) {
    setStatus("تعذّر تحميل قائمة السور. تأكد من اتصالك بالإنترنت.", true);
  }

  const searchInput = q("#qSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => searchQuran(e.target.value), 450);
    });
  }
});
