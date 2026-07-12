// Rotates daily based on day-of-year, so every visitor sees the same item on a given day.
window.DAILY_POOL = [
  { type: "آية", text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", ref: "سورة الطلاق — الآية ٢" },
  { type: "حديث", text: "الدين النصيحة", ref: "رواه مسلم" },
  { type: "آية", text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "سورة الشرح — الآية ٦" },
  { type: "حديث", text: "من حسن إسلام المرء تركه ما لا يعنيه", ref: "رواه الترمذي" },
  { type: "آية", text: "وَبَشِّرِ الصَّابِرِينَ", ref: "سورة البقرة — الآية ١٥٥" },
  { type: "حديث", text: "الكلمة الطيبة صدقة", ref: "متفق عليه" },
  { type: "آية", text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", ref: "سورة طه — الآية ١١٤" },
  { type: "حديث", text: "المؤمن للمؤمن كالبنيان يشد بعضه بعضًا", ref: "متفق عليه" },
  { type: "آية", text: "فَاذْكُرُونِي أَذْكُرْكُمْ", ref: "سورة البقرة — الآية ١٥٢" },
  { type: "حديث", text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه", ref: "متفق عليه" },
  { type: "آية", text: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ", ref: "سورة المائدة — الآية ٢" },
  { type: "حديث", text: "من لا يرحم لا يُرحم", ref: "متفق عليه" },
  { type: "آية", text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", ref: "سورة البقرة — الآية ٢٠١" },
  { type: "حديث", text: "إنما الأعمال بالنيات", ref: "متفق عليه" },
];

function renderDailyContent(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const item = window.DAILY_POOL[dayOfYear % window.DAILY_POOL.length];
  el.innerHTML = `
    <span style="font-size:11px; font-weight:800; color:var(--gold); text-transform:uppercase; letter-spacing:1px;">${item.type} اليوم</span>
    <p class="ayah" style="font-size:19px; margin:8px 0 6px;">"${item.text}"</p>
    <span style="font-size:12.5px; opacity:0.75;">${item.ref}</span>
  `;
}
