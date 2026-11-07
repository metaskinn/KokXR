# KÖK&KOD Hackathon – KökXR Winning Plan (item list to be handed to the agent)

Sources: KOKKOD_Sartname.pdf, KokXR_Sunum_v2.pptx, the organizers' Bursa archive announcement, the Drive folder structure (checked on 6 November 2026), the vakifkatilim.com.tr publications page.
Rule: what the document states = [SPEC], our own inspection = [VERIFIED], our proposal = [PROPOSAL], what we are unsure of = [QUESTION].

## A. Rules from the specification (complete)

1. [SPEC] Competition: Vakıf Katılım + 42 Türkiye collaboration, for the 42 Türkiye & 42 Network campuses. The organization is run by Bilişim Vadisi.
2. [SPEC] Main problem: "How can we turn the foundation (vakıf) artifacts in Türkiye into a new-generation digital experience that users can explore from mobile or desktop devices, learn about with reliable information, and use to interact with cultural heritage?"
3. [SPEC] An application that merely lists artifacts is not wanted; UX, accessibility, design, technical infrastructure, data use and innovation must be strong, and it must be able to expand with new cities and artifacts.
4. [SPEC] Product: a working mobile application OR desktop application.
5. [SPEC] The product must allow discovery of multiple foundation artifacts, access to an artifact's history + visuals + source information, and interaction with cultural content.
6. [SPEC] Example areas: Audio guide/storytelling, Accessibility-focused discovery, Gamified cultural tour, Community-contributed digital archive, Route planner/city tour assistant, AR-supported time travel, Free choice.
7. [SPEC] An idea alone, a presentation, mock-up, wireframe or static prototype does not count as the main product. The core flows must be shown with a working MVP.
8. [SPEC] The dataset does not come as a ready API or database; the team must convert the content into its own data model.
9. [SPEC] Team of 2–4 people, one captain (communication lead) required; official correspondence and submissions go through the captain. (Captain in the presentation: Muhammet Ali Divan.)
10. [SPEC] Calendar: 8 October–7 November online development; 7–8 November 2026 physical final event (development marathon + final presentations) and award ceremony.
11. [SPEC] The final is attended in person; the team must be ready at the date, time and venue the organization announces.
12. [SPEC] The presentation duration, presentation template, technical submission formats and venue requirements will be shared separately with the finalists. The scoring weights will also be announced separately.
13. [SPEC] MVP requirements: a working application; discovery of multiple artifacts; access to history, visuals and sources; the ability to ADD AND EDIT CONTENT; a design suited to adding new artifacts; end-to-end demonstration of the core flows at the final; a screenshot/presentation does not replace a demo.
14. [SPEC] Architecture: language, framework and database are free; new artifacts, CITIES and CONTENT TYPES must be addable; the architecture and data model must be explainable at the final.
15. [SPEC] A third-party API may be used, but it is the team's responsibility that it works at demo time.
16. [SPEC] Open-source licenses must be complied with.
17. [SPEC] Data: cleaning, classification, tagging and linking are the team's job.
18. [SPEC] Source information must be shown in historical/cultural content.
19. [SPEC] Unverified content must not be presented as certain fact.
20. [SPEC] If there is community contribution, a moderation/approval mechanism before publication is mandatory.
21. [SPEC] UX: an understandable, consistent interface; readability and navigation suited to the device.
22. [SPEC] Accessibility examples: screen reader, alternative text, high contrast, font size, color-blindness compatibility, audio narration, subtitles, keyboard use. These must be in the WORKING product, not in the design.
23. [SPEC] Security: user input must be validated; personal data, if any, must be protected.
24. [SPEC] Testing: core flows and critical functions must be tested.
25. [SPEC] Code must be readable and modular; setup/run documentation (README) is recommended.
26. [SPEC] Additional criteria: fit to the problem and cultural value; innovation and data use (technology for need, not for show); teamwork and communication (task sharing is clear, everyone knows the technical details).
27. [SPEC] The final presentation must include: problem, target user, solution, technical architecture, data use, innovative features, scalability + live demo.
28. [SPEC] Only team members may give the presentation.
29. [SPEC] The jury has 7 people: Bilişim Vadisi 2, Vakıf Katılım 2, Independent 2, General Directorate of Foundations (Vakıflar Genel Müdürlüğü) 1.
30. [SPEC] Prizes (per person): 1st MacBook Air M5 13", 2nd iPad Air M4 13", 3rd iPad 11".
31. [SPEC] General rules: interfering with other teams' systems is forbidden; the license of third-party content/images is the team's responsibility; submission formats and deadlines must be complied with.
32. [SPEC] Ethics: original work; respect for copyright and intellectual property; no malware/unauthorized access; disqualification for violation.

## B. What we verified about the dataset

33. [VERIFIED] There are 4 folders at the Drive root: "I. ve II. Cilt - Osmangazi", "II. Cilt - Yıldırım", "III. Cilt - Diğer İlçeler", "KÖK&KOD".
34. [VERIFIED] Under Osmangazi, category/structure folders: II. Murat Külliyesi, Hamzabey Külliyesi, Sivil Mimari, I. Murat Hüdavendigar Külliyesi, Su Yapıları, Tekke ve Zaviyeler, Osmangazi Camiler ve Hazireler 1/2/3, Eğitim Yapıları, Orhan Bey Külliyesi, Timurtaş Paşa Külliyesi, Türbeler, Ticari Yapılar, Ulucamii.
35. [VERIFIED] Sample leaf folder (Ulucamii): "2-Ulucamii.indd", "2-Ulucamii.pdf" (~284 MB), "2-Ulucamii.idml" (~324 KB) and a "Links" folder (photographs).
36. [VERIFIED] The images inside Links are DJI_..._ODAK.jpeg (drone) and ERD....jpg/.tif/.psd; files range from 2 MB to 144 MB. They cannot be used in the app in their raw form; they must be downsized.
37. [PROPOSAL] The .idml file is InDesign's zip+XML format; the TEXT in the book can be extracted from it automatically (Stories/*.xml). This may be the fastest way to bring publication-sourced, verified text into the data model. I have not yet opened and checked its contents.
38. [VERIFIED] The publications page has Bursa Volumes 1, 2, 3; Hatay; Konya Volumes 1, 2 PDFs. That is, the inventories of other cities exist in the same format: to show extensibility, adding 1–2 artifacts from Konya or Hatay is possible.
39. [QUESTION] The "KÖK&KOD" folder looked empty to me. Is there a data package prepared specifically for you in it, or is access restricted?
40. [QUESTION] Was the "content package of 60–80 artifacts from 7 regions" mentioned in the specification given separately, or is there only the Bursa archive?
41. [QUESTION] How should the permission to publish/use the photographs in the app and the photographer credit (e.g. "Fotoğraf: Vakıf Eserleri Envanteri, Vakıf Katılım") be shown? The organization should be asked; for now put a source line under every image.

## C. Our current project (KökXR) and fit with the specification

42. [VERIFIED] Position in the presentation: "An XR education platform that turns foundation artifacts into 3D digital twins, lets you hold the artifact in your hands and return to its past state." Slogan: "Dokunamadığın tarihe dokun."
43. [VERIFIED] Features in the presentation: Eseri Eline Al, Zaman Katmanı (slider), Restorasyon Görevi, Doğrulanmış Bilgi (curator-approved data). Channels: VR, AR, Web. Target: schools (KökMobil), museums, foundations/ministry.
44. [VERIFIED] The demo scope in the presentation is "one venue · one artifact · one scenario". The specification, however, wants MULTIPLE artifacts + content adding/editing. This is our biggest gap.
45. [VERIFIED] The presentation mentions the Şanlıurfa example; the data provided is Bursa. The narrative and demo must move to Bursa.
46. [QUESTION] What technology was the existing website written in (React/Next, Three.js, Unity WebGL...)? What are the repo link and the live address? The agent needs to plan accordingly.
47. [DECISION – 6 November] The website alone is not considered sufficient; the product will be delivered as a MOBILE application. The presentation (slide 3) already has "AR → Telefon · Tablet" and "KökMobil", so the mobile choice is consistent with the accepted presentation. If the existing web code is JavaScript-based, the fastest path is to wrap it into an Android APK with Capacitor (the code is not rewritten). To be finalized once the repo is seen.
48. [QUESTION] Exactly which part is the person working in parallel doing (the 3D model, the site, the presentation)? The division of tasks should be clarified accordingly.
49. [QUESTION] Is there a 3D model currently (which artifact, which format: glb/gltf/fbx)? Will there be a VR headset at the final?

## D. What needs to be done (in priority order)

50. [PROPOSAL][P0] Multi-artifact discovery: at least 8–12 artifacts from Bursa, a list + map with category (mosque, külliye, tomb, bathhouse/water structure, han/commercial, madrasa) and district filters.
51. [PROPOSAL][P0] On each artifact page: name, district, category, period/construction year, founder (vâkıf), short history, gallery, SOURCE line (e.g. "Bursa Vakıf Eserleri Envanteri, Cilt X, s. Y").
52. [PROPOSAL][P0] Admin panel: add / edit / upload image / publish artifacts. The specification explicitly asks for it; in the demo, show live adding of a new artifact and its appearing in the app instantly.
53. [PROPOSAL][P0] The data model should be extensible: City → District → Artifact; Artifact ↔ Category, Period, Foundation/Vâkıf, Image, Source, Story, Audio, 3D model, Quest. A new city should come just by adding data, without code changes.
54. [PROPOSAL][P0] A "verification status" field on every piece of information: Verified (inventory-sourced) / User contribution – awaiting approval / Commentary. Unverified content should be shown with a separate badge.
55. [PROPOSAL][P0] Keep the existing "Eseri Eline Al" 3D experience working on a single star artifact (e.g. Ulucamii or the tile/minbar detail of the Yeşil Türbe); the remaining artifacts with photo + story. Do not try to spread 3D to every artifact.
56. [PROPOSAL][P0] Accessibility in the working product: alt text on all images, a large-text and high-contrast button, audio narration (quick solution with browser TTS), keyboard navigation, a color-blind-friendly palette.
57. [PROPOSAL][P0] Image processing pipeline: with a script, convert TIF/PSD/JPEGs to 1600px and 400px WebP, keep or strip EXIF, tie the file name to the artifact ID.
58. [PROPOSAL][P1] Community contribution + moderation: a user adds a memory/photo, and it goes live with "approve/reject" in the panel. Both a specification item and a strong demo moment.
59. [PROPOSAL][P1] Gamification: visit the artifact / solve a quiz / complete the restoration quest → badge. The "Restorasyon Görevi" in the presentation connects here.
60. [PROPOSAL][P1] Route: a walking route from selected artifacts (e.g. "Hanlar Bölgesi: Koza Han – Emir Han – Ulucamii"). Leaflet + OpenStreetMap is enough for the map. Verify the coordinates.
61. [PROPOSAL][P1] Zaman Katmanı: a slider between images of the same artifact from different framings/periods. If there is truly no old photograph in the archive, do not invent "that period"; use a verifiable comparison such as before/after restoration.
62. [PROPOSAL][P1] If artificial intelligence is used, it should answer only from our own verified database and give a source in every answer; be consistent with the presentation's promise "the answer comes not from artificial intelligence but from curator-approved data".
63. [PROPOSAL][P1] README: setup, running, architecture diagram, data model, steps to add a new city, the libraries used and their licenses.
64. [PROPOSAL][P1] Tests: at least automated tests for artifact listing, artifact detail, content adding/editing, moderation approval and input validation.
65. [PROPOSAL][P1] Security: login required for the panel, form inputs validated, upload size/type limit, text sanitization against XSS.
66. [PROPOSAL][P2] Proof of extensibility: add 1–2 artifacts from the Konya or Hatay inventory live from the admin panel and show "new city added in 5 minutes".
67. [PROPOSAL][P2] Offline mode (PWA cache): content opens even without internet during an artifact visit.
68. [PROPOSAL][P2] QR code: a QR to be placed in front of the artifact opens that artifact's page in the app. Simple and concrete for the jury.
69. [PROPOSAL][P2] Teacher mode: an artifact set + quiz for a class; keeps the school story in the presentation.

## E. What not to do

70. Do not go with a single artifact/single scenario demo; the specification wants multiple artifacts.
71. Do not go without content adding/editing; it is explicitly mandatory.
72. Do not do a "demo" with screenshots, video or Figma; a live working product is required.
73. Do not write historical information without a source; do not have artificial intelligence produce a history and put it in without verification.
74. Do not invent dates, persons, construction years. Leave a field you do not know empty or write "bilgi bekleniyor".
75. Do not put 100 MB TIFs directly into the app; the demo will slow down.
76. Do not trust the demo internet; have a local/offline version ready that works if the wifi at the final venue goes down.
77. Do not put VR at the center and leave the rest empty; the specification wants a mobile/desktop product, VR is a bonus.
78. Do not keep the Şanlıurfa narrative in the main story; the data is Bursa.
79. Do not use 3D models, music, icons of unclear license; list what you use in the README.
80. Do not have someone from outside the team give the presentation.
81. Do not explain accessibility only on a slide; the jury will press the button and see.
82. Do not describe too many features as "coming soon"; show what works, give the rest as a roadmap on one slide.
83. Do not collect personal data (name, phone, etc.) unless necessary; if you do, explain the protection measures.

## F. What will make us stand out (in priority order)

84. Three of the jury (Vakıf Katılım 2 + VGM 1) are from the institutions that own the content. The strongest message is to show that you are turning their own inventory book into "a living platform": "Envanter kitabı rafta kalmasın."
85. An automatic book-to-data pipeline: an import tool that pulls text from IDML/PDF and turns it into a structured artifact card (see 37). This proves the claim "the cost of adding a new city is nearly zero" and directly hits the scalability score.
86. Source and page next to every sentence: show the "Doğrulanmış Bilgi" badge concretely. Trust is very important for the VGM jury.
87. Live demo flow: discover → artifact detail → listen to audio → take it in hand in 3D → complete the quest → add a new artifact from the admin panel → approve a user contribution → the new city appeared. All the specification's MVP items in a single flow.
88. Show accessibility live: turn on a screen reader or audio narration and have an artifact listened to with eyes closed.
89. A real target user: a tourist / student / teacher touring Bursa. Start with one persona and one real scenario.
90. Scale story: Bursa (3 volumes) → Konya (2 volumes) → Hatay (1 volume) are already printed; with the same pipeline they all enter the platform.
91. Explain the architecture and the data model in the presentation with a single clear diagram; the specification explicitly asks for this.
92. Each team member should own a technical part and answer the jury's question on it (teamwork criterion).

## G. Concrete ideas tied to the Bursa archive

93. The "first capital of the Ottomans" route: the Orhan Bey, I. Murat Hüdavendigar, II. Murat (Muradiye) and Ulucamii külliyes; the archive has all of these folders.
94. An interactive diagram of "What is a külliye?": touching the mosque, madrasa, imaret, bathhouse, tomb parts opens the relevant artifact card (matches the külliye folders in the archive).
95. "Water journey": fountains and bathhouses from the Su Yapıları folder; the story of the foundation's water service to the city.
96. "Hans and trade": the Ticari Yapılar folder; the han/bazaar relation as the foundation's source of income (an educational layer explaining how a foundation works).
97. "Vakfiye card": for each artifact, who endowed it, for what purpose, what the source of income is. Add it if it is in the book, leave the field empty if not.
98. An aerial opening image with drone (DJI) photographs; a detail gallery with ERD photographs. A "framing type" label in the gallery: exterior, interior, detail, aerial.
99. A "detail hunt" game: a motif cropped from a high-resolution detail photograph is shown, and the user finds which artifact it is in.
100. Zooming into an inscription/tile detail in a high-resolution photograph with a deep-zoom viewer (e.g. OpenSeadragon). Turns the archive being "high-resolution" into an advantage.
101. Audio story: a 60–90 second text for each artifact, summarized from the source book and checked by a human; voiced with TTS and subtitled.
102. Restoration quest: a damaged-motif puzzle (put the pieces in place); when completed correctly the real photograph opens.
103. Category-based badges: "Türbe kâşifi", "Külliye ustası", "Su yolu takipçisi".
104. Community memories: a "Do you have a memory about this building?" form; after moderation, in the artifact page's "Topluluk anıları" section, with an "unverified" label.
105. Teacher package: a set of 5 artifacts + a 10-question quiz for the Ottoman founding period lesson.
106. City-adding wizard: in the admin panel "Yeni şehir" → district → category → artifact; add Konya live.

## H. 2-day quick implementation plan

107. [QUESTION – clarify this first] The final is a physical event on 7–8 November. Is "2 days" this final marathon, or before it? What does the document sent by the organization say about the submission time, presentation duration and submission format (repo link, APK, video, etc.)?
108. Hour 0–1: Open the existing code, list what works and what does not. Do not change the technology and hosting decision; build on top.
109. Hour 0–1: Task division. Suggested: (A) data + import pipeline + image downsizing, (B) artifact list/detail/map/accessibility interface, (C) admin panel + moderation + auth, (D) 3D/XR star artifact + presentation. Give the person working in parallel the most independent part (D or A).
110. Hour 1–3: Write the data model schema (JSON or database): cities, districts, categories, artifacts, media, sources, stories, contributions, quests.
111. Hour 1–4: Choose 10–12 Bursa artifacts (1–2 from each category), download and downsize 3–6 photographs for each.
112. Hour 2–6: Text: try pulling from the IDML; if that fails, copy from the PDF and enter a short history + source page number for each artifact. Have one person check every text against the book.
113. Hour 3–8: List + filter + map + artifact detail page + source line.
114. Hour 3–8: Admin panel: login, add/edit artifact, upload image, publish. Input validation.
115. Hour 8–12: Accessibility (alt text, contrast, font size, TTS, keyboard) + PWA setup.
116. Hour 8–12: Community contribution form + moderation queue.
117. Hour 12–16: 3D "Eline Al" star-artifact integration; quest + badge.
118. Hour 12–16: Routes (2–3 ready routes) and QR.
119. Hour 16–18: Tests, README, architecture diagram, license list.
120. Hour 16–20: A rehearsal of adding 1 artifact from Konya/Hatay via the panel (extensibility demo).
121. Hour 18–22: Presentation: problem → user → solution → live demo → architecture/data model → data use → innovation → scale → roadmap. Distribute the presentation order among the team members.
122. Hour 20–24: At least 3 full demo rehearsals, timed. A backup that works without wifi (local build + pre-loaded data). A recorded-video backup as a last resort, but the main demo will be live.
123. Cutoff rule: if one of the P0 items is not working at hour 16, P1/P2 work is stopped and everyone returns to P0.
124. A 10-minute sync every 3–4 hours: what is done, what is blocked.
125. In the last 2 hours no new features are added, only bugs are fixed.

## I. Technical notes for the agent

126. Open a new branch without breaking the existing repo; each P0 item as a separate commit.
127. Data files must be kept outside the code (e.g. /data/cities/bursa/*.json or a database seed); adding a city must not require a code change.
128. Image downsizing script: TIF/PSD/JPEG → WebP 1600px + 400px thumbnail; output naming: <sehir>-<eser-slug>-<sira>.webp.
129. Required fields in each artifact record: id, slug, name, city, district, category, summary, sources[] (book, volume, page), media[] (alt text + credit), verification_status.
130. User contributions in a separate table, status = pending/approved/rejected; only approved ones are public.
131. For accessibility checking, an automated tool (e.g. axe or Lighthouse) must be run and the result added to the README.
132. Invented data is forbidden: if a field is unknown, leave null and show "bilgi bekleniyor" in the interface.

## J. UPDATE (6 November 21:00): real status and priorities for the final

133. [VERIFIED] The final is a 24-hour continuous development marathon: be ready at 08.45 on Saturday 7 November at 42 İstanbul Şeker Han Campus (Sirkeci), the program starts at 09.00, and ends around 19.00–20.00 on Sunday. Program details will be given in the opening presentation.
134. [QUESTION] The presentation duration and submission format have still not been announced; they should be learned at the opening presentation and relayed to the agent.
135. [VERIFIED] The product is actually web + WebXR: kokxr.vercel.app. It is opened in the Quest browser and switched to VR with one button. The Unity plan of 23 October was not carried out; the product was developed on the web (Development Report 1).
136. [VERIFIED] What is ready: the home page; 2 artifacts (Ulu Camii, II. Murad/Muradiye Külliyesi), each with discovery points and 3 questions; vase, sword and tile workshops; the Yolculuk flow (take it in hand → walk through time → live the story); the sourced period slider (web); in VR the mosque interior, info card, model assembly, Muradiye board, vase; quiz and badge; admin screen; simulated Quest automated tests (83/83, etc.).
137. [VERIFIED] What the report explicitly lists as missing: the curator approval flow is a mockup, the teacher panel is a mockup, the Dijital Miras Kütüphanesi back end does not exist, no AR, only Ulu Camii was tried on a real Quest.
138. [QUESTION] Does the admin screen really save content (database/file), or is it only UI? Must be checked by reading the code.
139. [P0] Raise the number of artifacts from 2 to at least 10. The new artifacts may be without 3D: photographs from the Drive archive + a sourced short history from the inventory book + the existing artifact page template. The most critical task for the specification's "multiple artifacts" item and the "transferring the dataset into the product" criterion.
140. [P0] Make adding/editing artifacts from the admin screen work with real persistent storage; at the final, one artifact should be added live and appear on the home page.
141. [P0] Turn the curator approval flow from a mockup into a working one (pending/approved/rejected). Both the moderation requirement and the "Doğrulanmış Bilgi" promise.
142. [P0] Packaging: the specification says "mobile or desktop application". Fastest path: make the site a PWA (opens as an app via "install" on desktop and Android) and wrap the same site into a desktop application with Tauri/Electron. The VR demo stays unchanged in the Quest browser. [QUESTION] Ask the organization whether the jury counts a PWA as an application.
143. [P1] Proof of a new city: add 1 artifact from the Konya or Hatay inventory via the admin screen.
144. [P1] City/district/category filter and map; as the number of artifacts grows, discovery needs it.
145. [P1] Accessibility check (axe/Lighthouse), audio narration, font size and contrast; add the result to the README.
146. [P1] Match the claims in the presentation and on the site to the product: do not describe something that does not work as "existing". The Bursa → Konya/Hatay scale story instead of "Şanlıurfa".
147. [CAUTION] The sword in the sword workshop is in the Topkapı Palace Museum and is not a Bursa foundation artifact (the site's own note). The VGM jury may ask about this. Build the main demo on foundation artifacts, show the sword and tile as additional experiences.
148. Do not add new workshops/games. What you have is strong enough; the gaps are in the specification items (number of artifacts, content management, approval, packaging).
