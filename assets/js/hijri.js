/* ==========================================
   Hijri <-> Gregorian Converter
   Based on the standard Tabular Islamic Calendar
   (arithmetic approximation, not moon-sighting based)
========================================== */
"use strict";

const HijriConverter = (function () {
  const monthNames = [
    "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
    "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];

  // Julian Day Number helpers
  function gregorianToJDN(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function jdnToGregorian(jdn) {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);
    return new Date(year, month - 1, day);
  }

  // Islamic epoch (1 Muharram 1 AH) in JDN
  const ISLAMIC_EPOCH = 1948440;

  function hijriToJDN(year, month, day) {
    return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 +
      Math.floor((3 + 11 * year) / 30) + ISLAMIC_EPOCH - 1;
  }

  function jdnToHijri(jdn) {
    let year = Math.floor((30 * (jdn - ISLAMIC_EPOCH) + 10646) / 10631);
    let month = Math.min(12, Math.ceil((jdn - (29 + hijriToJDN(year, 1, 1))) / 29.5) + 1);
    if (month < 1) month = 1;
    let day = jdn - hijriToJDN(year, month, 1) + 1;
    return { year, month, day };
  }

  function gregorianToHijri(year, month, day) {
    const jdn = gregorianToJDN(year, month, day);
    return jdnToHijri(jdn);
  }

  function hijriToGregorian(year, month, day) {
    const jdn = hijriToJDN(year, month, day);
    return jdnToGregorian(jdn);
  }

  return { gregorianToHijri, hijriToGregorian, monthNames };
})();
