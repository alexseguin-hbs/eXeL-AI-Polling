#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const TRANSLATIONS_FILE = path.join(__dirname, '..', 'frontend', 'lib', 'lexicon-translations.ts');
const M = {
  "cube1.settings.cost_combo":{fr:"Combinaison",es:"Combinación",de:"Kombination",it:"Combinazione",pt:"Combinação",ru:"Комбинация",nl:"Combinatie",zh:"组合",ja:"組合",ko:"조합",ar:"مجموعة",hi:"संयोजन",bn:"সংমিশ্রণ",pa:"ਸੰਯੋਜਨ",th:"คอมโบ",vi:"Kết hợp",id:"Kombo",ms:"Kombo",tl:"Kombo",tr:"Kombo",pl:"Kombinacja",uk:"Комбінація",ro:"Combinație",el:"Συνδυασμός",cs:"Kombinace",sv:"Kombination",da:"Kombination",fi:"Yhdistelmä",no:"Kombinasjon",he:"שילוב",sw:"Mchanganyiko",ne:"संयोजन"},
  "cube1.settings.cost_summary":{fr:"Résumé",es:"Resumen",de:"Zusammenfassung",it:"Riepilogo",pt:"Resumo",ru:"Резюме",nl:"Samenvatting",zh:"摘要",ja:"要約",ko:"요약",ar:"ملخص",hi:"सारांश",bn:"সারাংশ",pa:"ਸਾਰ",th:"สรุป",vi:"Tóm tắt",id:"Ringkasan",ms:"Ringkasan",tl:"Buod",tr:"Özet",pl:"Podsumowanie",uk:"Резюме",ro:"Rezumat",el:"Περίληψη",cs:"Shrnutí",sv:"Sammanfattning",da:"Resumé",fi:"Yhteenveto",no:"Sammendrag",he:"סיכום",sw:"Muhtasari",ne:"सारांश"},
  "cube1.settings.cost_v2t":{fr:"V2T",es:"V2T",de:"V2T",it:"V2T",pt:"V2T",ru:"V2T",nl:"V2T",zh:"V2T",ja:"V2T",ko:"V2T",ar:"V2T",hi:"V2T",bn:"V2T",pa:"V2T",th:"V2T",vi:"V2T",id:"V2T",ms:"V2T",tl:"V2T",tr:"V2T",pl:"V2T",uk:"V2T",ro:"V2T",el:"V2T",cs:"V2T",sv:"V2T",da:"V2T",fi:"V2T",no:"V2T",he:"V2T",sw:"V2T",ne:"V2T"},
  "cube1.settings.cost_total":{fr:"Total",es:"Total",de:"Gesamt",it:"Totale",pt:"Total",ru:"Итого",nl:"Totaal",zh:"合计",ja:"合計",ko:"합계",ar:"المجموع",hi:"कुल",bn:"মোট",pa:"ਕੁੱਲ",th:"รวม",vi:"Tổng",id:"Total",ms:"Jumlah",tl:"Kabuuan",tr:"Toplam",pl:"Suma",uk:"Всього",ro:"Total",el:"Σύνολο",cs:"Celkem",sv:"Totalt",da:"Total",fi:"Yhteensä",no:"Totalt",he:"סה\"כ",sw:"Jumla",ne:"कुल"},
  "cube1.settings.cost_default":{fr:"défaut",es:"predeterminado",de:"Standard",it:"predefinito",pt:"padrão",ru:"по умолчанию",nl:"standaard",zh:"默认",ja:"デフォルト",ko:"기본",ar:"افتراضي",hi:"डिफ़ॉल्ट",bn:"ডিফল্ট",pa:"ਡਿਫਾਲਟ",th:"ค่าเริ่มต้น",vi:"mặc định",id:"default",ms:"lalai",tl:"default",tr:"varsayılan",pl:"domyślny",uk:"за замовчуванням",ro:"implicit",el:"προεπιλογή",cs:"výchozí",sv:"standard",da:"standard",fi:"oletus",no:"standard",he:"ברירת מחדל",sw:"chaguo-msingi",ne:"पूर्वनिर्धारित"},
  "cube1.settings.cost_note_formula":{fr:"Résumé = Phase A (résumé) + Phase B (thématisation ~30% surcroît). V2T = 500 utilisateurs vocaux × 0,74 min audio chacun.",es:"Resumen = Fase A (resumen) + Fase B (tematización ~30% adicional). V2T = 500 usuarios de voz × 0,74 min audio cada uno.",de:"Zusammenfassung = Phase A + Phase B (~30% Overhead). V2T = 500 Sprachnutzer × 0,74 Min Audio.",it:"Riepilogo = Fase A + Fase B (~30% overhead). V2T = 500 utenti vocali × 0,74 min audio.",pt:"Resumo = Fase A + Fase B (~30% overhead). V2T = 500 usuários de voz × 0,74 min áudio.",ru:"Резюме = Фаза A + Фаза B (~30% наценка). V2T = 500 голосовых пользователей × 0,74 мин аудио.",nl:"Samenvatting = Fase A + Fase B (~30% overhead). V2T = 500 spraakgebruikers × 0,74 min audio.",zh:"摘要 = 阶段A + 阶段B（~30%开销）。V2T = 500语音用户 × 0.74分钟音频。",ja:"要約 = フェーズA + フェーズB（~30%オーバーヘッド）。V2T = 500音声ユーザー × 0.74分。",ko:"요약 = Phase A + Phase B (~30% 오버헤드). V2T = 500 음성 사용자 × 0.74분 오디오.",ar:"الملخص = المرحلة أ + المرحلة ب (~30% إضافية). V2T = 500 مستخدم صوتي × 0.74 دقيقة.",hi:"सारांश = चरण A + चरण B (~30% ओवरहेड)। V2T = 500 वॉइस उपयोगकर्ता × 0.74 मिनट ऑडियो।",bn:"সারাংশ = ফেজ A + ফেজ B (~30% ওভারহেড)। V2T = 500 ভয়েস ব্যবহারকারী × 0.74 মিনিট।",pa:"ਸਾਰ = ਫੇਜ਼ A + ਫੇਜ਼ B (~30% ਓਵਰਹੈੱਡ)। V2T = 500 ਵੌਇਸ × 0.74 ਮਿੰਟ।",th:"สรุป = เฟส A + เฟส B (~30%) V2T = 500 ผู้ใช้เสียง × 0.74 นาที",vi:"Tóm tắt = Pha A + Pha B (~30%). V2T = 500 người dùng giọng nói × 0,74 phút.",id:"Ringkasan = Fase A + Fase B (~30%). V2T = 500 pengguna suara × 0,74 menit.",ms:"Ringkasan = Fasa A + Fasa B (~30%). V2T = 500 pengguna suara × 0.74 minit.",tl:"Buod = Phase A + Phase B (~30%). V2T = 500 voice users × 0.74 min.",tr:"Özet = Faz A + Faz B (~%30). V2T = 500 ses kullanıcısı × 0,74 dk.",pl:"Podsumowanie = Faza A + Faza B (~30%). V2T = 500 użytkowników głosowych × 0,74 min.",uk:"Резюме = Фаза A + Фаза B (~30%). V2T = 500 голосових × 0,74 хв.",ro:"Rezumat = Faza A + Faza B (~30%). V2T = 500 utilizatori voce × 0,74 min.",el:"Περίληψη = Φάση A + Φάση B (~30%). V2T = 500 χρήστες φωνής × 0,74 λεπτά.",cs:"Shrnutí = Fáze A + Fáze B (~30%). V2T = 500 hlasových × 0,74 min.",sv:"Sammanfattning = Fas A + Fas B (~30%). V2T = 500 röstanvändare × 0,74 min.",da:"Resumé = Fase A + Fase B (~30%). V2T = 500 stemmebrugere × 0,74 min.",fi:"Yhteenveto = Vaihe A + Vaihe B (~30%). V2T = 500 äänikäyttäjää × 0,74 min.",no:"Sammendrag = Fase A + Fase B (~30%). V2T = 500 stemmebrukere × 0,74 min.",he:"סיכום = שלב A + שלב B (~30%). V2T = 500 משתמשי קול × 0.74 דק'.",sw:"Muhtasari = Awamu A + Awamu B (~30%). V2T = watumiaji 500 wa sauti × dak. 0.74.",ne:"सारांश = फेज A + फेज B (~30%)। V2T = 500 भ्वाइस प्रयोगकर्ता × 0.74 मिनेट।"},
  "cube1.settings.cost_note_free":{fr:"Niveau gratuit (≤19 utilisateurs) : effectivement 0,00 $ sur tout fournisseur.",es:"Nivel gratis (≤19 usuarios): efectivamente $0,00 en cualquier proveedor.",de:"Kostenlose Stufe (≤19 Benutzer): effektiv $0,00 bei jedem Anbieter.",it:"Livello gratuito (≤19 utenti): effettivamente $0,00 con qualsiasi provider.",pt:"Nível grátis (≤19 usuários): efetivamente $0,00 em qualquer provedor.",ru:"Бесплатный тариф (≤19 пользователей): фактически $0,00 у любого провайдера.",nl:"Gratis niveau (≤19 gebruikers): effectief $0,00 bij elke provider.",zh:"免费层（≤19用户）：所有提供商实际 $0.00。",ja:"無料プラン（≤19ユーザー）：どのプロバイダでも実質 $0.00。",ko:"무료 티어(≤19명): 모든 제공업체에서 실질 $0.00.",ar:"المستوى المجاني (≤19 مستخدمًا): $0.00 فعليًا على أي مزود.",hi:"मुफ़्त स्तर (≤19 उपयोगकर्ता): किसी भी प्रदाता पर प्रभावी $0.00।",bn:"বিনামূল্যে স্তর (≤19): যেকোনো প্রদানকারীতে $0.00।",pa:"ਮੁਫ਼ਤ ਪੱਧਰ (≤19): ਕਿਸੇ ਵੀ ਪ੍ਰਦਾਤਾ 'ਤੇ $0.00।",th:"ระดับฟรี (≤19 ผู้ใช้): $0.00 ทุกผู้ให้บริการ",vi:"Gói miễn phí (≤19 người): $0.00 trên mọi nhà cung cấp.",id:"Tier gratis (≤19): $0,00 di semua penyedia.",ms:"Tahap percuma (≤19): $0.00 pada semua pembekal.",tl:"Free tier (≤19): $0.00 sa lahat ng provider.",tr:"Ücretsiz katman (≤19): tüm sağlayıcılarda $0,00.",pl:"Bezpłatny (≤19): $0,00 u każdego dostawcy.",uk:"Безкоштовний (≤19): $0,00 у будь-якого провайдера.",ro:"Nivel gratuit (≤19): $0,00 la orice furnizor.",el:"Δωρεάν (≤19): $0,00 σε κάθε πάροχο.",cs:"Zdarma (≤19): $0,00 u libovolného poskytovatele.",sv:"Gratis (≤19): $0,00 hos alla leverantörer.",da:"Gratis (≤19): $0,00 hos alle udbydere.",fi:"Ilmainen (≤19): $0,00 kaikilla palveluntarjoajilla.",no:"Gratis (≤19): $0,00 hos alle leverandører.",he:"חינם (≤19): $0.00 בכל ספק.",sw:"Bure (≤19): $0.00 kwa mtoa huduma yeyote.",ne:"निःशुल्क (≤19): कुनै पनि प्रदायकमा $0.00।"},
};
function main() {
  const lines = fs.readFileSync(TRANSLATIONS_FILE, 'utf8').split('\n');
  const LANGS = ['fr','es','de','it','pt','ru','nl','zh','ja','ko','ar','hi','bn','pa','th','vi','id','ms','tl','tr','pl','uk','ro','el','cs','sv','da','fi','no','he','sw','ne'];
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    let matchedLang = null;
    for (const lang of LANGS) { if (line.match(new RegExp(`^  ${lang}: \\{`))) { matchedLang = lang; break; } }
    if (!matchedLang) { result.push(line); i++; continue; }
    result.push(line); i++;
    const existingKeys = new Set();
    let depth = 1;
    while (i < lines.length && depth > 0) {
      const bline = lines[i];
      for (const ch of bline) { if (ch === '{') depth++; if (ch === '}') depth--; }
      const km = bline.match(/^\s+"([^"]+)":\s*"/);
      if (km) existingKeys.add(km[1]);
      if (depth === 0) {
        const newEntries = [];
        for (const [key, translations] of Object.entries(M)) {
          if (!existingKeys.has(key) && translations[matchedLang]) {
            const escaped = translations[matchedLang].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            newEntries.push(`    "${key}": "${escaped}"`);
          }
        }
        if (newEntries.length > 0) {
          if (result.length > 0) {
            const lastLine = result[result.length - 1];
            if (lastLine.match(/^\s+"[^"]+": "[^"]*"$/) && !lastLine.endsWith(',')) result[result.length - 1] = lastLine + ',';
          }
          result.push(...newEntries.map(e => e + ','));
          console.log(`${matchedLang}: +${newEntries.length}`);
        }
        result.push(bline);
      } else { result.push(bline); }
      i++;
    }
  }
  fs.writeFileSync(TRANSLATIONS_FILE, result.join('\n'), 'utf8');
  console.log('Batch 9 done.');
}
main();
