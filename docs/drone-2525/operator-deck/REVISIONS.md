# Drone-2525 operator deck — revision register (append-only, reviewed like the Vision-2525 whitepaper)

One entry per carried `drone-2525_r.NNN.html` from r.128 on. An entry is never edited; a correction of an earlier
claim is a NEW line under a later revision that names the claim it corrects. `frontend/tests/drone-revisions.test.mjs`
holds every carried file since r.128 to an entry whose sha256 matches the bytes, holds README HEAD to the last entry,
and refuses a register whose earlier entries changed: `chain` = sha256(previous chain | rev | sha256 | bytes), recomputed row by row.
Nomenclature `v.00.00_r.NNN`; skipped numbers are never invented. Sizes in bytes (`new Blob([html]).size`, never chars).

| rev | date | author | bytes | sha256 | shipped in | chain |
|---|---|---|---|---|---|---|
| r.128 | 2026-09-19 | Grok + eXeL AI | 211344 | 6c26f43c052d68027952b139626aecf1d4b3171e1204cac54fc89da8f102ec8c | 2159671 (served; the r.130 row cited d195781 — corrected in the r.131 section below) | fc7480650848100badc8d62dfa8e509b212536c2616f9b1b08d332db3f66647b |
| r.129 | 2026-09-19 | Claude Code | 215379 | 7b1e0e51a31aa79c92211ac385e781452cc1c3d24899c118d6976b83ed2e8c7e | 8a54271 | 0b9539d90e05709195f2ab913bea0c0b25ae1ef0fe54b4f21242e824ec31188e |
| r.130 | 2026-09-19 | Claude Code (AsM fleet, autonomous) | 231517 | ce034c5e5c52aff539321f8a8895965317b7d406b8d1fcdb5aaef978a5bee99e | a83e670 (artefact) · 1ce5a3c (gates, register, research) | 7ab4f6dee17afcdb97610353f954e0e5e0dcd77343d87c9626252a85068a0ef4 |
| r.131 | 2026-09-19 | Claude Code (AsM fleet fold, autonomous) | 245877 | 700a51469e3e5ab174a851081aa555aa5201ff5a84a1b6a5f8f9aac1b347db54 | 9870031 (artefact) | ca5919226aea1b4785a4585432c38ecc217abc25e8988fbac2ab69888dc798f8 |
| r.132 | 2026-09-19 | Claude Code (usability walk + two-phone gate, autonomous) | 256197 | d48ec579e31a7dfd684b7b1148944de0dcfcbe42cc1ef10d662f584e22adadaa | 607f0a8 (artefact) | 758cb5d629629a8e559c7aa8f332ec1602f56926142b0da2433f564641ad1690 |
| r.133 | 2026-09-19 | Claude Code (38-AsM team-test fold, autonomous) | 262814 | d10ae69bc53d1a73845b69db2da7280e518aa31c41eb415b10160e1f608e0526 | fbdd78e → 4321f40 (artefact, final bytes) | 2d0ac8d264429638379149bcf8bf8da8e38555b4c33551c002f1cf2e78b43605 |
| r.134 | 2026-09-19 | Claude Code (wave-3 + 48-lens fleet fold, autonomous) | 276780 | 840cf55c6c0181503ff4417a1eff16f32825ba530a78eabd0d3744cd5a7d6aec | f2557ac (artefact) | dea8dbcdbe9b3ee72444eddc91cf9ab3ea543977ef827a2c6b2670f4cd0d5f9a |
| r.135 | 2026-09-19 | Claude Code (fleet-48 second-reviewer fold, autonomous) | 290674 | 882287ecc3e2abc6fbac5f41723ea3a7682497531052a2ab5ebf06fa5b18b97b | 2020c02 (artefact) | 933db1088d53c08324590a27fdd24ba4340a8ba2fbad0392074bb14bf0c9ff78 |
| r.136 | 2026-09-19 | Claude Code (fleet-48 synthesis fold, autonomous) | 292524 | 2bcd7a574e5044f72a1d4cb28a1a88d6b052e5cd5ba0a42b25b48f4f9e22820e | 543a86c (artefact) | ef31b289b6034dba2924974f4f8efc9248508fb909d401ed89adf44e41a27c3d |
| r.137 | 2026-09-23 | Claude Code (the range the operator described, after plan review) | 297506 | 8e3ef876699b5a0b93beed1c971c72b92eb6066ab167f564af4b62e87af31ddc | c0e57ea (artefact) | c8348351f6ad2481976877dff8c1c8a21901761287a56fe277c7a6f4c39f9e70 |
| r.138 | 2026-09-23 | Claude Code (true scale · labels · zoom law · magazine · full screen, after plan review) | 310828 | c8449d701799ff23acedf70e341aca5119ff7033281e01b7c3292d6b4168bd18 | 474e6a7 → c5995ce (artefact, final bytes) | ad1c508f2e7ddc6226eae71faf975817c49675841695c2203e387fe21d1d556f |
| r.139 | 2026-09-23 | Claude Code (landscape + portrait like Mission Planning, after plan review) | 313903 | e8b52069c3b2ec8e9adf6c4b773bb6ea00f37d32f0fb92dfc4ca9ea39693aa38 | 0f71961 (artefact) | c002c0e0b14fce8e6478c4c12216307d9e7d613341ef570709943071fb77cf52 |
| r.140 | 2026-09-23 | Claude Code (the dark green plates + the 25 m Alt-C sheet) | 322411 | 0f44f0d8bfd83c0e55cda9a77501d3e65ec3306cbbc4b75ab3da5c89da6cce7a | f0f9592 → 9d45dae (artefact, final bytes) | d0fdb1208117f5366895b36957434da88208bfe63fcc45cb5416706564f353c3 |
| r.141 | 2026-09-23 | Claude Code (life-size at 12 in · the 50s at the edges) | 324194 | d177187681613f8d61c70f6df2fe39efc667557989548bc3d12bbdf48c3daf14 | 1e8b2d4 (artefact) | 1cb42d37446afd4816818e3b46508cfb2fdbd5f5aac30fd3df39e34179cadb83 |
| r.142 | 2026-09-23 | Claude Code (reload by hand on QUAL · the same order as the actual test) | 326615 | 4c7d6ee31fa60573b0a75069290482dae67f91773e304b6c4173c6d55677c367 | 662f8e3 (artefact) | 29e9b8bff3fbe53012e7afe75f1267f40e7e7f512cf9aff19036b0843cdb2c3e |
| r.143 | 2026-09-23 | Claude Code (no horizon line · white bullseye, red near a target · LOCK under the pip) | 329471 | c4c187b415aebed148c8c0e0d2a2c4b45b85ae974aff9b79d815e1794a4f568d | a9c6360 (artefact) | dae08b70abb13e811236476e3f89ab6781fe005b0f7448411066ec1ef0119197 |
| r.144 | 2026-09-23 | Claude Code (the targets on each of the 42 lanes) | 330920 | 2ffd1288883d2e1d36319309f8cf67ff08d254d7e72d95624ebf93a948fd9433 | b2b64dc (artefact) | 2a5f36b60e972eeed00421a1c43b36cd182030b13b5b7dc0e1609823757ed593 |
| r.145 | 2026-09-23 | Claude Code (lane markers at 100 · 200 · 300 m) | 333517 | 3a2d43e22387a21837a04587cd392ca5e904600eb226c82dc299b10e0a62d817 | 8531339 (artefact) | a33146a145a84ae34bea03124ab307a178f837ff09ff4b66a730c4081b2ce755 |
| r.146 | 2026-09-23 | Claude Code (deferred QA rows decide on evidence) | 334257 | b3b17cbde2f49a145f995c7716261e679886c00d356c97a7af72446db43b64e3 | 5466050 (artefact) | bac705abb3a8e1885c0d413f46931f9ae9ba5f2ea1c815b843c5fc024ff2efe4 |
| r.147 | 2026-09-23 | Claude Code (LOCK is the target nearest the bullseye on the picture) | 338605 | 2476f68a8a8835e144aeaebcb3a4dd9143b8311214b7d568efc42ac397629eb5 | 7a7a2c7 (artefact) | e8ba39881ab3eda4fad54156261828a07a470b7052fc7f2c59d247d75fb742e3 |
| r.148 | 2026-09-23 | Claude Code (the eye outranks the mark — the 48-agent fleet's fold) | 348198 | 213a56fc08d41f510d325002d5152a05435803b6a95e18ba6874349e9e0c5b76 | 8ccab36 (artefact) | efa9e45b39f71fdc06e5c8f26ba80a7488224710a74ad6d919c1cf14216d9ace |
| r.149 | 2026-09-23 | Claude Code (a box only around the marked target) | 349698 | 20499eed97482ba229216c507e2b4494174ebf94bb95b81e1fd145361621d80a | 6b585bf (artefact) | 731c50160124c96c74841643ca0be8e6bed982850c6f1a6e25041f49ad738e3e |
| r.150 | 2026-09-24 | Claude Code (the fire gate reads the picture) | 364301 | e8d553ed035352b1cb3edc7271a07f4af6f1141295af26599dd94de0bd8a5920 | ec241fa (artefact) | d7982abe4c087736b792aed0ed97b753c0ca220a7dc37ed1d7b0a5217a1262cf |
| r.151 | 2026-09-24 | Claude Code (pop-up targets fire again) | 367557 | 3c4d297eec612261a699a899eea7efe489178fb3c6fd8784e50fb7f72b231020 | SUPERSEDED by r.212 (pushed, never served - Deploy #1890 failed on deck-rcore) | 1069141c979f4e412750c90d38445c32d357e0c4bc449f3db2cd19e23e86f959 |
| r.152 | 2026-09-24 | Claude Code (the full-screen control is an icon) | 368979 | e15cd3993aa378c958b9469831b87f50317ee98b47bdfcc112c11980c9e2eebd | PENDING (Verify Live) | 28e068d9d57b8ee6e2b42a697b95c0d65a0d0f577955895d5a51ff3daf78bb29 |
| r.153 | 2026-09-26 | Claude Code (the tab reads eXeL Drone-2525) | 368965 | 3c3de52165ea9138569c2901b5f1a9207ed3ab0a3cb0fd103c8c6fee8148b318 | PENDING (Verify Live) | 4e7b234595851c7538ced56f81165efa2c7442777e50ecc19be8bebbe699907e |
| r.154 | 2026-10-04 | Claude Code (the QUAL · 40 clock counts real seconds) | 370119 | ccb4fe73f3fe09b2fb12a3d3442cdba5569e2ab49f8586b11aaca84f08d7e467 | PENDING (Verify Live) | bd180f511f84e17460ef0c3018277f5a9a3e8ba36df36e53a78920ec3b11e342 |
| r.155 | 2026-10-04 | Claude Code (TARGET · APPROVE · FIRE beside the stick) | 376178 | 300ceb93683c2ea638f03794ec0a9dfe9d73bc51a84b5b05fe2cf7c465f8a3b4 | PENDING (Verify Live) | d7ac891a9a0821588036445638a81e894274c92f4567f1d7180e7189cff6d0bf |
| r.156 | 2026-10-05 | Claude Code (the hit splash starts at the target's centre) | 378675 | 92eb716a8bec23dffa111f523d5e5ca8e764cd0009c7c8571e33671fd75f6b4d | PENDING (Verify Live) | a9d63598383a7bdfad849a95fe533124a10aad24c0ade1d8bec79be6ecabcc5c |
| r.157 | 2026-10-05 | Claude Code (round 1 of 19: the splash at the bottom of the target, labels only while marked, mode · Restart · lane, boards on both edges, 15 m lanes, the lit next step, the start light) | 415943 | 5d65ee2b5af886040a8d4d58ae556a4107ae43a189463d6e55666602f33d5e68 | PENDING (Verify Live) | 4eeff8536a4badbb3589870c398f9e43d09b04a5fd86b53d211dbe60b9ea9453 |
| r.158 | 2026-10-05 | Claude Code (no grey phantom targets; the lane numbers on a real sign board; faded dotted lane lines sign to sign) | 419540 | 62f9fd1f0121c21da790d9f68713df2aa49b6ccca6f9b4f70a1694d2d15af37d | PENDING (Verify Live) | 040727fe8428286b54344773149a67d70dfe250519aedf1ba43ebe4573fcf604 |
| r.159 | 2026-10-05 | Claude Code (real-size white lane signs that never cover a target; PC keys and mouse) | 423674 | d30d2ca9d0cc9d05c22b1c98cebcb1072c3f963a6a8fb71f6a0a8d41766644cb | PENDING (Verify Live) | 2c1cdd94fffe718bb085d4b2fa5c0e156f57d0da08dd87f3b9f10190315218b7 |
| r.160 | 2026-10-05 | Claude Code (the lane signs readable: short numbers, black on white, ≥ 9 px) | 424082 | 1fbc365f84c43bb895289fed5f5d4343152cec4a8e49b6fb45ff3d5cf2398105 | PENDING (Verify Live) | a1f0236e5995ca44eedfc0b03fc2128dcc60a1ec11c7dc83ec3d23c916fb7787 |
| r.161 | 2026-10-05 | Claude Code (T marks what the bullseye is on; keys beat focus; a left click centres the bullseye on the target) | 428373 | 543ed59859ab6c17329cf082d5fd22d6cf3f3305eb85179ca1ae7c61c9121403 | PENDING (Verify Live) | 10ef6640d7e7f7b8cc213d7056eafea1965a11a0101b40abc15b47c1c3b02774 |
| r.162 | 2026-10-05 | Claude Code (QUAL timer + vertical light; marks remembered — mark many, approve each, fire only approved; R reloads) | 440719 | 10c900f74b9482ebfb7b5adc10fcee3b8e3330293ce040ac2ad711a7630cc46e | PENDING (Verify Live) | fea7fc43e6eeefd44f5faadabbe7ed447a35f4a0010695e0c0a092c0df06716b |
| r.163 | 2026-10-05 | Claude Code (T-numbers in marking order; approve and fire by number; the splash 0.3 s) | 446713 | a725cdbab0ffda175e071f5c12ef6441256b284fa59107c2d5dfd2f465e1c9a4 | PENDING (Verify Live) | 8d7ee3f4aed5eeca6e09480aaabeefec86c5520db3bdcf111af5e3f981be03e2 |
| r.164 | 2026-10-05 | Claude Code (Settings → VOICE: Browser · Vosk · My Voice; test and train my voice) | 460296 | 567f6ef3b983f8e9fc6084db88ed9fba37f39027dbde920a68aa82cc59e84d1a | PENDING (Verify Live) | d02b3b81ce1723f4a571881a80602c1e94d891e403f7247edf00fc8b7136f566 |
| r.165 | 2026-10-05 | Claude Code (reselect to approve by every door; no ring on a down target; TRAIN DOWN remembers marks) | 465812 | 76961252036595df49cb8c55b7cc0731b00a81375675b670015edda548cba822 | 4bb4a3f (ship; Verify Live green through e522b2b) — filled r.196 | 7f15dd33b49f06f569f7b6d3117d520f98779ba08dfb443a0da0c3871419cb6f |
| r.178 | 2026-10-10 | Grok (hand edit af6f65e0 — unregistered at the time; carried 2026-10-12 as the operator's baseline, "the last working version") | 531981 | d39875bec3f4e2c5e53a56c21c3e5095825691301582b634d7ac493ba30e8f66 | af6f65e0 (served by hand; the picture on his phone had a later layout — see the r.196 section) | e4a1cb08bfe54f89a5fd607fb4617f07a3e7f9ca717d56cd29a160a92aa3642e |
| r.195 | 2026-10-11 | Grok (hand edit 14a930d0 — unregistered; carried 2026-10-12 as the record of what was served with the gate red) | 547290 | 7b02aed71bc2e78b4f44e2edb033d8208e06cd82642c855c585ad827e6b408e1 | 14a930d0 (served through 8f9b354 with deck-consistency, drone-playable and traceability red) | d521f699c98fe66d2ac31988e504b9e850ae431823ea63ab67b31b8d45d85a63 |
| r.196 | 2026-10-12 | Claude Code (RESTORE: the r.178 base; every target TARGET → APPROVE → FIRE in every mode; plates at true size; the r0.178 picture; THE RANGE from the intro and the QR; the register caught up) | 542571 | aef96537d11a1a00cec97656fb1a7573f89a97122b963450f1d84bab1b5d48e6 | e8578ad (Verify Live #2723) | a90b136a8c648e3bae213833b06623e40997b78669d908f6fbae26dd4c7bf550 |
| r.197 | 2026-10-12 | Claude Code (TRAIN DOWN on the record: START raises the lane and opens the clock under the light; the last target stops it; START and TIME are decision rows) | 552240 | 1e6fd69cfe8368d14ebd3c107bf482654c0bafcac8e5896048d167913535057c | a089d8d (Verify Live #2725) | d952e0e7b2a5fb2cbeef8418c28fa05ac2f27661414b40385d3fc4ff11537ebd |
| r.198 | 2026-10-12 | Claude Code (QUAL: the five Table VI positions as high-resolution figures traced from the operator's TC 3-22.9 pages — the rifle in its own colour — on a card the magazine's height, one at a time, matched to the four magazines; the table ends cold on the record) | 676440 | d8cc52d45d2a7af2a5fba4c27f6dae3d57afe524560476b4fc7542c6fdfabc41 | a7f8678 (Verify Live #2728) | c59a03a3a15137dd4595aac6c8e670339a6bf73e4d88efe046f4d488ec7f457e |
| r.199 | 2026-10-12 | Claude Code (QUAL: the five positions are the operator's own eXeL AI picture, cut exactly — the tan figure, the dark rifle — on a square box against the stop light's left edge, his five words; the traced figures of r.198 and their tracer deleted; the light one width) | 806168 | a6664bfe507e4dfa08b89c5ad95a050214f45016ffe57cf18f09b4bec9aa8973 | 57525eb (Verify Live #2730) | 4409ae9ee7427be03b91c7196e2fab2d3c70d9339ba3604f96f621e83cccd571 |
| r.200 | 2026-10-12 | Claude Code (the magazine drawn as the operator's own r0.178 picture in both cards — the neck with the feed lips, the tapered body with the bend, the sloped floor, the window, the 3×4 grid; the round lines inside the body; the RELOAD card at his width) | 810838 | ff67ecfc0daf0cccb1978ab4256f33720be2cac5c713b8566fee6d05fe8ffa1d | 621a808 (Verify Live #2732) | d05fcfb078d63de1498c5e5d92d74ea8448bf35e9d3d025bdf1c755599fba0ae |
| r.201 | 2026-10-12 | Claude Code (the count magazine keeps its gold frame at every count — the rounds and the number carry the colour, as in the operator's r0.178 picture; each of the last rounds draws a line; the number at the word's size; RELOAD at his picture's spacing) | 813575 | 2b66093f883dc070675193e261821129fc03a7b04699a318cf61debb6b49abaf | f6264f2 (Verify Live #2736) | 9f661e89012f235bdbc121b97e75355c83d33b40497a57b2a933e604d04fe249 |
| r.202 | 2026-10-12 | Claude Code (the magazine row is the operator's three pictures: the RELOAD ink and the count's frame and fill as rasters cut from his images, the cards at his proportions, the light at his box's proportion, all four one height with the stance box; the SVG magazines gone) | 897037 | e8043bcbe138b6d0ba278b459fb26d315ee729af0518c755b897ea6d1a77e380 | b5f7592 (Verify Live #2747) | b070f2139e32a65011086177bcc4073a0a2ee8d7402dbc1145c0cfebd4e8d075 |
| r.203 | 2026-10-12 | Claude Code (the rounds as in his reference: the counter's frame and fill and the RELOAD ink cut from shot40 — nineteen distinct bars inside the walls, over the grid, below the window, one bar per round; the frame is the uncovered magazine (the RELOAD drawing in gold) under the bars — operator on the LIVE r.202: "rounds mist be in magazine") | 866859 | 00661e043b0d6a5e1147960389ec8e4736f07f3a6634a1b5d84cc138e3372a5c | 9c16873 (Verify Live #2756) | 7a0bbdfe36f1516c4600e6c73d539c991d72194afef247074772c5d713ffa4ef |
| r.204 | 2026-10-12 | Claude Code (the buttons follow the bullseye: in the solo modes the glass and the actions read ONE mark — the one under the bullseye: the lit button, the recital at the top left and the step toast name its step, FIRE lights only with the bullseye on the red (fireOnIt, fireN's own rule, in every mode), a tap turns the head onto the plate in every solo mode and the double-tap still fires what the first tap touched when the second lands on it (never on blank sky), APPROVE on an unmarked plate holds — so target all, come back and approve all, then fire all; no caption and no board's words cover a control or a line of the HUD, a caption is moved and a board's words climb the post (the post drawn on to them) before they are dropped — operator on the LIVE r.202: "buttons must change to step we are on") | 897902 | 2085cd150d08f886b4f8236ed8d8f3f60c2494b6608afed08c7260298039db9b | e5aec75 (Verify Live #2769) | a3053e970cd5462cae4c099118495225a397629373abbf52df230094322d307f |
| r.205 | 2026-10-13 | Claude Code (the glass tells the truth about every target: ONE painter — a target's silhouette wears its own step, amber targeted and red approved, the mist no longer overriding the phase; the lit button wears that colour too (APPROVE amber, FIRE red); the middle of the picture carries TARGETS ONLY — every per-target caption retired, the lane signs kept; an exposure's close downs every plate of its engagement, hit or not; the boot self-check borrows the range and gives it back as it found it — his words 2026-10-12 20:44 "remove all text from middle; targets only" and 21:05 "buttoms and colors around boxing amber vs red should match") | 913009 | 24d03765171b8e8df3b55ed78b0d40133cd3c76f42b26eed79bc555ee71d8665 | 1c78765 (Verify Live #2775) | 3a3da320dd334a20854ea25b6f1df9ac594589865772679ff35afe4038d1edef |
| r.206 | 2026-10-13 | Claude Code (no colour without a mark, and one meaning of "under the bullseye": a mark that ends takes its colour with it through every door; the box goes to the silhouette the bullseye is ON, never a nearer one beside it; on the map, where there is no bullseye, no button is lit; amber and red answer the same question about being on a target; the amber of a mark is used for a mark and nothing else — the twelve Masters' fleet, five defects left OPEN on the LIVE r.205, two re-verified on the shipped bytes before a line was written) | 924081 | fe10269f5c8691d83f417e4617ea59f6cc72f622c00239d7b460a49169219e38 | 7ec479d (Verify Live #2780) | 8ac6395f6cb65ced1e757b98ddc97c4b61fd3911af1c7c33af617dae5c89aa76 |
| r.207 | 2026-10-13 | Claude Code (the glass keeps its promises: a button that is dark does not act, a view with no bullseye takes nothing away from him, a mark that ends takes its colour with it through EVERY door including the one r.205 added, and a lane sign shows its whole number — shrunk on its own post where the picture is tight, never moved off it and never cut (his decision DD-21, "Shrink them at the edge"); the three QA legs that approved without aiming first now aim, as a player does) | 932061 | dc266e890693ce9daad5aa8b42a310cf8935b695ed23026f1891613b0c35ee8f | 9cfb412 (Verify Live #2785) | 0b90262369f270925eaf083cc3d6d28ba7ae883b04f77d8ba8d96909efcae382 |
| r.208 | 2026-10-14 | Claude Code (THE CAPITAL I — the Capitol is DRAWN: at the default fidelity the eight door targets took the whole segment budget and all 217 edges of the building were dropped, so the stage was black; the scene's subject is now painted outside that budget, the way his own lane is on the range, and its detail follows the fidelity dial while its presence does not. The outline is the sourced building — 172.67 × 88.09 m, the drum, the ribbed shell, the Goddess and her star at 92.24 m — with the south steps, the Great Walk at its true 25 ft, the allée and the north lawn as trees with canopies, the bounding streets and the rotunda's circle. The painter learned WEIGHT (hairline · normal · bold, one ladder, no fourteenth colour). SCEN · CAPITAL 42 opens the Capital. The range is untouched but for ONE deliberate close of r.207's own defect — goRange now hands the range's wave back after a challenge, so CH1 then CH0 no longer leaves it at phase static and no longer toasts PASS · MOVING TARGETS at the next quota hit — and `tests/range-frozen.test.mjs` holds the other 100 definitions at 0 moved, with goRange, mapCam and drawMap re-pinned under their own key with their reasons) | 958647 | fd620516e4c3e85f8783d52a6a60639a11e345e9039daf671541425bc5675510 | 17064d7 (Verify Live #2790) | 3cfced9324b39c39f1ee84757c1400b703eec9a513c82befcefd044e06cca0e1 |
| r.209 | 2026-10-14 | Claude Code (THE SHEET NAMES THE MAP: the QR share sheet headed LANE 21 · TURRET · TRAIN UP and never said which map the lane was on. He sent the same screenshot and the same sentence TWICE, so this is its own revision, built first and alone. The heading now leads with the map — THE RANGE · LANE 21 · TURRET · TRAIN UP, and off the range THE CAPITAL · TURRET 21/42 · TRAIN UP, where the seat is the station because the range parks those same 42 units and renames them LANE n. The link learns the map ADDITIVELY: a Capital station could not be shared at all, since ?range= means the lane, so it gains ?map=capital&station=, while the range's own return line is left BYTE-IDENTICAL — which is why drone-playable's pinned source text needed no re-expression and why Verify Live's own fetch of ?range=21&role=turret&mode=train-up is untouched. rungIsRange/rungWord/rungSeat land here as hoisted functions in the append zone so the map ladder of r.211 extends them instead of writing a second set. No frozen span is touched: tests/range-frozen.test.mjs holds 100 definitions at 0 moved) | 963108 | d7b139b02c4d1071cb86a22b62a3cf3f74aaee651578ef94682512ee7b401353 | 66dc166 (Verify Live #2795) | 79f23273db9c8219306f5030fd31323e7e82718e43697569c1a1162f57d7a271 |
| r.210 | 2026-10-14 | Claude Code (THE ICON AT THE BOTTOM OPENS THE HISTORY CHAIN: the deck was the ONLY 2525 surface with no R-CORE badge, no panel and no history - nine React surfaces mount the shared RCoreBadge, including the Drone ROUTE, so /main/Drone-2525 showed a Drone history and the deck he plays showed none. r.195 added a hand-typed five-row list and a fixed badge over the dock; r.196's restore removed both and the shared-format replacement was then deferred at every revision from r.196 to r.209 - thirteen times, my debt and not a new ask. Now: his own reticle raster at the bottom of the glass below TARGET APPROVE FIRE, his wordmark on the first press, the Version History and compare panel on the second, fed by docs/traceability/drone-2525.ledger.json through the revision before this one. The engine is a PORT of lib/2525-core/revisions.ts and lib/version-diff.ts, proven equal to the shared engine on the real 87-entry ledger by 756 assertions. The placement is MEASURED by placeRcore from the same rects placeFace measures - below the buttons where the deck leaves 72 px, beside them where it leaves 20 - and the badge joins hudKeepOut's one list so no sign or status line can land on it. One green gate was rewritten and is named: drone-playable's literal ban on a fixed badge becomes the measured row RCORE_NEVER_COVERS_THE_PICTURE, because the deck has no flow slot at the bottom and using one would shrink his picture by 54 px. No frozen span is touched: tests/range-frozen.test.mjs holds 100 definitions at 0 moved) | 1144501 | 62fae4bd572a7dc3bbf729f8e1ee1636a0e427dc3c4bff9b2f463291e3350b3f | e8b4999 (Verify Live #2807) | 79911342f5fed3268609e608427d841ec9c3eef717f56eb5bd7abb3bce3e9410 |
| r.211 | 2026-10-15 | Claude Code (THE SHARE SHEET IS HIS PICTURE AGAIN - and the regression was MINE, at r.196. He reported it twice, the second time with two screenshots: "I still do not see why you regress; use image 2 formate for the range". Traced with git log -S: the polished sheet was added in 12962de77 during the r.183-195 wave and removed by a18880daf, my own r.196 artefact, because r.196 rebuilt the deck from his r0.178 base to fix the targets and r0.178 predates the sheet. r.209 then wrote the map name into the front of the plain sheet's one-line heading, which on his phone wraps and prints across the magazine cards on a 78-percent opaque ground. No gate noticed, because NO GATE MEASURED WHAT THE SHEET LOOKED LIKE. Restored: the opaque #05080c ground, the map as a 28 px cyan heading, the seat and programme italic beneath it, the hint line, the filled Copy Link pill, the plain white close. DD-48 is answered BETTER by his format - the map is not first in a string, it IS the title. rungWord is left exactly as r.209 wrote it because the boot row pins it; rungTitle, modeWords and rungSeatTitle are twins beside it. The .html in the link is deliberately NOT restored to his image's form, because verify-live fetches it. THE_SHEET_NAMES_THE_MAP was rewritten and then sabotaged three ways to prove it can still fail - translucent RED, caps heading RED, missing subtitle RED - the first two being exactly the states that shipped. No frozen span moved: 100 definitions at 0) | 1146630 | 7fa96ff7011484e124046731da6b43f67f9b4d12cd43617af5c044d654cf0bd5 | PENDING (Verify Live) | 4c7ec88b625621bb961eac28113e4af3404dc13ae2078d97d7824a29955f5012 |
| r.212 | 2026-10-15 | Claude Code (THE RECORD THE DECK CARRIES IS CURRENT AGAIN - and that is why his sheet was still not on his phone. He asked a THIRD time, "I still do not see why you regress; use image 2 formate for the range", and his screenshot's own corner reads r0.210: he was never looking at r.211. r.211 was correct and pushed and NEVER DEPLOYED. Deploy run 1890 on 689a4a4e9 is conclusion failure - its gate job died at the headless suites in 77 seconds, ship was skipped, and because the deck gates run in prebuild since r.196 the Cloudflare build fails the same way, so the site stayed on df76efa and Verify Live 2820's poll was never going to find r.211. The failing line: the deck carries the record through rev 87, the file is exactly one entry longer (lag 2). deck-rcore 91 passed 1 failed. THE OMISSION IS MINE: r.210's patcher REGENERATED the embedded RCORE_LEDGER from the ledger at build time; r.211's patcher never touched it, its only mention being the regex that STRIPS it before the code assertions. So the deck kept through 87 while the ledger grew to 88 and then 89. AND I REPORTED IT GREEN - the r.211 commit message says deck-rcore 92/0 where the shipped bytes give 91/1, because r.211 was run ad-hoc instead of through a chain script and that gate was run against the r.210 state, before the bookkeeping bumped DECK_REV and appended rev 89. A gate run before the bookkeeping is a gate run on a different revision. r.212 regenerates the record through rev 89, and r212-execute.sh re-runs every deck gate AFTER the bookkeeping against the exact bytes commit B carries, refusing on any non-zero exit. r.211's share-sheet restore rides along untouched: shipping r.212 is what puts his image 2 on his phone. No frozen span moved) | 1155736 | 604f158dc207dcd013bd1984723d2ce3ffa03f94ae267728399f0a0fff6a2e87 | 8e2fc73 (Verify Live #2822) | c7a6489b2c00084109ddac24cbcb6921e2ef9580ce531bbc59935a007d20076e |

## r.128 — Grok + eXeL AI (blue/red revisions; the LOBBY)
- The Blizzard-style multiplayer lobby with a 6-digit team code + opaque seed id per team, rotate lock, roster,
  readiness, `canLaunch` refusal order; LIGHT-4 keyed codex; host SEQUENCER (sessionSeq, provisional events,
  Lamport clock, `sessionOrderKey`); the 50 m RANGE from r.122 (42 lanes, Alt-C silhouettes at true metres,
  PRACTICE UP / STAY / QUAL 40, ASM_QUAL40 fixture); WALLS/WATERS; in-file QA 55 rows.
- Served as the playable at `/drone-2525/play.html` byte-identical (R-CORE: the best solution ships regardless of
  which AI wrote it). Repo lifts (no rework): `lib/2525-core/lc4.ts`, `lobby.ts`, `random.ts`; proofs
  `tests/lobby-2525.test.mjs` (38), `tests/sequencer-2525.test.mjs` (13).
- Honest open items at r.128: two real phones for HOST/JOIN → same hash; endurance soak; 9v9 locked until
  1v1/3v3 qualify on live transport; the range had "no aim/ballistics test" (its own comment).

## r.129 — Claude Code (operator items of 2026-09-19)
- `phys` moves the body along the airframe heading instead of the pilot camera's forward (the camera folds the
  gimbal pan in), so a head panned behind no longer reverses the body; bullseye (rings + centre tick, T13.SI) on
  standing pops and doors; once HIT the T## slot clears with the box (keyed on the designation's own slot); in a
  LIVE room the red box needs two separate humans (decided by seated identity, because `applyWorld` rewrites a
  local designation to `how:'PEER'`). QA rows `BODY_FWD_PAN180`, `HIT_CLEARS_SLOT`, `LIVE_TWO_HUMANS`,
  `LIVE_PEER_APPROVES`; 59 rows, headless 58/59 (`SYNC_DIRECT` FAIL by design on one device).
- Repo: `tests/drone-playable.test.mjs` re-pointed (byte-identity, < 7.77 MB in bytes, the r.129 regexes).
- **Claim made at r.129 that r.130 corrects:** "forward-goes-reverse fixed at its class". It was not. r.129 fixed
  the pan-folding sub-case only; at pan 0 the body still moved AWAY from what the screen showed, because the
  camera vector and the projector disagreed by 180° (see r.130). The r.129 QA measured displacement along the
  vector, which was the wrong side of that disagreement.

## r.130 — Claude Code, AsM fleet in autonomous mode (operator 2026-09-19: "make sure range with turrets actually works")
- **Found on the served r.129 by a read-only probe before any change:** from the pit, looking downrange, the projector
  culled all ten silhouettes; every aimed shot 50–300 m was a MISS; LOCK named a buoy; turned 180° the plates appeared.
  Cause, the class: `camOf` said forward = (sin yaw, −cos yaw) while `proj` draws forward = (−sin yaw, cos yaw). The
  same disagreement made QUAD/VTOL move AWAY from the point on screen under left-stick forward (59.4 → 68.3 m).
- **One forward basis** (`fwdOf`/`rightOf`/`yawTo`, derived from the projector): `camOf`, `lockOn`, `phys`, all five aim
  sites and the QA read it. The range pit parks at yaw 0 and faces its plates. QA `PROJ_FWD_AGREES`,
  `FWD_IS_WHAT_YOU_SEE_{D1Q,D1,R2}` (distance to the point at screen centre DECREASES under L-up — the invariant in
  picture terms), `RANGE_SEES_PLATES` 10/10, `RANGE_LOCK_PLATE`.
- **Pop-ups per lane at various distances:** plates DOWN by default; `rangeTick` raises one at a time per lane in a
  seeded per-lane order (`mulberry32(2525+lane)`), for 3 s at 50 m … 8 s at 300 m (FM 3-22.9 record fire, see
  `docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md`), 1.5 s gap. Hit → falls; lapsed → drops.
- **Three modes, the operator's names, on the existing `rangeMode`:** TRAINING · RESET (`bounce`, a downed target
  comes back on its next exposure) · TRAINING · DOWN (`stay`, stays down until RESET) · QUAL · 40 (`qual40`, timed
  tables I/II/III = 20/10/10 exposures; a lapsed exposure is an UNFIRED MISS round; 23/30/36). QA
  `MODE_RESET_RETURNS`, `MODE_DOWN_STAYS`, `MODE_QUAL_TIMED`.
- **Scale-true hit test:** a silhouette is hit when the pip sits inside its projected outline (CIRCLE inside the aiming
  circle, else SILHOUETTE), 6 px floor shown on the HUD; the old constant 32 px rule is gone for plates. QA
  `RANGE_HIT_50`, `RANGE_HIT_300`, `RANGE_MISS_300_OFF20` (the old rule scored it a hit), `RANGE_HIT_50_OFF10`.
  None of these rows use `simDirect`.
- **Sheet 9127 layout:** 50 F · 100 F ×3 (C-100C new) · 150 E ×2 · 200 E ×2 · 250 left · 300 right; table III cap
  covers C-100C. QA `ALTC_LAYOUT`.
- **Latent deck defect fixed at the class:** the reducer rebuilt every designation as `kind:'obj'` and dropped WHO
  marked it — so at CH0 `fireN` routed a designated plate down the bull-ring path (shooting BULL-1), and the r.129
  identity-based two-humans rule could never see a peer's identity. Now `kind:kindOfRef(target)` and
  `by:row.peerId`. Exposed silhouettes get a hairline screen bracket + seconds left; a turret never locks a buoy;
  the map prints every 7th lane label plus the seated lane ±2 (the label soup is gone).
- **Two render defects of r.128/r.129 the probe exposed, fixed at the class:** `bullseye()` (r.129) referenced `draw()`'s
  local `segs` from top level and threw on every frame; the loop's `try/catch` hid it, so nothing after the doors —
  pops, silhouettes, T-boxes, the HUD — was ever drawn while '0 page errors' stayed green. Now `segs` is passed in,
  the loop RECORDS a render exception (`state.drawErr`), and a deferred QA row `DRAW_COMPLETES` reads whether frames
  ran to their last line. And at MoT 1.1 the 42-lane range wire (601 segments) spent the whole 280-segment budget
  before any silhouette was drawn (r.128 too): the lane's exposed silhouettes now take the budget first and pit boxes
  draw only for the seated lane ±1 at MoT 1.
- In-file QA 75 rows, headless **74/75** (`SYNC_DIRECT` FAIL by design on one device), 0 page errors, 60 fps.
  Repo gates: `range-2525` (64), `drone-playable` (33, re-pointed), `drone-revisions` (this register).
- **Corrects r.129:** "forward-goes-reverse fixed at its class" — r.129 fixed only the pan-folding sub-case; the class
  was the basis disagreement above. Still open, honest: two real phones for HOST/JOIN → one hash; endurance soak;
  a perf run (SSSES Scalability/Efficiency stay unmeasured until it exists).

## r.131 — Claude Code, the fleet fold (24 reviewer lenses on r.130 → `docs/assessments/2026-09-19_r130_fleet_review.md`)
**Corrections of the record (new lines, the old rows stand as written):**
- The r.130 row cited `d195781` as r.128's shipping commit; that commit carries no deck. r.128 was carried and served by
  `2159671`. (lens 11A/11B)
- The r.130 section said `range-2525 (64)` and `drone-playable (33)`; the gates reported 65 and 35 at that commit. (11B, 9B)
- The r.130 README said "33 asserted exact patches"; the artefact commit said 44. Both were true of different builds of the
  same evening; the patcher scripts were not committed. From r.131 the patcher is carried: `docs/drone-2525/operator-deck/patches/`.
**What changed (each item names the lens that found it and the QA row that now holds it):**
- The scenario/challenge pickers no longer defeat the range: picking CH0 keeps the bull ring DOWN (it re-aimed and raised it,
  so every shot scored BULL-1 — 10B); the first pick of "50M RANGE" seats a turret (mode stayed `range`, slot keys chose
  Capitol doors — 10B/2B). Rows `TARGETN_HITS_THE_EXPOSED_PLATE`, `RANGE_LOCK_PLATE`.
- **One exposure, one round; a target that goes down takes its box with it.** `applyHit` refuses a plate that is not UP, not
  falling, and the lane's current exposure (`TARGET DOWN · WAIT FOR THE NEXT EXPOSURE`); in QUAL·40 a second pull in the same
  exposure is `ONE ROUND PER EXPOSURE`; a lapse after an engaged exposure charges nothing; `rangeRelease` clears the
  designation/slot on hit or lapse; a miss keeps red for this exposure but never re-arms the CH5 second authority; plates are
  never resurrected. (2A/2B/3A/3B/4A/4B/6A) Rows `ONE_ROUND_PER_EXPOSURE`, `LAPSE_RELEASES_THE_BOX`, `MODE_RESET_RETURNS`
  (now observes the SAME plate returning, 64.8 s later), `MODE_QUAL_TIMED` (+ `qualH===0` + a LAPSE event).
- **QUAL·40 fits its own clocks and can reach 40:** table clocks 142/75/75 s (DECLARED: exposures avg 5.2 s + 1.5 s gaps + slack;
  r.130's 120/60/60 could not fit their own exposures — 4A/4B); a table exposes only plates it can score (table III: 50/100/150);
  only a silhouette is a qualification round (never the bull ring); never a 41st round; the HUD shows per-table hits/rounds of
  lim, time, total and lapses; LAPSE and QUAL table advances are canonical events; the qual block is in `pack()`. Rows
  `TABLE_III_EXPOSES_ONLY_SCORABLE`, `QUAL40_TABLES` (re-based).
- **The basis, finished:** `camOf`'s seat offset rides `fwdOf/rightOf` (it still used the old inverted forward — 1A/1B);
  Capitol ring turrets face the Capitol; `mapCam` uses `fwdOf`; ONE `aimUnitAt` (camera eye, centre of mass, ±180 wrap) for
  every aim site (auto-aim was 1.8° high at 50 m); ONE `worldOf` for the T-box, world box, pick and lock cone (a plate's box
  was drawn up to 205 m from its silhouette — 1B/2B); tap-to-designate sees the range; double-tap fires only on the red box
  itself; voice has APPROVE and never fires on "hold/cease/stop"; the turret look goes through the control law (deadzone,
  sensitivity, trim, arrows) and is scaled by zoom; the seat/lane change starts clean and pre-aimed. Rows
  `PIT_SEES_300_RIGHT_250_LEFT`, `PAN_RIGHT_MOVES_WORLD_LEFT`, `FWD_AT_YAW90` (the rows 1B/8B said were missing — picture terms, non-zero yaw).
- **The picture on a phone (7A/7B/10A/10B):** what you must hit takes the segment budget before the world on EVERY channel
  (`drawTargets` before `WIRE.g`; the swarm capped by remaining headroom; pit boxes near my lane at MoT ≤ 2; the wing
  declutter names fixed); no lake craft or swarm on the range; ONE caption per exposed plate (`T1 · 100M F · 4s · RED`,
  clamped to the canvas), no third label, the T-box never smaller than 16 px; LOCK moved clear of the kebab button; the FPS
  text off the HUD line; the HUD line reads mode · HIT n · MISS n (and ALL DOWN · RESET); a RESET button (TRAINING·DOWN
  "stays down until RESET" had no RESET); the pip floor is ANGULAR (3 mrad, min 3 px — the same standard at every zoom and
  screen size; DECLARED).
- **Evidence honesty (5A/5B/8A/8B/10A):** the reducer applies HIT (downs the plate on every peer), MISS and LAPSE rows; the
  band is on the record (`HIT CIRCLE`); the batch labels every trial SIM and never broadcasts; boot QA snapshots and restores
  events/decisions/scores, mutes the link, and leaves no designation on the first screen (the phantom red `QA-BULL` box a
  stranger saw first — 10A); a QA that throws is a red row, never a blank panel; the deferred `DRAW_COMPLETES` row is printed
  and guarded. Rows `REDUCER_HIT_AND_LAPSE_DOWN_THE_PLATE`, `QA_LEAVES_NO_TRACE`.
- **The approve record tells the truth:** `how`/`sameDevice`/`samePerson` derive from whether ANOTHER seated human marked the
  target, not from the literal `'HI-2'` (every approval said SOLO — 6B); the spiral self-test refuses in a LIVE room or over a
  live box.
- In-file QA **84 rows** (+9), headless **83/84** (`SYNC_DIRECT` by design), 0 page errors, 60 fps. sha256 `700a51469e3e5ab1…`.
- **Repo (same evening, next commit):** ONE `tests/deck-head.mjs` names HEAD for every deck-reading gate (sequencer/lobby now
  lift from HEAD, not r.128 — 9B); `scripts/drone-deck-qa.mjs` runs the deck's own rows in headless Chromium in CI against a
  checked-in row manifest with set equality and a tight red-list (12A); Verify Live probes `play.html` for the revision
  (12B); the PLAY button says the served revision (12B).
- **Deferred to r.132 (a lobby/transport change, not a range change):** the wire path bypasses the two-humans gate — net
  APPROVE has no gate, SNAPSHOT imports red and never restores LIVE, a peer DESIG never writes a slot and can jam a
  foreign-lane box onto my device, six ambers coexist but only the newest is approvable (6A/6B/9A); the range has no
  canonical clock between peers (9A/5A); the reducer applies in arrival order while the hash sorts (5A).
- **Still open, honest:** two real phones for HOST/JOIN → one hash; endurance soak; `dt` is clamped so a slow device runs the
  range slow (2A); the shell's CH0 and the deck's CH0 are different games and the PLAY link passes nothing (12B); the register
  chain covers rev|sha|bytes only (11A/11B) — widening it re-bases every chain value and is a decision for the operator.
- **To verify tomorrow:** open `/drone-2525/play.html`, pick SCEN · 50M RANGE, watch a silhouette rise with its caption,
  TARGET → APPROVE → FIRE; then `cd frontend && npm run test:drone-deck-qa && npm run test:drone-playable && npm run
  test:drone-revisions && npm run test:range-2525`; `sha256sum -c docs/drone-2525/operator-deck/HASHES_r131.sha256` from the repo root.

## r.132 — Claude Code: the wire path obeys the same rules as the buttons; two phones, one hash
Operator ask (verbatim, hashed): `docs/asks/2026-09-19_usability_asm_team_test.md`. Findings that drove it: the usability walk
by real clicks `docs/assessments/2026-09-19_r131_usability_walk.md`.
- **Two phones, one hash — reached.** A real-click walk in two ISOLATED browser contexts over a WebRTC data channel (no shared
  tab channel): host offer → joiner answer → DIRECT → team auth → READY 1/1 → START → LIVE on both; the host marks, the mark
  reaches the joiner as the same slot by the host; the host's self-approve is refused `TWO HUMANS`; the joiner approves; red
  on both as `PEER HI-2`; the host fires, HIT, the box clears on both; **replay hash `ee5ef022` on both, MATCH on both.**
  Promoted to the repo as `frontend/scripts/drone-team-e2e.mjs` (`npm run test:drone-team-e2e`), a Deploy step.
- **What had to change for that to be true:** a peer's mark lands in a slot with its author, honours the lane guard and never
  overwrites a red box (`peerDesig`); a peer's approval needs an amber mark and, in a LIVE room, a seated human other than
  the marker (`wireApprove`, used by the reducer and by the receive path alike); a snapshot hands over amber, never red,
  never an approval, and keeps LIVE (`importSnapshotDesig`); `approveDesig(who, slot)` and `fireN(n)` honour the slot (six
  ambers, six approvals; `T4 IS NOT THE RED TARGET`); a HOLD/REJECT decision travels as its own canonical row — the walk
  found the host's refused self-approve missing from the joiner's hash; a tab message never downgrades a live DIRECT link.
  QA rows `PEER_DESIG_TO_SLOT`, `WIRE_APPROVE_TWO_HUMANS`, `WIRE_APPROVE_NEEDS_AMBER`, `FOREIGN_LANE_MARK_NOT_MY_BOX`,
  `PEER_MARK_NEVER_OVERWRITES_RED`, `FIRE_SLOT_MISMATCH_REFUSED`, `SNAPSHOT_NEVER_RED`, `HOLD_ROWS_TRAVEL`.
- **From the usability walk:** boot QA leaves no last shot on the first screen; a tap on the marked target keeps its phase
  (double-tap-to-fire works as documented); `MISS` is a miss and a lapsed exposure reads `LAPSED`; the MORE menu works (it
  had NO handler — the AsM seat, RELINQUISH and T prev/next were unreachable on every device); the AI member sees the
  exposed silhouette at CH0 (`ASM_SEES_THE_RANGE`).
- In-file QA **93 rows**, headless **92/93** (`SYNC_DIRECT` by design on one device). sha256 `d48ec579e31a7dfd…`, 256197 B.
- **Still open, honest:** the range has no canonical clock between peers (each phone runs its own exposures from `dt`; the
  hash matched because both peers scored the same event rows, not because their silhouettes rose in step) — the next
  R-CORE step for 3v3; the reducer applies in arrival order while the hash sorts (5A); two real phones on a real network
  (the walk used two contexts in one headless browser: real WebRTC, real ICE, no shared state, but one machine).
- The offer is ready 1.5 s after the first host candidate (8 s cap): a phone with no internet no longer waits out the STUN
  timeout (40–90 s in the walk) to pair over WiFi.
- **To verify tomorrow:** `cd frontend && npm run test:drone-team-e2e` (about 15 s), then `npm run test:drone-deck-qa`; on two
  phones: WAITING ROOM → host CREATE HOST OFFER, share the text + the other team's 6 digits → joiner JOIN OFFER → return the
  answer → host APPLY → both READY → START.

## r.133 — Claude Code: the 38-AsM team-test fold (26 seats played the served r.132 by clicks; `docs/assessments/2026-09-19_r132_asm_team_test.md`)
- **The AI member was dead code in live play.** `asmTick` was defined, exercised by a boot QA row, and never called from the
  frame loop — so `AsM SPOT` marked nothing on any device while its gate read green (the gate called the function itself). Now
  ticked from `spawn`; on the range it sees ONLY the seated lane's exposed silhouettes (a nearer lawn pop-up used to win `best`
  and then fail its own 80 m gate), measures from the seated pit (its own mount can stand 300 m from the lane), and **fires only
  on a red box** — a named human approved — once per box, through `fireN` (the r.132 branch downed the target on AMBER with no
  APPROVE and no record). `AsM OFF` is the default; the cycle is OFF → SPOT → FIRE. The reducer keeps the author `designate()`
  wrote (the AI's mark was re-stamped with the human's id). QA `ASM_TICKED_LIVE`, `ASM_SPOTS_FROM_PIT`, `ASM_FIRE_NEEDS_RED`.
- **The score was clipped exactly where it mattered.** `#playHud` was nowrap + overflow hidden: at 320–390 px the HIT/MISS/
  LAPSED count, the QUAL·40 clock and TOTAL, and the terminal `ALL DOWN` were off the phone. The strip wraps; the score has its
  own line; `hudScore()` is the one writer and runs the moment a hit, miss or lapse lands (the strip lagged the toast by a frame).
  QA `HUD_SCORE_WRAPS`. Desktop: the side panel now sits in the strip the stage reserves for it instead of on the picture.
- **The approver never learned the outcome.** The joiner's HIT stayed 0 and its red box stayed on a dead target — the peer's
  HIT row downed the plate but neither tallied nor released. A HIT/MISS row from the other seat now tallies here and takes the
  box down with the target (`THE OTHER SEAT HIT · <id>`). QA `PEER_HIT_TALLIES_AND_CLEARS`.
- **One sentence for an empty range** (key 1 said `NO T1`; the button and voice said `ALL DOWN · RESET`) — QA
  `EMPTY_RANGE_ONE_SENTENCE`. **No lapse counts before the round starts** (54 lapsed behind the intro; 1 in every waiting
  room) — QA `RANGE_IDLE_BEFORE_START`. TARGET aims the head at the mark (a red box 130 px off the pip read as a refusal); a
  peer's mark turns the approver's head to it (the box was off the joiner's screen). A hit target leaves the lock and its
  caption at once. LOCK is aim, drawn in the aim colour. A refusal names the next action; a long toast stays up to be read;
  the joiner's toast for the host's refusal says whose it was. `DOWN DIRECT` → `DOWN`; `HIT · CIRCLE` → `IN THE AIMING CIRCLE`;
  `SCEN · RANGE 50-300 M`; `TEAM SECRETS` (the joiner's panel said HOST).
- In-file QA **100 rows**, headless **99/100** (`SYNC_DIRECT` by design on one device).
- **Still open, honest:** the range clock between peers is per-device (r.132 note stands); the joiner cannot complete an unaided
  join because the RED code is shown nowhere (`ROOM_PRIVATE_CODES` — an operator decision); a joiner's qual counters do not
  move from remote hits (the tally covers HIT/MISS/LAPSED, not the qualification tables); the CH5 "second authority" overlay is
  superseded by the two-step (a PEER approve already is the second human) — documented, not a defect; two real phones.

## r.134 — Claude Code: the fold of team-test wave 3 (12 seats) and the 48-lens fleet review (12 lenses × A/B reviewers + synthesis)
Record: `docs/assessments/2026-09-19_r132_asm_team_test.md` (waves 1–3, D1–D22) and `docs/assessments/2026-09-19_r133_fleet48_review.md`.
- **Authority has ONE consumer** (Thor A). The red box was a stored bit that outlived a scene change, a mode change, a reset and
  its own approver. `releaseAuthority(why)` is the only path that drops it, and it writes a HOLD row; a scene change, RESET, a
  lost approver and a dead target all go through it. The CH5 popup — a second approval primitive with no author, no two-humans
  rule and no wire row — is gone: a red box whose approval was spent asks for a fresh APPROVE. A door tag is on the record and
  consumes the box (it fired N times on one approve with no row). A dead target cannot be marked or approved (judged on the
  marker's device; the range clock is still per device). QA `AUTHORITY_HAS_ONE_CONSUMER`, `NO_MARK_ON_A_DEAD_TARGET`,
  `NO_APPROVE_ON_A_DEAD_TARGET`, `LOST_APPROVER_IS_SAID`.
- **The record tells what happened** (Asar A, s33). RESET and a mode change are canonical rows that travel to the peer and ask
  before discarding a live table; a training-mode lapse is said and is a row; the AI member is an actor — `ASM@<device>` on its
  DESIGNATED and HIT/MISS rows, `HI OVER AI` when a human approves its mark, never held for "two humans" (Pangu A: the AI used
  to sign as whichever turret the loop reached first, and a peer could second-human its mark). QA `RESET_ON_RECORD`,
  `ASM_IS_AN_ACTOR`, `ASM_NEVER_MARKS_DEAD` (the second turret re-marked the plate the first had just downed, s38).
- **The link has a heartbeat** (s35). Twelve silent seconds, a failed connection or a closed channel → `DROPPED · 1p`, one
  sentence, and a peer-approved red box goes back to amber with a HOLD row. The strip read `DIRECT · 2p · MATCH` for 48 s after
  the other phone was gone.
- **VOICE reports the outcome** (s36): the recognizer's error turns the button OFF and says why; a second press always turns
  it off; a negation is heard before consent ("don't approve" used to approve); the lone spoken "f" no longer fires. **MAP keeps
  the strip** (s28). **Keys ignore text fields and the intro** (Thor A: typing a room code marked a target and sent it down
  the wire). **A row signed as nobody, or forged as me, is refused** at the wire.
- **The stranger** (Athena A): refusals are drawn ABOVE the intro (they were under it, z 6 vs 40); the first sentence names
  the next tap ("NOW PRESS APPROVE" / "WAIT FOR THE OTHER SEAT TO APPROVE"); a lapse says "MARK THE NEXT ONE"; the host's card
  shows the other team's six digits with one sentence (the unaided join was impossible — s23, Christo A). HAL/MoT changes say
  so; the replay bar is reachable from MORE on a phone and PLAY plays; the desk stick leaves the panel; the pip floor is on the
  HUD line; one revision string (UPDATES / BOOT / FIXTURE labels no longer carry other revisions).
- **Repo** (Enlil A, Krishna A): the two-phone gate now RUNS in Deploy (`npm run test:drone-team-e2e` after deck-qa) and reads
  the approver's PICTURE (strip `HIT 1`, toast `THE OTHER SEAT HIT`), not only state; `tests/deck-consistency.test.mjs` holds
  ONE HEAD across the register, README, domain JSON, ledger, HASHES and the carried patch (the domain JSON sat two editions
  behind, green — 0.017/0.018 entered for r.132/r.133); Verify Live compares the served body's sha256 to the register row
  (a stale edge can carry the same revision string); the patcher's paths are relative to itself.
- In-file QA **110 rows**, headless **109/110** (`SYNC_DIRECT` by design on one device).
- **Corrections on the record:** (1) the r.132 section says the two-phone gate was "a Deploy step" — it was in no workflow
  until r.134 (Enlil A). (2) The assessment's D18 says MAP "stops the AI tick and the slew" — `spawn()` runs before the map
  return, so the AI kept marking and the seated head kept turning while the picture was hidden; MAP froze the STRIP only
  (Pangu A, Asar A). (3) CLAUDE_CODE_NOTES_r133 names HEAD `drone-2525_v.00.00_r.133.html`; the carried file is
  `drone-2525_r.133.html`.
- **Still open, honest:** the range clock is per device (a peer's plate can be down where it is up on the shooter's; r.135's
  first item — an EXPOSE row from the host); the reducer applies in arrival order while the hash sorts; the hash's identity
  columns (SID, eventId, orderKey, beacon-driven logicalClock) make the same play a different hash per load — peer-agreement
  only, by design, said here; SSSES pillars other than efficiency are labels; the DATA panel is the machine's panel with no
  operator door (Sofia A: a word gate and `?diag=1` are r.135); QUAL table clocks run on frame time, not wall time (a hidden
  tab pauses the table); the dock FIRE sits under the R-HEAD stick at 320/390 (Enki A); SAVE is four downloads from one tap;
  3v3/9v9 stand on a single-peer link; two real phones.

## r.135 — Claude Code: the fold of the fleet's SECOND (adversarial) reviewers on the r.134 candidate
Record: `docs/assessments/2026-09-19_r133_fleet48_review.md` (reviewer B verdicts, the synthesis and the MoT coordination).
- **Three r.134 regressions, closed.** (1) The HUD split left `hudTail()` uncalled — the panel's CIL/HIL/SIL/COM stats, `calibrate()`
  (the HAL stream ladder), the MoT stamp and bloom were dead every frame (Aset B, Enki B); called again from `phys`. (2) The
  training-lapse row was written by BOTH phones for one exposure and diverged the two records from the first unengaged plate in the
  default mode (Odin B, Christo B, Asar B); now one lapse clock per room — the host's row travels (`netEvent`) and the joiner books it
  from the row, never a second row. (3) A DROPPED link was rewritten to DIRECT by the next inbound message and the recovery branch
  could never run (Christo B, Odin B, Thoth B); only DIRECT traffic feeds the heartbeat, only its own HELLO revives.
- **The fire gate's remaining members** (Thor B): nothing marks, approves or fires before PRACTICE or START (a WAITING room fired from
  behind the intro); the approver's seat never fires the marker's box (one approval, two shooters); a door tag needs a red box and
  goes through the record; an expired pop or UAV scores nothing and releases its box; a row's `data.by` is never an AI passport (a
  joiner forged `ASM@` to approve its own mark) — a peer's mark is the PEER's mark here, its AI a fact for the strip; at CH5 a miss goes
  back to amber so the other seat can re-approve (the popup's removal had left CH5 rooms unable to fire after one miss); a refused wire
  approval is a HOLD row beside it; a received APPROVER_LOST/PEER_LOST demotes the shooter's red; a lane change releases. QA
  `NO_FIRE_BEFORE_THE_ROUND`, `APPROVER_SEAT_NEVER_FIRES`, `EXPIRED_TARGET_SCORES_NOTHING`, `AI_PASSPORT_NEVER_FROM_A_ROW`,
  `CH5_MISS_GOES_BACK_TO_AMBER`.
- **The record** (Asar B, Aset B, Pangu B): `decide()` puts what it was handed into the hashed row (RESET why/mode/qualR/qualH, HOLD
  reasons) and names the actor (the AI's shot is the AI's SIM-ACTION); AI rows say `role:AI`; one name for a human's approval of the
  AI's mark on state, row, wire and toast (`HI OVER AI` / `PEER HI OVER AI`); in a room the AI's mark still needs the OTHER seat (r.129
  stands — the r.134 exemption is withdrawn); the AI never fires a qualification round.
- **Words** (Sofia B, Athena B): no session id or plate id reaches the player — `MARKED BY THE AI` / `THE OTHER SEAT` / `THE OTHER
  SEAT'S AI`, `150 M RIGHT`; `designate()` owns the one amber sentence ("NOW PRESS APPROVE" / "WAIT FOR THE OTHER SEAT TO APPROVE");
  APPROVE says "APPROVED BY YOU / THE OTHER SEAT / YOU APPROVED THE AI'S MARK · NOW PRESS FIRE"; a lapse names the gap; FIRE after a
  lapse says the lapse; the lost-link sentence claims a red box only when one went amber; a mode change asks like RESET and carries the
  mode to the peer; the join refusal travels; a spoken command is the whole utterance ("the fire alarm" fired); the desk keyboard works
  after a dropdown (the guard blurs a SELECT instead of swallowing every key); the view button follows a reset; the replay bar clears
  the pills; skew, not rtt, on the panel.
- **Gates** (Enlil B): `VOICE_NEGATION_HOLDS`, `MAP_KEEPS_THE_STRIP`, `ASM_NEVER_MARKS_DEAD` are behaviour rows now (a synthetic map
  step read from the DOM; five AI ticks over a downed plate); `ASM_MARKED_BY_THE_LOOP` is a deferred row written by the frame loop
  itself (silent, lane- and mode-neutral; says so if the round started first — drone-deck-qa, which boots alone, proves it). The QA no
  longer leaves `DROPPED · 1p` on the panel.
- In-file QA **116 rows**, headless **115/116** (`SYNC_DIRECT` by design on one device). Replays on the candidate: team 3/3 with the
  joiner's tally and "THE OTHER SEAT HIT · 100 M CENTRE"; AI FIRE 3/3 (the AI's shots on the record); QUAL·40 at 320 px 5/5.
- **Corrections on the record:** the r.134 section says "RESET and a mode change … ask before discarding" — only the button asked in
  r.134 (Enlil B); the r.134 section's "one revision string" overclaimed (the UPDATES body and the historical fixture label still carry
  other numbers — Thoth B, Krishna B); the r.134 artefact commit alone was a state test:ci rejects (deck-head at 133) until the ship
  commit followed — noted, the ship commit is the one that must be green.
- **Still open, honest** (r.136 first items): the canonical range clock (an EXPOSE row from the host; a peer's plate can still be down
  where it is up on the shooter's); re-reduce from the sorted log; the ledger forks when a joiner writes a row while its channel is
  down; one pc/dc per peer and per-peer liveness before 3v3; SSSES pillars other than efficiency are labels; the word gate and `?diag=1`;
  the dock FIRE under the R-HEAD stick at 320/390; frame-time QUAL clocks; SAVE as four downloads; patch replay in CI; two real phones.

## r.136 — Claude Code: the fold of the 48-agent fleet's SYNTHESIS (12 lenses over A + B + the r.135 candidate)
Record: `docs/assessments/2026-09-19_r133_fleet48_review.md` (reviewer B verdicts, the twelve syntheses, the twelve MoT answers).
- **The r.135 regression, closed.** Three syntheses (Thor, Asar, Christo) found the same thing: the marker's-seat rule refused FIRE
  when the mark's author was not this seat — and the AI signs as `ASM@<seat>`, so an AI mark in a room, approved by the other seat,
  could be fired by nobody. The marker's seat is now the human or its own AI (`by` stripped of `ASM@`). The approver's phone read
  "NOW PRESS FIRE" on a button that refuses it; it now reads "THE OTHER SEAT FIRES". QA `AI_MARK_FIRES_IN_A_ROOM` (own seat held
  for two humans, other seat approves, the owning seat fires, box cleared).
- **A peer's ordinary release reaches the shooter** (Thor): AUTHORITY_RELEASED and TARGET_DOWN rows from the other seat demote my
  box like APPROVER_LOST does; no red box crosses from the waiting room into LIVE (`releaseAuthority('ROOM START')`); an expired
  drone takes its box with it.
- **Two rows assert what they name** (Enlil): `MAP_KEEPS_THE_STRIP` clears the strip before the map step and demands the plate it
  marked (it had passed on the previous row's leftovers); `LOST_APPROVER_IS_SAID` demands the sentence, not only the state.
- In-file QA **117 rows**, headless **116/117**. Replays on the candidate: team 3/3 with the joiner's tally, AI FIRE 3/3, e2e 8/9
  (the HEAD-number row until the re-point).
- **Grades at r.135 (the twelve syntheses):** Aset B− · Asar C+ · Athena B− · Christo B− · Enki B− · Enlil B− · Krishna B+ · Odin
  C+ · Pangu B · Sofia C− · Thoth C · Thor B−. Convergent sentence: *the record is honest on one phone and the fire gate refuses the
  right people; two phones still keep their own range clock and fork on a channel drop; the panel is still the machine's.*
- **Still open (r.137 first items, from the syntheses):** the canonical range clock (EXPOSE row from the host) · never mint a
  sessionSeq on a JOIN whose channel is down; SNAPSHOT merges pending rows · re-reduce from the sorted log · every host row (QUAL,
  SIM-ACTION) on the wire; SPENT / TARGET DOWN as REJECT rows; the TIME-out as N LAPSE rows · fireN refuses a PEER red whose approver
  has been silent longer than one exposure · the join code selects the team and the refusal reaches the joiner before the wire ·
  SSSES retired until measured; rtt on one clock and one sign on all five surfaces · the word gate and `?diag=1`; strip/board/lapse
  through `plateWord`; one lapse sentence; "YOUR TARGET LAPSED" only for the player's own mark · the dock FIRE under the R-HEAD
  stick and a bottom-stack disjointness gate; `MAP_NO_FIRE`; every mark entrance aims · wall-clock QUAL tables with a HIDDEN row ·
  the harness measuring the AI as the AI · the SELECT screens honouring the solo path; the intro in the range's words · patch replay
  in CI; deck-consistency comparing commits and bytes · SAVE as one download · two real phones.

## r.137 — Claude Code: the range the operator described (2026-09-23)
Ask: `docs/asks/2026-09-23_range_modes_iwq_table_vi.md` (verbatim, hashed). Program of record: `docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md`
§"The program of record". Notes: `CLAUDE_CODE_NOTES_r137.md`. Patch: `patches/r136_to_r137.py` (30 asserted edits).
- **The unit of exposure is the ENGAGEMENT, not the plate.** The operator played r.136 and restated the three modes: in TRAINING every
  target is up (RESET: a hit target comes back; DOWN: it stays down); in QUAL the targets of an engagement come up TOGETHER — the Army
  IWQ Table VI 40-round day fire he pasted: 18 engagements in 4 phases, 5 / 8 / 12 / 16 s by count, ~3 s between engagements, ~8–10 s
  between phases, one round per silhouette, unengaged = miss, 40 targets = 50×6 · 100×7 · 150×8 · 200×8 · 250×6 · 300×5, the 50 R first.
- **Built:** `IWQ_VI` (1–14 verbatim; 15–18 DECLARED to consume exactly the remaining 50×2 · 100×3 · 150×1 · 200×2 · 250×2),
  `EXPOSURE_BY_COUNT {1:5,2:8,3:12,4:16}`, `ENG_GAP_S 3`, `PHASE_GAP_S 9`, `RETURN_S 3`, `engagementAt(lane,k)` (siblings seeded per
  lane; the same program on every lane and both phones); `rangeTick` runs training (no clock) or the tower (engagements, windows, the
  phase rest, unfired misses, four QUAL rows); `qualRecordShot` counts one round per silhouette and finishes at 40; `C-50L` added
  (11 silhouettes); the strip reads the engagement; LAPSED leaves the training strip.
- **Corrections on the record:** r.130's exposure-by-distance (3 s at 50 m, +1 s per 50 m) and its three 20/10/10 tables with
  142/75/75 s clocks were DECLARED from a search index and are superseded; r.131's per-plate scoring caps had no doctrine source and
  are retired. QA rows `QUAL40_TABLES`, `QUAL40_CAP_III`, `RANGE_POP_SCHEDULE`, `MODE_QUAL_TIMED`, `ONE_ROUND_PER_EXPOSURE`,
  `TABLE_III_EXPOSES_ONLY_SCORABLE` are retired with them.
- **Gates:** in-file QA 124 rows, headless 123/124 (`SYNC_DIRECT` by design); thirteen new rows (`IWQ_PROGRAM_IS_40` … `QUAL_ONE_ROUND_PER_TARGET`);
  `range-2525` rewritten (96 checks lift `IWQ_VI`/`engagementAt` out of the served bytes); `drone-playable`, manifest 124, `deck-consistency`,
  `drone-team-e2e` 9/9 (all-up training: the host marks a standing plate), seat replays solo 4/4 · qual 6/6 · AI FIRE 3/3.
- **Still open, honest:** engagements 15–18 against a real lane program (operator/tower); "near to far" is advice, not scored; a quad
  within 16 s on a thumb (hardware); everything the r.136 section lists as r.137-owed moves to r.138 unchanged.

## r.138 — Claude Code: true-scale silhouettes, justified labels, the zoom law, magazine + reload, full screen (2026-09-23)
Ask: `docs/asks/2026-09-23_labels_scale_zoom_reload_fullscreen.md` (verbatim, hashed; two DVIDS range photographs beside it). Notes:
`CLAUDE_CODE_NOTES_r138.md`. Patch: `patches/r137_to_r138.py` (36 asserted edits). Operator answers: no 75 m (a typo); FIRE stays the third
pill in full screen; QUAL = four 10-round magazines, training and every craft = 30-round magazines.
- **Silhouettes at their real size.** F 0.495 × 0.508 m, E 0.495 × 1.016 m (SOURCED: Range Systems E-type sheet 19.5" × 40"; F 19.5" × 20"
  DECLARED from the same family). A 300 m E is 1.6 px tall at 1×; the r.131 angular pip floor (3 mrad) is what keeps it hittable.
  **Correction on the record:** r.130's silhouette sizes (2.20 × 1.15 m at 50 m …) were sized for visibility, not truth.
- **Labels never overlap.** One placement function (`plateCaptionRects`) for the painter and the QA row: left targets right-justified to
  the left of the plate, right targets left-justified to the right, centre targets above; same-side captions stack.
- **The zoom law.** `zoomMax()`: turret 3× in QUAL · 40, 30× in training; every craft 30× optical. One clamp (`zoomClamp`) at every optic
  site; entering QUAL caps a higher zoom; a mouse wheel zooms too (pinch had been the only optic). Zoom is an optic, never authority.
- **Magazine and reload.** `magCap()` 10 in QUAL, 30 elsewhere; an empty magazine refuses FIRE (`EMPTY_MAGAZINE`, no shot, no round);
  RELOAD is a canonical row that travels (`why` MANUAL or PHASE); the tower's phase rest loads the next magazine on the record; RESET
  refills silently (the RESET row already exists). The counter and the zoom read at the top of the picture: `MAG 2/4 · 7 RDS · ZOOM 3×/3×`.
- **Full screen.** FULL hides the two bars, the strip and the dock; the sticks, TARGET · APPROVE · FIRE, RELOAD and the counter stay; the
  score moves into the top line; the browser's fullscreen is used when offered, never required; persisted in the sets store.
- **Fix the class:** `layout()` rewrote the app's class list on every resize — a rotation dropped `turret` (and would have dropped `full`);
  it toggles now.
- **Gates:** in-file QA 132 rows, headless 131/132 (`SYNC_DIRECT` by design); new `SILHOUETTES_TRUE_SCALE`, `LABELS_DO_NOT_OVERLAP`,
  `ZOOM_LAW`, `TRAINING_MAG_30`, `PHASE_CHANGES_MAG`, `EMPTY_MAG_REFUSES`, `RELOAD_ON_RECORD`, `FULL_SCREEN_KEEPS_CONTROLS`;
  `RANGE_HIT_50_OFF10` → `RANGE_HIT_50_OFF2` (the true-scale F is 2.8 px wide at 50 m). Repo: `range-2525` (dimensions, the zoom law, the
  magazine), `drone-playable`, manifest 132, `drone-team-e2e` 9/9, seat replays qual 11/11 with a phase reload, AI FIRE 3/3.
- **Correction on the record:** the r.138 ship commit (6071c48) carried `drone-deck-qa 11/1` in its own message and was pushed anyway — the
  gate's pinned aimed-hit list still named `RANGE_HIT_50_OFF10`; Deploy #935 refused (the deck boot-QA step) and the Deploy step was skipped.
  Fixed in the gate script (the rename), re-pushed; a red local gate is a stop, not a note.
- **Still open, honest:** the F-type sheet dimension is declared, not read; a real iOS Safari fullscreen and a thumb on RELOAD at 320 px are
  hardware; everything r.137 listed as owed stands.

## r.139 — Claude Code: landscape and portrait, like Mission Planning (2026-09-23)
Ask: `docs/asks/2026-09-23_landscape_portrait.md` (verbatim, hashed). Notes: `CLAUDE_CODE_NOTES_r139.md`. Patch: `patches/r138_to_r139.py` (10 asserted edits).
- **A phone is a phone in both orientations.** `deviceClass(w,h)` = phone when the short side is under 600 px. r.138 classed a phone in
  landscape (844 × 390) as a desk and gave it the side panel and a 573 px picture.
- **FULL fills the whole screen — correction of r.138.** `#app` is a four-row grid placed by auto-flow; hiding the two bars let `#stage`
  slide into an `auto` row at its 36 vh minimum, in BOTH orientations (measured `grid-template-rows 140.39px 0 249.6px 0` at 390 tall; the
  same 304 px band in the r.138 portrait capture). r.138's `FULL_SCREEN_KEEPS_CONTROLS` measured the controls, never the picture. The rows
  are named now (`.bar` 1 · 2, `#stage` 3, `#dock` 4), FULL is one row = the screen, FULL beats the desk layout (no side-panel margin, the
  HEAD stick at the edge).
- **Portrait stacks, landscape sits side by side.** The magazine line and the strip: under each other in portrait, one row in landscape.
- **Rotation.** `orientationchange` and `screen.orientation.change` re-lay out after 300 ms (iOS reports the old size on the first event);
  every resize re-fits the top line.
- **Gates:** in-file QA 136 rows, headless 135/136 (`SYNC_DIRECT` by design) in portrait AND landscape; new `DEVICE_CLASS_BY_SHORT_SIDE`,
  `FULL_FILLS_THE_STAGE` (stage rect == app rect), `FULL_BEATS_DESK`, `TOP_LINES_NEVER_OVERLAP`. `scripts/drone-deck-qa.mjs` now runs the boot
  QA in both orientations on every deploy (34 checks) — the way Mission Planning's harness runs both panes. `drone-playable` 68/0,
  `range-2525` 100/0, `drone-team-e2e` 9/9. Measured on the candidate: portrait FULL 390 × 844 = the screen; landscape FULL 844 × 390;
  tablet landscape FULL 1180 × 820; rotated in place, each way, the stage follows.
- **Still open, honest:** a real iPhone rotation and Safari's fullscreen are hardware; the tablet's side panel in portrait (820 wide → desk) is
  by the rule, not yet by a person's eye.

## r.140 — Claude Code: the dark green plates and the 25 m Alt-C sheet (2026-09-23)
Ask: `docs/asks/2026-09-23_targets_bigger_altc_sheet.md` (verbatim, hashed, the search screenshot beside it). Notes: `CLAUDE_CODE_NOTES_r140.md`.
Patch: `patches/r139_to_r140.py` (26 asserted edits).
- **The F-type is the wide shouldered plate: 26" × 21" = 0.660 × 0.533 m** (SOURCED: NSN 6920-00-071-4589, NCSS / Action Target).
  **Correction of r.138:** its F-type (19.5" × 20") was declared from the E-type's family and was wrong — the operator's "a little bigger".
  E stays 19.5" × 40".
- **The 25 m Alt-C sheet is a target option** (`TARGETS` picker: POP-UPS · 50–300 M or ALT-C SHEET · 25 M). One 17" × 22" sheet at 25 m
  (Rite in the Rain 9127 / Qualification Targets Inc.) carries the ten silhouettes scaled by 25/range, laid out as printed (50 bottom
  centre · 100 × 3 · 150 left/right · 200 × 2 · 250 top-left · 300 top-right; one 50 m, as printed — the 50 L stays down and is never a
  phantom). Measured: on screen each sheet silhouette is the same height as the real target at its range (worst 0.0 %). Every consumer
  of a plate's place and size goes through `qWorld()` and `plateDims()` — one geometry, no fork.
- **Paper never falls.** A hit is a hole drawn where the pip sat; the silhouette stays; the box clears; TRAINING · DOWN scores the
  silhouette out (dim); QUAL · 40 runs the same engagement program on the sheet (engaged silhouettes lit, the rest dim; windows, rounds,
  unfired misses unchanged); a peer's HIT row is a hole at the centre of mass. The sheet travels with the RESET row.
- **Gates:** in-file QA 140 rows, 139/140 in portrait and landscape (`SYNC_DIRECT` by design); new `SHEET_SCALES_TO_ANGLE`,
  `SHEET_HIT_IS_A_HOLE` (incl. no phantom after the 3 s return), `SHEET_DOWN_SCORES_OUT`, `SHEET_QUAL_ENGAGES`; `SILHOUETTES_TRUE_SCALE` holds the
  new F. `range-2525` 103/0 lifts the sheet and its layout (ten silhouettes, all inside 17 × 22 in); `drone-playable` 73/0; `drone-deck-qa`
  34/0; `drone-team-e2e` 9/9; qual seat 6/6.
- **Still open, honest:** the sheet's height above the lane (1.1 m) is declared; hole positions on a peer's phone are at the centre of mass,
  not where the shooter's pip sat; the 50 L has no place on the sheet by design.

## r.141 — Claude Code: life-size at 12 inches (iPhone 12 Pro Max), the two 50 m targets at the edges (2026-09-23)
Ask: `docs/asks/2026-09-23_eye_scale_12in_fifty_at_edges.md` (verbatim, hashed). Notes: `CLAUDE_CODE_NOTES_r141.md`. Patch: `patches/r140_to_r141.py` (11 asserted edits).
- **One focal length, life-size.** At 1× the focal length in CSS px is the eye distance in CSS px: 12 in × 152.3 px/in = 1827.6 px
  (iPhone 12 Pro Max: 6.7 in diagonal, 926 × 428 CSS px → 6.08 in tall; Apple tech specs; DECLARED for other phones). A thing on the screen
  subtends the angle it subtends in the world. **Correction of r.130–r.140:** the deck projected with a typed 38° half-angle — a 76° vertical
  field — which is why a 50 m F was 7 px and a 300 m E under 2 px; "targets are small" was the field, not the targets. Now: a 50 m F is
  24 px wide at 1×, a 300 m E 6 px (measured, QA `EYE_SCALE_12_IN`). The half-angle is derived from the screen height (10.7° at 662 px,
  5.2° in landscape) — the same scale, more or less sky. The stick moves the same fraction of the screen per second at any zoom.
- **The 50 L and 50 R stand at ±4.6 m** — the edges of a portrait phone at 50 m (a 390 px phone at 12 in sees ±5.3 m; 15 px inside; QA
  `FIFTY_AT_THE_EDGES`, portrait-conditional). DECLARED for 390–430 px phones.
- **Gates:** in-file QA 142 rows, 141/142 in portrait and landscape; `range-2525` 105/0 lifts `EYE`, `focalPx`, `fovDeg` and proves the
  focal length, the two half-angles and the edge geometry; `drone-playable` 76/0; `drone-deck-qa` 34/0; `drone-team-e2e` 9/9.
- **Still open, honest:** 152.3 px/in is the iPhone 12 Pro Max's; other phones differ by a few percent and are not yet read from the
  device; ±4.6 m is tuned to a 390–430 px portrait phone.

## r.142 — Claude Code: reload by hand on QUAL, the same order as the actual test (2026-09-23)
Ask: `docs/asks/2026-09-23_qual_reload_fixed_order.md` (verbatim, hashed: "key is we reload on Qual and have same order as actual test so user
memorizes order"). Notes: `CLAUDE_CODE_NOTES_r142.md`. Patch: `patches/r141_to_r142.py` (14 asserted edits).
- **The program names its silhouettes and is the same on every lane, every time.** Ranges per engagement are the operator's IWQ Table VI
  (1–14 verbatim, 15–18 DECLARED); which of left / centre / right stands is DECLARED once (per silhouette 3/3/3/2/2/4/4/4/4/6/5 = 50 × 6 ·
  100 × 7 · 150 × 8 · 200 × 8 · 250 × 6 · 300 × 5) and never seeded. **Operator decision on the record:** r.137's per-lane seed ("each lane
  has pop ups at various distances") is retired — a shooter memorises one order, as with the real table. Each phase is exactly ten targets.
- **Reload by hand.** The tower's rest no longer loads the next magazine; it says "PHASE 2 · PRONE SUPPORTED · PRESS RELOAD · MOVE". An
  empty magazine refuses FIRE ("EMPTY · PRESS RELOAD"); RELOAD is the shooter's row; four magazines as issued — a fifth is refused
  `NO_MAGAZINE` on the record. One `magReload()` rule serves the button and the QA.
- **Gates:** in-file QA 143 rows, 142/143 in portrait and landscape; `QUAL_SAME_ORDER_EVERY_LANE` (L01 = L02 = L21 = L42; ten a phase; the
  per-silhouette counts), `PHASE_NEEDS_RELOAD` (magazine 1 still in after the rest; engagement 6 refused on empty), `QUAL_FOUR_MAGS`;
  `QUAL_LANES_DIFFER` and `PHASE_CHANGES_MAG` retired. `range-2525` 108/0 (one order across 42 lanes; ten a phase; the counts; no tower
  reload); `drone-playable` 78/0; `drone-deck-qa` 34/0; `drone-team-e2e` 9/9. Replayed: phase 1 = ten hits on ten rounds → the rest →
  engagement 6 refused EMPTY → RELOAD → fires.
- **Still open, honest:** engagements 15–18 and the left/centre/right assignment are declared, not from a range computer file.

## r.143 — Claude Code: no horizon line; a white bullseye that turns red near a target; the bracket red with it (2026-09-23)
Ask: `docs/asks/2026-09-23_reticle_white_red_no_horizon.md` (verbatim, hashed). Notes: `CLAUDE_CODE_NOTES_r143.md`. Patch: `patches/r142_to_r143.py` (8 asserted edits).
- **The green horizon line is gone** from every scene; the world's own wire says where the ground is.
- **The bullseye is white** (the palette's white, `T13.SI`) **and turns red when the pip sits on a target** — a plate's projected outline
  + 8 px, any other target within 28 px of its centre (`reticleNear()`); the hairline bracket around that silhouette turns red with it.
  NEAR is aim, never authority: the amber → red designation box of the fire gate is untouched.
- **Fix the class on the way — LOCK is the thing in the crosshair (r.130 invariant).** With every target up (r.137), the nearest-in-cone
  rule named the 50 while the pip sat on the 100; the plate under the pip now wins. (A marked target still holds LOCK while in the cone —
  the r.131 hysteresis, by design.)
- **Gates:** in-file QA 146 rows, 145/146 in portrait and landscape; new `RETICLE_RED_NEAR_TARGET` (on the 100 C red; 30 px beside it white;
  25° away white), `LOCK_IS_THE_THING_IN_THE_CROSSHAIR`, `NO_HORIZON_LINE` (four pixel samples across the horizon row + the painter's source).
  `drone-playable` 82/0; `range-2525` 108/0; `drone-deck-qa` 34/0; `drone-team-e2e` 9/9.
- **Next, per the operator:** the same bullseye behaviour on the Capital and the other scenes (`reticleNear()` already covers non-plate
  targets by centre distance; the bracket is the range's).

## r.144 — Claude Code: the targets on each of the 42 lanes (2026-09-23)
Ask: `docs/asks/2026-09-23_targets_on_all_42_lanes.md` (verbatim, hashed; the operator's phone screenshot beside it). Notes:
`CLAUDE_CODE_NOTES_r144.md`. Patch: `patches/r143_to_r144.py` (5 asserted edits).
- **Every lane carries the same eleven silhouettes** at the same ranges — it already did as data (42 × 11 = 462 plates, one id per lane),
  and a shooter on any lane sees his eleven; but he saw only his neighbours' 50 m plates. **The neighbouring lanes (±1) now draw every
  standing silhouette, dim**, as on a real range; marking and firing stay on his own lane (`WRONG_LANE` is refused, unchanged).
- **Gates:** `EVERY_LANE_HAS_THE_TARGETS` (42 lanes, 462 plates, L42's eleven by id, every lane's targets standing in training) and
  `NEIGHBOUR_LANES_DRAWN` (a paint counter: 11 of mine + 11 per neighbour, dim) — 148 rows, 147/148 in portrait and landscape;
  `range-2525` 110/0 lifts `LANES` and `PLATES` (42 lanes 10 m apart, each with the eleven); `drone-playable` 85/0; `drone-deck-qa` 34/0;
  `drone-team-e2e` 9/9. Measured: lane 21 draws 11 own + 22 neighbour silhouettes; lane 1 (edge) 11 + 11; lane 42 carries C-50L-L42 … C-300-L42.
- **Still open, honest:** lanes beyond ±1 are not drawn (segment budget at MoT 1.1); on a real range the far lanes are visible too.

## r.145 — Claude Code: lane markers at 100, 200 and 300 m (2026-09-23)
Ask: `docs/asks/2026-09-23_lane_markers.md` (verbatim, hashed; the range photograph beside it). Notes: `CLAUDE_CODE_NOTES_r145.md`. Patch:
`patches/r144_to_r145.py` (6 asserted edits).
- **Numbered boards on posts at the lane edges**, like the photograph: each lane's left edge at 100, 200 and 300 m (the back of the lane),
  the last lane's right edge too — 129 boards, each carrying its lane number. Wire idiom: a 1.2 m post and a 0.5 m square board
  (DECLARED from the photograph), the number as HUD text on the board. Drawn with the silhouettes for the shooter's lane (bright) and the
  lanes beside it (dim). One pure `laneMarkers(lane)` serves the painter, the HUD and the QA.
- **Gates:** `LANE_MARKERS_100_200_300` (three boards at the left edge at 100/200/300, the last lane six, mine bright, 15 segments drawn, all
  in the picture from the pit) — 149 rows, 148/149 in portrait and landscape; `range-2525` 111/0 lifts `laneMarkers` and proves every lane's
  boards by number, edge and range; `drone-playable` 87/0; `drone-deck-qa` 34/0; `drone-team-e2e` 9/9.
- **Still open, honest:** the boards are at the lane's LEFT edge (the photograph's convention read as "the board opens the lane"); a
  real range may sign both edges — the operator's call; post and board sizes are declared.

## r.146 — Claude Code: deferred QA rows decide on evidence, not the runner's clock (2026-09-23)
Cause: Deploy #950 (commit eee8d92, carrying the r.144 deck) went red in CI on `DRAW_COMPLETES` in portrait — 146/148. Notes:
`CLAUDE_CODE_NOTES_r146.md`. Patch: `patches/r145_to_r146.py` (5 asserted edits).
- **The class.** `DRAW_COMPLETES` was decided by a fixed 1.5 s timer after the boot QA; a cold GitHub runner (Chromium freshly downloaded,
  462 plates and 129 boards on the first paint) had no frame done at 1.5 s, so the row read "no frame completed" for ever while the loop ran
  fine a moment later. `ASM_MARKED_BY_THE_LOOP` carried the same clock (a 700 ms window for the loop's mark). Both rows now POLL for the
  evidence they name — a frame that reached its last line or a recorded render exception; the loop's own mark — and decide when it arrives,
  up to a declared ceiling (`DRAW_ROW_CEIL_MS` 20 s, `ASM_ROW_CEIL_MS` 5 s) that is a real failure, not a runner speed. Each note now
  carries the time the evidence took ("after 3812 ms").
- **Proof of the class:** the served r.146 under a 30× CPU throttle (headless Chromium, CDP `Emulation.setCPUThrottlingRate`) — `DRAW_COMPLETES`
  OK after 3812 ms (the old timer would have said NO at 1500), `ASM_MARKED_BY_THE_LOOP` OK after 183 ms, 148/149; at 1× OK after 103 ms / 50 ms.
- **Correction of the r.130 record:** `DRAW_COMPLETES` as written in r.130 measured "a frame within 1.5 s of boot" — the runner's speed — not
  "the frame loop runs to its last line without exception". The r.141 gate fix (Deploy #939, fps 0.0) treated the same class at the gate
  only; the deck's own row still carried the clock. Now the deck's row is the evidence and the gate waits for it.
- **Gates:** in-file QA 149 rows, 148/149 in portrait and landscape (unchanged set); `drone-playable` 88/0 (`DRAW_ROW_CEIL_MS` present, the
  1.5 s and 700 ms timers gone); `drone-deck-qa` 34/0; `range-2525` 111/0; `drone-team-e2e` 9/9.
- **Still open, honest:** everything r.145 owed (boards at the left edge only; declared sizes; the fleet's r.137-owed items).

## r.147 — Claude Code: LOCK, T1 · T2 · T3 and key 1 are the targets nearest the bullseye on the picture (2026-09-23)
Ask: `docs/asks/2026-09-23_target_resets_to_50L_fleet_test.md` (verbatim, hashed): "target approve and fire keeps resetting to 50 m left
target; fix". Notes: `CLAUDE_CODE_NOTES_r147.md`. Patch: `patches/r146_to_r147.py` (13 asserted edits).
- **Reproduced on the served r.146:** bullseye 20 px beside the 150 R → LOCK `C-50L`, a plate whose centre sat 21 px OFF the left edge of
  the picture; TARGET then swung the head 7.3° onto it. Key 1 and voice "target one" named the 50 L in every case.
- **The class, not the instance.** Every fallback in `lockOn()` chose the nearest candidate IN METRES inside a 35° cone — plates, rings,
  buoys, pops, aircraft, foils and doors alike — and the turret's `slots()` took the first three standing plates in ARRAY ORDER, so T1 was
  the 50 L for ever. Whenever the pip was not exactly inside a plate's outline (11 px at 150 m on a phone) the 50 m pair won. The Capital
  scenes carried the same rule. Now ONE rule for every kind and every scene: the candidate whose projection is nearest the pip on the
  picture, within `LOCK_REACH_PX` (48 px, DECLARED: 26 mrad at 1×, finer as the optic zooms); off the picture is never a candidate; nothing
  within reach is no lock ("NO TARGET UNDER THE BULLSEYE · PUT IT ON ONE"); T1 · T2 · T3 are the three nearest the pip in that order; key 1
  marks what the button marks (T1 within reach, or nothing). The marked target's hysteresis and the plate-under-the-pip pass (r.143) stay.
  This is the "same function on the Capital of Texas" the operator asked for on 2026-09-23 (r.143), delivered as the lock rule.
- **Gates:** `LOCK_IS_NEAREST_TO_THE_PIP` (20 px beside the 150 R → the 150 R at 20 px, the off-picture 50 L never a candidate, the sky →
  none) · `TARGET_MARKS_THE_PIP` (TARGET marks the 150 R and moves the head 0.63° onto it, APPROVE reds it, FIRE lands) ·
  `CAP_LOCK_IS_THE_PIP` (Capital, T11: beside door D-LIB → D-LIB, the nearer D-CAP-W does not take it) — 152 rows, 151/152 in portrait and
  landscape; `range-2525` 115/0 lifts `pipRank` / `pipNearest` and proves the order, the off-picture rule, the reach and the on-bullseye
  lock; `drone-playable` 89/0.
- **Corrections of earlier claims:** r.131's `RANGE_LOCK_PLATE` read "LOCK from the pit at pan 0 = C-50" — at pan 0 the pip sits on the
  grass, and the row now aims at the exposed plate; r.131's `TARGETN_HITS_THE_EXPOSED_PLATE` fired key 1 with the pip 55 px off the plate
  and passed only because key 1 took the nearest plate in metres — the row now puts the pip beside the plate, and key 1 refuses the grass.
- **Still open, honest:** the AI member (`asmTick`) still spots the nearest standing plate in metres from its own mount — that is its own
  sensor, not the human's bullseye, and is unchanged; everything r.146 owed.

## r.148 — Claude Code: the eye outranks the mark — the 48-agent fleet's fold on r.147 (2026-09-23)
Fleet: `docs/assessments/2026-09-23_r147_fleet48_review.md` (12 lenses × reviewer A + adversarial reviewer B + one synthesis, + 12 MoT
coordinators). Notes: `CLAUDE_CODE_NOTES_r148.md`. Patch: `patches/r147_to_r148.py` (23 asserted edits).
- **Correction of the r.147 claim.** r.147's "LOCK is the target nearest the bullseye" ran only on an EMPTY board. `lockOn` kept the marked
  target — mine, the other seat's, or the AI's — anywhere inside a 35° cone BEFORE the pip rule, and its gate cleared the board before it
  looked. The deck parks the head on a 50 m plate; the first TARGET marks it; the AI member marked the nearest plate in metres the moment a
  box cleared and swung the seated head onto it; so every later TARGET re-marked that plate and swung the head back, APPROVE reddened it
  under a ring on another plate, and FIRE said MISS. The operator's sentence reproduced verbatim on r.147 (Athena B, both orientations;
  Pangu A/B with the AI on; Aset A, Enki A, Christo A/B, Odin A, Thor A on the source).
- **The class, as one rule with its members.** (1) a mark is held as LOCK only while the bullseye is ON it (`pipOn`: a plate's outline + 8 px,
  28 px for anything else); otherwise the pip rule runs. (2) `markLock` is the one door for TARGET, key N and voice: on the current mark it
  keeps the phase and the author and says who marked it (a red box is never demoted, a peer's or the AI's box never re-signed); on another
  target it releases my own unfinished mark with one HOLD row (RE-MARK) and moves the head only after a mark was made. (3) T1 · T2 · T3 obey
  the reach on every craft — the assign and numbered-door pools rank by the pip and a door behind the camera is not a slot; keys 2/3 refuse
  like key 1; voice "target N" is key N. (4) the AI member spots THROUGH THE BULLSEYE (pipRank from the seated camera) and says
  "NOT UNDER YOUR BULLSEYE" when it fell back to metres; it never moves the seated head; it marks nothing for 1.2 s after a shot so the HIT
  sentence is read; a reset forgets the last shot. (5) a FIRE with no box is booked against NONE, never the nearest plate (the record had
  named a plate nobody marked, on both phones, hashed). (6) the board sits under the strip in portrait (they overprinted at 390 px).
  (7) the wire: APPROVE's author is the authenticated sender, never a claimed field (a joiner had signed the host's approval); a peer HIT row
  downs a plate only with an APPROVE for it on this record (a replay-log refusal, not a hashed row, so an honest peer never forks the hash).
  (8) the EYE comment says 24 px, measured.
- **Gates:** nine new rows — `TARGET_FOLLOWS_THE_EYE` (100 C marked, bullseye beside the 150 R → TARGET marks the 150 R, head 0.63°, the
  100 C released with a row), `TARGET_ON_OWN_MARK_KEEPS_PHASE`, `KEYS_2_3_OBEY_THE_REACH`, `ASM_SPOTS_THE_PIP_AND_NEVER_MOVES_IT` (head
  0.000°), `TARGET_OVER_AI_AMBER_MARKS_THE_PIP`, `REJECT_NEVER_NAMES_AN_UNMARKED_TARGET`, `BOARD_NEVER_OVER_THE_STRIP`,
  `PEER_HIT_NEEDS_RED_ON_RECORD`, `AI_WAITS_FOR_THE_HIT_TO_BE_READ` — 161 rows, 160/161 in portrait and landscape; `drone-playable` 90/0;
  `drone-team-e2e` 9/9; the AI seat replay now looks at the AI's box before approving (the head no longer snaps there).
- **Still open, honest (from the fleet, named for r.149):** FIRE with the ring off the red box should say where the box is and spend nothing
  (Athena); the record's vocabulary on the strip / board / LOCK line and the room sentences to the wrong seat (Sofia; a word gate); a
  refusal at MARK / APPROVE / RELOAD-full / SPENT time as a row (Asar); `commit()` (the door tag) without a red box, blind approval of a
  target off the approver's picture, a peer mark on a dead plate approved (Thor); the sheet's under-pip pass by metres among overlapping
  outlines (Enki); false DIVERGED for ~1 s after a HOLD (Christo); `state.fps` clamped at 20 so HAL.PI never engages (Odin); SSSES
  pillars scored as labels / unmeasured zeros (Thoth); the TARGET BUTTON itself and the ASM self-exemption without predicate gates, and
  the deck's rows running only after main (Enlil); the AI signs SIM-ACTION/REJECT rows as HI (Pangu); the deploy door (Krishna).

## r.149 — Claude Code: a box only around the marked target — amber on TARGET, red on APPROVE, the voxel in 3D (2026-09-23)
Ask: `docs/asks/2026-09-23_edge_markers_only_when_targeted.md` (verbatim, hashed; the phone screenshot beside it). Notes:
`CLAUDE_CODE_NOTES_r149.md`. Patch: `patches/r148_to_r149.py` (6 asserted edits).
- **No edge markers unless targeted.** The r.130 hairline bracket that every standing silhouette wore (and that r.143 turned red near the
  bullseye) is gone. A marked target wears the amber T-box on the picture; APPROVE turns it red; and in the 3D picture every marked slot
  gets the wire box in the world (the voxel) in the same colour — `slotBoxes()`, one pure list for the painter and the QA (r.052 drew the
  voxel for the current mark only). The bullseye itself still turns red when it sits on a target (r.143 aim colour, never authority).
- **The three range modes, unchanged and re-stated in the operator's words:** TRAINING · RESET — a hit target goes down and pops back up
  (RETURN_S 3 s); TRAINING · DOWN — a hit target stays down until RESET; QUAL · 40 — the engagement's targets rise together and a hit one
  stays down for the rest of its window; a lifter rises again only when the program names it in a later engagement (40 targets on 11
  lifters, as the real range does). Gates unchanged: `TRAIN_ALL_UP`, `MODE_RESET_RETURNS`, `MODE_DOWN_STAYS`, `QUAL_ENG_TOGETHER`,
  `QUAL_UNENGAGED_IS_MISS`.
- **Gates:** `VOXEL_BOX_FOLLOWS_THE_MARK` (no box with nothing marked; TARGET → one 12-edge voxel in amber; APPROVE → the same box red) ·
  `NO_BRACKET_UNLESS_TARGETED` (the painter carries no bracket path for an unmarked silhouette and draws the slot boxes) — 163 rows,
  162/163 in portrait and landscape; `drone-playable` 91/0.
- **Still open, honest:** everything r.148 owed (the fleet's r.149 order in `docs/assessments/2026-09-23_r147_fleet48_review.md` MoT 1 —
  FIRE_SAYS_WHERE and the gate door first); the r.143 register line "the bracket turns red with the bullseye" is superseded by this entry.

## r.150 — Claude Code: the fire gate reads the picture — a round or a tag is spent only on a red box the bullseye is on (2026-09-24)
Ask: `docs/asks/2026-09-23_drs_bu_sbu_alpha_needs.md` ("fix all AsM identified issues"), executed in MoT 1's order from the 48-agent
fleet on r.147 (`docs/assessments/2026-09-23_r147_fleet48_review.md`) — items 1–4. Notes: `CLAUDE_CODE_NOTES_r150.md`. Patch:
`patches/r149_to_r150.py` (27 asserted edits). Artefact commit `ec241fa`; shipped in: PENDING until Verify Live (the ledger and the domain JSON
carry `shipped`).
- **FIRE says where (A1/A1b/A2).** Red box on the 50 L, bullseye on the 150 R: FIRE → `YOUR RED BOX IS ON THE 50 M LEFT · YOUR BULLSEYE IS
  NOT · PUT IT ON IT`, one REJECT `TARGET_OFF_PICTURE` row, no round spent, the box still red. r.149 spent the round, said MISS and never
  named the box — the last visible half of the operator's complaint. Plates use the one hold rule (outline + 8 px); other kinds the 32 px
  of the hit test; the MAP view cannot fire; the batch's own `simDirect` bypasses the gate as it bypasses the hit test. A miss still costs a
  round when the bullseye is on the box's edge and the shot lands outside the silhouette; N pulls per approval stay, one row per pull.
- **A tag needs a red box under the bullseye (A4).** `commit()` refuses `TAG_NEEDS_RED_BOX` (Enter / YES on a peer's REQ scored +250 with no
  mark); a pending request dies with RESET, RELEASE and a closed round.
- **No approval on a dead plate, whoever marked it (B15)** — button and wire both HOLD `TARGET_DOWN`. **The approver looks at a peer's mark
  from any seat (B16)** — never for an AI mark. **The AI re-arms on reload (A18), reads the HIT for `ASM_READ_S` 1.4 s (A22)**; the dead
  `!state.hiLock` guard is gone (A19). **A forged red of another kind never shoots the bull (A21).**
- **The door (E4/E5/E9):** `ASM_MARKED_BY_THE_LOOP` says NOT EXERCISED in red; `DRAW_COMPLETES` needs three frames and zero render errors;
  the deck's own `SSSES` row (it could not fail) is gone.
- **Gates:** 13 new rows, each with a note regex in `scripts/drone-deck-qa.mjs` (a predicate replaced by `true` cannot pass):
  `FIRE_SAYS_WHERE` · `FIRE_ON_THE_BOX_STILL_HITS` · `FIRE_FROM_MAP_REFUSED` · `ONE_ROW_PER_PULL` · `TAG_NEEDS_RED_BOX` ·
  `PENDING_DIES_WITH_THE_SCENE` · `PEER_APPROVE_OF_A_DEAD_PLATE_REFUSED` · `APPROVE_LOOKS_AT_THE_MARK` · `AI_MARK_NEVER_TURNS_THE_SEAT` ·
  `AI_RESUMES_AFTER_RELOAD` · `FORGED_RED_NEVER_HITS_THE_RING` · `KEY1_REFUSES_THE_GRASS` · `TARGET_BUTTON_FOLLOWS_THE_EYE` (deferred: it
  clicks the real button). 175 rows, 174/175 in portrait and landscape.
- **Corrections, on the record:** `RANGE_MISS_300_OFF20` (r.130) is a refusal that spends nothing, not a MISS that spends a round;
  `QUAL_ONE_ROUND_PER_TARGET` (r.131), `EMPTY_MAG_REFUSES` (r.138) and `CH5_MISS_GOES_BACK_TO_AMBER` (r.135) made their MISS 80 px or 25° off
  the plate — now 4 px outside the silhouette, inside the hold rule; `HIT_CLEARS_SLOT` (r.131) rode the hole A21 closes with a synthetic
  kind-obj ring and now marks the real ring.
- **Still open (the fleet's order):** item 5 (one "under the pip") → r.151 · items 6–8 (one voice, one layer; the overprint in the
  operator's screenshot) → r.152 · items 9–11 (the record and the wire; wall-clock fps; the ledger's ship field) → r.153.

## r.151 — Claude Code: pop-up targets fire again — a pop the LOCK reaches is fireable (2026-09-24)
Operator: **"pop-up targets no longer work."** The fleet's r.147 order, MoT 1 item 5 ("one under the pip"). Notes:
`CLAUDE_CODE_NOTES_r151.md`. Patch: `patches/r150_to_r151.py` (4 asserted edits). Artefact commit PENDING; shipped in: PENDING
until Verify Live (the ledger and the domain JSON carry `shipped`).
- **One value, root-caused.** r.150 taught the FIRE gate to spend a round only with the bullseye on the red box. Its non-plate
  branch projected `worldOf(tgt)` — a pop's **BASE**, y≈1.2 — and accepted only within **32 px** of the pip. But a lawn pop is
  **drawn at body-centre** `p.y+1.2` (≈2.4) and the LOCK reaches `LOCK_REACH_PX` (**48 px**). So a TURRET / CAPITAL pop
  (`s.kind==='pop'`, no `.form`) could be marked and approved — the LOCK reached it — yet FIRE was refused `TARGET_OFF_PICTURE`.
  Range plates (`tgt.form`) use `pipOn` and were never affected. **The fix: the non-plate FIRE tolerance is `LOCK_REACH_PX`, not
  32** — the gate now accepts exactly what the LOCK accepts. "If you can lock it you can fire it." Scope is strict — `pipOn`, the
  lock, the draw and plate handling are untouched.
- **Correction on the record (r.150).** r.150's FIRE-gate comment read "every other kind the 32 px the hit test uses"; that 32 px
  was the bug for a pop, whose base sits 1.2 m below the drawn silhouette. From r.151 the non-plate FIRE reach is `LOCK_REACH_PX`.
  The applyHit HIT test (`pipOff < 32`) is unchanged, so a shot aimed at the silhouette spends a round and a shot aimed at the
  base lands the hit — the round is no longer refused outright.
- **Gate:** one new boot-QA row `FIRE_HITS_A_POP` with a note regex in `scripts/drone-deck-qa.mjs` (a predicate replaced by
  `true` cannot pass): a turret lawn pop, marked and approved — bullseye on the drawn silhouette (its base past 32 px, within
  `LOCK_REACH_PX`) FIRE **spends a round** where r.150 refused; on the base FIRE → **HIT / SIM-ACTION**. Plus a REPO source gate
  in `drone-playable` holding the non-plate branch to `LOCK_REACH_PX` (never `<=32`). 176 rows, 175/176 in portrait and landscape.
- **Still open (the fleet's order):** items 6–8 → r.152 · items 9–11 → r.153.

## r.152 — Claude Code: the full-screen control is an icon, not a word (2026-09-24)
Operator (`docs/asks/2026-09-24_drone_popups_box_maximize.md`): **"Add maximize from Mission Planning in upper right versus
words to indicate Full Screen Mode (and minimize arrows instead of Exit)"** — with two screenshots. Notes:
`CLAUDE_CODE_NOTES_r152.md`. Patch: `patches/r151_to_r152.py` (8 asserted edits). Artefact commit `8366dfa`; shipped in:
PENDING until Verify Live (the ledger and the domain JSON carry `shipped`; r.151's `shipped` is filled `0dd4cc4` — the commit that
put its bytes on `main` and the current served HEAD).
- **The icon, not the word.** The deck carried two full-screen controls — `btnFullBar` in the top `.bar` and `btnFull` in
  `#magBar` — whose label was the WORD `FULL`, toggled to `EXIT`. Both now carry the Mission-Planning affordance the rest of the
  app uses: **maximize `⤢`** to enter full screen, **minimize `⤡`** to exit — the exact convention in
  `frontend/app/SoI-2525/page.tsx` (`portfolioMax ? "⤡" : "⤢"`) and Security-2525 Mission Planning's Maximize2 / Minimize2. The
  toggle writes `on ? '⤡' : '⤢'` and keeps a descriptive `title` / `aria-label` (`full screen` → `exit full screen`) so the meaning
  survives the loss of the word.
- **Upper-right, at a tap size.** `#btnFullBar{order:9;margin-left:8px;font-size:16px;…}` renders the top-bar maximize icon last in
  the flex bar, where the existing `flex:1` spacer right-aligns it at the upper-right **without disturbing the CONTROLS / DATA / MORE
  dropdowns** (they keep their places); `#magBar #btnFull` is bumped so its glyph reads. The fullscreen BEHAVIOUR
  (`setFull` → `requestFullscreen`/`exitFullscreen`, `#app.full` hiding the words while the sticks · TARGET · APPROVE · FIRE · RELOAD
  stay) is untouched.
- **The pop-ups, reconfirmed (no fix needed).** The operator re-asked to confirm pop-up behaviour. Verified on the served deck,
  headless: TRAINING · RESET ("Target - Up") stands every target at once; TARGET on a pop draws the **amber** designation box;
  APPROVE turns it **red**; FIRE on a marked+approved pop spends a round and lands a HIT (the r.151 fire fix). All four already work —
  no code change was made to the pop / box / fire logic (the r.151 `LOCK_REACH_PX` fire fix is untouched).
- **Gate:** one new boot-QA row `FULLSCREEN_IS_AN_ICON` with a note regex in `scripts/drone-deck-qa.mjs` (a predicate replaced by
  `true` cannot pass): off → `⤢`/`⤢`, full → `⤡`/`⤡`, measured on both buttons in the served bytes. Plus a REPO source gate in
  `drone-playable` holding the served bytes to the `⤢`/`⤡` glyphs (never the word `FULL`/`EXIT`) and the top-bar right-alignment.
  177 rows, 176/177 in portrait and landscape.
- **Still open (the fleet's order):** items 6–8 → still owed · items 9–11 → r.153.

## r.153 — Claude Code: the browser tab reads "eXeL Drone-2525" (2026-09-26)
Operator (`docs/asks/2026-09-26_drone_tab_name.md`): **"make drone-2525 tab name / eXeL Drone-2525 / not sure why ECO IS
IN NAME"**, and the follow-up: **"It should be 'eXeL Drone-2525' not 'eXeL Drone-2525 · MoT · SSSES'"**. Notes:
`CLAUDE_CODE_NOTES_r153.md`. Patch: `patches/r152_to_r153.py` (3 asserted edits). Artefact commit `c65d719`; shipped in:
PENDING until Verify Live (the ledger and the domain JSON carry `shipped`; r.152's `shipped` is filled `948c37e` — the
commit that put its bytes on `main` and the served HEAD).
- **Title-only.** The served deck's `<title>` was the last place the stale early deck name **"eXeL ECO-2525 · MoT ·
  SSSES"** survived, so the phone browser tab read "ECO-2525". It now reads exactly **"eXeL Drone-2525"** — the whole
  "· MoT · SSSES" suffix dropped (operator's follow-up). "ECO-2525" was a leftover name; the surface is Drone-2525. The
  masthead had already read Drone-2525; only the `<title>` lagged.
- **No logic, no layout, no QA row.** A browser title carries no runtime behaviour, so there is nothing new to prove at
  runtime; `drone-playable` holds `public/drone-2525/play.html` byte-identical to the carried r.153 snapshot, which is the
  proof the title shipped. The manifest and every QA row are unchanged; the r.152 `⤢`/`⤡` full-screen assertions and all
  range behaviour carry over untouched.
- **Note on the numbering.** The previously-planned r.153 "record & wire" work (the fleet's items 9–11) shifts to **r.154**;
  this title fix takes r.153, per the operator's 2026-09-26 ask.

## r.154 — Claude Code: the QUAL · 40 clock counts real seconds; 10 s between positions (2026-10-04)
Operator (`docs/asks/2026.10.04_03.56..35_drone2525_qual40_exposure_times.md`): **"make sure times for multiple targets on qual40 are accurate"**, and the confirmation: **"depending on
number of targets, you get kore time.  3-4 seconds per target. fine qual"**. Notes: `CLAUDE_CODE_NOTES_r154.md`. Patch:
`patches/r153_to_r154.py` (8 asserted edits). Artefact commit `fc0fddf`; shipped in: PENDING until Verify Live (the ledger and
the domain JSON carry `shipped`).
- **The defect, measured on the served r.153.** The frame loop caps every step at 50 ms (`dt=Math.min(.05,…)`) and `rangeTick`
  runs inside `phys → spawn` on that capped step, so below 20 fps the qualification clock ran slower than real time: at ~160 ms
  frames a 5 s exposure lasted 16.58 s; at ~120 ms frames (8 fps) the first 3 s gap lasted 7.57 s and the 5 s exposure 12.53 s.
  At 60 fps every window was already right (5.02 / 12.02 / 16.02 s, gaps 3.02 s).
- **The fix.** The range clock counts wall time: `rangeDt(ms)` = elapsed seconds capped at 0.25 s per frame (a backgrounded tab
  cannot skip an engagement). The loop takes the raw elapsed BEFORE `last=now`, hands it to `rangeTick` for its own `phys()` call
  only (`state.rangeDtNow`, cleared after, so the QA's and STEP's synthetic `phys(dt)` keep their own step), and physics keeps its
  50 ms step. This covers the QUAL · 40 windows (5/8/12/16 s), the 3 s gap, the phase gap and the TRAINING · RESET 3 s return.
- **The phase gap is 10 s** (was the declared midpoint 9 s): the sourced "ten second transition delay to allow the shooter time to
  reload and assume the next position" (iwtsexplained.com/table-vi; the 2019 Infantry magazine — via search results). The
  exposure values are unchanged (the operator: "fine qual"; 3–4 s per target is what 5/8/12/16 gives).
- **Gates.** Boot-QA row `QUAL_CLOCK_IS_WALL_TIME` (rangeDt 160 ms → 0.16, 5000 ms → 0.25, −5 ms → 0; the loop and spawn carry the
  wall step); `QUAL_EXPOSURE_BY_COUNT` now holds `PHASE_GAP_S===10`. `drone-range-all-lanes` times lane 21 with the real frame loop
  at normal frames and with every frame slowed to ~120 ms: first gap and engagement 1 within ±0.35 s — r.153 FAILS it (7.57 s /
  12.53 s), r.154 PASSES (3.10 s / 5.09 s slow; 3.00 s / 5.00 s normal). 178 rows, 177/178 in portrait and landscape.

## r.155 — Claude Code: TARGET · APPROVE · FIRE left of the stick on the turret, centred between the sticks on a drone (2026-10-04)
Operator (`docs/asks/2026.10.04_08.50..02_drone2525_face_left_of_stick_turret.md`, with his phone screenshot of r.154 on lane 21):
**"target approve fire needs to be left of joystick for turret (and centered between two joysticks when operating drone)."**
Notes: `CLAUDE_CODE_NOTES_r155.md`. Patch: `patches/r154_to_r155.py` (8 asserted edits). Artefact commit `d2d2431`; shipped in:
PENDING until Verify Live (the ledger and the domain JSON carry `shipped`).
- **The defect, measured on the served r.154.** The cluster was centred on the SCREEN (`left:50%; translateX(-50%)`). On the turret
  at 390×844 it sat at 81–309 × 656–696 px while the HEAD stick sat at 310–382 × 716–788 px on the right edge — above the stick and
  across the screen from the thumb. On a desk the centre was the window's (614–825 px) while the gap between the sticks ran 72–1068.
- **The fix.** `placeFace()` measures `#stage`, `#joyR` and (when visible) `#joyL` with `getBoundingClientRect` and writes inline
  `left`/`top` (transform none), clearing its inline styles first so each call starts from the CSS. TURRET: one row, right edge 10 px
  left of the stick, vertical centre = the stick's; on narrow screens the gap shrinks to 4 px and then the pill padding/min-width, never
  over the stick, never off the stage (320 px: 4–232 against a stick at 240). DRONE: centred on the midpoint between L's right edge and
  R's left edge at the sticks' height — one row if it clears 6 px each side (compact pills before two rows), else two rows, else above
  the sticks. It runs from `layout()` (resize, orientation, FULL), `syncSticks()`, `applyMode()`, boot, `fonts.ready`, and a
  MutationObserver on `#app`'s class and the sticks' style — so every path that toggles `.turret`/`.full`/`.desk` re-places it.
- **What the move must not cover** (found on the r.155 captures before push). In landscape the face now sat on the HUD's right-hand
  `unit · SPIRAL` / `FPS` canvas lines: `hudStatusY()` steps both above the face and the stick's label only when the face box covers
  them (portrait is unchanged). The toast (z 41, left 10 px, bottom 92 px) would have lain over TARGET/APPROVE for up to 4.2 s and
  taken their taps: `placeFace()` raises it above the face and the stick labels (bottom ≥ 92 px, as before).
- **Measured on r.155** (headless): 390×844 turret 72–300 × 732–772 beside a stick at 310–382 × 716–788; quad 114–276 centred between
  80 and 310 (off 0 px); 844×390 turret 551–762 × 326–370 beside 772–836 × 316–380; quad 316–527 between 72 and 772; FULL identical.
- **Gates.** Boot-QA row `FACE_BESIDE_STICK` (turret: face right ≤ stick left − 4, vertical overlap ≥ 60 % of the face, inside the
  stage; drone: |face centre − gap midpoint| ≤ 4 px, touching neither stick, inside the stage). 179 rows, 178/179 in portrait and
  landscape (SYNC_DIRECT, red by construction on one device).

## r.156 — Claude Code: the hit splash starts at the centre of the hit target (2026-10-05)
Operator (`docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md`, Addendum 2, with his phone screenshot
`addendum2_splash_screenshot.png` of r.154 QUAL on lane 21): **"make sure splash on drone originates from center of hit target"**,
then **"fix splash"**. Notes: `CLAUDE_CODE_NOTES_r156.md`. Patch: `patches/r155_to_r156.py` (6 asserted edits). Artefact commit
`aa66c46`; shipped in: PENDING until Verify Live (the ledger and the domain JSON carry `shipped`).
- **The defect, measured on the served r.155.** `applyHit` copied the target's raw `x/y/z` into `state.fx` and the draw ringed
  `(f.x, f.y||1.2, f.z)`. A range plate keeps lane-local `x` and `y=0` (its world place is `qWorld`: + the lane's x, + its ground
  height, + its slope), so on lane 21, 300 m E at 3× (390×844) the ring sat at world (6.4, 1.20, 300) against the plate's centre
  (1.4, −6.16, 300) — 91 px right of and 135 px above the plate (lane 1: 205 m to the side). It also flashed on a miss. And it was
  drawn through the budgeted `segs()` after the world wire: at MoT 1 (280 segments) the wire had spent the budget (segs 280,
  dropped 499), so the ring was dropped whole — no splash where he hit.
- **The fix.** A hit sets `state.fx={t,id,direct:true,ref}` (the target itself); a miss sets nothing. `splashCentre(f)` returns
  `worldOf(ref)` — the one centre of mass the aim and the hit test use (`qWorld` + `plateDims` for a plate; the craft's own place
  for a drone) — lowered toward the base as a plate falls (`y = base + (centre − base)·(1 − fall)`, the silhouette's own fold). The
  draw asks it every frame (same 0.45 s ring, LOCK red) and strokes the 16 segments outside the world budget (still counted in
  `state.segs`). `state.fx` has no other reader.
- **Measured on r.156** (headless, same seat): the ring projects at (195, 307) on the plate's (195, 305) at 0.1 s, 2 px lower
  because the plate is already 29 % folded; 16/16 segments drawn while the wire drops 483.
- **Gates.** Boot-QA row `SPLASH_FROM_TARGET_CENTRE`: a 50 m and a 300 m hit on the seated lane through the one fire path, the
  splash centre projected with the draw's projector within 2 px of the plate's projected `worldOf` centre (0.4 px · 0.1 px — the
  hit has already started the fall); a miss 40 px beside a 300 m plate, scored through `applyHit` itself, leaves no new splash; one
  synchronous `draw()` after the 300 m hit puts 16/16 splash segments on the canvas. 180 rows, 179/180 in portrait and landscape
  (SYNC_DIRECT, red by construction on one device).

## r.157 — Claude Code: Drone round 1 of 19 — the splash at the bottom of the hit target, and the five queued asks (2026-10-05)
Operator (`docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md`, round 1 and Addenda 1–5; the Drone-2525 asks of 2026.10.04
in `docs/asks/`). Addendum 5, verbatim, first: **"splash-ring as oval from bottom of target works"** (it supersedes Addendum 4; the
camera-facing burst is not built). Notes: `CLAUDE_CODE_NOTES_r157.md`. Patch: `patches/r156_to_r157.py` (76 asserted edits).
Artefact commit `f6cf582`; shipped in: PENDING until Verify Live (the ledger and the domain JSON carry `shipped`).
- **The splash.** The same flat ring (1.2 → 4.2 m, 16 segments, LOCK red, 0.45 s, outside the world budget, nothing on a miss) is
  centred on `baseOf(target)`: a plate's foot (`qWorld`, moving back with the fold exactly as `silMesh` draws it); for a door, a pop-up,
  a drone or an aircraft the ground under it (y 0). Measured on lane 21 at 3× (390×844): ring (195, 370) on the 150 m plate's foot
  (195, 370); r.156 put it 0.44 m higher, at the centre of mass. Boot-QA `SPLASH_FROM_TARGET_BASE` replaces
  `SPLASH_FROM_TARGET_CENTRE` (50 m and 300 m: 0.000 m from the foot, 0.0 px across, at the bottom edge, ≥ 0.15 m below the centre of
  mass, an oval 87×7 / 15×0 px; door and drone on the ground; a miss draws none; 16/16 segments drawn).
- **Labels only while marked** (his pick, 4b9a6ca): no caption on a standing target in any mode; the marked one reads in plain words
  ("T1 · 150 M RIGHT · AMBER"). `LABELS_ONLY_WHILE_MARKED` replaces `LABELS_DO_NOT_OVERLAP`.
- **The range menu** (his pick "Mode + Restart + Lane"): TRAIN UP · TRAIN DOWN · QUAL 40, RESTART and LANE 21 on one row in both
  orientations (r.156 had 11 range controls on four rows and RESTART at x 849 on an 844 px screen); scenario, platform, water, MoT,
  targets, CH, DIFF and HAL behind MORE. goRange says the one sentence ("LANE 21 · QUAL 40 · 40 TARGETS · 4 MAGAZINES · STARTS ON
  GREEN"); the platform picker says TURRET on the range. `RANGE_MENU_ON_SCREEN`.
- **Lane boards on both edges and 15 m lanes.** One `LANE_W=15` drives the lane centres and the lines; every lane has a board on each
  edge at 100/200/300 m reading "◂ 40 · 41 ▸" ("1 ▸" and "◂ 42" outside) — 252 boards on 129 posts, each on its own lane's ground;
  the widest target stands 6.65 m from its lane centre against the line at 7.5 m (r.156: 150/250/300 m outside the 10 m lane). Board
  words sit above the board, nearest first, and never overprint each other, a caption, the strip, the light or the bullseye.
  `LANE_MARKERS_100_200_300` (rewritten), `TARGETS_INSIDE_LANE`, `BOARD_LABELS_NEVER_OVERPRINT`.
- **The next step is lit; RELOAD calls; one plain line** (ask 2026.10.04_09.16..32): exactly the button that will work glows
  (TARGET, then APPROVE, then FIRE; an empty magazine lights none and RELOAD calls; dimmed buttons stay tappable and refuse as
  before); RELOAD glows when empty and at the QUAL phase rest with a part-used magazine, never full; the strip, the LOCK line, the
  label, the board and the approval toast use plain words (no `C-150R-L21`, no "CH0 D3", no slope word; the corner says "LANE 21",
  SPIRAL only with `?diag=1`). `NEXT_BUTTON_LIT`, `RELOAD_CALLS`, `NO_RAW_IDS_ON_GLASS`.
- **The start light** (Addendum 1), upper right under the magazine line: RED WAIT before the round, between positions and when done;
  YELLOW READY in the 3 s before each QUAL engagement and the last 3 s of the phase rest; GREEN FIRE while my targets stand (training:
  whenever targets stand). Not a button. `START_LIGHT_SEQUENCE` (R → Y → G → Y → G …, R then Y across the rest, R at the end),
  `START_LIGHT_WORDS`, `START_LIGHT_CLEAR` (portrait 320,116 62×35; landscape 774,110).
- **The range shows lanes and targets only** (Addendum 3): the slope-coloured lane rays, the firing line, the distance lines, the berm
  and the MoT 1 blue ground grid are gone from the range picture (the dim grid stays on the MAP).
- **From the reviews.** My lane's targets, boards and marked box never enter the world budget — at MoT 1.1 on lane 21 the neighbour
  lane's silhouettes had spent the 280 segments and the player saw captions with no silhouettes (`MY_LANE_NEVER_DROPPED`: 305/305).
  Rooms score by lane: another lane's Restart row restarts only that lane ("LANE 6 RESTARTED"), another lane's HIT/MISS rows drop its
  plate but never touch my strip, a joiner on a lane the host does not sit on books its own unfired misses, my lane's peer HIT draws
  the same splash (`ROOM_RESET_IS_MY_LANE`, `FOREIGN_LANE_HIT_NOT_MY_STRIP`, `ROOM_LAPSE_ON_EVERY_LANE`). QUAL ends with the
  scorecard and the next step, RESTART lit, the light red (`QUAL_DONE_SAYS_RESTART`).
- **Gates.** 194 rows, 193/194 in portrait and landscape (SYNC_DIRECT, red by construction on one device); drone-range-lanes 42/42
  and the QUAL clock both within ±0.35 s; team e2e 10/0 with one hash on both phones.
- **Correction of the record (append, not edit).** Commit `ece1828` said the reload and three-step ask (2026.10.04_09.16..32) was
  folded into r.156; it was not — r.156 shipped only the splash. It is in r.157 (above). The live column of r.151–r.156 above still
  reads PENDING (Verify Live): r.155 shipped in `7db2b8b` and r.156 in `828e80a`, both served LIVE per Verify Live #2436
  on `ed4af60` (recorded in `359a060`); the domain JSON and the ledger carry those ship commits.


## r.158 — Claude Code: no grey phantom targets; the lane numbers on a real sign board (2026-10-05)
Operator (`docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md` Addendum 6, verbatim): **"for Range on Qual and Train Up and
Train Down, there are grey phantom targets. Also the lane markers need to be on the actual "sign" <-- 20 21 --> like attached"** (a
pop-up course photo: a white board on a post, "5 6"). Notes: `CLAUDE_CODE_NOTES_r158.md`. Patch: `patches/r157_to_r158.py` (14 asserted edits). Artefact commit `ad2b2b0`; shipped in: PENDING until Verify Live.
- **No phantoms.** On the range only my lane's standing targets are drawn. r.144 drew the neighbouring lanes' (±1) silhouettes dim grey — those
  were the phantoms. Every lane still carries its targets (`EVERY_LANE_HAS_THE_TARGETS`). `NO_PHANTOM_TARGETS` replaces `NEIGHBOUR_LANES_DRAWN`.
- **The sign.** Each marker is a post with a 1.2 × 0.6 m board, and the numbers ("◂ 20 · 21 ▸") are written on the board, centred; the
  board on the screen is never smaller than its words. r.157 wrote the words in the air above a 0.5 m square. `LANE_NUMBERS_ON_THE_SIGN`.
- **The lane lines** (Addendum 7, verbatim: "also show line of lanes from sign to sign at 100 200 and 300 markers... very faded dotted grey line"):
  along each lane edge in view, a 35% grey dotted line (dash 2/7) from post to post, 100 → 200 → 300 m. `LANE_LINES_SIGN_TO_SIGN`.
- **Gates.** 197 boot rows, 196/197 in portrait and landscape (SYNC_DIRECT, red by construction on one device).


## r.159 — Claude Code: the signs like the photo; PC keys and mouse (2026-10-05)
Operator (round folder ASK.md Addenda 9–10, verbatim there): "Signs need to be smaller like uploaded images (realistic as photo uploaded)",
"DO not cover targets with signs", "And have White/Black like uploaded image"; "PC operations must be able to use arrows for turret and arrows
and asdw for drone operations. Once should also be able to operate mouse. Right click should target approve, left click fire. or T or space
for target, space for approve, and F for fire." Notes: `CLAUDE_CODE_NOTES_r159.md`. Patch: `patches/r158_to_r159.py` (11 asserted edits). Artefact commit `09f78aa`.
Twelve-lens review of r.158 (SSSES 74.3, MoT C+): `docs/assessments/2026.10.05_14.27..25_drone2525_r158_twelve_lenses.md`.
- **Signs.** A 0.6 × 0.35 m board drawn at its real projected size (never enlarged to fit its words), white with black numbers sized to the board
  (no numbers when too small to read); a sign that would touch a standing target of my lane is not drawn (`signCoversTarget`). `LANE_NUMBERS_ON_THE_SIGN`
  (rewritten), `SIGNS_NEVER_COVER_TARGETS`.
- **PC controls.** Arrows aim the turret; WASD moves a drone and the arrows aim its head (unchanged, now proven); RIGHT CLICK and SPACE share one door
  (`pcTargetApprove`): nothing marked → TARGET, amber → APPROVE, red → "RED · LEFT CLICK OR F TO FIRE" (never fires); LEFT CLICK and F call `fireN`,
  which refuses anything not red. The browser menu no longer opens on the picture. `PC_KEYS_AND_MOUSE`.
- **Gates.** 198 boot rows, 197/198 portrait and landscape (SYNC_DIRECT by construction).
- **Correction (append).** r.158's artefact commit is `ad2b2b0` (its pre-rebase sha `fb8829f` was cited); r.158 shipped in `20454e2`, served live
  per the operator's own screenshot of its signs; Verify Live runs #2459–#2465 failed with "The job was not acquired by Runner" (GitHub capacity).


## r.160 — Claude Code: the lane signs readable (2026-10-05)
Operator (round folder ASK.md Addendum 11, verbatim): **"I can't read signs"** — r.159 drew real-size boards and wrote no numbers under 5 px, so
every board in his view was blank white. Notes: `CLAUDE_CODE_NOTES_r160.md`. Patch: `patches/r159_to_r160.py` (10 asserted edits). Artefact commit `5a8a161`.
- Each sign keeps the photo's look (small white board on a post, black numbers) and always carries its numbers: the short form like the photo's
  "5 6" ("21 22"; "1" and "42" outside), at least 9 px, the board never smaller than its real 0.6 × 0.35 m and just big enough for the numbers.
  Still never over a target. `LANE_NUMBERS_ON_THE_SIGN` rewritten (legible numbers inside every written sign, centred on its real board).
- r.159 shipped in `980dede`, LIVE per Verify Live #2467.


## r.161 — Claude Code: the PC keys and mouse, as he plays (2026-10-05)
Operator (round folder ASK.md Addendum 12, verbatim): **"T for Target, Space for Approve, and F for fire do not work. Also if I click with mouse on
target, the center of bulleye to move to that location for max use of mouse."** and **"ensure click on mouse moves position of turret to center bulleye on target."**
Notes: `CLAUDE_CODE_NOTES_r161.md`. Patch: `patches/r160_to_r161.py` (14 asserted edits). Artefact commit `af6b541`.
- **T was the defect.** The T key stepped to the next target slot on every press (T1, T2, …), so it marked a different target from the one under the
  bullseye. T is now the TARGET button: it marks what the bullseye is on. Space approves an amber mark; F fires (whether or not a slot number was set).
- **Keys beat focus.** With a button or picker holding focus, T / Space / F / arrows / WASD let go of it and reach the game (a focused button took Space).
- **Left click aims.** A left click on a target turns the turret / gimbal so the bullseye centres on it; on blank ground it turns toward the point; on the
  red mark already under the bullseye it fires (fireN, which refuses anything not red). Right click aims first, then marks / approves. The target the
  mouse centred is the one T and Space mark (overlapping plates at 1× had chosen the far one).
- The mark toast says "MARKED 150 M RIGHT", not the target id. QA `MOUSE_CLICK_CENTRES_THE_BULLSEYE`, `KEYS_BEAT_FOCUS`; `PC_KEYS_AND_MOUSE` re-pointed.
- Gates: 200 boot rows, 199/200 portrait and landscape (SYNC_DIRECT by construction); team e2e 10/0. r.160 shipped `1d9ea29`, LIVE in Verify Live #2473 (ce92c30).

## r.162 — Claude Code: the QUAL timer and the range light (2026-10-05)
Operator (round folder ASK.md Addendum 13, verbatim): **"On qual, add timer and have red yellow green light on right vertical, with Red, Yellow, green
as time to next set of targets (1 second per each light). if 3 targets are up, 3 seconds per target (thats 9 second for group), so Red light should
indicate at 7, yellow at 8, and green at 9 (if that's the qual actual time sequence)."**
Notes: `CLAUDE_CODE_NOTES_r162.md`. Patch: `patches/r161_to_r162.py` (41 asserted edits). Artefact commit `9222164`.
- **The light stands vertical on the right** — red on top, yellow, green at the bottom, like a range light (it was three lamps in a row).
- **QUAL · 40 counts the last three seconds of each group, one second a lamp:** red at window − 2, yellow at window − 1, green at the window's end (the
  group is done, the next set is coming; green holds one second). Dark otherwise. Training keeps the r.157 light (green while targets stand).
- **The timer** under the lamps reads the seconds left on the group that is up ("12 S"), or the seconds to the next group ("NEXT 3 S").
- **The windows are unchanged** — the program of record the operator supplied on 2026-09-23 (1 = 5 s · 2 = 8 s · 3 = 12 s · 4 = 16 s). His "3 s per
  target, 9 s for three" was offered conditionally; three targets therefore light red at 10, yellow at 11, green at 12. Changing to 3 s per target is his call.
- **Addendum 14 (verbatim): "buttons for target, T / approve, Space / Fire, F seem to work now: but system forgets target was targeted or approved,
  having to recreate 3 step process to fire each time.  review and update".** Cause: a HIT cleared the mark and the slot, and the training tick
  released the box again when the target finished falling; in TRAIN UP the same target stands up 3 s later, unmarked. Now in TRAIN UP
  a marked and approved target keeps its mark and approval through the hit and the return — F fires again as soon as it stands; F while it is
  down holds ("COMING BACK UP") and costs no round. The mark ends on RESTART, a lane or mode change, or a new mark. TRAIN DOWN and QUAL unchanged.
- **Addendum 15 (verbatim): "If something is marked Target, it stays target.  I should be able to target all 3-4 or all pop ups, then go to each one
  to approve, system remembers.  I can only shoot targets approved."** Cause: one designation at a time — a new TARGET released the shooter's own
  unapproved mark (r.148 RE-MARK). Now, solo, in TRAIN UP and QUAL 40: any number of marks keep their boxes and T-numbers; TARGET on a marked target
  focuses it (never re-makes it); APPROVE and FIRE act on the mark under the bullseye; only a red one fires; a mark outlives its target going down.
  TRAIN DOWN ends only the hit target's mark. A two-person room keeps its per-shot approval from the other seat.
- **Correction of r.148:** "a new mark releases my own unfinished mark (HOLD RE-MARK)" now holds only where marks do not persist (TRAIN DOWN, a room).
- Addendum 16 (the team marks and approves as H.I., then fires together on best time; then AI marks with HI approval, timed against it) is recorded
  as the direction, not built here.
- Older rows re-pointed to the new law, each named: TARGET_FOLLOWS_THE_EYE, TARGET_BUTTON_FOLLOWS_THE_EYE, RANGE_HIT_50/300, SHEET_HIT_IS_A_HOLE,
  PEER_HIT_TALLIES_AND_CLEARS, LAPSE_RELEASES_THE_BOX, EXPIRED_TARGET_SCORES_NOTHING (run in TRAIN DOWN), NEXT_BUTTON_LIT (run in TRAIN DOWN),
  NO_RAW_IDS_ON_GLASS, RESET_ON_RECORD (starts clean); START_LIGHT_SEQUENCE / QUAL_DONE_SAYS_RESTART: red when QUAL is done.
- **Addendum 17 (verbatim): "also add R for reload on PC computer."** R is the RELOAD button, and like T / Space / F it reaches the game through a
  focused button. QA `KEY_R_RELOADS`.
- Addendum 18 (T-numbers in marking order; approve and fire by number; voice words) is the next revision, r.163.
- QA `KEY_R_RELOADS`, `MARKS_ARE_REMEMBERED`, `MARK_SURVIVES_THE_RETURN`, `QUAL_LIGHT_LAST_THREE_SECONDS`, `QUAL_TIMER_COUNTS`; `START_LIGHT_SEQUENCE` re-pointed to the new law.
- **Correction:** the r.161 section names artefact commit `af6b541`; the sync before the push rewrote it to `0b45687`. r.161 shipped `cafdd9f`, LIVE in
  Verify Live #2477.

## r.163 — Claude Code: T-numbers by marking order, approve and fire by number, a short splash (2026-10-05)
Operator (round folder ASK.md Addendum 18, verbatim): **"As well, we need T1, T2, T3 as order of targets gets labeled.  So I can Approve T3 and Fire T3,
or Approve T1, Approve T3 and Fire 1"**; Addendum 21: **"Note: Splash now stays too long after firing."**
Notes: `CLAUDE_CODE_NOTES_r163.md`. Patch: `patches/r162_to_r163.py` (15 asserted edits). Artefact commit `921ce8a`.
- **T-numbers count up in the order targets are marked** (T1 first); a marked target keeps its number; RESTART starts again at T1.
- **Keys 1–9 go to TN** — the head turns onto it and it becomes the mark SPACE approves and F fires (3 · SPACE · F = approve T3, fire T3). With no TN,
  keys 1–3 keep their r.148 meaning.
- **Voice by number** (one parser, `voiceCmd`): "approve 3" / "approve T3" approves T3 wherever it is; "fire 1" turns onto T1 and fires only if it is red;
  "target 3" goes to T3; "target" marks what the bullseye is on; "reload" reloads; a negation ("don't fire three") holds.
- **The splash is 0.3 s of real time.** It was 0.45 s of game time, and the game clock runs slow when the frame rate drops below 20 fps (each frame
  counts at most 0.05 s), so on a busy PC it hung for seconds.
- QA `T_NUMBERS_IN_MARKING_ORDER`, `VOICE_BY_NUMBER`, `SPLASH_IS_SHORT`.
- **Correction:** the r.162 section names artefact commit `9222164`; the sync before the push rewrote it to `0e6d329`. r.162 shipped `6fe15e4`, LIVE in
  Verify Live #2485.

## r.164 — Claude Code: Settings → VOICE, three engines, a per-voice test (2026-10-05)
Operator (round folder ASK.md Addenda 19–20, verbatim): **"choose top 3, and lets have option to select in settings, once settings, we can test for our
specific voice quality of detection."** and **"Voice calibration should be a separate mode (under settings) to test key words for one's voice profile and
allow for acoustic modeling to enhance detection to a specfiic voice locally to feed model for maximizing chance of detection)."**
Notes: `CLAUDE_CODE_NOTES_r164.md`. Patch: `patches/r163_to_r164.py` (10 asserted edits; the replaced voice block kept verbatim in `patches/r163_onresult.txt`). Artefact commit `bf8cb7c`.
- **ENGINE** (Settings → VOICE, remembered on the device): BROWSER — Web Speech, on the device where the browser offers it · VOSK — on-device Kaldi with a
  closed word list, loaded only when picked (~40 MB once, from the Vosk author's site; unverified from the sandbox) · MY VOICE — TF.js speech-commands with
  a head trained on the player's own clips (~6 MB base once; the trained head stays in this browser).
- **TEST MY VOICE** asks TARGET · APPROVE · FIRE · RELOAD · ONE · TWO · THREE in turn and scores each HEARD / MISSED / CONFUSED (with the word it heard);
  the table and "N OF 7 HEARD" stay on the device per engine.
- **TRAIN MY VOICE** (MY VOICE): 8 clips per word and room noise, trained in the browser, saved in this browser only; **RESET MY VOICE** clears it.
- **One door:** every engine hears through `voiceHeard` → `voiceAct` (r.163's `voiceCmd` first); single-word engines go through a phrase assembler
  ("approve" … "three" within 1.6 s = "approve three"). Voice stays a request: FIRE fires only a red box under the bullseye.
- QA `VOICE_SETTINGS`, `VOICE_PHRASE_ASSEMBLER`, `VOICE_TEST_SCORES` (a scripted voice through the whole test: 4 of 7 heard, "five" scored CONFUSED for
  FIRE); `VOICE_NEGATION_HOLDS` re-pointed to `voiceAct`. Not testable headless: a real microphone, the Vosk model download, the MY VOICE training.
- r.163 shipped `0699abf`, LIVE in Verify Live #2495.

## r.165 — Claude Code: reselect to approve, and a shot target goes away (2026-10-05)
Operator (round folder ASK.md Addenda 22–23, verbatim): **"target is not allowing to be reselected to approve ; test throughally"**, **"Splash stays way too long"**,
**"targets do not disappear when shot."**
Notes: `CLAUDE_CODE_NOTES_r165.md`. Patch: `patches/r164_to_r165.py` (12 asserted edits). Artefact commit `47f66e2`.
- **The "splash" that stayed was the damage ring** over the current mark (drawn while lifePct < 100). It was drawn on a target that was DOWN, and since
  r.162 the mark stays — a ~2.6 m red ring sat on the fallen target until it stood again 3 s later. The ring now shows only on a standing target.
  Measured: 145 red pixels on the fallen 100 M LEFT 1.5 s after the hit in r.164, 0 in r.165 (the real splash shows at 0.1 s and is gone by 0.5 s).
- **Reselect to approve:** SPACE and RIGHT CLICK first make the mark under the bullseye (or the clicked target) the current one, then approve it — they
  stopped at "RED · FIRE" when the current mark was a different red target. A right click approves exactly the target clicked. A TAP on a marked target
  focuses it (it re-marked it, demoting red to amber); a DOUBLE-TAP fires any red mark it lands on.
- **TRAIN DOWN remembers marks** as TRAIN UP and QUAL 40 do; only the hit target's mark ends there.
- QA `RESELECT_TO_APPROVE` (SPACE on T2 after T1 is red, right click, APPROVE button, voice "approve", re-mark keeps red, fire — in TRAIN UP, TRAIN DOWN and
  QUAL 40), `NO_RING_ON_A_DOWN_TARGET`.
- **Correction:** `MARKS_ARE_REMEMBERED`'s TRAIN DOWN half passed vacuously in r.162–r.164 (the first mark had been dropped before the shot, and the check
  only looked for its absence); it now requires both marks red and the shot to land.
- r.164 shipped `a5764e1`, LIVE in Verify Live #2504 (a33863d; #2503 had caught the edge mid-update).

## r.178 — Grok: the operator's baseline, carried after the fact (2026-10-10; registered 2026-10-12)
Hand edit `af6f65e0` ("Color the rounds by how many are left"), never carried, hashed or registered when it was served. Carried here as the
operator's reference: **"r.178 was the last working version before magazins and distorted targets became a reoccuring issue"** (2026-10-11).
sha256 `d39875bec3f4e2c5…`, 531,981 B. Its `BUILD.revision` still said `'0.166'` while the header said r0.178 (the stale class, r.177–r.185).
Not served again as r.178; r.196 is built from these bytes.

## r.195 — Grok: the last hand edit, carried as the record (2026-10-11; registered 2026-10-12)
Hand edit `14a930d0` ("Use the Vision-2525 R-CORE badge on the range"), served through `8f9b354` while `deck-consistency` (4), `drone-playable` (4)
and `traceability` (1) were red in CI — Cloudflare Workers Builds deploys on push regardless of the gate. Carried so the record shows what the
operator met (**"r.195 is soo beyond messed up as targets dont work"**): plates enlarged below 28 px (r.180), the firing pits not drawn, `roundOpen`
loosened (r.193), a fixed R-CORE badge over the picture with a five-row hand list, the deck's own QA row rewritten to the new layout.
sha256 `7b02aed71bc2e78b…`, 547,290 B. Not served again.

## r.196 — Claude Code: RESTORE — the r.178 base, every target TARGET → APPROVE → FIRE, the r0.178 picture (2026-10-12)
Operator (docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md, verbatim): **"please review Drone-2525 / R-CORE AND recent
revisions was messed up by Grok. I need help restoring functionality; attached is the last know version"** · **"all targets must have user Target,
Approve, and fire / targets turn Amber when targeted and after approved turn red"** · **"r.178 was the last working version before magazins and
distorted targets became a reoccuring issue"** · **"ensure magazines don't get distorted; heres correct ones"**.
Notes: `CLAUDE_CODE_NOTES_r196.md`. Patch: `patches/r195_to_r196.py` — SRC is `drone-2525_r.178.html` (26 asserted edits). Artefact commit `a18880d`.
- **Invariant:** every standing target needs TARGET → APPROVE → FIRE from the person on the glass, in every mode; a target is drawn at its true
  size and hit on that size; the served deck is a carried, hashed, registered revision; a red gate never ships.
- **QUAL 40 every target** (r.169 `b6487246`, undone by `b2dfa80a`): `keepsMark` is false in every mode — no mark rides a target down and back up;
  a plate that just stood is released. TRAIN UP keeps r.166; TRAIN DOWN keeps r.165 (the hit one's mark ends, the others stay).
- **The r0.178 picture is the master, the code base is `af6f65e0`.** Headless at 428×926, `af6f65e0` draws two 86×115 cards at left 8 / top 92
  with the light above at top 42 — NOT the operator's screenshots (RELOAD left, the count CENTRED, the light on the SAME row, ~56×70 cards,
  RESTART at the right of the menu row). What he saw was served by hand from a working copy that never reached git. r.196 draws the picture:
  one row at top 42, cards and light 75 px tall, the count centred to 0.0 px, the magazine drawing 26×52 (its 48:96 viewBox at exactly 1:2,
  never scaled unevenly), mode · lane · RESTART(right), the strip above the row, the score under it. Measured by `MAG_ROW_ONE_LINE`.
- **Plates at true size:** no pixel floor in `silMesh` (r.180 enlarged anything under 28 px — the "distorted targets"); `PLATE_DRAWN_AT_TRUE_SIZE`
  holds the drawn outline to `plateDims` at 50 m and 300 m, 1× and 3×. The firing pits (`RANGE_WIRE`) are drawn, as in r.178.
- **THE RANGE** on both intro screens and from the QR link (`?range=21&role=turret&mode=train-up`, r.187) opens Lane 21 in PRACTICE (r.192) — the
  QR link r.178 printed was read by nothing.
- QA rows re-stated to the operator's rule: `EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE` (TRAIN UP, TRAIN DOWN, QUAL 40: bare F refused · TARGET amber ·
  F refused · APPROVE red · F hits · down and unmarked · in TRAIN UP the returned target needs it all again) replaces `MARK_SURVIVES_THE_RETURN`;
  `MARKS_ARE_REMEMBERED` (the hit ones released, the amber one kept; QUAL ends unmarked); `NO_RING_ON_A_DOWN_TARGET` (down AND unmarked);
  `RANGE_MENU_ON_SCREEN` (RESTART at the right); new `MAG_ROW_ONE_LINE`, `PLATE_DRAWN_AT_TRUE_SIZE`. Boot QA 214/215 both orientations (SYNC_DIRECT).
- **Red first:** on the r.178 bytes the deck's own QA read 209/213 — `MARK_SURVIVES_THE_RETURN`, `MARKS_ARE_REMEMBERED`, `NO_RING_ON_A_DOWN_TARGET`
  red (they asserted the r.162 held mark that r.166 had already retired); on `8f9b3540` the gates read deck-consistency 47/4, drone-playable 111/4,
  traceability 60/1.
- **The CI door:** `frontend/package.json` `prebuild` now runs `drone-revisions`, `deck-consistency` and `drone-playable` — Cloudflare Workers
  Builds runs `npm run build`, so a red deck gate fails the build and the site stays on the last green SHA.
- **Register catch-up and corrections (on the record, never edited):** r.166–r.177 and r.179–r.194 were uncarried hand edits — `d6bcc160 bb7bb3cd
  2073d154 b6487246 bb3ecc9e 8ccb37b5 0ebffc7c 061b5757 63a135a0 7cbe041c 82b3c0bb b2dfa80a dc495fe6 · 50826908 2960980f 84c86cf9 aac4db9b 04d76634
  60d5a411 12962de7 6a4097f6 44631941 ddb5108d 040a21ba 61b4d49d 7ffd164e 8206a28b a146c120 3ba0f97c 5a6b64bb 43a0dc46 074ac55c 3380e7b1`; r.187–r.189
  were used twice (`ddb5108d`/`040a21ba`/`61b4d49d`, then `7ffd164e`/`8206a28b`/`a146c120`); `BUILD.revision` lagged the header from r.177 to r.185;
  ledger revs 65–72 cited the parent commit; r.165's `shipped` placeholder is filled (`4bb4a3f`); ledger rev 61's `commit` is filled (`82b3c0bb`).
- Not in r.196 (carried by r.197–r.199 on this base): the TRAIN DOWN clock (r.182), the cold range (r.179/r.181), the pose cards (r.180–r.194), the
  R-CORE history (r.195) — in the shared format, from the shared ledger.
- Credit: Sensor Fusion (`frontend/app/SensorFusion-2525`) works and was built with the Grok bot; it is untouched here (operator 2026-10-11).

## r.197 — Claude Code: TRAIN DOWN — the clock under the light, from START to the last target, on the record (2026-10-12)
Operator (2026-10-11, verbatim): **"Train-Down where we have timer under stop light tonsee how fast to target all 3"** · **"that way a 3v3 drone can have
challenges targeting number of targets (6 people per team), to find the best time similar to Train-Down at "The Range.""**.
Notes: `CLAUDE_CODE_NOTES_r197.md`. Patch: `patches/r196_to_r197.py` (base r.196, declared and asserted; 17 asserted edits). Artefact commit `f65885b`.
- **Invariant:** TRAIN DOWN is a timed run on the record. START raises the lane's targets and opens the clock as a decision row behind the same door as
  a shot; the clock stops the instant the last target is down and the time is a decision row; both reach every seat and enter the replay hash.
- **What a player meets:** pick TRAIN DOWN (or open the QR link in that mode) — every target is down, the light says WAIT, the button says START.
  START — every target stands, the clock runs under the lamps (TIME m:ss.t), the strip carries it. The last target down — ALL DOWN · m:ss.t on the light,
  the strip and the hint; RESTART re-arms. START before the round opens, or while the clock runs, is refused with a REJECT row.
- **The target set is declared** on the START row (`targets:N` — the lane's 11; `TRAIN_DOWN_N` raises the nearest N when set), so the 3v3 challenge
  varies a number, not the mode (DD-04). The operator's "all 3" is an open decision, recorded; the default is the lane.
- Ported from r.182 (`aac4db9b`, a hand edit never registered): `downArm` / `downStart` / `downClockWord`, the START relabel, the words on the light and the
  strip — now behind `downStartOnRecord` (`decide('START')`) and `downStop` (`decide('TIME')`); the rows travel like RESET and a peer START runs the same
  lane's clock; a peer TIME is the time. A reset clears the clock in every mode.
- QA: `TRAIN_DOWN_CLOCK` (armed → START → running → the last target → the time on the light, the strip, the hint, the row within 50 ms),
  `TRAIN_DOWN_ON_THE_RECORD` (refused before the round, refused while running, START and TIME rows, the replay hash moves); `MODE_DOWN_ALL_DOWN` re-stated
  through START. Boot QA both orientations; `drone-team-e2e` 10/10.

## r.198 — Claude Code: QUAL — the five positions as the operator's own figures, one at a time, matched to the four magazines; the range goes cold (2026-10-12)
Operator (2026-10-11, verbatim): **"i need Raster for each pose"** · **"I want clear rasters for 5 shooting positions; same height as magazines and stop
light accept a rounded square"** · **"we match the shooting position tonthe target and 4 magazines that we actually test in wualifications for army
range"** · **"mini poses are raster sinplications 1983 starwars video game style with words of these 5"** · **"standing; Prone unsupported, Prone
Supported, Kneeling Supported, Standing Supported"** · (2026-10-12) **"dont use stick figures; better high resolution modern images, make gun different color than person"**.
Notes: `CLAUDE_CODE_NOTES_r198.md`. Patch: `patches/r197_to_r198.py` (base r.197, declared and asserted). Artefact commit `d93370d`.
- **Invariant:** in QUAL the pose on the card is the position the current engagement is fired from and the magazine is the one the Army test loads
  for that phase (1 STANDING · 2–5 PRONE UNSUPPORTED · MAG 1 · 6–10 PRONE SUPPORTED · MAG 2 · 11–14 KNEELING SUPPORTED · MAG 3 · 15–18 STANDING
  SUPPORTED · MAG 4); every target still needs TARGET → APPROVE → FIRE; the table ends cold, on the record (a COLD row with hits, rounds, score).
- **The rasters:** his own TC 3-22.9 figures (`docs/asks/img/…shot3..7.jpg`), traced at high resolution by `frontend/scripts/trace-poses.mjs` with the
  recipe `docs/drone-2525/poses/poses.v2.json`: Chromium decodes the page, the pixels are classed (paper → transparent · the uniform's grey → the
  PERSON, T13.SI · the long mid-grey rows → the RIFLE, T13.DOME · thin black → outline, T13.ROAD), the numbered callouts are found by their white
  interiors, their digits and their rings and painted over along their radii, the prone figures are mirrored so every rifle points right, and the
  figure is fitted into 256×256 by majority vote; Node writes a 2-bit palette PNG with stored deflate (`pose-0..4.png`, ≈16.7 KB each,
  `POSES.sha256`), embedded in the deck as `POSE_PNG` data URIs so it stays one file. No stick figures; the gun is never the person's colour
  (operator 2026-10-12). The word is the card's label.
- **The card:** `#posWell`, a rounded square (radius 12) of exactly the magazine card's height (75 px), between the count and the light on the same
  row, QUAL only; one `<img>` whose source follows the engagement (`POSES`, `POSE_BY_ENG`, `qualPose`, `paintPos`); the rest between phases shows
  the next position; done reads RANGE IS COLD.
- **The cold range** (r.179 `50826908` / r.181 `84c86cf9`, hand edits never registered, carried): the 40th round lowers every plate and clears
  every mark; the glass says CEASE FIRE · UNLOAD · SHOW CLEAR · the score · THE LINE IS CLEAR · RANGE IS COLD · PRESS RESTART; the light says
  CEASE FIRE · COLD; RELOAD reads UNLOAD and refuses (NO MAG when the fourth is spent); a cold line draws no silhouette and no board; a plate
  stands only while its own exposure is up (`qualDropStrays`); `decide('COLD')` carries hits/rounds/score and travels like RESET.
- QA: `POSE_MATCHES_THE_ENGAGEMENT` (11 engagements walked, the rest between phases, done, outside QUAL), `POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT`
  (measured), `QUAL_ENDS_COLD` (every plate down, marks cleared, the words, UNLOAD refuses, the COLD row, the light); `QUAL_DONE_SAYS_RESTART` re-stated to
  the cold words. Gate `tests/pose-rasters.test.mjs` (node-only, in prebuild): the carried PNGs are 256×256 2-bit palette files whose palette is exactly
  transparent · person · outline · rifle from the deck's own T13; both decks embed them byte-equal; the words, the table; the tracer carried.
- Open (default, on the record): the phase-rest sentence stays r.178's "PHASE n · <position> · PRESS RELOAD · MOVE" (r.181's tower voice "CEASE FIRE
  · LOCK AND LOAD" is not carried); the colours — person ivory (T13.SI), rifle gold (T13.DOME), outline T13.ROAD — are one line each.

## r.199 — Claude Code: QUAL — the five positions are his own picture, cut exactly, on a square box against the light (2026-10-12)
Operator (2026-10-12, verbatim): **"use my images exactly for 5 shooting positions"** · **"DO NOT USE your images BUT eXeL AI corrected inages"** ·
**"STOP TRYING YOURS USE MINE / DELETE THE ORIGINAL AND USE eXeL AI"** · **"heres the correction, just remove borders around text"** · **"so when
showing positions it will be in square box right of the center magazine with counter (as visual reminder to gamer"** · **"better yet, have it
left of fire box"** · **"with stop light indicstor on targets"** · **"push and commit"**. Ask file: `docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md`
(addendum 2026-10-12, shots 12–28). Notes: `CLAUDE_CODE_NOTES_r199.md`. Patch: `patches/r198_to_r199.py` (base r.198, declared and asserted). Artefact commit `4911e6b`.
- **Invariant:** the position on the card is HIS figure — cut from his own picture by one carried script, never redrawn, the rifle its own colour
  as he drew it — one at a time, matched to the engagement and the magazine as in r.198; the box is a square of the magazine's height that sits
  against the light's left edge and never touches the count, on a 375-px phone as on a wide one; the targets keep the light's colours (amber
  targeted, red approved — r.196).
- **The figures:** his picture `docs/asks/img/2026.10.11_18.56..53_drone2525_shot12.png` (the five on black, hashed in the ask's sidecar) →
  `docs/drone-2525/poses/cut-stances.py` (python3 + ImageMagick): each figure is its own connected shape above the black (a shape under 5,000 px
  joins the figure within 30 px — the wall top of the fifth), so a neighbour's rifle tip or boots never enter the next card; the cut keeps every
  pixel of the figure with the dark lines inside it (the mask closed by 3 px), takes nothing of a neighbour, and fits the longest side to 256 px
  → `stance-0..4.png` (RGBA, 19–57 KB), `POSES.sha256`. Embedded as `POSE_PNG` data URIs; the deck stays one file. The r.198 traced figures
  (`pose-0..4.png`), their recipe (`poses.v2.json`) and the tracer (`frontend/scripts/trace-poses.mjs`) are deleted ("DELETE THE ORIGINAL");
  `HASHES_r198.sha256` still names them as what r.198 shipped.
- **The words:** his labels from his own cards (shots 13/14), in his order: TACTICAL STANDING · UNSUPPORTED PRONE · SUPPORTED PRONE · SUPPORTED
  KNEELING · SUPPORTED STANDING (the Table VI order; `POSE_BY_ENG` unchanged). The label's border is not drawn; the word alone, under the figure, in the cyan of his cards (T13.WIRE); the toast between phases says the same words (`IWQ_VI[].pos`).
- **The box:** `#posWell` keeps its 75×75 square (radius 12) and moves from "right of the count" to `right:76px` — against the light's left edge
  with 4 px between; the light takes one width (`#app.range #startLight{width:72px}`, the word's letter-spacing .06em, the clock 11 px) so WAIT ·
  READY · FIRE · CEASE FIRE · the QUAL count ("NEXT 3 S") · the TRAIN DOWN clock all fit and the box clears the centred count by 7 px on a 375-px
  phone (14 px on 390). The figure stands on the floor of a 69×52 box (`#posPic`), fitted with its shape kept, the word under it.
- QA: `POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT` re-stated (square of the magazine's height; one row; against the light ≤ 8 px, clear
  of the count ≥ 4 px, measured; the figure box 69×52 and the picture's fit) · `POSE_MATCHES_THE_ENGAGEMENT` re-stated to his words. Gate
  `tests/pose-rasters.test.mjs` rewritten: his picture carried and in the sidecar; the cut script carried; the five RGBA 256-px PNGs under 64 KB;
  `POSES.sha256`; both decks embed them byte-equal; his words and the table; the CSS of the box and the light; the originals gone.
- Kept, on the record: "stop light indicator on targets" = the targets carry the light's colours (r.196 `PHASE_COLOUR_FOLLOWS_THE_SLOT`).
- Owed next, one at a time: the magazine proportions to his crops (shot15 flipped on the y axis, shots 17/18 copied exactly, the count centred);
  the label clutter (shots 21/22); Drone-2525 on the Vision-2525 worlds page (shot20); R-CORE in the shared format (shot19) → r.200.

## r.200 — Claude Code: the magazine drawn as his picture (2026-10-12)
Operator (2026-10-12, verbatim): **"fix fucking magazine proportions"** · **"I even have correct zoomed version ton-use to copy exactly"** (shots 17/18) ·
**"also here is original magazine, ya need to flip around y axis to match correct image. Also see right proportion of range (as Grok messed up
original layout)."** (shot15, shot16) · **"why dont the magazines still not look like image 3?"** (image 3 = his r0.178 picture, shot1). Notes:
`CLAUDE_CODE_NOTES_r200.md`. Patch: `patches/r199_to_r200.py` (base r.199, declared and asserted). Artefact commit `bfab534`.
- **Finding:** the r0.178 code (`af6f65e0`) draws a three-dimensional box in perspective (a trapezoid and a side plane, `M16 22l18-4 4 66-22 4z`)
  at 36×82 in an 86×112 card; his r0.178 picture draws a FLAT magazine — ink 17×46 CSS (ratio 0.37) in a 57×71 card. The picture never came from
  that code (the r.196 restore carried the code's drawing at 26×52, so the ink stayed a narrow box, 12×38). The picture is the master.
- **Invariant:** both cards draw ONE outline measured from his picture into the 48×96 viewBox — the neck with the feed lips (x 11.5–26.2 at the
  top), the step to the body's top-left corner, the right shoulder, the body tapering right with the bend past two thirds, the bottom-right corner,
  the sloped floor (ink x 7.6–39.7, y 4.6–91.2, ratio 0.37), the window (22.4–28.2 × 16.2–21.3), four grid rows (y 38.3 · 54.4 · 69.8 · 81.5) and
  two grid columns following the taper — rendered in the 26×52 box (1:2, never stretched) so the ink is ≈ 17.4×46.9 CSS; the count magazine
  lights its 19 round lines inside that body (`inner()` from the outline, 1.4 in from each wall); the RELOAD word's letter-spacing .14em → .06em
  brings the card to ≈ 59 px (his 57).
- Measured from the picture: `docs/asks/img/2026.10.11_18.56..53_drone2525_shot1.png` at 3× (the cyan ink x 84–134, y 654–790; row by row).
- QA: `MAGAZINE_IS_HIS_DRAWING` (both cards one outline; the outline's bbox 32.1×86.6 of 48×96, ratio 0.37; the ink in CSS within 1.5/2 px of his
  17.4×46.9; the box 26×52; the grid 4 rows + 2 columns; the window in both; the 19 round lines inside the body). `MAG_ROW_ONE_LINE` unchanged
  (one row, the count centred, the 1:2 box). `drone-playable`: the outline twice, no perspective box, 19 round lines, the word's spacing.
- **Corrections from the AsM review of r.199** (Sofia · Thor · Enlil, after its push): the light is now the row's height (75) like the magazines and
  the box, one width (72) in every range mode, and nothing it shows wraps ("NEXT 10 S", the clock, CEASE FIRE · COLD — `LIGHT_WORDS_FIT_ONE_WIDTH`);
  the strip's line under the row no longer meets the light; a phone narrower than 368 px gets a 64-px light so the box still clears the count;
  the two code comments that still spoke the old position words say his; the pose-rasters gate pins the five figures' and the cut script's sha256
  so a redrawn figure cannot pass as his. The r.199 release note says plainly that "stop light indicator on targets" built nothing new.
- Owed next: the label clutter on marked targets (shots 21/22) · Drone-2525 on the Vision-2525 worlds page (shot20) · R-CORE in the shared
  format (shot19) → r.201+.

## r.201 — Claude Code: the magazine keeps its frame (2026-10-12)
The AsM review of r.200 (Sofia), against the operator's r0.178 picture (shot1 at 3 rounds: the gold frame, three red lines, a red "3"): r.200 painted
the whole count magazine amber or red below 21 rounds (`hudMag`, a line of r.178's code the picture never showed). Notes: `CLAUDE_CODE_NOTES_r201.md`.
Patch: `patches/r200_to_r201.py` (base r.200, declared and asserted). Artefact commit `9ea7ef4`.
- **Invariant:** the frame is gold at every count; the colour of the count lives in the round lines and the number only; a count of n ≤ 19 lights at
  least n lines (3 → 3, 12 → 12; 20 and above read full); nothing else of r.200's drawing changes.
- **His colour rule, stated 2026-10-12:** GREEN at 20 rounds and above · AMBER 6 to 19 · RED 5 and under. r.178's line read green only above 20
  (amber at exactly 20); `hudMag` now follows his words; the QA row holds 19 amber and 20 green.
- Also from that review: the number at the word's size and weight (11 px, 500 — his "3" is small); the RELOAD word back at his picture's spacing
  (.14em; the card takes the width his phone's font gives it — r.200's "59 px" was a Linux-font number).
- QA: `MAGAZINE_KEEPS_ITS_FRAME` (3, 12 and 30 rounds: the frame's stroke, the lit lines, the number's colour, restored after). `drone-playable`:
  the gold line, the lit rule, the number's size, the word's spacing.
- Owed next: R-CORE in the shared format (the rehearsed port, now r.202) · the label clutter was answered by r.196 (`LABELS_ONLY_WHILE_MARKED`) ·
  Drone-2525 on the Vision-2525 worlds page (its own commit, outside the deck).

## r.202 — Claude Code: the magazine row is his three pictures (2026-10-12)
Operator (2026-10-12, verbatim): **"These are exact image ton-use; create final raster and use exact proportions"** (shots 29–31: the stop light at
ALL DOWN · 0:21.5, the count magazine at 29, the RELOAD magazine) · **"height of all magazines, standing position and stop light need to be same"** ·
**"we had right dimentions on r.178 and you are still getting magazine wrong"** · **"WHEN INFIVE YOU AND IMAGE FOLLOW EXACTLY!"**. Notes:
`CLAUDE_CODE_NOTES_r202.md`. Patch: `patches/r201_to_r202.py` (base r.201, declared and asserted). Artefact commit `ab65de4`.
- **Invariant:** the RELOAD drawing and the count magazine's frame and fill are RASTERS cut from his pictures, never redrawn; the cards keep his
  proportions (RELOAD 60×75 = 0.80, the count 42×75 = 0.56, the light 56×75 = 0.747, two px wider than his 0.731 so TIME 12:34.5 fits) at the one row height with the stance box (75); the ink sits in
  each card where his picture puts it (18×48: 30 % / 43 % of the width, 64 % of the height, from 7 % down); the count's fill is clipped from the
  top by the rounds left (his picture at 29 is the full fill) and recoloured by his rule (green ≥ 20 · amber 6–19 · red ≤ 5); the frame never changes.
- **The rasters:** `docs/drone-2525/magazine/cut-magazine.py` cuts them from `docs/asks/img/…shot30.png` (the count) and `…shot31.png` (RELOAD):
  each pixel's alpha is how much of the ink colour it carries, other hues refused; the frame and the fill on one canvas so they overlay 1:1; fitted
  to 72×192 (the ink is 18×48 CSS at 4×); the fill recoloured to his amber and red → `reload-ink.png`, `count-frame.png`, `count-fill-green/amber/red.png`
  (7–9 KB each), `MAGAZINE.sha256`. Embedded as `MAG_PNG`; `MAG_FILL_TOP/BOTTOM` (11.3 % / 92.0 % of the canvas) measured from his picture.
- **The light:** 56×75 (0.747; his box is 0.731 = 55 px, the extra px is for TIME 12:34.5) with the lamps 10.6 px (19 % of its width) in a column, the word 6.5 px and the clock 9 px under them, measured from his picture (shot29), not cut from it — the light keeps live lamps and words, so it is the one card that is not a raster;
  every word it shows fits (`LIGHT_WORDS_FIT_ONE_WIDTH`); the stance box at `right:60px`; the narrow-phone rule of r.200/r.201 is no longer needed
  (the box clears the count by 16 px even at 360) and leaves.
- QA: `MAGAZINE_IS_HIS_DRAWING` re-stated (his rasters by src, 18×48 in 60×75 and 42×75, his proportions ±2 %), `MAGAZINE_KEEPS_ITS_FRAME` re-stated
  (the frame src unchanged at 3/12/19/20/30, the fill red/amber/amber/green/green, the clip monotonic and at the measured top at 30, the number's
  colour), `MAG_ROW_ONE_LINE` measures the rasters' boxes (0.375), `LIGHT_WORDS_FIT_ONE_WIDTH` at 56×75. New gate `tests/magazine-rasters.test.mjs`
  (node-only, prebuild + test:ci): his pictures in the sidecar, the cut script pinned, the five PNGs pinned and embedded byte-equal, the CSS of the
  cards, the light and the box, no SVG magazine left. `drone-playable` re-stated (no `<svg viewBox="0 0 48 96">`, ten PNG data URIs).
- Owed next: the twelve Masters' QUAL 40 AAR fixes (r.203) · R-CORE in the shared format (r.204).

## r.203 — Claude Code: the rounds as in his picture (2026-10-12)
Operator (2026-10-12, ~03:50, on the LIVE r.202, verbatim): **"rounds mist be in magazine"**, then his reference picture (~04:15, shot40: the
two magazines at 10×, the counter at 30 with nineteen distinct bars inside the walls, over the grid, below the window). shot40 is the r.200
preview — this session's render of the magazine drawn from his r0.178 picture — which he sent back as his reference: his choice, the session's
render. The choice of shot40 over his r0.178 photo (shot30/33) is taken under his sign-off of ~10:25 ("approve all your own decisions; document changes", on the
ask's record). Notes: `CLAUDE_CODE_NOTES_r203.md`. Patch: `patches/r202_to_r203.py` (base r.202, declared and asserted). Artefact commit `4adfe70`.
- **Cause:** r.202's fill was cut from his r0.178 phone photo at 29 (shot30): twenty-eight thin lines from just under the body's top line,
  through the window — a hatch at the card's size, a solid block over the window on the phone. A first draft (the frame painted over the fill)
  was refused by the Spiral round: the two rasters never overlap where both are opaque, so it changed almost no pixel he could see.
- **Invariant:** the counter's rounds are his reference's bars — distinct, inside the walls, over the grid, below the window — one bar per
  round (the lowest r of his nineteen; nineteen to thirty is the full picture); the frame is the uncovered magazine (walls, window, the full
  grid) under the bars; the RELOAD ink and the counter's frame and fill are rasters cut from shot40, pinned, never redrawn; the cards, the
  light and the box of r.202 unchanged.
- **The cut:** `docs/drone-2525/magazine/cut-magazine.py` now cuts shot40 (2000×1818; the counter at x 506–785, y 93–818, RELOAD at x 81–359,
  both 280×726 at 10×) into the same five 72×192 rasters (2.8–6.6 KB): the RELOAD ink in cyan; the counter's FRAME = the same uncovered
  drawing recoloured to his gold (in shot40 the counter's own grid is covered by its bars, so a frame cut from the counter carried holes — the
  Spiral round caught it on the first cut); the fill from the counter's box. `BARS.json` is written by the cut (the nineteen bars' tops and the
  foot → `MAG_BAR_TOPS`, `MAG_FILL_TOP` 32.0 %, `MAG_FILL_BOTTOM` 96.4 %) and pinned with the rasters in `MAGAZINE.sha256`. `hudMag` clips to
  the top of the (19 − r)-th bar; the fill stays painted over the frame (the r.202 markup order), so the bars cover the grid as in his drawing.
  r.202's cut (shot30/31) is superseded in place; its bytes live at the r.202 artefact commit `ab65de4` (`HASHES_r202` no longer checks out
  against the tree for the seven magazine lines — said here, as r.198's did after r.199).
- **Gates:** `ROUNDS_ARE_INSIDE_THE_MAGAZINE` (new, deferred: the frame, fill and RELOAD rasters decoded to a canvas — every fill row between
  the walls, nineteen distinct bars, the band from 32 % to 96 % of the body, below the window, the frame's grid whole: its interior rows at
  least 95 % of the RELOAD ink's), `BARS_OVER_THE_GRID` (new: the fill painted over the frame, one box),
  `MAGAZINE_KEEPS_ITS_FRAME` re-stated at his bars (3 → 86.7 %, 12 → 56.0 %, 30 → 32.0 %; one bar per round in a 10-round magazine),
  `MAGAZINE_IS_HIS_DRAWING` and `MAG_ROW_ONE_LINE` unchanged and green; `tests/magazine-rasters.test.mjs` re-pinned to shot40 and the new cut,
  `MAG_BAR_TOPS` equal to `BARS.json`, the six-line `MAGAZINE.sha256` true file by file.
- **Said plainly:** 30 and 29 and every count from nineteen up draw the full picture (his reference is at 30 with nineteen bars); the first
  shots of a 30-round magazine move the number, not the bars.
- **Owed, by his ask (no numbers decided here beyond the next):** r.204 — his 04:00–04:08 words: "I should be able to target all, then come back
  and approve all, then fire all" · "buttons must change to step we are on" (the lit button and the strip follow the mark under the bullseye;
  a caption never covers a control — shot41/42) · then the twelve Masters' QUAL 40 AAR (B1 the frozen fall at the window's end; H1 the 30-round
  first magazine from the deferred self-check; H2 the bare lane post; H3 the rest toast; N1 a toast's lifetime) · then R-CORE in the shared format.

## r.204 — Claude Code: the buttons follow the bullseye; a caption never covers a control (2026-10-12)
Operator (2026-10-12, 04:00–04:08, on the LIVE r.202; his words with the spelling straightened — the ask file holds them as typed):
**"make sure if I target once and come back I still have to approve. I should be able to target all, then come back and approve all, then fire
all"** · **"buttons must change to step we are on"** (shot41, shot42). Then ~10:25: "approve all your own decisions; document changes". Notes:
`CLAUDE_CODE_NOTES_r204.md`. Patch: `patches/r203_to_r204.py` (base r.203, declared and asserted). Artefact commit `450e156`.
- **Found first (no rework):** TARGET (`markLock`), APPROVE (`approveDesig`) and FIRE (`fireN`) already acted on a MARKED plate under the
  bullseye and kept an earlier amber (r.162) — target all, approve all, fire all already worked when the head was on the plate; but the LIT
  button, the strip and the step toast read the CURRENT mark and lagged the reticle (TARGET lit while the bullseye sat on a red), APPROVE on an
  UNMARKED plate approved the current mark behind him, a tap marked without turning the head, and FIRE lit beside a red the bullseye was not
  on (where FIRE refuses). Captions floored at H-44 of the canvas, below the button row, so at 3.3× an off-screen 50 m plate's caption printed
  over TARGET and FIRE.
- **Invariants ((a) in the solo modes — TRAIN UP, TRAIN DOWN, QUAL 40; a LIVE room keeps r.203's reading of the current mark, listed under
  Owed; (b) in every mode, gated solo):** (a) the glass and the actions read ONE mark, the one under the bullseye — the lit button, the strip
  and the step toast name its next step (unmarked → TARGET, amber → APPROVE, red → FIRE only with the bullseye on it, else AIM ON IT — the FIRE button and AIM ON IT follow
  fireOnIt in every mode, the challenges and a LIVE room included); on an UNMARKED plate the recital names THAT plate and its step
  ("150 M RIGHT · PRESS TARGET"), never the last plate shot (operator 2026-10-12 18:40, shot44/45); with NOTHING under the bullseye no button
  lights and no other plate's step is recited (DD-13e) — the MAP excepted, it has no bullseye and keeps the current mark (r.133); in every solo mode, QUAL 40 included, a tap turns the head onto the tapped
  plate and the double-tap still fires what the first tap touched when the second tap lands on it, never on blank sky (DD-13a); APPROVE on an
  unmarked plate holds NOT_MARKED and touches no other; with nothing under the
  bullseye, the current mark's step (an amber's APPROVE; nothing for a red); a step toast ends when the plate under the bullseye changes after
  it rose and never before its own confirmation shows; (b) a caption and a board's words never cover a control or a line of the HUD; a caption
  that would is moved (the other side, then below the plate, then up to the line) and dropped only when no place is free; a mark off the
  picture keeps its edge caption (r.203's reminder).
- **Fix, the class (ten cuts, nine rounds):** `markUnderBullseye()` (the one mark the glass and the actions read), `fireOnIt(s)` (fireN's one
  on-target rule lifted — a plate: the bullseye on its outline; a ring: the bullseye ring; anything else within LOCK_REACH_PX; never on the
  map — so the lit button, the strip and the action read the same) and `stepFor(mark)`;
  `approveWorksHere(d)` / `fireWorksHere(d)` become tests of A MARK (the current one by default — the existing callers unchanged); `nextStep`
  lights for that mark, FIRE only when `fireOnIt` holds, and `hudPhase` names it (AIM ON IT for a red elsewhere);
  `hudPhase` gained the unmarked-plate clause before its LAST line (the eighth round: after any hit the strip fell through to "LAST · 50 M LEFT · DOWN" — his own shot45 scene — while TARGET was correctly lit); `nextStep` lights nothing when `lockOn()` is empty; `approveDesig` refuses on an unmarked plate under the bullseye (NOT MARKED · PRESS TARGET FIRST, after the down-holds, only for a plate
  mark); in every solo mode a tap turns the head onto the tapped plate (as `goToT`) and `state._tapObj` keeps what the first tap touched
  for 320 ms so the double-tap still fires it — only within 40 px of the first tap (the third round caught the tap-aim breaking the
  double-tap; the fourth caught the second tap on blank sky firing it, r.131; the fifth caught the QUAL 40 exception to the tap-aim: on his
  first screen the toast said APPROVE while TARGET was lit — the tap-aim is every solo mode now); `toast(m, plate)` carries its
  plate and what was under the bullseye when it rose, and `paintCues` ends it only when that changes (the second round caught the first cut
  parsing the toast's text and wiping the FIRE-on-amber refusal; the third caught the plate-only FIRE test leaking onto the Capitol pops). `hudKeepOut()` = the ONE keep-out list (the button row, the sticks, RELOAD, the counter, the stance box, the light,
  the full-screen and menu buttons, the strip and the score line, the magazine line, the board, the toast, the counter card; the sticks with
  their label band; and the words the painter itself draws on the stage — the corner's two lines, the lane and the FPS, and the LOCK line,
  measured where they are drawn), cached per picture size and a 200 ms window, the toast's band kept once seen; `plateCaptionRects` bounds a caption by `captionCeiling(H)` and `captionFloor(H)` from that list and
  MOVES a caption that would touch one — the other side, then below the plate, then up to the line — dropping it only when no place is free
  (the second round caught the first cut deleting most landscape captions at 1×; the third caught a 14-px clamp losing the off-top captions and
  the stick label band uncovered; the fourth cut's own 3.3× picture, read before the fourth round, showed a 50 m caption over the FPS — the
  painter's lines are not DOM elements, so neither list saw them: the fifth cut lists them in both, lets a caption climb past every line it
  meets (a two-line block defeated one step) and has the row measure them on the live canvas; the corner's lane label measured at the 13 px it
  is drawn with); `boardLabels` takes the same list, and a board's words that would touch a control climb the post or drop below it — past a
  target, as far as the picture allows, never sideways (r.159: the sign stays on its post's line) — and the post is drawn on to the moved sign,
  before they are dropped — the post in the pieces that clear every control (6 px off), every word, every standing target and the bullseye
  box, and the row counts the crossings (the fourth round: at 667×375 r.203 printed my lane's 100 m numbers over RELOAD and the counter, and the keep-out alone dropped
  them; CI saw neither at 390×844 and 844×390 alone; the fifth round: the moved signs left bare posts; the sixth: the unclipped post ran
  through RELOAD and the reticle; the seventh: through his targets); a caption's ceiling is the band above IT, not one line across the
  picture, and a caption stays within 40 px of a plate that shows in the open stage (the seventh round: landscape captions pulled onto the
  reticle); the come-back tap's toast names the plate in words and ends with its plate, the peer messages name the plate in words, and the
  NOT_MARKED hold is booked against NONE with the plate under the bullseye named in the row (r.148: never a plate nobody marked); hudKeepOut's cache is keyed on the picture's size and a 200 ms window, never on the tick (rebuilt every
  frame; stale across PAUSE and a rotation); the strip says PRESS RELOAD on an empty magazine, on a red and on an amber (it said PRESS FIRE or PRESS APPROVE with nothing lit); a peer's
  HOLD names the plate in words; the off-stage clause is gone, so a mark off the picture keeps its edge
  caption. Nothing else moves.
- QA: `BUTTONS_FOLLOW_THE_BULLSEYE` (TRAIN UP: three marked, each come-back reads APPROVE, approved reads FIRE, an unmarked plate reads TARGET
  while reds stand, three fired, the strip names the same mark; TRAIN DOWN the same; QUAL 40 in a real exposure window: two up, marked, come
  back and approve both, then fire both, two hits; a non-silent pass: the step toast shows on its own plate,
  ends when the bullseye leaves it, and the FIRE-on-amber refusal stays; a red the bullseye is not on lights nothing and says AIM ON IT;
  APPROVE on an unmarked plate holds NOT_MARKED and touches no other; a confirmation for a plate the bullseye is not on stays and ends on the
  next plate) and `CAPTIONS_CLEAR_OF_THE_CONTROLS` (the row's OWN list of every visible element over the stage — not the painter's — sixty
  looks: 1×, 2×, 3.3×, 5× and 8× × the far and the near plate × pan −6/0/+6° × tilt −4/0°: 0 words on any element; every mark captioned at
  every look; then QUAL 40 with the stance box on the row, twelve looks, the same), in
  the deck's boot QA, `tests/deck-qa-manifest.mjs` and `scripts/drone-deck-qa.mjs`; `tests/drone-playable.test.mjs` holds the helpers in the
  served bytes; `scripts/drone-deck-qa.mjs` now runs FOUR viewports (390×844, 844×390, 375×667, 667×375 — EYE_SCALE_12_IN declared red at
  667×375, red there since before r.204) and a TOUCH leg (two taps fire after the head turned; a red then blank sky inside the picture fires
  nothing and says DOUBLE-TAP THE RED BOX TO FIRE; in QUAL 40 a tap on plate A with the bullseye on plate B turns the head onto A, the toast and
  the lit button agree on APPROVE, APPROVE approves A with no hold, red-then-sky spends no round); Verify Live's job allows 18 minutes; the foil
  exports are regenerated by the bookkeeping so test:foil-model is green (red since r.196, the first domain bump after r.165's export; Deploy's
  gate has other reds since 63eb251d and stays red) and in the chain; the touch leg runs at 390×844 and 844×390. The play-throughs are
  in the repo: `scripts/drone-trainup-play.mjs` (thirteen looks, the
  lit button equal to the step under the bullseye at each; a touch double-tap on a red fires it after the head turned; a red then the sky is
  refused) and `scripts/drone-qual40-play.mjs` (40/40 through the buttons on these bytes, the revision and sha in its log).
- Decided under his 10:25 sign-off, listed to reverse: DD-13a a tap turns the head onto the tapped plate in every solo mode, QUAL 40 included
  · DD-13b a NOT_MARKED hold is a hold (hiHolds, sssesCore, a linked peer outside LIVE) · DD-13c the red box is a marker, FIRE works on the plate
  (r.141's true size) and inside the box but off the plate no button lights and the strip says AIM ON IT · DD-13d a board's words with no place
  clear of a control move along the post's line, as far as the picture allows, the post drawn on to them (667×375 shows it).
- Owed next: the twelve Masters' QUAL 40 AAR fixes (the twelve Masters' fixes (the boot self-check yielding to an entered player, the exposure-end snap, the stray
  mid-fall plate, the sign and its words as one object, the rest toast reading the magazine, a toast's lifetime) · the LIVE room's lit button
  (a peer's mark under my bullseye: the current mark's step lights; FIRE lights only on the red under the bullseye there too) · captions still
  overprint each other and their own boxes and can sit on the bullseye ring at every zoom (the ring is not in the keep-out; as r.203, as his
  shot42) · the strip's second line wraps onto the magazine line at 390 and 375 · EYE_SCALE_12_IN at 667×375 · 360-px phones (FIFTY_AT_THE_EDGES
  at 360×780 and 360×640, EYE_SCALE_12_IN at 780×360 and 640×360 — red on r.203 too, undeclared) · the boot to the published QA is ~1.9 s against ~1.5 s on r.203 on this machine (the two new rows; the keep-out list is now computed once per QA look, which took it back from ~2.2 s) · hiHolds now counts a NOT_MARKED hold and authFailures fall because FIRE is dark off target, so an R-CORE reader sees both move at r.204 · the QR door into QUAL 40 lands inside the 1.5 s deferred row and gets a 30-round first magazine (H1, the same on r.203) · the two play-throughs in scripts/ are manual evidence, not a gate (test:drone-play owed) · a PAUSE-then-rotation leg with qaArmed off ·
  the challenges' FIRE light (right when probed, ungated) · an empty-magazine look · "target all" proven on three plates of eleven, and the
  QUAL play-through one plate at a time · the foil export stamp still carries the domain revision (the class: drop it from the stamp or
  regenerate in the shared generation step; every bookkeeping must regenerate until then) · the other boot rows that read the QA block's
  W,H · the plates show through the 0.55-alpha cards (pre-existing) · at 390 px and 3.3× the strip's PRESS FIRE overlaps the MAG line by 6 px
  while TOP_LINES_NEVER_OVERLAP stays green (pre-existing; the row should measure the longest clause) · a player who enters within ~1.5 s of
  load has the mode and magazine reset by the deferred boot rows (the QR door's 30-round first magazine, H1) · R-CORE in the shared format
  (r.206).

## r.205 — Claude Code: the glass tells the truth about every target (2026-10-13)
Operator (2026-10-12, verbatim as typed — the ask file holds them with their screenshots):
**"remove all text from middle; targets only.  and everything is still no aligning. this amber target should have approve on buttons
highlighted"** (~20:44, shot49) · **"system should always remember what silouettes are targeted.  if targeted, approve is next step / if
silloeten is approved fire is next step / buttoms and colors around boxing amber vs red should match"** (~21:05) · **"I need 12 AsM Fleet to
test; … test and simulate until no phantom targets and ensure all targets and siloeets have the proper color boxing with button when
bulleseye is over target"** (~21:15) · **"SSSES , AsM, Simulate, and SPIRAL TEST TO ENSURE NO GLITCHES"** (~21:30). Then on the LIVE r.204,
2026-10-13 ~04:34: **"way better; keep it ip and run AsM 111 + MoT 333 word, SPIRAL, SSSES , and UX usability test; …"** (shot50/51).
Notes: `CLAUDE_CODE_NOTES_r205.md`. Patch: `patches/r204_to_r205.py` (base r.204, declared and asserted, 23 edits). Artefact commit `6a0f594`.
- **Found first, measured on the LIVE r.204 bytes (sha256 2085cd15…), not taken on a reviewer's word:**
  - A TARGETED plate painted its silhouette **LOCK red** inside its **amber** box. `drawPlates` read `q.mist?T13.LOCK:phaseCol(q,…)`, so the
    mist flag — set the moment a target is marked — beat the slot's phase. Read from the painter's own calls: TARGETED `#E24B3B`, wanted
    `#F0A020`. His criterion, failing on every marked target in every mode, since r.196.
  - **APPROVE was green** (`rgb(61,204,138)`, the cue colour) on an amber box; only FIRE already wore its box's red.
  - Thirty-six **words over the stage** in three looks with six targets marked — "T1 · 50 M LEFT · AMBER" and the rest — crossing each other
    and their own boxes (his "everything is still no aligning").
  - **The boot self-check stole the range.** Tap TARGET inside the first ~2 s and the mark vanished 150 ms later: the deferred row saved the
    lane, the mode, the zoom, the view and the head, ran its own test on lane 01, and then set the marks, the approval and the magazine to
    EMPTY instead of back to what it saved. Stack: the TARGET button → the row → `designate` → `tgtSlot` replaced. This is H1, recorded at
    r.204 as "the QR door's 30-round first magazine" — the larger half was that it eats the player's targets.
  - **The times are right; the light is not** (his "double check all stop lights and times are accurate per real tests"). Measured over 94.7 s
    of real play: exposures 5.0 / 8.0 / 12.1 / 16.0 s against TC 3-20.40 Table VI's 5 / 8 / 12 / 16, 3.0 s between engagements, 10.0 s between
    phases, 18 engagements, 40 rounds — every number inside ±0.1 s of the programme. The four exposure seconds are
    DECLARED (the operator supplied them 2026-09-23; no open source publishes them); the 10 s transition is sourced. But GREEN showed 7.2 s in all, and in 72 of 72 of those samples **no
    target was up**; with a target up the lamp was dark in 480 of 627 samples. The lamp fires green at the END of a window, three seconds
    before the next set. His own Addendum 13 (r.162) asked for "Red, Yellow, green **as time to next set of targets**". Owed to r.206 with the
    range officer's start, where the light's meaning and the officer's commands move together.
- **Invariants (each one gated, each gate shown red on the r.204 bytes first — `scratchpad/r205/redfirst/redfirst.txt`):**
  1. **A target's colour is its slot's phase** — unmarked the stroke, TARGETED `T13.GIMBAL` amber, APPROVED `T13.LOCK` red, and a plate whose
     mark has ended goes back to the stroke. One painter: `phaseCol(q, q.mist?T13.LOCK:…)`, the phase first, the mist only for a target that
     carries no phase.
  2. **A button wears the colour of the box it acts on** — APPROVE amber, FIRE red, TARGET the cue colour.
  3. **The middle of the picture carries targets only** — no per-target caption is measured, placed or drawn; his lane signs stay.
  4. **An exposure's close downs every plate of its engagement**, hit or not; a hit at the buzzer is a hit, never NOT ENGAGED.
  5. **The boot self-check borrows the range and gives it back exactly as it found it** — the marks, the approval, the magazine and every
     plate of every lane.
  6. **A press is judged on the target under the bullseye before anything is judged on the mark behind it**, and a
     refusal about one target ends that target's box and no other (`dropMark`, never `releaseAuthority`).
  7. **An empty magazine darkens FIRE and nothing else** — TARGET and APPROVE cost no round.
  8. **With nothing under the bullseye the glass names no plate at all** (DD-13e completed).
  9. **The MAP has no bullseye** — `lockOn()` returns null there, so the current mark stands.
  10. **The self-check gives back everything it took** — the whole magazine (its cap included), the lane's run, the
      clock, the tallies and the last shot, not only the marks.
  11. **A peer's refusal about another plate does not end my red box** — AUTHORITY_RELEASED and TARGET_DOWN name a
      plate; APPROVER_LOST and PEER_LOST are about the seat and still end it.
  12. **FIRE is judged on the target under the bullseye too** — the hoist is in fireN as well as approveDesig.
  13. **The MAP says what the MAP is** — TARGET there names the reason instead of an impossible instruction.
  14. **FIRE is not lit where FIRE is refused** — a QUAL plate already engaged this exposure takes no second round.
- **Fix, the class (40 asserted edits):** the one painter at `drawPlates`; `#face b.appr{color:var(--g)}` with the class on the button;
  `captionCeiling`, `captionFloor` and the whole of `plateCaptionRects` retired to `function plateCaptionRects(){ return []; }`, the caption
  draw cut out of `draw()`, `boardLabels`' `taken` emptied, the rows that measured captions retired with them
  (`LABELS_ONLY_WHILE_MARKED` gone; `CAPTIONS_CLEAR_OF_THE_CONTROLS` → `BOARDS_CLEAR_OF_THE_CONTROLS`, the sign half kept at full strength);
  the window-end block downs every plate and `qualDropStrays` spares nothing mid-fall; the deferred boot row saves the magazine and every
  plate and restores `sv.desig`, `sv.slots`, `sv.hi` instead of clearing them.
- **QA:** `SILHOUETTE_COLOUR_IS_THE_PHASE` (six reads taken from `drawPlates`' own calls, each silhouette matched to its plate by its own
  `silMesh` mesh so no neighbour can be mistaken for it) · `BUTTON_WEARS_ITS_TARGETS_COLOUR` (computed styles against the thirteen colours) ·
  `NO_WORDS_ON_THE_STAGE` (every `fillText` of three whole frames intercepted with six targets marked at 1×, 3.3× and 8×: a word that is not a
  lane sign, the corner, the frame rate or LOCK fails the row) · `A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON` (four legs: a fallen mark with a
  standing red box beside it and the bullseye on a third plate; an empty magazine on a standing amber; blank sky after a
  shot; the MAP — red on the r.204 bytes with `slots 2 → 0`, `PRESS RELOAD`, `LAST · 200 M LEFT · DOWN` and a plate
  returned by `lockOn()` on the map) · `FALL_ENDS_WITH_THE_WINDOW` (four shots: this seat and the other seat's row
  0.2 s before a 5 s close, a shot 0.05 s before it, and the 300 M into the 10 s rest) · `BOARDS_CLEAR_OF_THE_CONTROLS` (r.204's sixty looks,
  the sign half). Boot QA **231/232** on the cut, only SYNC_DIRECT (offline); **227/232** with the five new rows alone on the r.204 bytes.
- **Play-throughs on the shipped bytes:** TRAIN UP fifteen looks, every lit button equal to the step under the bullseye, captions 0, 0 errors;
  QUAL 40 **40/40 EXPERT**, 3 reloads, 0 errors, 231 s, **first magazine 10 rounds** (it was 30 — H1's own symptom, gone with the fix).
- Decided under his 2026-10-12 10:25 sign-off ("approve all your own decisions; document changes"), listed to reverse in one line:
  **DD-14** the stage carries targets only — the per-target captions are retired, the lane signs stay (his 21:20 answer, "Signs stay") ·
  **DD-15** the lit button wears its target's colour, APPROVE amber and FIRE red · **DD-16** one painter: the phase decides a target's colour
  before the mist · **DD-17** the boot self-check restores what it borrows rather than standing down, so its coverage is kept ·
  **DD-18** a press is judged on the target under the bullseye first, and a refusal about one target ends that target's
  box and no other · **DD-19** an empty magazine darkens FIRE only · **DD-20** the MAP has no bullseye.
- **Corrections on the record (raised by the round, kept here because the ledger is append-only):** r.204's two commits
  carry DIFFERENT co-author trailers — the attribution in force changed between the artefact and the records half of the
  same revision; from r.205 on, one revision is signed one way throughout. The exposure seconds of Table VI are DECLARED,
  not sourced; earlier notes implied otherwise.
- Owed, listed so he never says them twice: DD-13f, his 20:55 twenty-person drill, sits with CLASS 1e (the room's
  reading) · three times a table the glass says PRESS RELOAD on a magazine it has just filled and the press is refused
  (measured in this revision's own QUAL 40 timeline) · on a cold range FIRE says the target lapsed while TARGET refuses
  any mark · hudKeepOut returns CSS pixels while its consumers work in canvas pixels, with no ResizeObserver · the lane
  picker reads LANE 21 on every QR-opened lane · 428x926, the size he actually holds, is not one of the four CI
  viewports · the 360-px phones are red and undeclared · the r.204 pin's 38 invariants collapse into one assertion ·
  the two play-throughs are run by nothing in CI.
- Owed to r.206, with the decision named: his shot51 sign defect survives. A lane sign's visibility is judged on the
  board's CENTRE and the box drawn plus or minus half a width, so a sign near either edge loses its first digit. The
  obvious clamp is wrong - r.159 is his own rule that a sign stays on its post's line, and LANE_NUMBERS_ON_THE_SIGN
  enforces it to within 1 px (shifting a sign sideways turned that row red in this revision's own rehearsal). The
  choice is his: an edge sign that cannot be drawn whole is not drawn, or the post law is relaxed for the outermost
  signs.
- Measured this round, owed to r.206: a target that is UP but off the picture gets no cue. At 428x926, 15 of the 40
  target appearances of QUAL 40 sit off the left edge or clipped at the landing zoom (19 of 40 at 390x844), all at
  negative x, while the strip says "1 UP". The lane is 15 m wide and scanning is the game, so the camera is not the
  defect; the missing edge cue is. Unchanged by r.205, measured by scratchpad/r205/offscreen.mjs.
- Owed next: **r.206** the range officer's commands at the START of the table (his 18:25 "load and make ready") together with the light's
  meaning (green while the range is hot, the countdown lamps before the set) · the LIVE room's lit button · the map's own painter (a target
  can still read differently there; `lockOn()` returns a plate on the map) · the 42-lane team drill when he calls it · R-CORE in the shared
  format · the per-size reds already declared (EYE_SCALE_12_IN at 667×375, the 360-px phones).

## r.206 — Claude Code: no colour without a mark, and one meaning of "under the bullseye" (2026-10-13)
Operator (2026-10-12 ~21:15, verbatim): **"I need 12 AsM Fleet to test; youbknow mybcriteria but fail toninplment; test and
somulate until no phantomntargets and ensure all targets and siloeets have the proper color boxing with button when bulleseye
osnover target"**. The fleet — 145 agents, twelve Masters, every finding refuted three ways — is
`docs/assessments/2026-10-13_drone2525_fleet12_phantom_and_colour.md`, committed alone before this code. It was ordered onto the
r.204 bytes; r.204 and then r.205 shipped while it worked, and under the no-rework law it re-played every confirmed finding on
the bytes on his phone: **four closed by r.205** (recorded there so they are not rebuilt), **five still open**. Those five are
r.206. Notes: `CLAUDE_CODE_NOTES_r206.md`. Patch: `patches/r205_to_r206.py` (base r.205, declared and asserted, 11 edits).
Artefact commit `c707fba`.
- **Verified on the shipped r.205 bytes before a line was written** (`scratchpad/r206/probe1.mjs`, `probe2.mjs`), not taken on a
  reviewer's word: after `releaseAuthority` two plates read `mist:true, phase:null, slot:null`, **zero boxes drawn**, painting
  `#E24B3B`, while the never-marked neighbour paints `#E8D5B0`; of ten aim points with the bullseye strictly inside exactly one
  silhouette, **two handed the box to another plate**; on the MAP the lit FIRE stayed lit through the whole session and after its
  own refusal; across forty offsets walked off one mark, amber and red answered differently at **eleven**; and the recital painted
  an unmarked plate in `rgb(240, 160, 32)`, the amber of a mark.
- **The invariants, each gated, each gate red on the r.205 bytes first:**
  1. **A target with no box is the plain silhouette.** A mark that ends takes its colour with it, through EVERY door —
     `releaseAuthority` released the mark and left the flag, and the painter reads the flag where there is no phase, so a
     standing, unmarked, unboxed target wore the approved red for ever and never healed. Eleven call sites share that door.
  2. **The box goes to the silhouette the bullseye is ON.** A plate the bullseye is strictly inside wins before any plate merely
     within reach of it; inside each pass the nearest to the OUTLINE wins, with world metres breaking an exact tie only. The
     8 px reach stays as the fallback so a 300 m plate is still takeable. The deck's own r.147 line already said so.
  3. **No bullseye, nothing lit.** The map's early return never reached the buttons' only painter.
  4. **One meaning of "under the bullseye" for amber and red.** Amber is narrowed to red's honest rule; red is NOT widened —
     widening it would light a button the deck then refuses and would fail the transit leg r.204 earned.
  5. **Amber means marked, and only marked.** The recital's unmarked line takes the gold its own "TARGET FIRST" already uses,
     and the LAST line takes the ivory.
- **QA:** `NO_COLOUR_WITHOUT_A_MARK` (two marked, one approved, then **`releaseAuthority`** — the door r.205's own colour row
  never opens, which is why that row is green over this) · `THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP` (a spread of aim points;
  the row counts the ones it actually tested) · `BUTTONS_ARE_DARK_OFF_THE_PICTURE` (a red mark standing, one real frame on the
  map, then back) · `ONE_MEANING_OF_UNDER_THE_BULLSEYE` (forty offsets walked off one mark, amber and red at the same offsets,
  plus the recital's colour). **Every one pushes `ok:false` with `NOT EXERCISED` when its leg does not run** — the fleet's
  deeper finding was a row green by omission. Boot QA **235/236** on the cut, only SYNC_DIRECT (offline); **231/236** with the
  four new rows alone on the r.205 bytes.
- Owed, in their order: `approveDesig` has no on-target test, so after r.206 a DARK APPROVE still acts if pressed — the
  round on this cut measured it (9.26 px clear of the outline, all three buttons dark, the strip AIM ON IT, and APPROVE
  still reddens the slot and books an APPROVE row into the record, the hash and the room). The fix was built here and
  taken back out: it turns four long-standing rows red (RANGE_MISS_300_OFF20, PHASE_NEEDS_RELOAD,
  AUTHORITY_HAS_ONE_CONSUMER, A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON), each of which approves without aiming
  first. They are right to aim; rewriting them is honest work, and it changes an action four invariants depend on —
  the fleet's own reason for making it its own revision. r.207, first item · the range officer's
  opening and the lamp that leads its window (r.207) · a cue for a target that is up but off the picture · his call on the lane
  signs clipped at the edge · the LIVE room's reading (CLASS 1e) and his 20:55 team drill · R-CORE in the shared format.

## r.207 — Claude Code: the glass keeps its promises (2026-10-13)
Operator, 2026-10-13, asked which revision he wanted first and answering in his own word: **"The leftovers first"** (DD-22). So this one
carries what was broken on his phone, before the range officer. His sign decision of the same turn is in it: **"Shrink them at the edge"**
(DD-21). Notes: `CLAUDE_CODE_NOTES_r207.md`. Patch: `patches/r206_to_r207.py` (base r.206, declared and asserted, 23 edits, and the cut is
now PARSED before it is written — see below). Artefact commit `b3d5c18`.
- **Measured on the shipped r.206 bytes before a line was written** (`scratchpad/r207/behave.mjs`, 43 pan steps off the mark at 390×844),
  not taken on a reviewer's word:
  - **A dark APPROVE still acted.** All three buttons dark, strip `AMBER · T1 · 200 M RIGHT · AIM ON IT` — and the press turned the mark
    **red**, booked `APPROVE SOLO HI-2` into the record and the replay hash, and toasted `RED BOX · 200 M RIGHT · APPROVED BY YOU · NOW
    PRESS FIRE`. FIRE at the identical geometry refused with `TARGET_OFF_PICTURE` and spent nothing. The glass said no and the action said
    yes — his 21:05 criterion inverted.
  - **Opening the MAP erased his step sentence.** Toast `block` → `none` on the map → `none` back, and `toast._plate` cleared, so it could
    never return. **A regression r.206 itself introduced** — its fix for the frozen lit FIRE sent the map through `paintCues` for the first
    time, and that function's toast block reads `lockOn()`, which r.205 made null on the map.
  - **`dropMark` left the colour behind.** r.206's own invariant says a mark that ends takes its colour with it "through EVERY door"; the
    door r.205 added, and which r.206's two down-refusals call, never cleared the flag — one orphan, `mist:true`, every time.
- **The invariants, each gated, each gate shown red on the r.206 bytes first (232/237 there, 236/237 here):**
  1. **A dark button does not act** — on the range, in solo play. `approveDesig` takes FIRE's own on-target test, placed **below** the
     two down-guards so that a target which is DOWN is still answered as down; the MAP is exempt because it has no bullseye to be on,
     which is `lockOn()`'s own rule and r.206's CLASS 1b (without the exemption the guard contradicts
     `A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON`'s map leg). **Scope stated rather than implied:** `marksPersist()` and
     `platesHere()` confine it to the range in solo play — in a challenge and in a LIVE room a dark APPROVE still acts, which is CLASS
     1e's ground and is owed with it, not claimed here.
  2. **A view with no bullseye takes nothing away from him.** The toast block skips the map.
  3. **Through EVERY door** — `dropMark` ends one target's mark, so it ends that target's colour.
  4. **A lane sign shows its whole number** (DD-21): it SHRINKS on its own post until the box is inside the picture, down to
     `SIGN_MIN_PX` (9, his own legibility floor); below that it is not drawn. It never moves sideways, so r.159 — his rule that a sign
     stays on its post's line, held to 1 px by this very row — is untouched. **What that costs him, measured and not glossed:** at his
     428×926 the edge signs are ALREADY at the 9 px floor, so the shrink has no room and the branch never fires. Across 161 pan looks:
     drawn 241 → 222, **clipped 18 → 0, shrunk 0**. He stops seeing half a number and stops seeing those signs at all. The row's own
     note now reports "N shrunk to fit" beside the clipped count, so the record can never say "shrink" while it is deleting. If he would
     rather see them, letting only the outermost sign slide off its post, with its post drawn across to it, is one line and r.204's
     machinery already does the drawing — it bends r.159, so it is his to say.
- **Five QA legs, not three.** The round on this cut found that the new guard **intercepted two more rows and left both green at all
  four viewports** — `NO_APPROVE_ON_A_DEAD_TARGET` never reached its dead-target branch, and `PEER_HIT_TALLIES_AND_CLEARS` measured an
  amber box while its note said red. That is the very class this revision exists to close. The dead-target one is answered by the
  guard's placement below the down-guards; the other takes the same one-line aim as the first three. Proof that nothing else was
  disarmed: spying `decide()` through a whole boot self-test, `TARGET_DOWN` stays at 2 and `NOT_MARKED` at 5 on both cuts, and
  `NOT_ON_IT` appears exactly once — the new row's own deliberate press.
- **The three original QA legs that approved without aiming first now aim** (`shootPlate`, `PHASE_NEEDS_RELOAD`, `AUTHORITY_HAS_ONE_CONSUMER`).
  Each edit is setup only and no row's subject moves: `shootPlate` marks and approves ON the plate and steps the bullseye off it only
  afterwards, which is what its `offPx` callers were always testing; `PHASE_NEEDS_RELOAD`'s refusal is still `EMPTY_MAGAZINE`, because
  `fireN` checks the magazine above the aim; `AUTHORITY_HAS_ONE_CONSUMER` still measures that releasing a red box writes exactly one HOLD.
  Verified in isolation: the three aim edits alone, with no guard, leave the boot QA unchanged.
- **QA:** new `THE_MAP_KEEPS_HIS_SENTENCE` · `ONE_MEANING_OF_UNDER_THE_BULLSEYE` now **presses** the dark button instead of only comparing
  lit-ness (its own comment said "lights AND ACTS" while the row measured only the light) · `NO_COLOUR_WITHOUT_A_MARK` now opens **both**
  doors, `dropMark` as well as `releaseAuthority` · `LANE_NUMBERS_ON_THE_SIGN` holds that every sign it draws is wholly inside the picture
  **and walks a sign to the edge on purpose** — its four fixed looks produced a clipped sign at 844×390 and 428×926 and none at 390×844,
  and a row that is red only at some sizes is the same green-by-omission the fleet named; it now pans until a sign's post is within a
  half-width of an edge and says NOT EXERCISED if it never finds one (21 such looks at 390×844, 8 of them drawn outside the picture on
  r.206, 0 on r.207).
- **The cut is parsed before it is written.** Twice in r.205 and r.206 a patcher wrote a deck that did not parse, and the failure only
  surfaced when a browser booted it. `r206_to_r207.py` now extracts the deck's inline script and hands it to `node --check`, refusing
  before anything is written.
- Owed next, in order: **r.208** the range officer's opening on QUAL 40 (his 18:25 and 04:34 words) with the lamp counting him IN to the
  targets — DD-23, "3 red, 2 yellow, 1 green" — the word under the lamp in QUAL, TRAIN DOWN's clock, and a cue for a target that is up but
  off the picture · **r.209** the LIVE room's reading (CLASS 1e) and his 20:55 twenty-person drill (DD-13f) · **r.210** R-CORE in the shared
  format, owed since his first ask. Still carried: the QUAL-40 miss that reaches no record row; a lane post drawn without its board; three
  times a table the glass says PRESS RELOAD on a magazine just filled; `hudKeepOut` in CSS pixels with no ResizeObserver; the lane picker
  reading LANE 21 on every QR-opened lane; 428×926 absent from the CI viewports; the 360-px phones red and undeclared; the two
  play-throughs run by nothing in CI; and the DD rows that never reached the ledger or the domain JSON.

## r.208 — Claude Code: THE CAPITAL I, the Capitol is drawn (2026-10-14)
Operator, 2026-10-13: *"can you create edge wireframes of Austin texas Captial of texas scenario with stationary pop up targets for turret …
also enhance capital of texas using online images to make more realistic outline using array of 13 Trinity colors with varying levels of
thickness etc to mimic 3D structure of capital and capital lawn (including trees … while making these updates; don't change the range; just
use working range to start building elements for The Capital"* (DD-27, DD-34, DD-35). His order is the build order, and this is the first of
five. Notes: `CLAUDE_CODE_NOTES_r208.md`. Patch: `patches/r207_to_r208.py` (base r.207, declared and asserted, 20 edits, the cut parsed
before it is written). Artefact commit `ca3261f`.
- **Measured on the shipped r.207 bytes before a line was written** (`scratchpad/r208/`, 390×844, the Capital entered through its own picker):
  at **MoT 1.1, the default fidelity, the stage was BLACK** — 280 segments of a 280 budget spent, **1,278 dropped**, every one of the
  Capitol's 217 edges among them. Instrumented at the call: `drawTargets` is entered at **5** segments spent and leaves at **280**, because
  eight door targets × (a 12-edge box + a 29-segment bullseye) = 328. The building could not be reached. **A better model would have changed
  nothing** until that was answered, which is why this revision is "the Capitol is drawn" and not "the Capitol is beautiful".
- **The four members, each a class and not an instance:**
  1. **DD-38 · the scene's subject is never the first thing dropped.** A group now says whether it is what the scene is *about*; the subject
     is painted by `segsOwn` — counted, never dropped — which is the range's own r.157 rule (*my lane's targets are the shooter's own
     picture*) applied to the Capital. Everything else stays inside the budget and drops first. Measured: **208 own segments at MoT 1.1**
     (world 280 of 280) and **348 at MoT 5.1**.
  2. **DD-37 · the painter learned weight.** `add(n,c,s,{w,own,lod})` and `segs(arr,col,w)` / `segsOwn(arr,col,w)`; the ladder is
     `lib/wire-core/vector-law.ts`'s own — hairline 0.6 · normal 1 · bold 1.6 — because a darker edge would be a **fourteenth colour**.
     Weight is a role, not a distance: the silhouette bold, the structure normal, the ground hairline. Every existing call passes no weight
     and draws **exactly** as before.
  3. **DD-34 · the building, from sourced numbers.** E-W 566 ft 6 in = **172.67 m** and the central block 289 ft = **88.09 m** (NHL
     nomination 70000770); the star's tip **92.24 m** above the south grade and a **60 ft** rotunda (Texas State Preservation Board); the
     Goddess **4.88 m** and her star 8 ft point to point (1888 state pamphlet). The deck's old spire stopped at 62 m — **a third short** —
     and its dome ring was r 16 m against a 9.14 m rotunda. The grounds are the arena record's own tree rows and streets, converted by the
     one transform `deck z = −(record y)`, and gated against that record by `tests/capitol-model.test.mjs`.
  4. **DD-39 · detail follows the dial, presence does not.** Every group declares the lowest MoT major that draws it, so a weak phone sees
     the whole building in outline and never a blank stage.
- **Two doors that were shut:** `SCEN · CAPITAL 42` set `state.mode` and toasted — it never called `applyMode` and never set a challenge, so
  picking his own scenario left the range on the glass; and the overhead view, framed for a 15 m lane at 155 m, showed about 33 m of a 500 m
  site. One function (`pickScenario`) now serves the picker and the QA, and over the Capital the map rises to 2,400 m and looks straight
  down, where the deck's one focal length frames 512 m. The range's map keeps its 155 exactly.
- **ONE thing about the range changes, deliberately, and it is r.207's own defect being closed.** Leaving CH0 for a challenge has always
  set `state.phase='static'` and zeroed the hits, and `goRange()` never put them back — measured on the shipped r.207 bytes through its own
  challenge picker, CH1 then CH0 leaves `phase:'static'` and four hits then toast **PASS · MOVING TARGETS** with `passed` 1 → 2. r.208 adds a
  second door onto that, two taps from the range, so it is closed here for every door: whoever leaves CH0 stashes the range's wave and
  `goRange()` hands it back whole. `goRange` is a frozen span and is **re-pinned under its own key with that reason**. The no-fly volume is
  NOT changed: r.131's `CAP` and `WING` boxes are kept exactly and flagged as the range's own, because re-sizing them moved 5 of 120 measured
  points over his lanes.
- **DD-35 made mechanical, not promised.** `tests/range-frozen.test.mjs` pins the sha256 of **100 top-level definitions** — those that belong to the
  range alone, the predicate that defines it (`chNum`) and the seat switcher (`applyMode`) — the program of record, the magazines, the clock, the lamp, his five stances, the lane, its plates, its signs and the three
  doors onto it. **r.207 → r.208 moves none of those hundred**, and the three it does move (`goRange`, `mapCam`, `drawMap`) are re-pinned under their own key with their reasons. The gate is sharp and not vacuous: replayed over the real ships it reports exactly
  `boardLabels` for r.206 → r.207 (his D-21 decision) and exactly `qualDropStrays, rangeTick, boardLabels, drawPlates` for r.204 → r.205, and
  each match is a line in that patch's own header. What it does not cover is said in the file: the functions the Capital is **required** to
  reuse are deliberately absent, and their range-facing behaviour is held by the 242-row boot QA at four viewports — and by the two
  play-throughs, which nothing in CI runs yet.
- **Rows** (each red on the r.207 bytes first, kept in `scratchpad/r208/redfirst/`): `THE_CAPITOL_IS_DRAWN` (deferred, because a drawn frame
  is the evidence — and because `SWARM` is a const declared after the self-test runs, measured by a throw), `CAPITOL_IS_THE_SOURCED_BUILDING`,
  `EVERY_EDGE_HAS_A_LAWFUL_WEIGHT`, `THE_SCENARIO_PICKER_OPENS_THE_SCENARIO`. Boot QA 241/242 at three viewports with SYNC_DIRECT the only red and 240/242 at 667x375, where EYE_SCALE_12_IN is red as it already is on r.207.
- **Said out loud rather than glossed:** on a phone, through the deck's own EYE law (1× is life-size at 12 in, focal 1827.6 px), the Capitol
  **cannot** be seen whole from the ground — the full 172.67 m of width needs 428 m of standoff at the widest zoom the optic has, which is
  the arena's own radius. From the south lawn he sees the central block and the dome, full height, and scans for the rest; the overhead view
  shows the whole site. That is a consequence of his own rule, measured, not a defect to be hidden.
- **Owed, and named:** the arena record and `components/security-2525/mission-planning.tsx` still carry the Capitol **±55 m** north-south,
  **24.9 % deeper** than the sourced 289 ft — one polygon, two carriers, corrected together as their own change (the gate prints it on every
  run). The record's other eleven buildings and their doors come with the per-location pop-ups (r.209), with the three that carry door
  targets today left exactly where their doors are. Still carried from before: the QUAL-40 miss that reaches no record row; a lane post drawn
  without its board; three times a table the glass says PRESS RELOAD on a magazine just filled; `hudKeepOut` in CSS pixels with no
  ResizeObserver; the lane picker reading LANE 21 on every QR-opened lane; 428×926 absent from the CI viewports; the 360-px phones red and
  undeclared; the two play-throughs run by nothing in CI; the DD rows that never reached the ledger or the domain JSON; and Verify Live's
  10-minute poll against an 18-minute job.

## r.209 — Claude Code: THE SHEET NAMES THE MAP (2026-10-14)
Operator, 2026-10-14, **sent twice** with the same screenshot (`docs/asks/img/…_shot58.png`, sha256 `660e8c66…e133e7`):
*"This should have the range at top"* (DD-48). His own law — *when the operator repeats himself, the last answer missed; change what
you do, not how you describe it* — so this is its own revision, built first and alone, ahead of the map ladder it belongs to.
Notes: `CLAUDE_CODE_NOTES_r209.md`. Patch: `patches/r208_to_r209.py` (base r.209's parent declared and asserted, 7 edits, the cut
parsed by `node --check` before it is written). Artefact commit `a6f0424`.
- **Measured on the shipped r.208 bytes first:** the sheet heads `LANE 21 · TURRET · TRAIN UP` (written at `play.html:8084`, static
  default at `:660`) and the word *map* appears nowhere on it. With the ladder he named the same day — THE RANGE → THE CAPITAL →
  CITY OF AUSTIN → LANDMARKS OF TEXAS → MAJOR TEXAS CITIES → THE STATE OF TEXAS (DD-47) — that is the missing word.
- **The heading leads with the map.** `THE RANGE · LANE 21 · TURRET · TRAIN UP`; off the range `THE CAPITAL · TURRET 21/42 · TRAIN UP`.
  The seat is read from the rung: `units[].label` is **already** `TURRET i/42` (r.131) and is reused, not re-derived — but the range
  parks those same 42 units and renames them `LANE n`, so off the range the seat falls back to the station form rather than showing a
  lane. The fixed ` · TURRET · ` segment is dropped where the seat already names the craft, so the Capital form is not `TURRET` twice.
- **The link learns the map, additively.** A Capital station **could not be shared at all** — `?range=` means the LANE. `shareUrl()`
  gains a branch **above** the range's return, which is left **byte-identical**: `drone-playable.test.mjs`'s pin of that exact source
  text needed **no re-expression**, and `.github/workflows/verify-live.yml`'s fetch of
  `play.html?range=21&role=turret&mode=train-up` is untouched. The `?map=` **reader** lands with the ladder in r.211 — a link nothing
  reads yet would be a promise the deck cannot keep.
- **The ladder's first members land here**, as **hoisted `function` declarations** in the append zone after `const _mp`:
  `rungIsRange()`, `rungWord()`, `rungSeat()`. Hoisted and not `const`, because `toolSelfTest()` runs above that line and a `const`
  there is in its temporal dead zone at boot — the TDZ failure r.208 records at `:5727`. r.211 **extends** `rungIsRange` with
  `state._selMap` instead of writing a second one.
- **Gates, red on the r.208 bytes first** (`redfirst/r209.md`): the new boot row `THE_SHEET_NAMES_THE_MAP` (deferred, because the sheet
  is wired by an IIFE far below the boot self-check — it presses the real `#btnQr`, reads what he would read, and closes the sheet
  again), plus two added assertions in `drone-playable.test.mjs`, one of them pinning the ladder's first member as hoisted.
- **The range is untouched:** `tests/range-frozen.test.mjs` 100 definitions at **0 moved**; `tests/range-2525.test.mjs` 118; both
  play-throughs re-run on the shipped bytes.
- **Owed and carried, unchanged:** the arena record and `mission-planning.tsx` still carry the footprint 24.9 % too deep north to
  south; no `test:drone-play` runner in CI; Verify Live polls 10 minutes against an 18-minute job; 428×926 is still not a CI viewport.
  Next: **r.210**, the R-CORE icon at the bottom below TARGET · APPROVE · FIRE, opening the history chain (DD-49) — owed since r.196
  and deferred thirteen times.

## r.210 — Claude Code: THE ICON AT THE BOTTOM OPENS THE HISTORY CHAIN (2026-10-14)
Operator, 2026-10-14: *"Also, not seeing RCORE LOGO TO SEE HISTORY CHAIN"*, and asked where it belongs — *"icon at bottom"* ·
*"same as all other rcore single links at bottom below Target Approve, Fire"* (**DD-49**).
Notes: `CLAUDE_CODE_NOTES_r210.md`. Patch: `patches/r209_to_r210.py` (base asserted from `HASHES_r209.sha256`, 9 edits, a stale list,
a presence list, the cut parsed by `node --check` before it is written). Artefact commit `328ed8d`.
- **He is right, and the debt is mine.** Measured on the shipped r.209 bytes: `grep` for `rcoreBadge`, `RCORE_LEDGER` or `data-rcore`
  in `frontend/public/drone-2525/play.html` returns **nothing**. Nine React surfaces mount the shared `RCoreBadge` — SoI, Security,
  Architect, Celestial, Financial, Settings, SensorFusion, SIM **and the Drone route** — so `/main/Drone-2525` showed a Drone history
  while the deck he actually plays showed none. r.195 shipped a hand-typed five-row list and a `position:fixed` badge over the dock;
  r.196's restore removed both, correctly, and the shared-format replacement was deferred at **every revision from r.196 to r.209 —
  thirteen times**, tracked in this register's own Owed list. He did not have to ask twice; he had to ask after I had moved it thirteen times.
- **The badge is his artwork and his placement.** The framed reticle at rest, the wordmark pill on the first press, the panel on the
  second — the 2026-09-25 two-click shape exactly. Both rasters are **inlined as data URIs** (`RCORE_ICON_PNG` 10,412 B,
  `RCORE_WORDMARK_PNG` 23,676 B, carried at `img/r-core-*@84.png`): the deck is ONE file and fetches nothing.
- **The placement is measured, never guessed** — `placeRcore()`, called from `placeFace()`'s tail and re-run by the same
  MutationObserver. Measured on r.209: below TARGET · APPROVE · FIRE the deck leaves **72 px** in portrait (390×844, 375×667,
  428×926) and **20 px** in landscape (844×390, 667×375). So portrait puts the row directly below the buttons — his words exactly —
  and landscape puts it on the same line to their left, clear of the stick. The badge also joins `hudKeepOut()`'s one keep-out list,
  so no lane sign, caption or status line can land on it.
- **The panel is the shared panel.** A port of `components/2525-core/rcore-revision-panel.tsx` with every `data-rcore-*` hook — the
  two impact-ticked scrubbers with ‹/› steppers, the *vs previous* and *v1 vs latest* presets, the filterable stat chips, the summary
  line, numbered KEY IMPROVEMENTS with L1–L5 chips, Unified ↔ Side by side, the change navigator, the collapsed Details table, the
  newest-first timeline with D# and ⎇ commit citations, and the self-contained HTML download — and every visible word taken verbatim
  from the 52 `rcore.*` lexicon keys.
- **The engine is a port, and the port is proven.** `rcCompare` · `rcDiffTokens` · `rcDiffText` · `rcTokenize` · `rcSideBySide` ·
  `rcUnified` · `rcEscHtml` · `rcEscAttr` · `rcStripBidi` · `rcRedact` · `rcFirstSentence` · `rcFromLedger` · `rcImpactOf` ·
  `rcCategoryOf` · `rcFnv1a` · `rcDownloadHtml`. Run against the real 87-entry ledger beside the TypeScript originals: **756
  assertions, 0 failures** — the adapter entry for entry, 86 consecutive LCS diffs, both renderers, impact, category, first-sentence,
  redaction, 41 full `compareRevisions` objects field for field, the unknown-pick fallbacks, the escapers on bidi and zero-width
  input, and the 3000-token cap. The two things a careless port gets wrong are pinned as source text by the gate: the LCS tie-break
  emits the **deletion** first, and impact is read from the **text** before the kind (nine of these 87 rows differ from a naive ladder).
- **The data is the shared ledger, through the revision before this one.** `RCORE_LEDGER` carries rev 1–87; r.210's own release row
  is written in the records commit, after these bytes are frozen, so the file is exactly **one** entry longer.
  `tests/deck-rcore.test.mjs` holds that lag to exactly one, field for field, and fails if it is two.
- **ONE GREEN GATE WAS REWRITTEN, and it is named here.** `drone-playable.test.mjs` asserted the literal string
  `#rcoreBadge{position:fixed` was absent. The deck has no flow slot at the bottom — `#face` is itself `position:fixed` and the `#app`
  grid's dock row is `display:none` at **0 px** — so mounting the badge in flow would shrink **his picture** by ~54 px, changing
  something he did not ask to change. The badge therefore joins the same control layer `#face` is in, and the invariant that string
  stood for is kept by **measurement**: the new row `RCORE_NEVER_COVERS_THE_PICTURE` walks **every** visible box on the page (637 at
  428×926) and fails if the badge touches one. The ban on a hand-typed list is untouched, and `frontend/tests/rcore-revisions.test.mjs`
  — the rule for the React surfaces — is not relaxed by one word.
- **Gates, red on the r.209 bytes first** (`redfirst/r210.md`): `tests/deck-rcore.test.mjs` **7 passed, 79 failed** on the shipped
  r.209; three new boot rows (`RCORE_IS_ON_THE_GLASS`, `RCORE_IS_THE_SHARED_HISTORY`, `RCORE_NEVER_COVERS_THE_PICTURE`), deferred
  because the badge is wired by an IIFE far below the boot self-check — they press the real buttons, read the real geometry, and put
  the page back. The new gate is in **both** `test:ci` and `prebuild`.
- **English only, and the fill is owed.** The deck has no lexicon, so the panel ships the English of the 52 `rcore.*` keys verbatim;
  the ×33 fill is staged and listed, under his own law — *no translation fill before the English is final*.
- **The range is untouched:** `tests/range-frozen.test.mjs` 100 definitions at **0 moved**; `tests/range-2525.test.mjs` 118; both
  play-throughs re-run on the shipped bytes and compared to r.209's field for field.
- **Owed and carried, unchanged:** the arena record and `mission-planning.tsx` still carry the footprint 24.9 % too deep north to
  south; no `test:drone-play` runner in CI; Verify Live polls 10 minutes against an 18-minute job; 428×926 is still not a CI viewport;
  the ×33 fill of the `rcore.*` strings in the deck. Next: **r.211**, the map ladder — one door, and a man can play alone
  (DD-43/45/46/47).

## r.211 — Claude Code: THE SHARE SHEET IS HIS PICTURE AGAIN (2026-10-15)
Operator, 2026-10-15, **reported twice**, the second time with two screenshots side by side: *"I still do not see why you regress; use
image 2 formate for the range"*.
Notes: `CLAUDE_CODE_NOTES_r211.md`. Patch: `patches/r210_to_r211.py` (base asserted from `HASHES_r210.sha256`, 10 edits, a stale list, a
presence list, the cut parsed by `node --check` before it is written). Red-first: `redfirst/r211.md`. Artefact commit `d3ef63c`.
- **The regression is mine, and it is traced, not guessed.** `git log -S"Scan to share"` on the deck returns exactly two commits:
  `12962de77` **added** the polished sheet in the r.183–r.195 wave, and `a18880daf` — **my r.196 artefact** — **removed** it. r.196 rebuilt
  the deck from his own r0.178 base to fix the targets, and r0.178 predates the sheet, so it went with the rest of that wave. r.196's notes
  listed those commits as "uncarried hand edits", so it was on the record — but **the UI loss was never said out loud to him**, which is the
  part that matters. r.209 then wrote the map name into the FRONT of the plain sheet's one-line heading, producing the wrapping ALL-CAPS line
  printed across the magazine cards that he photographed.
- **The real defect: no gate measured what the sheet looked like.** Six revisions shipped over a broken screen with every gate green. That is
  closed here — `THE_SHEET_NAMES_THE_MAP` now measures the heading, the subtitle, the hint **and the computed background colour**.
- **Restored, from `12962de77` verbatim:** the opaque `#05080c` ground (was `rgba(0,0,0,.78)`, which let the deck print through), the map as a
  28 px `#2EE0E0` heading, the seat and programme in italic beneath it, the white rounded QR card, the `Scan to share …` hint, the URL, a
  filled `#1E4A4E` `Copy Link` pill, and a plain white `×` in place of the boxed teal button.
- **DD-48 is answered better, not abandoned.** r.209 put the map first in a string; his picture makes the map **the heading**, with lane, seat
  and mode on the line beneath — *The Range* / *The Capital*. `rungWord()` is left **exactly** as r.209 wrote it because the boot row and
  `drone-playable` both pin it; `rungTitle()`, `modeWords()` and `rungSeatTitle()` are title-case twins beside it, so nothing pinned moves.
- **Deliberately NOT restored:** his image shows the link as `/drone-2525/play?range=…` **without `.html`**. That was the r.186 form; r.196
  corrected it on purpose and `verify-live.yml` fetches `play.html?range=21&role=turret&mode=train-up` on every run. Only the **look** is
  restored, and the patcher refuses if the old URL appears in code.
- **A trap hit for the second time.** The stale check first refused on `/drone-2525/play?range=` — at line 6129, inside the **embedded R-CORE
  ledger** r.210 added, in a historical entry whose prose *describes* the old link. The patcher now strips the `RCORE_LEDGER` block before any
  code check, exactly as `drone-playable.test.mjs` learned to in r.210. **The embedded record is data, not code.**
- **Red first** (`redfirst/r211.md`): the four new `drone-playable` assertions all fail on the shipped r.210 bytes. `THE_SHEET_NAMES_THE_MAP`
  had to be **rewritten** (it pinned the old ALL-CAPS form), so it was sabotaged three ways on the real cut — translucent ground **RED**, caps
  heading **RED**, missing subtitle **RED**. The first two are precisely the states that shipped: **had this row existed in this form at
  r.196, it would have caught the regression the day I made it.**
- **The range is untouched:** `tests/range-frozen.test.mjs` 100 definitions at **0 moved**; `range-2525` 118; the TRAIN UP play-through
  **IDENTICAL** to r.210's field for field, and QUAL 40 re-run on the shipped bytes.
- **Owed and carried, unchanged:** the arena record and `mission-planning.tsx` still carry the footprint 24.9 % too deep north to south; no
  `test:drone-play` runner in CI; Verify Live polls 10 minutes against an 18-minute job; 428×926 is still not a CI viewport. Next: **r.212**,
  the map ladder — one door, and a man can play alone (DD-43/45/46/47); then the `</>` Code button (DD-61…64).

## r.212 — Claude Code: THE RECORD THE DECK CARRIES IS CURRENT AGAIN (2026-10-15)
Operator, 2026-10-15, **a third time**, with the same two screenshots: *"I still do not see why you regress; use image 2 formate for the
range"*. The answer this time is not about the sheet at all. **r.211 fixed the sheet and never reached the site**, and his own screenshot
says so: its corner reads **`eXeL r0.210`**.

**The cause, measured.** Deploy run **#1890** on `689a4a4e9` is `conclusion: failure`. The `gate` job failed at step 7, the headless
suites, in 77 seconds; `ship` was skipped. Because the deck gates have run in `prebuild` since r.196, the Cloudflare build fails the same
way — so the site stayed on `df76efa`, and Verify Live #2820's ten-minute poll was never going to find r.211. The failing line, verbatim:

```
FAIL: the deck carries the record through rev 87; the file is exactly one entry longer —
      this release's own row (lag 2, last kind release)
deck-rcore: 91 passed, 1 failed
```

`tests/deck-rcore.test.mjs:42-45` requires `lag === 1`. The ledger file has **89** entries; the deck embedded **`"through":87`**.

**What r.211 omitted, and it is mine.** r.210's patcher *regenerated* the embedded `RCORE_LEDGER` from the ledger at build time
(`THROUGH=len(LEDGER['entries'])`). r.211's patcher never touched the block — its only mention of `RCORE_LEDGER` is the regex that
**strips** it before the code assertions. So the deck kept r.210's `through=87` while the ledger grew to 88 (r.210 records) and then 89
(r.211 ship).

**And I reported it green.** The r.211 commit message says `deck-rcore 92/0`; on the bytes that shipped it is **91/1**, reproducible in one
second. r.211 was executed ad-hoc rather than through a chain script, so that gate ran against the r.210 state — before the bookkeeping
bumped `DECK_REV` and appended rev 89. **A gate run before the bookkeeping is a gate run on a different revision**, which is the same
defect as the sheet itself: a check that did not check.

**The class, not the instance.** The embedded record is not optional bookkeeping a patcher may skip — it is part of what the deck *is*.
r.212's patcher regenerates it from the ledger and **refuses** unless the result is the ledger's first 89 entries field for field, in the
gate's own field order, with `through === 89`. And `r212-execute.sh` re-runs every deck gate **after** the bookkeeping commit, against the
exact `frontend/public/drone-2525/play.html` that commit B will carry, refusing the commit on any non-zero exit.

**r.211's share-sheet restore rides along untouched** — the opaque `#05080c` ground, the map as a 28 px `#2EE0E0` heading, the seat and
programme italic beneath it, the hint, the filled `#1E4A4E` Copy Link pill, the plain white close. `THE_SHEET_NAMES_THE_MAP` is unchanged
and still sabotage-proved three ways. **Shipping r.212 is what finally puts his image 2 on his phone.**

Notes: `CLAUDE_CODE_NOTES_r212.md`. Patch: `patches/r211_to_r212.py` (base asserted from `HASHES_r211.sha256`, 3 edits, a stale list, a
presence list, the embedded block re-parsed and compared to the ledger, `node --check` on both inline scripts before the file is written).
