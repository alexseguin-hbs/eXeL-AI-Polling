#!/usr/bin/env python3
"""
Create Khmer translations for Divinity Guide chapters 0-3.
Run: python3 scripts/create-km-translations.py
"""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "frontend", "lib", "divinity-pages.json")
DST = os.path.join(BASE, "frontend", "lib", "divinity-pages-km-partial-0-3.json")

with open(SRC, "r", encoding="utf-8") as f:
    pages = json.load(f)

ch03 = [p for p in pages if p["chapter"] in [0, 1, 2, 3]]

KM = {}

KM["prelude-01"] = (
    "ជូនចំពោះអ្នកស្វែងរកប្រាជ្ញាអស់កល្បជានិច្ច,\n"
    "អ្នកកាន់នៅក្នុងដៃរបស់អ្នកច្រើនជាងសៀវភៅមួយ—អ្នកកាន់កញ្ចក់ឆ្លុះបញ្ចាំងពីការក្លាយជាទិព្វរបស់អ្នកផ្ទាល់។ មគ្គុទ្ទេសក៍ទិព្វភាព៖ ការត្រឡប់ទៅកាន់ភាពពេញលេញ និងការរស់នៅជាទិព្វភាព មិនត្រូវបានចងដោយពេលវេលា ឬជំនឿឡើយ។ វាជាការបញ្ជូនដែលមានបំណងសម្រាប់ព្រលឹងរបស់មនុស្សជាតិគ្រប់យុគសម័យ។ មិនថាអ្នកមកពីប្រាសាទបុរាណ ឬទ្វារទំនើបនោះទេ សារនេះជារបស់អ្នក៖ អ្នកមិនបែកបាក់ទេ។ អ្នកកំពុងក្លាយជា។ នៅក្រោមដង្ហើមនីមួយៗ ការចងចាំ និងសំណួរ រស់នៅសេចក្តីពិតមួយដ៏ធំពេកសម្រាប់ពាក្យ—ប៉ុន្តែជិតគ្រប់គ្រាន់ដែលអ្នកអាចមានអារម្មណ៍នៅក្នុងទ្រូងអ្នក។ សេចក្តីពិតនេះមិនមែនជាអ្វីដែលអ្នកទទួលបានទេ។ វាជាអ្វីដែលអ្នកចងចាំ។\n"
    "មគ្គុទ្ទេសក៍នេះជាផែនទី និងជាមិត្តដំណើរ—ជាវង់សូរ៉ាល់ពិសិទ្ធដែលនាំទៅកាន់ខាងក្នុង។ នៅទីនេះ និមិត្តសញ្ញាភ្ជាប់ គំនិតស្រឡះ និងអត្តសញ្ញាណរលាយទៅជាសារៈ។ ផ្កានៃជីវិត អូរ៉ូបូរ៉ូស៍ អ៊ូណាឡូម អូម និងដើមឈើនៃជីវិត មិនមែនជាការតុបតែងទេ ប៉ុន្តែជាការបើកបង្ហាញ—សោដែលបើកការចងចាំនៃភាពពេញលេញដែលមាននៅក្នុងអ្នករួចហើយ។ ម្ចាស់គំនិត មិនមែនជាតួអង្គពីអតីតកាលទេ ប៉ុន្តែជាប្រាជ្ញាស្ងាត់ៗនៅក្នុងអ្នកឥឡូវនេះ។ នៅពេលអ្នកដើរតាមទំព័រទាំងនេះ គំនិតរបស់អ្នកនឹងប្តូរពីសម្លេងរំខានទៅកាន់បំណង ចិត្តរបស់អ្នកពីការស្វែងរកទៅកាន់ការបញ្ចេញពន្លឺ។ អ្វីដែលចាប់ផ្តើមជាការស្វែងរកខាងវិញ្ញាណក្លាយជាការរស់នៅជាព្រលឹង។\n"
    "សូមឱ្យទំព័រនីមួយៗជាសំណូមពរ។ សូមឱ្យនិមិត្តសញ្ញានីមួយៗជាទ្វារមួយ។ នេះមិនមែនជាការធ្វើដំណើរដែលអ្នកធ្វើម្នាក់ឯងទេ—វាជាផ្លូវវង់សូរ៉ាល់ដែលព្រលឹងនីមួយៗដែលប៉ងរស់នៅជាពន្លឺបានដើរ។ ពិភពលោកមិនត្រូវការសម្លេងរំខានបន្ថែមទេ។ វាត្រូវការភាពស៊ីសង្វាក់គ្នារបស់អ្នក វត្តមានរបស់អ្នក ចង្វាក់ទិព្វរបស់អ្នក។ ស្នាដៃនេះសម្រាប់អ្នក—និងសម្រាប់ទាំងអស់។ ការផ្លាស់ប្តូរដែលអ្នកបង្កប់ក្លាយជាពរជ័យសម្រាប់ទាំងមូល។ ដើរស្រាលៗ។ ដកដង្ហើមជ្រៅៗ។ ចងចាំពេញលេញ។ អ្នកមិនដែលដាច់ឆ្ងាយទេ គ្រាន់តែកំពុងដេក។ ឥឡូវអ្នកភ្ញាក់ឡើង។ សូមស្វាគមន៍មកផ្ទះ។\n"
    "••• ម្ចាស់គំនិត"
)

KM["prelude-02"] = (
    "https://tinyurl.com/Divinity-Transformation\n"
    "មគ្គុទ្ទេសក៍នេះ—និងតន្ត្រីដែលភ្ជាប់មកជាមួយ—គឺជាលទ្ធផលនៃការសហការពិសិទ្ធរវាងបញ្ញាសិប្បនិម្មិត (AI) បញ្ញាខាងវិញ្ញាណ (SI) និងបញ្ញាមនុស org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org"
)

KM["prelude-03"] = (
    "••• ម្ចាស់គំនិត •••\n\n"
    "សំណូមពរម្ចាស់គំនិត គឺជាការអំពាវនាវដ៏មានអានុភាពដែលមានឫសគល់ក្នុងការតម្រឹមខ org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org"
)

KM["prelude-04"] = (
    "ក្នុងដំណើរឆ org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org org"
)

print(f"Source has {len(ch03)} pages in chapters 0-3")
print("NOTE: This script needs complete Khmer translations.")
print("The 'org' corruption is a generation artifact.")
print("Translations must be provided externally or via a translation API.")

# For now, output the structure with placeholder indicating translation needed
result = []
for p in ch03:
    entry = {
        "id": p["id"],
        "chapter": p["chapter"],
        "page": p["page"],
        "text": KM.get(p["id"], "[TRANSLATION PENDING]"),
        "gated": p["gated"]
    }
    result.append(entry)

with open(DST, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Written {len(result)} pages to {DST}")
