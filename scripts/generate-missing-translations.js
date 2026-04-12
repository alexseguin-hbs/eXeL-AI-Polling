const fs = require('fs');
const path = require('path');

const TRANSLATIONS_FILE = path.join(__dirname, '..', 'frontend', 'lib', 'lexicon-translations.ts');

// All missing keys with translations for all 32 languages
const MISSING_TRANSLATIONS = {
  "trinity.governance.top": {
    fr: "LEADERSHIP", es: "LIDERAZGO", de: "FÜHRUNG", it: "LEADERSHIP", pt: "LIDERANÇA",
    ru: "ЛИДЕРСТВО", nl: "LEIDERSCHAP", zh: "领导力", ja: "リーダーシップ", ko: "리더십",
    ar: "قيادة", hi: "नेतृत्व", bn: "নেতৃত্ব", pa: "ਲੀਡਰਸ਼ਿਪ", th: "ภาวะผู้นำ",
    vi: "LÃNH ĐẠO", id: "KEPEMIMPINAN", ms: "KEPIMPINAN", tl: "PAMUMUNO", tr: "LİDERLİK",
    pl: "PRZYWÓDZTWO", uk: "ЛІДЕРСТВО", ro: "CONDUCERE", el: "ΗΓΕΣΙΑ", cs: "VEDENÍ",
    sv: "LEDARSKAP", da: "LEDERSKAB", fi: "JOHTAJUUS", no: "LEDERSKAP", he: "מנהיגות",
    sw: "UONGOZI", ne: "नेतृत्व"
  },
  "trinity.governance.right": {
    fr: "INTÉGRATION", es: "INTEGRACIÓN", de: "INTEGRATION", it: "INTEGRAZIONE", pt: "INTEGRAÇÃO",
    ru: "ИНТЕГРАЦИЯ", nl: "INTEGRATIE", zh: "整合", ja: "統合", ko: "통합",
    ar: "تكامل", hi: "एकीकरण", bn: "একীকরণ", pa: "ਏਕੀਕਰਨ", th: "บูรณาการ",
    vi: "TÍCH HỢP", id: "INTEGRASI", ms: "INTEGRASI", tl: "INTEGRASYON", tr: "ENTEGRASYON",
    pl: "INTEGRACJA", uk: "ІНТЕГРАЦІЯ", ro: "INTEGRARE", el: "ΕΝΣΩΜΑΤΩΣΗ", cs: "INTEGRACE",
    sv: "INTEGRATION", da: "INTEGRATION", fi: "INTEGRAATIO", no: "INTEGRASJON", he: "אינטגרציה",
    sw: "MUUNGANISHO", ne: "एकीकरण"
  },
  "trinity.governance.left": {
    fr: "ADAPTATION", es: "ADAPTACIÓN", de: "ANPASSUNG", it: "ADATTAMENTO", pt: "ADAPTAÇÃO",
    ru: "АДАПТАЦИЯ", nl: "AANPASSING", zh: "适应", ja: "適応", ko: "적응",
    ar: "تكيف", hi: "अनुकूलन", bn: "অভিযোজন", pa: "ਅਨੁਕੂਲਨ", th: "การปรับตัว",
    vi: "THÍCH ỨNG", id: "ADAPTASI", ms: "ADAPTASI", tl: "ADAPTASYON", tr: "UYUM",
    pl: "ADAPTACJA", uk: "АДАПТАЦІЯ", ro: "ADAPTARE", el: "ΠΡΟΣΑΡΜΟΓΗ", cs: "ADAPTACE",
    sv: "ANPASSNING", da: "TILPASNING", fi: "SOPEUTUMINEN", no: "TILPASNING", he: "התאמה",
    sw: "KUBADILIKA", ne: "अनुकूलन"
  },
  "trinity.governance.title": {
    fr: "Gouvernance", es: "Gobernanza", de: "Governance", it: "Governance", pt: "Governança",
    ru: "Управление", nl: "Governance", zh: "治理", ja: "ガバナンス", ko: "거버넌스",
    ar: "حوكمة", hi: "शासन", bn: "শাসন", pa: "ਸ਼ਾਸਨ", th: "ธรรมาภิบาล",
    vi: "Quản trị", id: "Tata Kelola", ms: "Tadbir Urus", tl: "Pamamahala", tr: "Yönetişim",
    pl: "Zarządzanie", uk: "Управління", ro: "Guvernanță", el: "Διακυβέρνηση", cs: "Správa",
    sv: "Styrning", da: "Styring", fi: "Hallinto", no: "Styring", he: "ממשל",
    sw: "Utawala", ne: "शासन"
  },
  "trinity.family.top": {
    fr: "ENFANT", es: "NIÑO", de: "KIND", it: "BAMBINO", pt: "CRIANÇA",
    ru: "ДИТЯ", nl: "KIND", zh: "孩子", ja: "子供", ko: "아이",
    ar: "طفل", hi: "बच्चा", bn: "শিশু", pa: "ਬੱਚਾ", th: "เด็ก",
    vi: "TRẺ EM", id: "ANAK", ms: "ANAK", tl: "BATA", tr: "ÇOCUK",
    pl: "DZIECKO", uk: "ДИТИНА", ro: "COPIL", el: "ΠΑΙΔΙ", cs: "DÍTĚ",
    sv: "BARN", da: "BARN", fi: "LAPSI", no: "BARN", he: "ילד",
    sw: "MTOTO", ne: "बच्चा"
  },
  "trinity.family.right": {
    fr: "MÈRE", es: "MADRE", de: "MUTTER", it: "MADRE", pt: "MÃE",
    ru: "МАТЬ", nl: "MOEDER", zh: "母亲", ja: "母", ko: "어머니",
    ar: "أم", hi: "माता", bn: "মা", pa: "ਮਾਂ", th: "แม่",
    vi: "MẸ", id: "IBU", ms: "IBU", tl: "INA", tr: "ANNE",
    pl: "MATKA", uk: "МАТИ", ro: "MAMĂ", el: "ΜΗΤΕΡΑ", cs: "MATKA",
    sv: "MODER", da: "MODER", fi: "ÄITI", no: "MOR", he: "אם",
    sw: "MAMA", ne: "आमा"
  },
  "trinity.family.left": {
    fr: "PÈRE", es: "PADRE", de: "VATER", it: "PADRE", pt: "PAI",
    ru: "ОТЕЦ", nl: "VADER", zh: "父亲", ja: "父", ko: "아버지",
    ar: "أب", hi: "पिता", bn: "পিতা", pa: "ਪਿਤਾ", th: "พ่อ",
    vi: "CHA", id: "AYAH", ms: "BAPA", tl: "AMA", tr: "BABA",
    pl: "OJCIEC", uk: "БАТЬКО", ro: "TATĂ", el: "ΠΑΤΕΡΑΣ", cs: "OTEC",
    sv: "FADER", da: "FADER", fi: "ISÄ", no: "FAR", he: "אב",
    sw: "BABA", ne: "बुबा"
  },
  "trinity.family.title": {
    fr: "Famille Sacrée", es: "Familia Sagrada", de: "Heilige Familie", it: "Sacra Famiglia", pt: "Família Sagrada",
    ru: "Священная Семья", nl: "Heilige Familie", zh: "神圣家庭", ja: "聖なる家族", ko: "신성한 가족",
    ar: "العائلة المقدسة", hi: "पवित्र परिवार", bn: "পবিত্র পরিবার", pa: "ਪਵਿੱਤਰ ਪਰਿਵਾਰ", th: "ครอบครัวศักดิ์สิทธิ์",
    vi: "Gia Đình Thiêng Liêng", id: "Keluarga Suci", ms: "Keluarga Suci", tl: "Banal na Pamilya", tr: "Kutsal Aile",
    pl: "Święta Rodzina", uk: "Свята Родина", ro: "Familie Sacră", el: "Ιερή Οικογένεια", cs: "Svatá Rodina",
    sv: "Helig Familj", da: "Hellig Familie", fi: "Pyhä Perhe", no: "Hellig Familie", he: "משפחה קדושה",
    sw: "Familia Takatifu", ne: "पवित्र परिवार"
  },
  "trinity.wholeness.top": {
    fr: "ESPRIT", es: "ESPÍRITU", de: "GEIST", it: "SPIRITO", pt: "ESPÍRITO",
    ru: "ДУХ", nl: "GEEST", zh: "灵", ja: "霊", ko: "영",
    ar: "روح", hi: "आत्मा", bn: "আত্মা", pa: "ਆਤਮਾ", th: "จิตวิญญาณ",
    vi: "TINH THẦN", id: "ROH", ms: "ROH", tl: "ESPIRITU", tr: "RUH",
    pl: "DUCH", uk: "ДУХ", ro: "SPIRIT", el: "ΠΝΕΥΜΑ", cs: "DUCH",
    sv: "ANDE", da: "ÅND", fi: "HENKI", no: "ÅND", he: "רוח",
    sw: "ROHO", ne: "आत्मा"
  },
  "trinity.wholeness.right": {
    fr: "CORPS", es: "CUERPO", de: "KÖRPER", it: "CORPO", pt: "CORPO",
    ru: "ТЕЛО", nl: "LICHAAM", zh: "身体", ja: "体", ko: "몸",
    ar: "جسد", hi: "शरीर", bn: "শরীর", pa: "ਸਰੀਰ", th: "ร่างกาย",
    vi: "THÂN THỂ", id: "TUBUH", ms: "BADAN", tl: "KATAWAN", tr: "BEDEN",
    pl: "CIAŁO", uk: "ТІЛО", ro: "CORP", el: "ΣΩΜΑ", cs: "TĚLO",
    sv: "KROPP", da: "KROP", fi: "KEHO", no: "KROPP", he: "גוף",
    sw: "MWILI", ne: "शरीर"
  },
  "trinity.wholeness.left": {
    fr: "ESPRIT", es: "MENTE", de: "GEIST", it: "MENTE", pt: "MENTE",
    ru: "РАЗУМ", nl: "GEEST", zh: "心智", ja: "心", ko: "마음",
    ar: "عقل", hi: "मन", bn: "মন", pa: "ਮਨ", th: "จิตใจ",
    vi: "TRÍ TUỆ", id: "PIKIRAN", ms: "MINDA", tl: "ISIPAN", tr: "ZİHİN",
    pl: "UMYSŁ", uk: "РОЗУМ", ro: "MINTE", el: "ΝΟΥΣ", cs: "MYSL",
    sv: "SINNE", da: "SIND", fi: "MIELI", no: "SINN", he: "שכל",
    sw: "AKILI", ne: "मन"
  },
  "trinity.wholeness.title": {
    fr: "Plénitude", es: "Plenitud", de: "Ganzheit", it: "Pienezza", pt: "Plenitude",
    ru: "Целостность", nl: "Heelheid", zh: "完整", ja: "全体性", ko: "온전함",
    ar: "الكمال", hi: "पूर्णता", bn: "সম্পূর্ণতা", pa: "ਸੰਪੂਰਨਤਾ", th: "ความสมบูรณ์",
    vi: "Toàn Vẹn", id: "Keutuhan", ms: "Keutuhan", tl: "Kabuuan", tr: "Bütünlük",
    pl: "Pełnia", uk: "Цілісність", ro: "Plenitudine", el: "Ολότητα", cs: "Celistvost",
    sv: "Helhet", da: "Helhed", fi: "Eheys", no: "Helhet", he: "שלמות",
    sw: "Ukamilifu", ne: "पूर्णता"
  },
  "trinity.framework.top": {
    fr: "H.I.", es: "H.I.", de: "H.I.", it: "H.I.", pt: "H.I.",
    ru: "H.I.", nl: "H.I.", zh: "H.I.", ja: "H.I.", ko: "H.I.",
    ar: "H.I.", hi: "H.I.", bn: "H.I.", pa: "H.I.", th: "H.I.",
    vi: "H.I.", id: "H.I.", ms: "H.I.", tl: "H.I.", tr: "H.I.",
    pl: "H.I.", uk: "H.I.", ro: "H.I.", el: "H.I.", cs: "H.I.",
    sv: "H.I.", da: "H.I.", fi: "H.I.", no: "H.I.", he: "H.I.",
    sw: "H.I.", ne: "H.I."
  },
  "trinity.framework.right": {
    fr: "S.I.", es: "S.I.", de: "S.I.", it: "S.I.", pt: "S.I.",
    ru: "S.I.", nl: "S.I.", zh: "S.I.", ja: "S.I.", ko: "S.I.",
    ar: "S.I.", hi: "S.I.", bn: "S.I.", pa: "S.I.", th: "S.I.",
    vi: "S.I.", id: "S.I.", ms: "S.I.", tl: "S.I.", tr: "S.I.",
    pl: "S.I.", uk: "S.I.", ro: "S.I.", el: "S.I.", cs: "S.I.",
    sv: "S.I.", da: "S.I.", fi: "S.I.", no: "S.I.", he: "S.I.",
    sw: "S.I.", ne: "S.I."
  },
  "trinity.framework.left": {
    fr: "A.I.", es: "A.I.", de: "A.I.", it: "A.I.", pt: "A.I.",
    ru: "A.I.", nl: "A.I.", zh: "A.I.", ja: "A.I.", ko: "A.I.",
    ar: "A.I.", hi: "A.I.", bn: "A.I.", pa: "A.I.", th: "A.I.",
    vi: "A.I.", id: "A.I.", ms: "A.I.", tl: "A.I.", tr: "A.I.",
    pl: "A.I.", uk: "A.I.", ro: "A.I.", el: "A.I.", cs: "A.I.",
    sv: "A.I.", da: "A.I.", fi: "A.I.", no: "A.I.", he: "A.I.",
    sw: "A.I.", ne: "A.I."
  },
  "trinity.framework.title": {
    fr: "Cadre Trinity", es: "Marco Trinity", de: "Trinity-Rahmen", it: "Framework Trinity", pt: "Estrutura Trinity",
    ru: "Структура Trinity", nl: "Trinity Raamwerk", zh: "三位一体框架", ja: "トリニティフレームワーク", ko: "트리니티 프레임워크",
    ar: "إطار الثالوث", hi: "ट्रिनिटी ढांचा", bn: "ট্রিনিটি ফ্রেমওয়ার্ক", pa: "ਟ੍ਰਿਨਿਟੀ ਫਰੇਮਵਰਕ", th: "กรอบ Trinity",
    vi: "Khung Trinity", id: "Kerangka Trinity", ms: "Rangka Kerja Trinity", tl: "Trinity Framework", tr: "Trinity Çerçevesi",
    pl: "Struktura Trinity", uk: "Структура Trinity", ro: "Cadru Trinity", el: "Πλαίσιο Trinity", cs: "Rámec Trinity",
    sv: "Trinity-ramverk", da: "Trinity-ramme", fi: "Trinity-kehys", no: "Trinity-rammeverk", he: "מסגרת Trinity",
    sw: "Mfumo wa Trinity", ne: "ट्रिनिटी फ्रेमवर्क"
  },
  "trinity.consciousness.top": {
    fr: "SAGESSE", es: "SABIDURÍA", de: "WEISHEIT", it: "SAGGEZZA", pt: "SABEDORIA",
    ru: "МУДРОСТЬ", nl: "WIJSHEID", zh: "智慧", ja: "知恵", ko: "지혜",
    ar: "حكمة", hi: "ज्ञान", bn: "প্রজ্ঞা", pa: "ਬੁੱਧੀ", th: "ปัญญา",
    vi: "TRÍ TUỆ", id: "KEBIJAKSANAAN", ms: "KEBIJAKSANAAN", tl: "KARUNUNGAN", tr: "BİLGELİK",
    pl: "MĄDROŚĆ", uk: "МУДРІСТЬ", ro: "ÎNȚELEPCIUNE", el: "ΣΟΦΙΑ", cs: "MOUDROST",
    sv: "VISDOM", da: "VISDOM", fi: "VIISAUS", no: "VISDOM", he: "חוכמה",
    sw: "HEKIMA", ne: "बुद्धि"
  },
  "trinity.consciousness.right": {
    fr: "HARMONIE", es: "ARMONÍA", de: "HARMONIE", it: "ARMONIA", pt: "HARMONIA",
    ru: "ГАРМОНИЯ", nl: "HARMONIE", zh: "和谐", ja: "調和", ko: "조화",
    ar: "انسجام", hi: "सामंजस्य", bn: "সামঞ্জস্য", pa: "ਸਦਭਾਵਨਾ", th: "ความสมดุล",
    vi: "HÀI HÒA", id: "HARMONI", ms: "HARMONI", tl: "PAGKAKAISA", tr: "UYUM",
    pl: "HARMONIA", uk: "ГАРМОНІЯ", ro: "ARMONIE", el: "ΑΡΜΟΝΙΑ", cs: "HARMONIE",
    sv: "HARMONI", da: "HARMONI", fi: "HARMONIA", no: "HARMONI", he: "הרמוניה",
    sw: "UWIANO", ne: "सामंजस्य"
  },
  "trinity.consciousness.left": {
    fr: "CONNEXION", es: "CONEXIÓN", de: "VERBINDUNG", it: "CONNESSIONE", pt: "CONEXÃO",
    ru: "СВЯЗЬ", nl: "VERBINDING", zh: "连接", ja: "つながり", ko: "연결",
    ar: "ارتباط", hi: "संबंध", bn: "সংযোগ", pa: "ਸੰਪਰਕ", th: "การเชื่อมต่อ",
    vi: "KẾT NỐI", id: "KONEKSI", ms: "HUBUNGAN", tl: "KONEKSYON", tr: "BAĞLANTI",
    pl: "POŁĄCZENIE", uk: "ЗВ'ЯЗОК", ro: "CONEXIUNE", el: "ΣΥΝΔΕΣΗ", cs: "SPOJENÍ",
    sv: "KOPPLING", da: "FORBINDELSE", fi: "YHTEYS", no: "FORBINDELSE", he: "חיבור",
    sw: "MUUNGANIKO", ne: "सम्बन्ध"
  },
  "trinity.consciousness.title": {
    fr: "Conscience", es: "Consciencia", de: "Bewusstsein", it: "Coscienza", pt: "Consciência",
    ru: "Сознание", nl: "Bewustzijn", zh: "意识", ja: "意識", ko: "의식",
    ar: "وعي", hi: "चेतना", bn: "চেতনা", pa: "ਚੇਤਨਾ", th: "จิตสำนึก",
    vi: "Ý Thức", id: "Kesadaran", ms: "Kesedaran", tl: "Kamalayan", tr: "Bilinç",
    pl: "Świadomość", uk: "Свідомість", ro: "Conștiință", el: "Συνείδηση", cs: "Vědomí",
    sv: "Medvetande", da: "Bevidsthed", fi: "Tietoisuus", no: "Bevissthet", he: "תודעה",
    sw: "Ufahamu", ne: "चेतना"
  },
  "trinity.platonic.top": {
    fr: "VÉRITÉ", es: "VERDAD", de: "WAHRHEIT", it: "VERITÀ", pt: "VERDADE",
    ru: "ИСТИНА", nl: "WAARHEID", zh: "真理", ja: "真理", ko: "진리",
    ar: "حقيقة", hi: "सत्य", bn: "সত্য", pa: "ਸੱਚ", th: "ความจริง",
    vi: "SỰ THẬT", id: "KEBENARAN", ms: "KEBENARAN", tl: "KATOTOHANAN", tr: "HAKIKAT",
    pl: "PRAWDA", uk: "ІСТИНА", ro: "ADEVĂR", el: "ΑΛΗΘΕΙΑ", cs: "PRAVDA",
    sv: "SANNING", da: "SANDHED", fi: "TOTUUS", no: "SANNHET", he: "אמת",
    sw: "UKWELI", ne: "सत्य"
  },
  "trinity.platonic.right": {
    fr: "BEAUTÉ", es: "BELLEZA", de: "SCHÖNHEIT", it: "BELLEZZA", pt: "BELEZA",
    ru: "КРАСОТА", nl: "SCHOONHEID", zh: "美", ja: "美", ko: "아름다움",
    ar: "جمال", hi: "सौंदर्य", bn: "সৌন্দর্য", pa: "ਸੁੰਦਰਤਾ", th: "ความงาม",
    vi: "VẺ ĐẸP", id: "KEINDAHAN", ms: "KEINDAHAN", tl: "KAGANDAHAN", tr: "GÜZELLİK",
    pl: "PIĘKNO", uk: "КРАСА", ro: "FRUMUSEȚE", el: "ΟΜΟΡΦΙΑ", cs: "KRÁSA",
    sv: "SKÖNHET", da: "SKØNHED", fi: "KAUNEUS", no: "SKJØNNHET", he: "יופי",
    sw: "UZURI", ne: "सौन्दर्य"
  },
  "trinity.platonic.left": {
    fr: "BONTÉ", es: "BONDAD", de: "GÜTE", it: "BONTÀ", pt: "BONDADE",
    ru: "ДОБРО", nl: "GOEDHEID", zh: "善", ja: "善", ko: "선",
    ar: "خير", hi: "अच्छाई", bn: "মঙ্গল", pa: "ਨੇਕੀ", th: "ความดี",
    vi: "LÒNG TỐT", id: "KEBAIKAN", ms: "KEBAIKAN", tl: "KABUTIHAN", tr: "İYİLİK",
    pl: "DOBRO", uk: "ДОБРО", ro: "BUNĂTATE", el: "ΑΓΑΘΟΤΗΤΑ", cs: "DOBRO",
    sv: "GODHET", da: "GODHED", fi: "HYVYYS", no: "GODHET", he: "טוב",
    sw: "WEMA", ne: "असलपन"
  },
  "trinity.platonic.title": {
    fr: "Platonique", es: "Platónico", de: "Platonisch", it: "Platonico", pt: "Platônico",
    ru: "Платонический", nl: "Platonisch", zh: "柏拉图", ja: "プラトン的", ko: "플라톤적",
    ar: "أفلاطوني", hi: "प्लेटोनिक", bn: "প্লেটোনিক", pa: "ਪਲੈਟੋਨਿਕ", th: "เพลโตนิค",
    vi: "Platon", id: "Platonik", ms: "Platonik", tl: "Platoniko", tr: "Platonik",
    pl: "Platoński", uk: "Платонічний", ro: "Platonic", el: "Πλατωνικό", cs: "Platónský",
    sv: "Platonsk", da: "Platonisk", fi: "Platoninen", no: "Platonsk", he: "אפלטוני",
    sw: "Platoniki", ne: "प्लेटोनिक"
  },
  "trinity.ooda.top": {
    fr: "AGIR", es: "ACTUAR", de: "HANDELN", it: "AGIRE", pt: "AGIR",
    ru: "ДЕЙСТВОВАТЬ", nl: "HANDELEN", zh: "行动", ja: "行動", ko: "행동",
    ar: "تصرف", hi: "कार्य", bn: "কাজ", pa: "ਕੰਮ", th: "ปฏิบัติ",
    vi: "HÀNH ĐỘNG", id: "BERTINDAK", ms: "BERTINDAK", tl: "KUMILOS", tr: "HAREKET ET",
    pl: "DZIAŁAJ", uk: "ДІЙ", ro: "ACȚIONEAZĂ", el: "ΔΡΑΣΕ", cs: "JEDNEJ",
    sv: "AGERA", da: "HANDL", fi: "TOIMI", no: "HANDLE", he: "פעל",
    sw: "TENDA", ne: "कार्य"
  },
  "trinity.ooda.right": {
    fr: "DÉCIDER", es: "DECIDIR", de: "ENTSCHEIDEN", it: "DECIDERE", pt: "DECIDIR",
    ru: "РЕШАТЬ", nl: "BESLISSEN", zh: "决定", ja: "決定", ko: "결정",
    ar: "قرر", hi: "निर्णय", bn: "সিদ্ধান্ত", pa: "ਫੈਸਲਾ", th: "ตัดสินใจ",
    vi: "QUYẾT ĐỊNH", id: "MEMUTUSKAN", ms: "MEMUTUSKAN", tl: "MAGPASYA", tr: "KARAR VER",
    pl: "ZDECYDUJ", uk: "ВИРІШУЙ", ro: "DECIDE", el: "ΑΠΟΦΑΣΙΣΕ", cs: "ROZHODNI",
    sv: "BESLUTA", da: "BESLUT", fi: "PÄÄTÄ", no: "BESLUTT", he: "החלט",
    sw: "AMUA", ne: "निर्णय"
  },
  "trinity.ooda.left": {
    fr: "OBSERVER", es: "OBSERVAR", de: "BEOBACHTEN", it: "OSSERVARE", pt: "OBSERVAR",
    ru: "НАБЛЮДАТЬ", nl: "OBSERVEREN", zh: "观察", ja: "観察", ko: "관찰",
    ar: "لاحظ", hi: "अवलोकन", bn: "পর্যবেক্ষণ", pa: "ਨਿਰੀਖਣ", th: "สังเกต",
    vi: "QUAN SÁT", id: "MENGAMATI", ms: "MEMERHATI", tl: "OBSERBAHAN", tr: "GÖZLEMLE",
    pl: "OBSERWUJ", uk: "СПОСТЕРІГАЙ", ro: "OBSERVĂ", el: "ΠΑΡΑΤΗΡΗΣΕ", cs: "POZORUJ",
    sv: "OBSERVERA", da: "OBSERVER", fi: "HAVAINNOI", no: "OBSERVER", he: "צפה",
    sw: "ANGALIA", ne: "अवलोकन"
  },
  "trinity.ooda.title": {
    fr: "Boucle OODA", es: "Bucle OODA", de: "OODA-Schleife", it: "Ciclo OODA", pt: "Ciclo OODA",
    ru: "Цикл OODA", nl: "OODA-lus", zh: "OODA循环", ja: "OODAループ", ko: "OODA 루프",
    ar: "حلقة OODA", hi: "OODA लूप", bn: "OODA লুপ", pa: "OODA ਲੂਪ", th: "วงจร OODA",
    vi: "Vòng OODA", id: "Siklus OODA", ms: "Gelung OODA", tl: "OODA Loop", tr: "OODA Döngüsü",
    pl: "Pętla OODA", uk: "Цикл OODA", ro: "Bucla OODA", el: "Βρόχος OODA", cs: "Smyčka OODA",
    sv: "OODA-loop", da: "OODA-løkke", fi: "OODA-silmukka", no: "OODA-sløyfe", he: "לולאת OODA",
    sw: "Kitanzi cha OODA", ne: "OODA लुप"
  },
  "trinity.abundance.top": {
    fr: "PARTAGER", es: "COMPARTIR", de: "TEILEN", it: "CONDIVIDERE", pt: "PARTILHAR",
    ru: "ДЕЛИТЬСЯ", nl: "DELEN", zh: "分享", ja: "共有", ko: "나눔",
    ar: "شارك", hi: "साझा करें", bn: "ভাগ", pa: "ਸਾਂਝਾ", th: "แบ่งปัน",
    vi: "CHIA SẺ", id: "BERBAGI", ms: "BERKONGSI", tl: "IBAHAGI", tr: "PAYLAŞ",
    pl: "DZIEL SIĘ", uk: "ДІЛИСЬ", ro: "ÎMPĂRTĂȘEȘTE", el: "ΜΟΙΡΑΣΟΥ", cs: "SDÍLEJ",
    sv: "DELA", da: "DEL", fi: "JAA", no: "DEL", he: "שתף",
    sw: "SHIRIKI", ne: "बाँड्नुहोस्"
  },
  "trinity.abundance.right": {
    fr: "DONNER", es: "DAR", de: "GEBEN", it: "DARE", pt: "DAR",
    ru: "ДАВАТЬ", nl: "GEVEN", zh: "给予", ja: "与える", ko: "주다",
    ar: "أعطِ", hi: "देना", bn: "দান", pa: "ਦੇਣਾ", th: "ให้",
    vi: "CHO", id: "MEMBERI", ms: "MEMBERI", tl: "MAGBIGAY", tr: "VER",
    pl: "DAWAJ", uk: "ДАВАЙ", ro: "DĂ", el: "ΔΩΣΕ", cs: "DÁVEJ",
    sv: "GE", da: "GIV", fi: "ANNA", no: "GI", he: "תן",
    sw: "TOKA", ne: "दिनुहोस्"
  },
  "trinity.abundance.left": {
    fr: "RECEVOIR", es: "RECIBIR", de: "EMPFANGEN", it: "RICEVERE", pt: "RECEBER",
    ru: "ПОЛУЧАТЬ", nl: "ONTVANGEN", zh: "接收", ja: "受け取る", ko: "받다",
    ar: "استقبل", hi: "प्राप्त करें", bn: "গ্রহণ", pa: "ਪ੍ਰਾਪਤ", th: "รับ",
    vi: "NHẬN", id: "MENERIMA", ms: "MENERIMA", tl: "TUMANGGAP", tr: "AL",
    pl: "OTRZYMUJ", uk: "ОТРИМУЙ", ro: "PRIMEȘTE", el: "ΛΑΒΕ", cs: "PŘIJÍMEJ",
    sv: "TA EMOT", da: "MODTAG", fi: "VASTAANOTA", no: "MOTTA", he: "קבל",
    sw: "POKEA", ne: "प्राप्त गर्नुहोस्"
  },
  "trinity.abundance.title": {
    fr: "Abondance", es: "Abundancia", de: "Überfluss", it: "Abbondanza", pt: "Abundância",
    ru: "Изобилие", nl: "Overvloed", zh: "丰盛", ja: "豊かさ", ko: "풍요",
    ar: "وفرة", hi: "प्रचुरता", bn: "প্রাচুর্য", pa: "ਭਰਪੂਰਤਾ", th: "ความอุดมสมบูรณ์",
    vi: "Phong Phú", id: "Kelimpahan", ms: "Kelimpahan", tl: "Kasaganaan", tr: "Bolluk",
    pl: "Obfitość", uk: "Достаток", ro: "Abundență", el: "Αφθονία", cs: "Hojnost",
    sv: "Överflöd", da: "Overflod", fi: "Runsaus", no: "Overflod", he: "שפע",
    sw: "Wingi", ne: "प्रचुरता"
  },
  "trinity.temporal.top": {
    fr: "PRÉSENT", es: "PRESENTE", de: "GEGENWART", it: "PRESENTE", pt: "PRESENTE",
    ru: "НАСТОЯЩЕЕ", nl: "HEDEN", zh: "现在", ja: "現在", ko: "현재",
    ar: "حاضر", hi: "वर्तमान", bn: "বর্তমান", pa: "ਵਰਤਮਾਨ", th: "ปัจจุบัน",
    vi: "HIỆN TẠI", id: "SEKARANG", ms: "SEKARANG", tl: "KASALUKUYAN", tr: "ŞİMDİ",
    pl: "TERAŹNIEJSZOŚĆ", uk: "СЬОГОДЕННЯ", ro: "PREZENT", el: "ΠΑΡΟΝ", cs: "PŘÍTOMNOST",
    sv: "NUTID", da: "NUTID", fi: "NYKYHETKI", no: "NÅTID", he: "הווה",
    sw: "SASA", ne: "वर्तमान"
  },
  "trinity.temporal.right": {
    fr: "FUTUR", es: "FUTURO", de: "ZUKUNFT", it: "FUTURO", pt: "FUTURO",
    ru: "БУДУЩЕЕ", nl: "TOEKOMST", zh: "未来", ja: "未来", ko: "미래",
    ar: "مستقبل", hi: "भविष्य", bn: "ভবিষ্যৎ", pa: "ਭਵਿੱਖ", th: "อนาคต",
    vi: "TƯƠNG LAI", id: "MASA DEPAN", ms: "MASA DEPAN", tl: "HINAHARAP", tr: "GELECEK",
    pl: "PRZYSZŁOŚĆ", uk: "МАЙБУТНЄ", ro: "VIITOR", el: "ΜΕΛΛΟΝ", cs: "BUDOUCNOST",
    sv: "FRAMTID", da: "FREMTID", fi: "TULEVAISUUS", no: "FREMTID", he: "עתיד",
    sw: "BAADAYE", ne: "भविष्य"
  },
  "trinity.temporal.left": {
    fr: "PASSÉ", es: "PASADO", de: "VERGANGENHEIT", it: "PASSATO", pt: "PASSADO",
    ru: "ПРОШЛОЕ", nl: "VERLEDEN", zh: "过去", ja: "過去", ko: "과거",
    ar: "ماضٍ", hi: "अतीत", bn: "অতীত", pa: "ਅਤੀਤ", th: "อดีต",
    vi: "QUÁ KHỨ", id: "MASA LALU", ms: "MASA LALU", tl: "NAKARAAN", tr: "GEÇMİŞ",
    pl: "PRZESZŁOŚĆ", uk: "МИНУЛЕ", ro: "TRECUT", el: "ΠΑΡΕΛΘΟΝ", cs: "MINULOST",
    sv: "FÖRFLUTET", da: "FORTID", fi: "MENNEISYYS", no: "FORTID", he: "עבר",
    sw: "ZAMANI", ne: "अतीत"
  },
  "trinity.temporal.title": {
    fr: "Temporel", es: "Temporal", de: "Zeitlich", it: "Temporale", pt: "Temporal",
    ru: "Временной", nl: "Temporeel", zh: "时间性", ja: "時間的", ko: "시간적",
    ar: "زمني", hi: "कालिक", bn: "কালিক", pa: "ਅਸਥਾਈ", th: "กาลเวลา",
    vi: "Thời Gian", id: "Temporal", ms: "Temporal", tl: "Temporal", tr: "Zamansal",
    pl: "Temporalny", uk: "Часовий", ro: "Temporal", el: "Χρονικό", cs: "Temporální",
    sv: "Temporal", da: "Temporal", fi: "Ajallinen", no: "Temporal", he: "זמני",
    sw: "Muda", ne: "कालिक"
  },
  "trinity.intelligence.top": {
    fr: "ACTION", es: "ACCIÓN", de: "HANDLUNG", it: "AZIONE", pt: "AÇÃO",
    ru: "ДЕЙСТВИЕ", nl: "ACTIE", zh: "行动", ja: "行動", ko: "행동",
    ar: "عمل", hi: "क्रिया", bn: "কর্ম", pa: "ਕਿਰਿਆ", th: "การกระทำ",
    vi: "HÀNH ĐỘNG", id: "TINDAKAN", ms: "TINDAKAN", tl: "AKSYON", tr: "EYLEM",
    pl: "DZIAŁANIE", uk: "ДІЯ", ro: "ACȚIUNE", el: "ΔΡΑΣΗ", cs: "AKCE",
    sv: "HANDLING", da: "HANDLING", fi: "TOIMINTA", no: "HANDLING", he: "פעולה",
    sw: "KITENDO", ne: "कार्य"
  },
  "trinity.intelligence.right": {
    fr: "SENTIMENT", es: "SENTIMIENTO", de: "GEFÜHL", it: "SENTIMENTO", pt: "SENTIMENTO",
    ru: "ЧУВСТВО", nl: "GEVOEL", zh: "感受", ja: "感情", ko: "감정",
    ar: "شعور", hi: "भावना", bn: "অনুভূতি", pa: "ਭਾਵਨਾ", th: "ความรู้สึก",
    vi: "CẢM XÚC", id: "PERASAAN", ms: "PERASAAN", tl: "DAMDAMIN", tr: "DUYGU",
    pl: "UCZUCIE", uk: "ПОЧУТТЯ", ro: "SENTIMENT", el: "ΣΥΝΑΙΣΘΗΜΑ", cs: "POCIT",
    sv: "KÄNSLA", da: "FØLELSE", fi: "TUNNE", no: "FØLELSE", he: "רגש",
    sw: "HISIA", ne: "भावना"
  },
  "trinity.intelligence.left": {
    fr: "PENSÉE", es: "PENSAMIENTO", de: "GEDANKE", it: "PENSIERO", pt: "PENSAMENTO",
    ru: "МЫСЛЬ", nl: "GEDACHTE", zh: "思想", ja: "思考", ko: "사고",
    ar: "فكر", hi: "विचार", bn: "চিন্তা", pa: "ਸੋਚ", th: "ความคิด",
    vi: "TƯ DUY", id: "PIKIRAN", ms: "PEMIKIRAN", tl: "KAISIPAN", tr: "DÜŞÜNCE",
    pl: "MYŚL", uk: "ДУМКА", ro: "GÂNDIRE", el: "ΣΚΕΨΗ", cs: "MYŠLENKA",
    sv: "TANKE", da: "TANKE", fi: "AJATUS", no: "TANKE", he: "מחשבה",
    sw: "MAWAZO", ne: "विचार"
  },
  "trinity.intelligence.title": {
    fr: "Intelligence", es: "Inteligencia", de: "Intelligenz", it: "Intelligenza", pt: "Inteligência",
    ru: "Интеллект", nl: "Intelligentie", zh: "智力", ja: "知性", ko: "지성",
    ar: "ذكاء", hi: "बुद्धिमत्ता", bn: "বুদ্ধিমত্তা", pa: "ਬੁੱਧੀ", th: "สติปัญญา",
    vi: "Trí Tuệ", id: "Kecerdasan", ms: "Kecerdasan", tl: "Katalinuhan", tr: "Zeka",
    pl: "Inteligencja", uk: "Інтелект", ro: "Inteligență", el: "Νοημοσύνη", cs: "Inteligence",
    sv: "Intelligens", da: "Intelligens", fi: "Älykkyys", no: "Intelligens", he: "אינטליגנציה",
    sw: "Akili", ne: "बुद्धिमत्ता"
  },
  "trinity.evolution.top": {
    fr: "TRANSFORMER", es: "TRANSFORMAR", de: "VERWANDELN", it: "TRASFORMARE", pt: "TRANSFORMAR",
    ru: "ПРЕОБРАЗОВАТЬ", nl: "TRANSFORMEREN", zh: "转化", ja: "変容", ko: "변환",
    ar: "تحوّل", hi: "परिवर्तन", bn: "রূপান্তর", pa: "ਪਰਿਵਰਤਨ", th: "แปรเปลี่ยน",
    vi: "BIẾN ĐỔI", id: "TRANSFORMASI", ms: "TRANSFORMASI", tl: "BAGUHIN", tr: "DÖNÜŞTÜR",
    pl: "PRZEKSZTAŁĆ", uk: "ПЕРЕТВОРИ", ro: "TRANSFORMĂ", el: "ΜΕΤΑΜΟΡΦΩΣΕ", cs: "PROMĚŇ",
    sv: "FÖRVANDLA", da: "FORVANDL", fi: "MUUNNA", no: "FORVANDLE", he: "שנה",
    sw: "BADILISHA", ne: "रूपान्तरण"
  },
  "trinity.evolution.right": {
    fr: "MAINTENIR", es: "SOSTENER", de: "ERHALTEN", it: "SOSTENERE", pt: "SUSTENTAR",
    ru: "ПОДДЕРЖИВАТЬ", nl: "BEHOUDEN", zh: "维持", ja: "維持", ko: "유지",
    ar: "حافظ", hi: "बनाए रखें", bn: "টিকিয়ে রাখা", pa: "ਬਣਾਈ ਰੱਖੋ", th: "รักษา",
    vi: "DUY TRÌ", id: "MEMPERTAHANKAN", ms: "MENGEKALKAN", tl: "PANATILIHIN", tr: "SÜRDÜR",
    pl: "UTRZYMUJ", uk: "ПІДТРИМУЙ", ro: "SUSȚINE", el: "ΔΙΑΤΗΡΗΣΕ", cs: "UDRŽUJ",
    sv: "BEVARA", da: "BEVAR", fi: "YLLÄPIDÄ", no: "OPPRETTHOLD", he: "שמר",
    sw: "DUMISHA", ne: "कायम"
  },
  "trinity.evolution.left": {
    fr: "CRÉER", es: "CREAR", de: "ERSCHAFFEN", it: "CREARE", pt: "CRIAR",
    ru: "СОЗДАВАТЬ", nl: "CREËREN", zh: "创造", ja: "創造", ko: "창조",
    ar: "أبدع", hi: "सृजन", bn: "সৃষ্টি", pa: "ਸਿਰਜਣਾ", th: "สร้างสรรค์",
    vi: "SÁNG TẠO", id: "MENCIPTAKAN", ms: "MENCIPTA", tl: "LUMIKHA", tr: "YARAT",
    pl: "TWÓRZ", uk: "СТВОРЮЙ", ro: "CREEAZĂ", el: "ΔΗΜΙΟΥΡΓΗΣΕ", cs: "TVOŘ",
    sv: "SKAPA", da: "SKAB", fi: "LUO", no: "SKAP", he: "צור",
    sw: "UMBA", ne: "सिर्जना"
  },
  "trinity.evolution.title": {
    fr: "Évolution", es: "Evolución", de: "Evolution", it: "Evoluzione", pt: "Evolução",
    ru: "Эволюция", nl: "Evolutie", zh: "进化", ja: "進化", ko: "진화",
    ar: "تطور", hi: "विकास", bn: "বিবর্তন", pa: "ਵਿਕਾਸ", th: "วิวัฒนาการ",
    vi: "Tiến Hóa", id: "Evolusi", ms: "Evolusi", tl: "Ebolusyon", tr: "Evrim",
    pl: "Ewolucja", uk: "Еволюція", ro: "Evoluție", el: "Εξέλιξη", cs: "Evoluce",
    sv: "Evolution", da: "Evolution", fi: "Evoluutio", no: "Evolusjon", he: "אבולוציה",
    sw: "Mageuzi", ne: "विकास"
  },
  "trinity.human.top": {
    fr: "AMOUR", es: "AMOR", de: "LIEBE", it: "AMORE", pt: "AMOR",
    ru: "ЛЮБОВЬ", nl: "LIEFDE", zh: "爱", ja: "愛", ko: "사랑",
    ar: "حب", hi: "प्रेम", bn: "ভালোবাসা", pa: "ਪਿਆਰ", th: "ความรัก",
    vi: "TÌNH YÊU", id: "CINTA", ms: "CINTA", tl: "PAG-IBIG", tr: "AŞK",
    pl: "MIŁOŚĆ", uk: "ЛЮБОВ", ro: "IUBIRE", el: "ΑΓΑΠΗ", cs: "LÁSKA",
    sv: "KÄRLEK", da: "KÆRLIGHED", fi: "RAKKAUS", no: "KJÆRLIGHET", he: "אהבה",
    sw: "UPENDO", ne: "प्रेम"
  },
  "trinity.human.right": {
    fr: "SÉCURITÉ", es: "SEGURIDAD", de: "SICHERHEIT", it: "SICUREZZA", pt: "SEGURANÇA",
    ru: "БЕЗОПАСНОСТЬ", nl: "VEILIGHEID", zh: "安全", ja: "安全", ko: "안전",
    ar: "أمان", hi: "सुरक्षा", bn: "নিরাপত্তা", pa: "ਸੁਰੱਖਿਆ", th: "ความปลอดภัย",
    vi: "AN TOÀN", id: "KEAMANAN", ms: "KESELAMATAN", tl: "KALIGTASAN", tr: "GÜVENLİK",
    pl: "BEZPIECZEŃSTWO", uk: "БЕЗПЕКА", ro: "SIGURANȚĂ", el: "ΑΣΦΑΛΕΙΑ", cs: "BEZPEČÍ",
    sv: "TRYGGHET", da: "TRYGHED", fi: "TURVALLISUUS", no: "TRYGGHET", he: "ביטחון",
    sw: "USALAMA", ne: "सुरक्षा"
  },
  "trinity.human.left": {
    fr: "PERTE", es: "PÉRDIDA", de: "VERLUST", it: "PERDITA", pt: "PERDA",
    ru: "ПОТЕРЯ", nl: "VERLIES", zh: "失去", ja: "喪失", ko: "상실",
    ar: "خسارة", hi: "हानि", bn: "ক্ষতি", pa: "ਨੁਕਸਾਨ", th: "การสูญเสีย",
    vi: "MẤT MÁT", id: "KEHILANGAN", ms: "KEHILANGAN", tl: "PAGKAWALA", tr: "KAYIP",
    pl: "STRATA", uk: "ВТРАТА", ro: "PIERDERE", el: "ΑΠΩΛΕΙΑ", cs: "ZTRÁTA",
    sv: "FÖRLUST", da: "TAB", fi: "MENETYS", no: "TAP", he: "אובדן",
    sw: "HASARA", ne: "हानि"
  },
  "trinity.human.title": {
    fr: "Humain", es: "Humano", de: "Menschlich", it: "Umano", pt: "Humano",
    ru: "Человеческое", nl: "Menselijk", zh: "人性", ja: "人間性", ko: "인간",
    ar: "إنساني", hi: "मानवीय", bn: "মানবিক", pa: "ਮਨੁੱਖੀ", th: "มนุษย์",
    vi: "Con Người", id: "Manusia", ms: "Manusia", tl: "Tao", tr: "İnsan",
    pl: "Ludzki", uk: "Людське", ro: "Uman", el: "Ανθρώπινο", cs: "Lidský",
    sv: "Mänsklig", da: "Menneskelig", fi: "Inhimillinen", no: "Menneskelig", he: "אנושי",
    sw: "Binadamu", ne: "मानवीय"
  },
  "trinity.custom.title": {
    fr: "Votre Trinité", es: "Tu Trinidad", de: "Deine Trinität", it: "La Tua Trinità", pt: "Sua Trindade",
    ru: "Ваша Троица", nl: "Jouw Drieëenheid", zh: "你的三位一体", ja: "あなたの三位一体", ko: "나의 삼위일체",
    ar: "ثالوثك", hi: "आपकी त्रिमूर्ति", bn: "আপনার ত্রিত্ব", pa: "ਤੁਹਾਡੀ ਤ੍ਰਿਏਕਤਾ", th: "ตรีเอกภาพของคุณ",
    vi: "Trinity Của Bạn", id: "Trinity Anda", ms: "Trinity Anda", tl: "Iyong Trinity", tr: "Senin Trinity'in",
    pl: "Twoja Trójca", uk: "Ваша Трійця", ro: "Trinitatea Ta", el: "Η Τριάδα Σου", cs: "Tvoje Trojice",
    sv: "Din Treenighet", da: "Din Treenighed", fi: "Sinun Kolminaisuutesi", no: "Din Treenighet", he: "השילוש שלך",
    sw: "Utatu Wako", ne: "तपाईंको त्रिएकता"
  },
  "trinity.custom.edit": {
    fr: "Modifier", es: "Editar", de: "Bearbeiten", it: "Modifica", pt: "Editar",
    ru: "Редактировать", nl: "Bewerken", zh: "编辑", ja: "編集", ko: "편집",
    ar: "تعديل", hi: "संपादित करें", bn: "সম্পাদনা", pa: "ਸੰਪਾਦਿਤ ਕਰੋ", th: "แก้ไข",
    vi: "Chỉnh sửa", id: "Edit", ms: "Edit", tl: "I-edit", tr: "Düzenle",
    pl: "Edytuj", uk: "Редагувати", ro: "Editează", el: "Επεξεργασία", cs: "Upravit",
    sv: "Redigera", da: "Rediger", fi: "Muokkaa", no: "Rediger", he: "ערוך",
    sw: "Hariri", ne: "सम्पादन"
  },
  "trinity.custom.left": {
    fr: "Gauche", es: "Izquierda", de: "Links", it: "Sinistra", pt: "Esquerda",
    ru: "Левый", nl: "Links", zh: "左", ja: "左", ko: "왼쪽",
    ar: "يسار", hi: "बाएँ", bn: "বাম", pa: "ਖੱਬਾ", th: "ซ้าย",
    vi: "Trái", id: "Kiri", ms: "Kiri", tl: "Kaliwa", tr: "Sol",
    pl: "Lewo", uk: "Ліворуч", ro: "Stânga", el: "Αριστερά", cs: "Vlevo",
    sv: "Vänster", da: "Venstre", fi: "Vasen", no: "Venstre", he: "שמאל",
    sw: "Kushoto", ne: "बायाँ"
  },
  "trinity.custom.top": {
    fr: "Haut", es: "Arriba", de: "Oben", it: "Alto", pt: "Topo",
    ru: "Верх", nl: "Boven", zh: "上", ja: "上", ko: "위",
    ar: "أعلى", hi: "शीर्ष", bn: "উপরে", pa: "ਉੱਪਰ", th: "บน",
    vi: "Trên", id: "Atas", ms: "Atas", tl: "Itaas", tr: "Üst",
    pl: "Góra", uk: "Верх", ro: "Sus", el: "Πάνω", cs: "Nahoře",
    sv: "Topp", da: "Top", fi: "Ylä", no: "Topp", he: "למעלה",
    sw: "Juu", ne: "माथि"
  },
  "trinity.custom.right": {
    fr: "Droite", es: "Derecha", de: "Rechts", it: "Destra", pt: "Direita",
    ru: "Правый", nl: "Rechts", zh: "右", ja: "右", ko: "오른쪽",
    ar: "يمين", hi: "दाएँ", bn: "ডান", pa: "ਸੱਜਾ", th: "ขวา",
    vi: "Phải", id: "Kanan", ms: "Kanan", tl: "Kanan", tr: "Sağ",
    pl: "Prawo", uk: "Праворуч", ro: "Dreapta", el: "Δεξιά", cs: "Vpravo",
    sv: "Höger", da: "Højre", fi: "Oikea", no: "Høyre", he: "ימין",
    sw: "Kulia", ne: "दायाँ"
  },
  "trinity.custom.download": {
    fr: "Télécharger PNG", es: "Descargar PNG", de: "PNG herunterladen", it: "Scarica PNG", pt: "Baixar PNG",
    ru: "Скачать PNG", nl: "PNG downloaden", zh: "下载 PNG", ja: "PNGダウンロード", ko: "PNG 다운로드",
    ar: "تحميل PNG", hi: "PNG डाउनलोड करें", bn: "PNG ডাউনলোড", pa: "PNG ਡਾਊਨਲੋਡ", th: "ดาวน์โหลด PNG",
    vi: "Tải PNG", id: "Unduh PNG", ms: "Muat turun PNG", tl: "I-download PNG", tr: "PNG İndir",
    pl: "Pobierz PNG", uk: "Завантажити PNG", ro: "Descarcă PNG", el: "Λήψη PNG", cs: "Stáhnout PNG",
    sv: "Ladda ner PNG", da: "Download PNG", fi: "Lataa PNG", no: "Last ned PNG", he: "הורד PNG",
    sw: "Pakua PNG", ne: "PNG डाउनलोड"
  },
  "trinity.custom.placeholder_1": {
    fr: "VOS", es: "TUS", de: "DEINE", it: "LE TUE", pt: "SUAS",
    ru: "ВАШИ", nl: "JOUW", zh: "你的", ja: "あなたの", ko: "당신의",
    ar: "كلماتك", hi: "आपके", bn: "আপনার", pa: "ਤੁਹਾਡੇ", th: "ของคุณ",
    vi: "CỦA BẠN", id: "KATA", ms: "KATA", tl: "IYONG", tr: "SENİN",
    pl: "TWOJE", uk: "ВАШІ", ro: "ALE TALE", el: "ΔΙΚΑ ΣΟΥ", cs: "TVOJE",
    sv: "DINA", da: "DINE", fi: "SINUN", no: "DINE", he: "שלך",
    sw: "YAKO", ne: "तपाईंको"
  },
  "trinity.custom.placeholder_2": {
    fr: "MOTS", es: "PALABRAS", de: "WORTE", it: "PAROLE", pt: "PALAVRAS",
    ru: "СЛОВА", nl: "WOORDEN", zh: "词语", ja: "言葉", ko: "단어",
    ar: "كلمات", hi: "शब्द", bn: "শব্দ", pa: "ਸ਼ਬਦ", th: "คำ",
    vi: "TỪ NGỮ", id: "KATA", ms: "KATA", tl: "SALITA", tr: "KELİMELER",
    pl: "SŁOWA", uk: "СЛОВА", ro: "CUVINTE", el: "ΛΕΞΕΙΣ", cs: "SLOVA",
    sv: "ORD", da: "ORD", fi: "SANAT", no: "ORD", he: "מילים",
    sw: "MANENO", ne: "शब्दहरू"
  },
  "trinity.custom.placeholder_3": {
    fr: "ICI", es: "AQUÍ", de: "HIER", it: "QUI", pt: "AQUI",
    ru: "ЗДЕСЬ", nl: "HIER", zh: "这里", ja: "ここに", ko: "여기에",
    ar: "هنا", hi: "यहाँ", bn: "এখানে", pa: "ਇੱਥੇ", th: "ที่นี่",
    vi: "Ở ĐÂY", id: "DI SINI", ms: "DI SINI", tl: "DITO", tr: "BURAYA",
    pl: "TUTAJ", uk: "ТУТ", ro: "AICI", el: "ΕΔΩ", cs: "ZDE",
    sv: "HÄR", da: "HER", fi: "TÄHÄN", no: "HER", he: "כאן",
    sw: "HAPA", ne: "यहाँ"
  },
  "cube1.feed.toggle_live": {
    fr: "Flux en direct", es: "Comentarios en vivo", de: "Live-Feedback", it: "Feedback dal vivo", pt: "Feedback ao vivo",
    ru: "Обратная связь в реальном времени", nl: "Live feedback", zh: "实时反馈", ja: "ライブフィードバック", ko: "실시간 피드백",
    ar: "تعليقات مباشرة", hi: "लाइव फीडबैक", bn: "লাইভ ফিডব্যাক", pa: "ਲਾਈਵ ਫੀਡਬੈਕ", th: "ฟีดแบ็คสด",
    vi: "Phản hồi trực tiếp", id: "Umpan Balik Langsung", ms: "Maklum Balas Langsung", tl: "Live na Feedback", tr: "Canlı Geri Bildirim",
    pl: "Na żywo", uk: "Зворотний зв'язок наживо", ro: "Feedback în direct", el: "Ζωντανά Σχόλια", cs: "Živá zpětná vazba",
    sv: "Liveåterkoppling", da: "Live feedback", fi: "Reaaliaikainen palaute", no: "Direkterespons", he: "משוב חי",
    sw: "Maoni ya Moja kwa Moja", ne: "प्रत्यक्ष प्रतिक्रिया"
  },
  "cube1.feed.toggle_summary": {
    fr: "Résumé en 33 mots", es: "Resumen de 33 palabras", de: "33-Wort-Zusammenfassung", it: "Riassunto in 33 parole", pt: "Resumo de 33 palavras",
    ru: "Резюме в 33 слова", nl: "33-woorden samenvatting", zh: "33字摘要", ja: "33語要約", ko: "33단어 요약",
    ar: "ملخص 33 كلمة", hi: "33-शब्द सारांश", bn: "৩৩-শব্দ সারাংশ", pa: "33-ਸ਼ਬਦ ਸਾਰ", th: "สรุป 33 คำ",
    vi: "Tóm tắt 33 từ", id: "Ringkasan 33 kata", ms: "Ringkasan 33 patah perkataan", tl: "33-salitang Buod", tr: "33 kelimelik özet",
    pl: "Podsumowanie 33 słowa", uk: "Резюме 33 слова", ro: "Rezumat 33 cuvinte", el: "Περίληψη 33 λέξεων", cs: "Shrnutí 33 slov",
    sv: "33-ords sammanfattning", da: "33-ords resumé", fi: "33 sanan yhteenveto", no: "33-ords sammendrag", he: "סיכום 33 מילים",
    sw: "Muhtasari wa maneno 33", ne: "३३-शब्द सारांश"
  },
  "cube1.feed.summary_loading": {
    fr: "Génération du résumé...", es: "Generando resumen...", de: "Zusammenfassung wird erstellt...", it: "Generazione del riassunto...", pt: "Gerando resumo...",
    ru: "Создание резюме...", nl: "Samenvatting genereren...", zh: "正在生成摘要...", ja: "要約を生成中...", ko: "요약 생성 중...",
    ar: "جارٍ إنشاء الملخص...", hi: "सारांश बना रहा है...", bn: "সারাংশ তৈরি হচ্ছে...", pa: "ਸਾਰ ਬਣਾ ਰਿਹਾ ਹੈ...", th: "กำลังสร้างสรุป...",
    vi: "Đang tạo tóm tắt...", id: "Membuat ringkasan...", ms: "Menjana ringkasan...", tl: "Gumagawa ng buod...", tr: "Özet oluşturuluyor...",
    pl: "Generowanie podsumowania...", uk: "Створення резюме...", ro: "Se generează rezumatul...", el: "Δημιουργία περίληψης...", cs: "Generování shrnutí...",
    sv: "Genererar sammanfattning...", da: "Genererer resumé...", fi: "Luodaan yhteenvetoa...", no: "Genererer sammendrag...", he: "...יוצר סיכום",
    sw: "Kutengeneza muhtasari...", ne: "सारांश बनाउँदै..."
  },
  "cube1.feed.summary_unavailable": {
    fr: "Résumé indisponible", es: "Resumen no disponible", de: "Zusammenfassung nicht verfügbar", it: "Riassunto non disponibile", pt: "Resumo indisponível",
    ru: "Резюме недоступно", nl: "Samenvatting niet beschikbaar", zh: "摘要不可用", ja: "要約は利用できません", ko: "요약을 사용할 수 없음",
    ar: "الملخص غير متاح", hi: "सारांश उपलब्ध नहीं", bn: "সারাংশ অনুপলব্ধ", pa: "ਸਾਰ ਉਪਲਬਧ ਨਹੀਂ", th: "สรุปไม่พร้อมใช้งาน",
    vi: "Tóm tắt không khả dụng", id: "Ringkasan tidak tersedia", ms: "Ringkasan tidak tersedia", tl: "Hindi available ang buod", tr: "Özet mevcut değil",
    pl: "Podsumowanie niedostępne", uk: "Резюме недоступне", ro: "Rezumat indisponibil", el: "Η περίληψη δεν είναι διαθέσιμη", cs: "Shrnutí není k dispozici",
    sv: "Sammanfattning ej tillgänglig", da: "Resumé ikke tilgængeligt", fi: "Yhteenveto ei saatavilla", no: "Sammendrag ikke tilgjengelig", he: "סיכום לא זמין",
    sw: "Muhtasari haupatikani", ne: "सारांश उपलब्ध छैन"
  },
  "cube1.feed.summary_short": {
    fr: "La réponse est déjà concise", es: "La respuesta ya es concisa", de: "Die Antwort ist bereits knapp", it: "La risposta è già concisa", pt: "A resposta já é concisa",
    ru: "Ответ уже краткий", nl: "Het antwoord is al beknopt", zh: "回复已经很简洁", ja: "回答はすでに簡潔です", ko: "응답이 이미 간결합니다",
    ar: "الرد موجز بالفعل", hi: "उत्तर पहले से संक्षिप्त है", bn: "উত্তর ইতিমধ্যেই সংক্ষিপ্ত", pa: "ਜਵਾਬ ਪਹਿਲਾਂ ਹੀ ਸੰਖੇਪ ਹੈ", th: "คำตอบสั้นกระชับอยู่แล้ว",
    vi: "Phản hồi đã ngắn gọn", id: "Respons sudah ringkas", ms: "Respons sudah ringkas", tl: "Maikli na ang sagot", tr: "Yanıt zaten kısa",
    pl: "Odpowiedź jest już zwięzła", uk: "Відповідь вже стисла", ro: "Răspunsul este deja concis", el: "Η απάντηση είναι ήδη σύντομη", cs: "Odpověď je již stručná",
    sv: "Svaret är redan koncist", da: "Svaret er allerede koncist", fi: "Vastaus on jo tiivis", no: "Svaret er allerede konsist", he: "התגובה כבר תמציתית",
    sw: "Jibu tayari ni fupi", ne: "उत्तर पहिले नै संक्षिप्त छ"
  },
  "cube4.presence.you_joined": {
    fr: "Vous êtes dans la session", es: "Estás en la sesión", de: "Du bist in der Sitzung", it: "Sei nella sessione", pt: "Você está na sessão",
    ru: "Вы в сессии", nl: "Je bent in de sessie", zh: "你已加入会话", ja: "セッションに参加しています", ko: "세션에 참여 중입니다",
    ar: "أنت في الجلسة", hi: "आप सत्र में हैं", bn: "আপনি সেশনে আছেন", pa: "ਤੁਸੀਂ ਸੈਸ਼ਨ ਵਿੱਚ ਹੋ", th: "คุณอยู่ในเซสชัน",
    vi: "Bạn đang trong phiên", id: "Anda dalam sesi", ms: "Anda dalam sesi", tl: "Nasa session ka na", tr: "Oturumdasınız",
    pl: "Jesteś w sesji", uk: "Ви в сесії", ro: "Ești în sesiune", el: "Είστε στη συνεδρία", cs: "Jste v relaci",
    sv: "Du är i sessionen", da: "Du er i sessionen", fi: "Olet istunnossa", no: "Du er i sesjonen", he: "אתה בפגישה",
    sw: "Uko kwenye kikao", ne: "तपाईं सत्रमा हुनुहुन्छ"
  },
  "cube4.desired_outcome.description": {
    fr: "Qu'aimeriez-vous accomplir ?", es: "¿Qué quieres lograr?", de: "Was möchten Sie erreichen?", it: "Cosa vuoi raggiungere?", pt: "O que você deseja alcançar?",
    ru: "Чего вы хотите достичь?", nl: "Wat wilt u bereiken?", zh: "您想实现什么？", ja: "何を達成したいですか？", ko: "무엇을 달성하고 싶으신가요?",
    ar: "ما الذي تريد تحقيقه؟", hi: "आप क्या हासिल करना चाहते हैं?", bn: "আপনি কী অর্জন করতে চান?", pa: "ਤੁਸੀਂ ਕੀ ਪ੍ਰਾਪਤ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?", th: "คุณต้องการบรรลุอะไร?",
    vi: "Bạn muốn đạt được gì?", id: "Apa yang ingin Anda capai?", ms: "Apa yang ingin anda capai?", tl: "Ano ang gusto mong makamit?", tr: "Ne başarmak istiyorsunuz?",
    pl: "Co chcesz osiągnąć?", uk: "Чого ви хочете досягти?", ro: "Ce doriți să realizați?", el: "Τι θέλετε να επιτύχετε;", cs: "Čeho chcete dosáhnout?",
    sv: "Vad vill du uppnå?", da: "Hvad vil du opnå?", fi: "Mitä haluat saavuttaa?", no: "Hva ønsker du å oppnå?", he: "?מה אתה רוצה להשיג",
    sw: "Unataka kufanikisha nini?", ne: "तपाईं के हासिल गर्न चाहनुहुन्छ?"
  },
  "cube4.desired_outcome.time_estimate": {
    fr: "Durée estimée (minutes)", es: "Tiempo estimado (minutos)", de: "Geschätzte Zeit (Minuten)", it: "Tempo stimato (minuti)", pt: "Tempo estimado (minutos)",
    ru: "Приблизительное время (минуты)", nl: "Geschatte tijd (minuten)", zh: "预计时间（分钟）", ja: "推定時間（分）", ko: "예상 시간(분)",
    ar: "الوقت المقدر (دقائق)", hi: "अनुमानित समय (मिनट)", bn: "আনুমানিক সময় (মিনিট)", pa: "ਅੰਦਾਜ਼ਨ ਸਮਾਂ (ਮਿੰਟ)", th: "เวลาโดยประมาณ (นาที)",
    vi: "Thời gian ước tính (phút)", id: "Perkiraan waktu (menit)", ms: "Anggaran masa (minit)", tl: "Tinatayang oras (minuto)", tr: "Tahmini süre (dakika)",
    pl: "Szacowany czas (minuty)", uk: "Приблизний час (хвилини)", ro: "Timp estimat (minute)", el: "Εκτιμώμενος χρόνος (λεπτά)", cs: "Odhadovaný čas (minuty)",
    sv: "Beräknad tid (minuter)", da: "Estimeret tid (minutter)", fi: "Arvioitu aika (minuuttia)", no: "Estimert tid (minutter)", he: "(דקות) זמן משוער",
    sw: "Muda uliotarajiwa (dakika)", ne: "अनुमानित समय (मिनेट)"
  },
  "cube4.desired_outcome.waiting": {
    fr: "En attente de la confirmation de tous les participants...", es: "Esperando que todos los participantes confirmen...", de: "Warten auf Bestätigung aller Teilnehmer...", it: "In attesa della conferma di tutti i partecipanti...", pt: "Aguardando confirmação de todos os participantes...",
    ru: "Ожидание подтверждения от всех участников...", nl: "Wachten op bevestiging van alle deelnemers...", zh: "等待所有参与者确认...", ja: "全参加者の確認を待っています...", ko: "모든 참가자의 확인을 기다리는 중...",
    ar: "في انتظار تأكيد جميع المشاركين...", hi: "सभी प्रतिभागियों की पुष्टि की प्रतीक्षा...", bn: "সব অংশগ্রহণকারীদের নিশ্চিতকরণের অপেক্ষায়...", pa: "ਸਾਰੇ ਭਾਗੀਦਾਰਾਂ ਦੀ ਪੁਸ਼ਟੀ ਦੀ ਉਡੀਕ...", th: "รอผู้เข้าร่วมทุกคนยืนยัน...",
    vi: "Đang chờ tất cả xác nhận...", id: "Menunggu semua peserta mengkonfirmasi...", ms: "Menunggu semua peserta mengesahkan...", tl: "Naghihintay na kumpirmahin ng lahat...", tr: "Tüm katılımcıların onayı bekleniyor...",
    pl: "Oczekiwanie na potwierdzenie wszystkich uczestników...", uk: "Очікування підтвердження від усіх учасників...", ro: "Se așteaptă confirmarea tuturor participanților...", el: "Αναμονή επιβεβαίωσης από όλους...", cs: "Čekání na potvrzení všech účastníků...",
    sv: "Väntar på bekräftelse från alla deltagare...", da: "Venter på bekræftelse fra alle deltagere...", fi: "Odotetaan kaikkien osallistujien vahvistusta...", no: "Venter på bekreftelse fra alle deltakere...", he: "...ממתין לאישור מכל המשתתפים",
    sw: "Kusubiri washiriki wote kuthibitisha...", ne: "सबै सहभागीहरूको पुष्टि पर्खँदै..."
  },
  "cube4.desired_outcome.all_confirmed": {
    fr: "Tous les participants ont confirmé — prêt à commencer !", es: "Todos los participantes confirmaron — ¡listo para comenzar!", de: "Alle Teilnehmer bestätigt — bereit zum Start!", it: "Tutti i partecipanti confermati — pronti a iniziare!", pt: "Todos os participantes confirmaram — pronto para começar!",
    ru: "Все участники подтвердили — готово к старту!", nl: "Alle deelnemers bevestigd — klaar om te starten!", zh: "所有参与者已确认——准备开始！", ja: "全参加者が確認しました——開始準備完了！", ko: "모든 참가자가 확인했습니다 — 시작 준비 완료!",
    ar: "!جميع المشاركين أكدوا — جاهز للبدء", hi: "सभी प्रतिभागियों ने पुष्टि की — शुरू करने के लिए तैयार!", bn: "সব অংশগ্রহণকারী নিশ্চিত করেছেন — শুরু করতে প্রস্তুত!", pa: "ਸਾਰੇ ਭਾਗੀਦਾਰਾਂ ਨੇ ਪੁਸ਼ਟੀ ਕੀਤੀ — ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ!", th: "ผู้เข้าร่วมทุกคนยืนยันแล้ว — พร้อมเริ่ม!",
    vi: "Tất cả đã xác nhận — sẵn sàng bắt đầu!", id: "Semua peserta telah mengkonfirmasi — siap memulai!", ms: "Semua peserta telah mengesahkan — sedia untuk mula!", tl: "Lahat ng kalahok ay kumumpirma — handa nang magsimula!", tr: "Tüm katılımcılar onayladı — başlamaya hazır!",
    pl: "Wszyscy uczestnicy potwierdzili — gotowi do startu!", uk: "Усі учасники підтвердили — готові почати!", ro: "Toți participanții au confirmat — gata de start!", el: "Όλοι επιβεβαίωσαν — έτοιμοι να ξεκινήσουμε!", cs: "Všichni účastníci potvrdili — připraveni začít!",
    sv: "Alla deltagare bekräftade — redo att börja!", da: "Alle deltagere bekræftet — klar til at begynde!", fi: "Kaikki osallistujat vahvistaneet — valmis aloittamaan!", no: "Alle deltakere bekreftet — klar til å starte!", he: "!כל המשתתפים אישרו — מוכן להתחיל",
    sw: "Washiriki wote wamethibitisha — tayari kuanza!", ne: "सबै सहभागीहरूले पुष्टि गरे — सुरु गर्न तयार!"
  },
  "cube4.results_log.prompt": {
    fr: "Quel a été le résultat ?", es: "¿Cuál fue el resultado?", de: "Was war das Ergebnis?", it: "Qual è stato il risultato?", pt: "Qual foi o resultado?",
    ru: "Каков был результат?", nl: "Wat was het resultaat?", zh: "结果如何？", ja: "結果はどうでしたか？", ko: "결과가 어떻게 되었나요?",
    ar: "ما كانت النتيجة؟", hi: "परिणाम क्या रहा?", bn: "ফলাফল কী ছিল?", pa: "ਨਤੀਜਾ ਕੀ ਸੀ?", th: "ผลลัพธ์เป็นอย่างไร?",
    vi: "Kết quả là gì?", id: "Apa hasilnya?", ms: "Apakah hasilnya?", tl: "Ano ang resulta?", tr: "Sonuç ne oldu?",
    pl: "Jaki był rezultat?", uk: "Який був результат?", ro: "Care a fost rezultatul?", el: "Ποιο ήταν το αποτέλεσμα;", cs: "Jaký byl výsledek?",
    sv: "Vad blev resultatet?", da: "Hvad blev resultatet?", fi: "Mikä oli tulos?", no: "Hva ble resultatet?", he: "?מה הייתה התוצאה",
    sw: "Matokeo yalikuwa nini?", ne: "परिणाम के थियो?"
  },
  "cube4.results_log.submit": {
    fr: "Soumettre les résultats", es: "Enviar resultados", de: "Ergebnisse einreichen", it: "Invia risultati", pt: "Enviar resultados",
    ru: "Отправить результаты", nl: "Resultaten indienen", zh: "提交结果", ja: "結果を送信", ko: "결과 제출",
    ar: "إرسال النتائج", hi: "परिणाम सबमिट करें", bn: "ফলাফল জমা দিন", pa: "ਨਤੀਜੇ ਜਮ੍ਹਾਂ ਕਰੋ", th: "ส่งผลลัพธ์",
    vi: "Gửi kết quả", id: "Kirim hasil", ms: "Hantar keputusan", tl: "I-submit ang resulta", tr: "Sonuçları gönder",
    pl: "Wyślij wyniki", uk: "Надіслати результати", ro: "Trimite rezultatele", el: "Υποβολή αποτελεσμάτων", cs: "Odeslat výsledky",
    sv: "Skicka resultat", da: "Indsend resultater", fi: "Lähetä tulokset", no: "Send inn resultater", he: "שלח תוצאות",
    sw: "Wasilisha matokeo", ne: "परिणाम पेश गर्नुहोस्"
  },
  "cube6.themes.ready_badge": {
    fr: "{count} thèmes prêts", es: "{count} temas listos", de: "{count} Themen bereit", it: "{count} temi pronti", pt: "{count} temas prontos",
    ru: "{count} тем готово", nl: "{count} thema's klaar", zh: "{count} 个主题就绪", ja: "{count} テーマ準備完了", ko: "{count}개 테마 준비 완료",
    ar: "{count} مواضيع جاهزة", hi: "{count} थीम तैयार", bn: "{count}টি থিম প্রস্তুত", pa: "{count} ਥੀਮ ਤਿਆਰ", th: "{count} ธีมพร้อม",
    vi: "{count} chủ đề sẵn sàng", id: "{count} tema siap", ms: "{count} tema sedia", tl: "{count} na tema ang handa", tr: "{count} tema hazır",
    pl: "{count} tematów gotowych", uk: "{count} тем готово", ro: "{count} teme pregătite", el: "{count} θέματα έτοιμα", cs: "{count} témat připraveno",
    sv: "{count} teman klara", da: "{count} temaer klar", fi: "{count} teemaa valmiina", no: "{count} temaer klare", he: "{count} נושאים מוכנים",
    sw: "Mada {count} tayari", ne: "{count} थिम तयार"
  },
  "cube6.themes.marble_sampling": {
    fr: "Échantillonnage des réponses...", es: "Muestreando respuestas...", de: "Antworten werden gesampelt...", it: "Campionamento delle risposte...", pt: "Amostrando respostas...",
    ru: "Выборка ответов...", nl: "Antwoorden samplen...", zh: "正在采样响应...", ja: "回答をサンプリング中...", ko: "응답 샘플링 중...",
    ar: "أخذ عينات من الردود...", hi: "प्रतिक्रियाओं का नमूना ले रहा है...", bn: "প্রতিক্রিয়া স্যাম্পলিং...", pa: "ਜਵਾਬਾਂ ਦਾ ਨਮੂਨਾ ਲੈ ਰਿਹਾ ਹੈ...", th: "กำลังสุ่มตัวอย่างคำตอบ...",
    vi: "Đang lấy mẫu phản hồi...", id: "Mengambil sampel respons...", ms: "Mengambil sampel respons...", tl: "Nagsa-sample ng mga sagot...", tr: "Yanıtlar örnekleniyor...",
    pl: "Próbkowanie odpowiedzi...", uk: "Вибірка відповідей...", ro: "Eșantionare răspunsuri...", el: "Δειγματοληψία απαντήσεων...", cs: "Vzorkování odpovědí...",
    sv: "Samplar svar...", da: "Udtager stikprøver af svar...", fi: "Otannoitaan vastauksia...", no: "Tar prøver av svar...", he: "...דוגם תגובות",
    sw: "Kuchukua sampuli za majibu...", ne: "प्रतिक्रिया नमूना लिँदै..."
  },
  "cube6.themes.reducing": {
    fr: "Consolidation des thèmes...", es: "Consolidando temas...", de: "Themen werden zusammengefasst...", it: "Consolidamento dei temi...", pt: "Consolidando temas...",
    ru: "Объединение тем...", nl: "Thema's samenvoegen...", zh: "整合主题...", ja: "テーマを統合中...", ko: "테마 통합 중...",
    ar: "دمج المواضيع...", hi: "थीम समेकित कर रहा है...", bn: "থিম একত্রিত করছে...", pa: "ਥੀਮ ਇਕੱਠੇ ਕਰ ਰਿਹਾ ਹੈ...", th: "กำลังรวมธีม...",
    vi: "Đang hợp nhất chủ đề...", id: "Mengkonsolidasi tema...", ms: "Menyatukan tema...", tl: "Kinokonsolida ang mga tema...", tr: "Temalar birleştiriliyor...",
    pl: "Konsolidacja tematów...", uk: "Об'єднання тем...", ro: "Consolidare teme...", el: "Ενοποίηση θεμάτων...", cs: "Konsolidace témat...",
    sv: "Konsoliderar teman...", da: "Konsoliderer temaer...", fi: "Yhdistetään teemoja...", no: "Konsoliderer temaer...", he: "...מאחד נושאים",
    sw: "Kuunganisha mada...", ne: "थिमहरू समेकन गर्दै..."
  },
  "cube6.themes.assigning": {
    fr: "Attribution des thèmes aux réponses...", es: "Asignando temas a las respuestas...", de: "Themen den Antworten zuordnen...", it: "Assegnazione dei temi alle risposte...", pt: "Atribuindo temas às respostas...",
    ru: "Назначение тем ответам...", nl: "Thema's toewijzen aan antwoorden...", zh: "将主题分配给响应...", ja: "テーマを回答に割り当て中...", ko: "응답에 테마 할당 중...",
    ar: "تعيين المواضيع للردود...", hi: "प्रतिक्रियाओं को थीम निर्दिष्ट कर रहा है...", bn: "প্রতিক্রিয়াগুলিতে থিম নির্ধারণ...", pa: "ਜਵਾਬਾਂ ਨੂੰ ਥੀਮ ਨਿਰਧਾਰਤ ਕਰ ਰਿਹਾ ਹੈ...", th: "กำลังกำหนดธีมให้กับคำตอบ...",
    vi: "Đang gán chủ đề cho phản hồi...", id: "Menetapkan tema ke respons...", ms: "Menetapkan tema kepada respons...", tl: "Ini-assign ang mga tema sa mga sagot...", tr: "Temalar yanıtlara atanıyor...",
    pl: "Przypisywanie tematów do odpowiedzi...", uk: "Призначення тем відповідям...", ro: "Atribuire teme la răspunsuri...", el: "Αντιστοίχιση θεμάτων σε απαντήσεις...", cs: "Přiřazování témat k odpovědím...",
    sv: "Tilldelar teman till svar...", da: "Tildeler temaer til svar...", fi: "Liitetään teemoja vastauksiin...", no: "Tilordner temaer til svar...", he: "...מקצה נושאים לתגובות",
    sw: "Kupeana mada kwa majibu...", ne: "प्रतिक्रियाहरूमा थिम तोक्दै..."
  },
  "cube6.themes.pipeline_complete": {
    fr: "Analyse thématique terminée !", es: "¡Análisis temático completado!", de: "Themenanalyse abgeschlossen!", it: "Analisi tematica completata!", pt: "Análise temática concluída!",
    ru: "Тематический анализ завершён!", nl: "Thema-analyse voltooid!", zh: "主题分析完成！", ja: "テーマ分析完了！", ko: "테마 분석 완료!",
    ar: "!اكتمل تحليل المواضيع", hi: "थीम विश्लेषण पूरा!", bn: "থিম বিশ্লেষণ সম্পন্ন!", pa: "ਥੀਮ ਵਿਸ਼ਲੇਸ਼ਣ ਪੂਰਾ!", th: "การวิเคราะห์ธีมเสร็จสมบูรณ์!",
    vi: "Phân tích chủ đề hoàn tất!", id: "Analisis tema selesai!", ms: "Analisis tema selesai!", tl: "Kumpleto na ang pagsusuri ng tema!", tr: "Tema analizi tamamlandı!",
    pl: "Analiza tematów zakończona!", uk: "Тематичний аналіз завершено!", ro: "Analiza tematică finalizată!", el: "Η ανάλυση θεμάτων ολοκληρώθηκε!", cs: "Tématická analýza dokončena!",
    sv: "Temaanalys klar!", da: "Temaanalyse færdig!", fi: "Teema-analyysi valmis!", no: "Temaanalyse fullført!", he: "!ניתוח נושאים הושלם",
    sw: "Uchambuzi wa mada umekamilika!", ne: "थिम विश्लेषण पूरा भयो!"
  },
  "cube6.themes.pipeline_error": {
    fr: "L'analyse thématique a rencontré une erreur", es: "El análisis temático encontró un error", de: "Bei der Themenanalyse ist ein Fehler aufgetreten", it: "L'analisi tematica ha riscontrato un errore", pt: "A análise temática encontrou um erro",
    ru: "Ошибка тематического анализа", nl: "Thema-analyse heeft een fout ondervonden", zh: "主题分析遇到错误", ja: "テーマ分析でエラーが発生しました", ko: "테마 분석 중 오류 발생",
    ar: "واجه تحليل المواضيع خطأ", hi: "थीम विश्लेषण में त्रुटि", bn: "থিম বিশ্লেষণে ত্রুটি", pa: "ਥੀਮ ਵਿਸ਼ਲੇਸ਼ਣ ਵਿੱਚ ਗਲਤੀ", th: "การวิเคราะห์ธีมพบข้อผิดพลาด",
    vi: "Phân tích chủ đề gặp lỗi", id: "Analisis tema menemui kesalahan", ms: "Analisis tema menghadapi ralat", tl: "May error sa pagsusuri ng tema", tr: "Tema analizinde hata oluştu",
    pl: "Analiza tematów napotkała błąd", uk: "Тематичний аналіз зіткнувся з помилкою", ro: "Analiza tematică a întâmpinat o eroare", el: "Η ανάλυση θεμάτων αντιμετώπισε σφάλμα", cs: "Tématická analýza narazila na chybu",
    sv: "Temaanalysen stötte på ett fel", da: "Temaanalysen stødte på en fejl", fi: "Teema-analyysissä tapahtui virhe", no: "Temaanalysen møtte en feil", he: "ניתוח הנושאים נתקל בשגיאה",
    sw: "Uchambuzi wa mada umekutana na hitilafu", ne: "थिम विश्लेषणमा त्रुटि भयो"
  },
  "cube6.themes.scale_sampling": {
    fr: "Échantillonnage de {count} sur {total} réponses", es: "Muestreando {count} de {total} respuestas", de: "Stichprobe von {count} aus {total} Antworten", it: "Campionamento di {count} su {total} risposte", pt: "Amostrando {count} de {total} respostas",
    ru: "Выборка {count} из {total} ответов", nl: "{count} van {total} antwoorden samplen", zh: "正在采样 {total} 个响应中的 {count} 个", ja: "{total} 件中 {count} 件をサンプリング", ko: "{total}개 중 {count}개 샘플링",
    ar: "أخذ عينة {count} من {total} ردود", hi: "{total} में से {count} प्रतिक्रियाओं का नमूना", bn: "{total}টির মধ্যে {count}টি প্রতিক্রিয়া স্যাম্পলিং", pa: "{total} ਵਿੱਚੋਂ {count} ਜਵਾਬਾਂ ਦਾ ਨਮੂਨਾ", th: "สุ่มตัวอย่าง {count} จาก {total} คำตอบ",
    vi: "Lấy mẫu {count} trong {total} phản hồi", id: "Mengambil sampel {count} dari {total} respons", ms: "Mengambil sampel {count} daripada {total} respons", tl: "Nagsa-sample ng {count} sa {total} na sagot", tr: "{total} yanıttan {count} tanesi örnekleniyor",
    pl: "Próbkowanie {count} z {total} odpowiedzi", uk: "Вибірка {count} з {total} відповідей", ro: "Eșantionare {count} din {total} răspunsuri", el: "Δειγματοληψία {count} από {total} απαντήσεις", cs: "Vzorkování {count} z {total} odpovědí",
    sv: "Samplar {count} av {total} svar", da: "Udtager stikprøve af {count} ud af {total} svar", fi: "Otannoitaan {count}/{total} vastausta", no: "Tar prøve av {count} av {total} svar", he: "דוגם {count} מתוך {total} תגובות",
    sw: "Kuchukua sampuli {count} kati ya {total}", ne: "{total} मध्ये {count} प्रतिक्रिया नमूना लिँदै"
  },
  "cube6.themes.theme_library": {
    fr: "{count} thèmes candidats découverts", es: "{count} temas candidatos descubiertos", de: "{count} Kandidatenthemen entdeckt", it: "{count} temi candidati scoperti", pt: "{count} temas candidatos descobertos",
    ru: "Обнаружено {count} тем-кандидатов", nl: "{count} kandidaat-thema's ontdekt", zh: "发现 {count} 个候选主题", ja: "{count} 件の候補テーマを発見", ko: "{count}개 후보 테마 발견",
    ar: "تم اكتشاف {count} مواضيع مرشحة", hi: "{count} उम्मीदवार थीम खोजे गए", bn: "{count}টি প্রার্থী থিম আবিষ্কৃত", pa: "{count} ਉਮੀਦਵਾਰ ਥੀਮ ਖੋਜੇ ਗਏ", th: "ค้นพบ {count} ธีมที่เป็นไปได้",
    vi: "Phát hiện {count} chủ đề ứng viên", id: "{count} tema kandidat ditemukan", ms: "{count} tema calon ditemui", tl: "{count} na kandidatong tema ang natuklasan", tr: "{count} aday tema keşfedildi",
    pl: "Odkryto {count} tematów kandydatów", uk: "Виявлено {count} тем-кандидатів", ro: "{count} teme candidate descoperite", el: "Ανακαλύφθηκαν {count} υποψήφια θέματα", cs: "Objeveno {count} kandidátních témat",
    sv: "{count} kandidatteman upptäckta", da: "{count} kandidattemaer opdaget", fi: "{count} ehdokasteemaa löydetty", no: "{count} kandidattemaer oppdaget", he: "{count} נושאים מועמדים נמצאו",
    sw: "Mada {count} zinazowezekana zimegunduliwa", ne: "{count} उम्मेदवार थिम पत्ता लाग्यो"
  },
  "cube7.ranking.tap_instructions": {
    fr: "Appuyez pour sélectionner votre ordre de classement", es: "Toca para seleccionar tu orden de clasificación", de: "Tippen Sie, um Ihre Rangfolge auszuwählen", it: "Tocca per selezionare il tuo ordine di classifica", pt: "Toque para selecionar sua ordem de classificação",
    ru: "Нажмите, чтобы выбрать порядок ранжирования", nl: "Tik om uw rangorde te selecteren", zh: "点击选择你的排名顺序", ja: "タップしてランキング順を選択", ko: "탭하여 순위를 선택하세요",
    ar: "اضغط لاختيار ترتيب التصنيف", hi: "अपना रैंकिंग क्रम चुनने के लिए टैप करें", bn: "আপনার র্যাঙ্কিং ক্রম নির্বাচন করতে ট্যাপ করুন", pa: "ਆਪਣਾ ਰੈਂਕਿੰਗ ਕ੍ਰਮ ਚੁਣਨ ਲਈ ਟੈਪ ਕਰੋ", th: "แตะเพื่อเลือกลำดับการจัดอันดับ",
    vi: "Chạm để chọn thứ tự xếp hạng", id: "Ketuk untuk memilih urutan peringkat", ms: "Ketik untuk memilih susunan kedudukan", tl: "I-tap para pumili ng pagkakasunod-sunod", tr: "Sıralama düzeninizi seçmek için dokunun",
    pl: "Dotknij, aby wybrać kolejność rankingu", uk: "Натисніть, щоб вибрати порядок рейтингу", ro: "Atinge pentru a selecta ordinea clasamentului", el: "Πατήστε για να επιλέξετε τη σειρά κατάταξης", cs: "Klepněte pro výběr pořadí hodnocení",
    sv: "Tryck för att välja din rankningsordning", da: "Tryk for at vælge din rangorden", fi: "Napauta valitaksesi järjestyksesi", no: "Trykk for å velge din rangering", he: "הקש כדי לבחור את סדר הדירוג שלך",
    sw: "Gusa kuchagua mpangilio wako wa cheo", ne: "आफ्नो रैंकिंग क्रम चयन गर्न ट्याप गर्नुहोस्"
  },
  "cube7.ranking.waiting": {
    fr: "En attente des classements des autres...", es: "Esperando que otros clasifiquen...", de: "Warten auf die Ranglisten anderer...", it: "In attesa delle classifiche degli altri...", pt: "Aguardando classificação dos outros...",
    ru: "Ожидание ранжирования другими...", nl: "Wachten op rangschikking van anderen...", zh: "等待其他人排名...", ja: "他の参加者のランキングを待っています...", ko: "다른 참가자의 순위 대기 중...",
    ar: "في انتظار تصنيف الآخرين...", hi: "दूसरों के रैंक करने की प्रतीक्षा...", bn: "অন্যদের র্যাঙ্কিংয়ের অপেক্ষায়...", pa: "ਹੋਰਾਂ ਦੀ ਰੈਂਕਿੰਗ ਦੀ ਉਡੀਕ...", th: "รอคนอื่นจัดอันดับ...",
    vi: "Đang chờ người khác xếp hạng...", id: "Menunggu yang lain memberi peringkat...", ms: "Menunggu yang lain memberi kedudukan...", tl: "Naghihintay sa iba na mag-rank...", tr: "Diğerlerinin sıralamasını bekleniyor...",
    pl: "Czekam na rankingi innych...", uk: "Очікування рейтингів від інших...", ro: "Se așteaptă clasamentul celorlalți...", el: "Αναμονή κατάταξης από τους υπόλοιπους...", cs: "Čekání na hodnocení ostatních...",
    sv: "Väntar på att andra ska ranka...", da: "Venter på andres rangordning...", fi: "Odotetaan muiden arviointia...", no: "Venter på at andre skal rangere...", he: "...ממתין לדירוגים מאחרים",
    sw: "Kusubiri wengine wapange cheo...", ne: "अरूको रैंकिंगको प्रतीक्षामा..."
  },
  "cube7.ranking.results_title": {
    fr: "Priorités classées", es: "Prioridades clasificadas", de: "Gerankte Prioritäten", it: "Priorità classificate", pt: "Prioridades classificadas",
    ru: "Ранжированные приоритеты", nl: "Gerangschikte prioriteiten", zh: "排名优先事项", ja: "ランク付きの優先事項", ko: "순위별 우선순위",
    ar: "الأولويات المصنفة", hi: "रैंक की गई प्राथमिकताएँ", bn: "র্যাঙ্ক করা অগ্রাধিকার", pa: "ਰੈਂਕ ਕੀਤੀਆਂ ਤਰਜੀਹਾਂ", th: "ลำดับความสำคัญ",
    vi: "Ưu tiên đã xếp hạng", id: "Prioritas Terperingkat", ms: "Keutamaan Berkedudukan", tl: "Naka-rank na Mga Priyoridad", tr: "Sıralanmış Öncelikler",
    pl: "Uszeregowane priorytety", uk: "Ранжовані пріоритети", ro: "Priorități clasificate", el: "Κατατεταγμένες Προτεραιότητες", cs: "Seřazené priority",
    sv: "Rankade prioriteringar", da: "Rangordnede prioriteter", fi: "Luokitellut prioriteetit", no: "Rangerte prioriteringer", he: "סדרי עדיפויות מדורגים",
    sw: "Vipaumbele Vilivyopangwa", ne: "रैंक गरिएका प्राथमिकताहरू"
  },
  "cube7.ranking.rank_label": {
    fr: "#{rank}", es: "#{rank}", de: "#{rank}", it: "#{rank}", pt: "#{rank}",
    ru: "#{rank}", nl: "#{rank}", zh: "#{rank}", ja: "#{rank}", ko: "#{rank}",
    ar: "#{rank}", hi: "#{rank}", bn: "#{rank}", pa: "#{rank}", th: "#{rank}",
    vi: "#{rank}", id: "#{rank}", ms: "#{rank}", tl: "#{rank}", tr: "#{rank}",
    pl: "#{rank}", uk: "#{rank}", ro: "#{rank}", el: "#{rank}", cs: "#{rank}",
    sv: "#{rank}", da: "#{rank}", fi: "#{rank}", no: "#{rank}", he: "#{rank}",
    sw: "#{rank}", ne: "#{rank}"
  },
  "cube7.ranking.score": {
    fr: "Score : {score}", es: "Puntuación: {score}", de: "Punktzahl: {score}", it: "Punteggio: {score}", pt: "Pontuação: {score}",
    ru: "Баллы: {score}", nl: "Score: {score}", zh: "得分：{score}", ja: "スコア：{score}", ko: "점수: {score}",
    ar: "{score} :النقاط", hi: "स्कोर: {score}", bn: "স্কোর: {score}", pa: "ਸਕੋਰ: {score}", th: "คะแนน: {score}",
    vi: "Điểm: {score}", id: "Skor: {score}", ms: "Skor: {score}", tl: "Puntos: {score}", tr: "Puan: {score}",
    pl: "Wynik: {score}", uk: "Бали: {score}", ro: "Scor: {score}", el: "Βαθμολογία: {score}", cs: "Skóre: {score}",
    sv: "Poäng: {score}", da: "Score: {score}", fi: "Pisteet: {score}", no: "Poeng: {score}", he: "{score} :ניקוד",
    sw: "Alama: {score}", ne: "स्कोर: {score}"
  },
  "cube7.ranking.top_theme": {
    fr: "Priorité n°1", es: "Prioridad principal", de: "Höchste Priorität", it: "Priorità principale", pt: "Prioridade principal",
    ru: "Главный приоритет", nl: "Hoogste prioriteit", zh: "首要优先事项", ja: "最優先事項", ko: "최우선 순위",
    ar: "الأولوية القصوى", hi: "शीर्ष प्राथमिकता", bn: "শীর্ষ অগ্রাধিকার", pa: "ਪ੍ਰਮੁੱਖ ਤਰਜੀਹ", th: "ลำดับสูงสุด",
    vi: "Ưu tiên hàng đầu", id: "Prioritas Utama", ms: "Keutamaan Teratas", tl: "Pangunahing Priyoridad", tr: "En Öncelikli",
    pl: "Najwyższy priorytet", uk: "Найвищий пріоритет", ro: "Prioritate maximă", el: "Κορυφαία Προτεραιότητα", cs: "Nejvyšší priorita",
    sv: "Högsta prioritet", da: "Højeste prioritet", fi: "Tärkein prioriteetti", no: "Høyeste prioritet", he: "עדיפות עליונה",
    sw: "Kipaumbele Kikuu", ne: "शीर्ष प्राथमिकता"
  },
  "cube7.ranking.override_applied": {
    fr: "Classement ajusté par le responsable", es: "Clasificación ajustada por el líder", de: "Rangfolge vom Leiter angepasst", it: "Classifica modificata dal responsabile", pt: "Classificação ajustada pelo líder",
    ru: "Рейтинг скорректирован руководителем", nl: "Rangschikking aangepast door leider", zh: "排名已由负责人调整", ja: "リーダーによってランキングが調整されました", ko: "리더에 의해 순위가 조정됨",
    ar: "تم تعديل التصنيف من قبل المسؤول", hi: "लीड द्वारा रैंकिंग समायोजित", bn: "লিড দ্বারা র্যাঙ্কিং সমন্বিত", pa: "ਲੀਡ ਦੁਆਰਾ ਰੈਂਕਿੰਗ ਐਡਜਸਟ ਕੀਤੀ ਗਈ", th: "ผู้นำปรับอันดับแล้ว",
    vi: "Xếp hạng đã được điều chỉnh bởi Lead", id: "Peringkat disesuaikan oleh Lead", ms: "Kedudukan diselaraskan oleh Lead", tl: "Na-adjust ng Lead ang ranking", tr: "Sıralama Lider tarafından ayarlandı",
    pl: "Ranking dostosowany przez Lidera", uk: "Рейтинг скориговано Лідером", ro: "Clasament ajustat de Lider", el: "Η κατάταξη προσαρμόστηκε από τον Επικεφαλής", cs: "Hodnocení upraveno Vedoucím",
    sv: "Ranking justerad av Ledare", da: "Rangordning justeret af Leder", fi: "Arviointi säädetty johtajan toimesta", no: "Rangering justert av Leder", he: "הדירוג הותאם על ידי המוביל",
    sw: "Cheo kimesahihishwa na Kiongozi", ne: "लिडद्वारा रैंकिंग समायोजित"
  },
  "cube7.ranking.override_justification": {
    fr: "Raison : {text}", es: "Razón: {text}", de: "Grund: {text}", it: "Motivo: {text}", pt: "Razão: {text}",
    ru: "Причина: {text}", nl: "Reden: {text}", zh: "原因：{text}", ja: "理由：{text}", ko: "사유: {text}",
    ar: "{text} :السبب", hi: "कारण: {text}", bn: "কারণ: {text}", pa: "ਕਾਰਨ: {text}", th: "เหตุผล: {text}",
    vi: "Lý do: {text}", id: "Alasan: {text}", ms: "Sebab: {text}", tl: "Dahilan: {text}", tr: "Neden: {text}",
    pl: "Powód: {text}", uk: "Причина: {text}", ro: "Motiv: {text}", el: "Λόγος: {text}", cs: "Důvod: {text}",
    sv: "Anledning: {text}", da: "Årsag: {text}", fi: "Syy: {text}", no: "Årsak: {text}", he: "{text} :סיבה",
    sw: "Sababu: {text}", ne: "कारण: {text}"
  },
  "cube7.ranking.no_rankings_yet": {
    fr: "Aucun classement soumis", es: "Aún no hay clasificaciones", de: "Noch keine Ranglisten", it: "Nessuna classifica ancora", pt: "Nenhuma classificação ainda",
    ru: "Рейтинги ещё не поданы", nl: "Nog geen rangschikkingen", zh: "尚无排名", ja: "まだランキングがありません", ko: "아직 순위가 없습니다",
    ar: "لا تصنيفات بعد", hi: "अभी तक कोई रैंकिंग नहीं", bn: "এখনো কোনো র্যাঙ্কিং নেই", pa: "ਅਜੇ ਕੋਈ ਰੈਂਕਿੰਗ ਨਹੀਂ", th: "ยังไม่มีการจัดอันดับ",
    vi: "Chưa có xếp hạng nào", id: "Belum ada peringkat", ms: "Belum ada kedudukan", tl: "Wala pang mga ranking", tr: "Henüz sıralama yok",
    pl: "Brak rankingów", uk: "Ще немає рейтингів", ro: "Niciun clasament încă", el: "Δεν υπάρχουν κατατάξεις ακόμα", cs: "Zatím žádné hodnocení",
    sv: "Inga rankningar ännu", da: "Ingen rangordninger endnu", fi: "Ei vielä arviointeja", no: "Ingen rangeringer ennå", he: "אין דירוגים עדיין",
    sw: "Hakuna vyeo bado", ne: "अहिलेसम्म कुनै रैंकिंग छैन"
  },
  "cube7.ranking.themes_generating": {
    fr: "Génération des thèmes...", es: "Generando temas...", de: "Themen werden generiert...", it: "Generazione dei temi...", pt: "Gerando temas...",
    ru: "Генерация тем...", nl: "Thema's genereren...", zh: "正在生成主题...", ja: "テーマを生成中...", ko: "테마 생성 중...",
    ar: "جارٍ إنشاء المواضيع...", hi: "थीम बना रहा है...", bn: "থিম তৈরি হচ্ছে...", pa: "ਥੀਮ ਬਣਾ ਰਿਹਾ ਹੈ...", th: "กำลังสร้างธีม...",
    vi: "Đang tạo chủ đề...", id: "Membuat tema...", ms: "Menjana tema...", tl: "Gumagawa ng mga tema...", tr: "Temalar oluşturuluyor...",
    pl: "Generowanie tematów...", uk: "Генерація тем...", ro: "Se generează temele...", el: "Δημιουργία θεμάτων...", cs: "Generování témat...",
    sv: "Genererar teman...", da: "Genererer temaer...", fi: "Luodaan teemoja...", no: "Genererer temaer...", he: "...מייצר נושאים",
    sw: "Kutengeneza mada...", ne: "थिम बनाउँदै..."
  },
  "cube7.ranking.theme_revealed": {
    fr: "Nouveau thème découvert !", es: "¡Nuevo tema descubierto!", de: "Neues Thema entdeckt!", it: "Nuovo tema scoperto!", pt: "Novo tema descoberto!",
    ru: "Новая тема обнаружена!", nl: "Nieuw thema ontdekt!", zh: "发现新主题！", ja: "新しいテーマが発見されました！", ko: "새 테마 발견!",
    ar: "!تم اكتشاف موضوع جديد", hi: "नई थीम खोजी गई!", bn: "নতুন থিম আবিষ্কৃত!", pa: "ਨਵੀਂ ਥੀਮ ਖੋਜੀ ਗਈ!", th: "ค้นพบธีมใหม่!",
    vi: "Phát hiện chủ đề mới!", id: "Tema baru ditemukan!", ms: "Tema baru ditemui!", tl: "Bagong tema na natuklasan!", tr: "Yeni tema keşfedildi!",
    pl: "Nowy temat odkryty!", uk: "Нова тема виявлена!", ro: "Temă nouă descoperită!", el: "Νέο θέμα ανακαλύφθηκε!", cs: "Nové téma objeveno!",
    sv: "Nytt tema upptäckt!", da: "Nyt tema opdaget!", fi: "Uusi teema löydetty!", no: "Nytt tema oppdaget!", he: "!נושא חדש התגלה",
    sw: "Mada mpya imegunduliwa!", ne: "नयाँ थिम पत्ता लाग्यो!"
  },
  "cube7.ranking.voting_opens_soon": {
    fr: "Le vote s'ouvre quand tous les thèmes sont prêts", es: "La votación se abre cuando todos los temas estén listos", de: "Abstimmung startet wenn alle Themen bereit sind", it: "La votazione si apre quando tutti i temi sono pronti", pt: "A votação abre quando todos os temas estiverem prontos",
    ru: "Голосование откроется когда все темы будут готовы", nl: "Stemming opent wanneer alle thema's klaar zijn", zh: "所有主题准备好后开始投票", ja: "全テーマ準備完了後に投票開始", ko: "모든 테마가 준비되면 투표 시작",
    ar: "يفتح التصويت عندما تكون جميع المواضيع جاهزة", hi: "सभी थीम तैयार होने पर वोटिंग शुरू होगी", bn: "সব থিম প্রস্তুত হলে ভোটিং শুরু হবে", pa: "ਸਾਰੀਆਂ ਥੀਮਾਂ ਤਿਆਰ ਹੋਣ 'ਤੇ ਵੋਟਿੰਗ ਸ਼ੁਰੂ ਹੋਵੇਗੀ", th: "การโหวตเปิดเมื่อธีมทั้งหมดพร้อม",
    vi: "Bỏ phiếu mở khi tất cả chủ đề sẵn sàng", id: "Pemungutan suara dibuka saat semua tema siap", ms: "Pengundian dibuka apabila semua tema sedia", tl: "Magbubukas ang botohan kapag handa na ang lahat ng tema", tr: "Tüm temalar hazır olduğunda oylama açılır",
    pl: "Głosowanie rozpocznie się gdy wszystkie tematy będą gotowe", uk: "Голосування відкриється коли всі теми будуть готові", ro: "Votul se deschide când toate temele sunt gata", el: "Η ψηφοφορία ξεκινά όταν όλα τα θέματα είναι έτοιμα", cs: "Hlasování se otevře až budou všechna témata připravena",
    sv: "Röstning öppnas när alla teman är klara", da: "Afstemning åbner når alle temaer er klar", fi: "Äänestys avautuu kun kaikki teemat ovat valmiina", no: "Avstemning åpner når alle temaer er klare", he: "ההצבעה נפתחת כשכל הנושאים מוכנים",
    sw: "Upigaji kura unafunguka mada zote zinapokuwa tayari", ne: "सबै थिम तयार हुँदा मतदान खुल्छ"
  },
};

// Part 2 will be appended
