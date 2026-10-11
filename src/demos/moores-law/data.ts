/** 出典確認：2026-10-11。CPUと複数ダイSoCが混在する概観用データ。 */
export const sources = {
  intel: {
    title: "Intel Microprocessor Quick Reference Guide",
    url: "https://www.intel.com/pressroom/kits/quickreffam.htm",
  },
  apple: {
    title: "Apple introduces M2 Ultra (2023)",
    url: "https://www.apple.com/newsroom/2023/06/apple-introduces-m2-ultra/",
  },
  history: {
    title: "Intel — Moore’s Law",
    url: "https://www.intel.com/content/www/us/en/newsroom/resources/moores-law.html",
  },
  speech: {
    title: "Gordon Moore — An Update on Moore’s Law (1997)",
    url: "https://www.intel.com/pressroom/archive/speeches/GEM93097.HTM",
  },
};
export const chips = [
  {
    name: "Intel 4004",
    short: "4004",
    year: 1971,
    count: 2300,
    kind: "CPU",
    source: "intel",
  },
  {
    name: "Intel 80386 DX",
    short: "80386 DX",
    year: 1985,
    count: 275000,
    kind: "CPU",
    source: "intel",
  },
  {
    name: "Intel Core i7-920",
    short: "Core i7",
    year: 2008,
    count: 731000000,
    kind: "CPU",
    source: "intel",
  },
  {
    name: "Apple M2 Ultra",
    short: "M2 Ultra",
    year: 2023,
    count: 134000000000,
    kind: "SoC（2ダイ）",
    source: "apple",
  },
] as const;
export const corrections =
  "仕様書の80386「約22.9万」と初期Core i7「約3.8億」は、Intel公式表に基づき80386 DX「約27.5万」、Core i7-920「約7.31億」に修正しています。";
