# KökXR — Chat Summary and Development Handover

**Date:** 2 Kasım 2026  
**Purpose:** To be able to pass this chat's context on to Claude Code, Codex CLI and Google Antigravity.

## 1. Project summary

- **Project name:** KökXR
- **Slogan:** “Dokunamadığın tarihe dokun.”
- **Context:** The KÖK&KOD hackathon; foundation (vakıf) works and cultural heritage.
- **Idea:** Discovering historical places and artifacts in a digital environment; where possible, examining 3D models of the artifacts, learning their stories and reinforcing them with interactive tasks.
- **Target users:** Students and schools, museums, foundations and cultural heritage institutions.
- **Long-term vision:** VR/AR support, 3D digital twins, time layer, restoration tasks, verified information, digital heritage library, KökMobil reaching rural schools.

## 2. Team and current status

- The team has 4 people; they know C, and have no Unity/game/VR development experience.
- Team in the uploaded presentation: Muhammet Ali Divan (captain), İsmet Bayandur, Selami Ali Şimşek, Meltem Taşkın.
- In the first conversations it was said that about two weeks remained and that concrete development had not yet started; **the remaining time must be verified again**.
- The user works on **Ubuntu/Linux**.
- Verified versions of the installed tools:
  - Claude Code: `2.1.309`
  - Codex CLI: `0.166.0`
  - Git: `2.53.0`
  - Node.js: `v24.22.1`
  - npm: `11.19.1`
- It was stated that Google Antigravity is also installed; its command-line integration has not yet been verified.
- The user has Claude Max, Codex and Gemini/Antigravity access.

## 3. Resources provided

### Bursa foundation works photo archive

A folder named **“Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi”** was shared with the user via Google Drive. The following folders are visible in the screenshot:

- `KÖK&KOD`
- `II. Cilt - Yıldırım`
- `III. Cilt - Diğer İlçeler`
- `I. ve II. Cilt - Osmangazi`

A PDF is also visible. **The photographs inside the folders have not yet been examined one by one.** The user stated that the images are not suitable for VR/360°; sample photographs are needed for a definitive technical assessment.

### Publications and reference sites

- Vakıf Katılım publications: https://www.vakifkatilim.com.tr/tr/hakkimizda/medya-merkezi/yayinlarimiz
- Sanal Müze: https://sanalmuze.gov.tr/
- 3D Mekanlar: https://www.3dmekanlar.com/
- 360TR: https://www.360tr.com/tr/

These sources came up for research and reference purposes. **Republishing technically accessible images is not automatically permitted.** In particular, the terms for using the photo archive in the hackathon demo and in the public application must be clarified with the sharing institution. No solution that relies on bypassing the protections of third-party sites or on unauthorised bulk downloading should be planned.

### Presentation

The user uploaded the file `KokXR_Sunum_v2 (1).pptx`. The main promises in the presentation:

- “Eseri Eline Al”: hold, rotate, enlarge, take apart into pieces.
- “Zaman Katmanı”: moving to the structure's past period.
- “Restorasyon Görevi”: repair by matching the pieces correctly.
- “Doğrulanmış Bilgi”: explanations from approved sources.
- Access via VR / AR / Web.
- The demo framing of the presentation: **one site · one artifact · one scenario**.

Not all of these features have been built yet; the vision in the presentation and the working prototype must be shown separately.

## 4. Technical direction decision taken

**First product:** A working **web prototype / clickable mockup** before a real VR application.

Recommended technology:

- React + TypeScript + Vite
- Tailwind CSS (if needed)
- Three.js or React Three Fiber when a 3D model is available
- A suitable web panorama viewer when a 360° panorama is available
- The first version does not require a backend, database, user login or real VR.

**Why?** The given photographs are not directly suitable for VR. Normal photographs can be used in the gallery, at information points and in zoomed inspection. A normal photograph must not be presented as a reliable real 360° place or a verified 3D digital twin.

## 5. MVP scope

1. KökXR welcome screen and slogan.
2. Selection of **a single foundation work / site** from Bursa.
3. Visual discovery with the photographs provided by the institution.
4. Clickable information points on the photograph.
5. Zoomed inspection of the artifact or architectural detail.
6. A historical information panel with a known source.
7. A three-question mini test.
8. A demo that can be shown smoothly from start to finish.

**Conditional feature:** Rotatable 3D inspection if there is a real `.glb`/`.gltf` model with permission to use. A panorama viewer if there is a 360° panorama. If these assets do not exist, the related features must not be promised in the MVP.

**Out of scope for now:** Real VR headset integration, full 3D site scanning, automatic historical reconstruction, time layer, restoration simulation, AI guide, multi-museum catalogue, KökMobil infrastructure.

## 6. Division of work among the agents

| Tool | Responsibility | Main output |
|---|---|---|
| Claude Code | Technical lead, task planning, scope control | `docs/plan.md`, `docs/next-task.md` |
| Codex CLI | Code development, testing, build | React application |
| Google Antigravity | IDE, visual inspection in the browser, quality control | Test and design report |

**Important:** The agents may share the same folder but must not edit the same files at the same time. At the start, let Claude → Codex work in sequence; let Antigravity do manual inspection. Automatic three-agent orchestration should be set up only after this basic flow has been verified. Use Git commits and human approval.

## 7. Recommended first setup on Linux

The commands below were **recommended; it has not yet been verified that the user ran them**.

```bash
mkdir -p ~/Projects/kokxr/docs
mkdir -p ~/Projects/kokxr/kaynaklar
cd ~/Projects/kokxr
git init

cat > .gitignore <<'IGNORE'
node_modules/
dist/
.env
.env.*
!.env.example
kaynaklar/
IGNORE
```

### Shared agent rules

The following principles can be written into `~/Projects/kokxr/AGENTS.md`:

```markdown
# KökXR Geliştirme Kuralları

KökXR, Bursa'daki vakıf eserlerini dijital olarak keşfetmeye yönelik bir hackathon prototipidir.

Teknolojiler: React, TypeScript, Vite.

İlk hedef:
- Ana sayfa
- Tarihi eser seçimi
- Fotoğraf galerisi
- Bilgi paneli
- Üç soruluk test

Kurallar:
- Arayüz Türkçe olacak.
- Önce çalışan basit sürümü geliştir.
- Verisi olmayan 3D veya VR özelliklerini varmış gibi gösterme.
- Tarihsel bilgi uydurma.
- Lisansı belirsiz görselleri herkese açık depoya yükleme.
- Her aşamada uygulamayı test et.
- Görev kapsamı dışında değişiklik yapma.
```

### Producing a plan from Claude

```bash
cd ~/Projects/kokxr
claude -p --permission-mode plan \
  "AGENTS.md dosyasındaki kuralları dikkate al. KökXR için yalnızca ilk geliştirme aşamasının planını oluştur. Hedef React + TypeScript ile çalışan ana sayfa ve eser seçimi ekranı. Kod yazma. Türkçe, net ve uygulanabilir görevler yaz." \
  > docs/plan.md
```

### Having Codex implement it

```bash
cd ~/Projects/kokxr
codex exec --sandbox workspace-write \
  "AGENTS.md ve docs/plan.md dosyalarını oku. İlk geliştirme aşamasını uygula. React, TypeScript, Vite kullan. Ana sayfa ve eser seçim ekranını geliştir. npm run build ile doğrula. Henüz VR, 360 derece veya backend oluşturma."
```

### Antigravity

Open the `~/Projects/kokxr` folder in Antigravity. Run the application, inspect the interface in the browser; at the start report problems without changing files. Automatic invocation of Antigravity from the CLI has not yet been verified.

## 8. First-week goal

| Day | Goal |
|---|---|
| 1 | Choose a single artifact and its sample photographs; verify the usage permissions. |
| 2 | Plan with Claude, home page with Codex. |
| 3 | Site selection, photo gallery, detail screen. |
| 4 | Information points and zoom. |
| 5 | Historical content and mini test. |
| 6 | Browser test with Antigravity; fixes with Codex. |
| 7 | End-to-end demo, backup, screen recording. |

The second week can be set aside for evaluating the 3D/360° possibilities depending on the state of the existing prototype, bug fixing and presentation rehearsal. This is a target plan; it is not a time guarantee.

## 9. Open questions and next step

- **Was the project folder actually created?** Terminal output is awaited.
- Which Bursa foundation work will be chosen from the Drive?
- Can 5–10 sample photographs of the same artifact be shared?
- Is there permission to use the photographs in the hackathon prototype and the public demo?
- Is a live demo with a VR headset mandatory for the hackathon?
- What is the current submission date and remaining time?

**Nearest concrete step:** Create the `~/Projects/kokxr` folder, copy this Markdown file as `docs/sohbet-ozeti.md`, choose a single artifact and have Claude prepare `docs/plan.md`. Let Codex implement only the first task. Let Antigravity test the first screens.

---

> **Source distinction:** This document was compiled from the chat with the user, the shared Google Drive screenshot and the uploaded KökXR presentation. The photographs inside the Drive have not yet been examined; the recommended technical architecture and division of tasks are development advice, not a statement of a completed product.
