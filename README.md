# Nermine El-Behery — Life & Relationship Coaching

Official bilingual (English / Arabic) website for Nermine El-Behery, Life & Relationship Coach.

نبذة بالعربي: الموقع الرسمي لنرمين البحيري، مدربة حياة وعلاقات. الموقع ثنائي اللغة (عربي/إنجليزي) ويتبدّل تلقائيًا من الزرار EN/AR أعلى الصفحة.

---

## 📁 Project structure

```
site/
├── index.html          → the whole page (structure + content)
├── css/
│   └── styles.css      → all visual styling, organized by section
├── js/
│   ├── particles.js    → animated background (Three.js particle scene)
│   └── main.js         → language switcher, mobile menu, booking form
├── images/             → all photos, logos, and covers used on the site
└── README.md           → this file
```

## ▶️ Running it locally

No build step, no install — it's plain HTML/CSS/JS.

1. Keep all folders (`css`, `js`, `images`) next to `index.html`.
2. Because the background animation loads a 3D library from the internet, opening `index.html` by double-clicking it may block that one script in some browsers (a local `file://` security restriction). To see the full experience, serve it locally instead:
   ```bash
   cd site
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.
3. Everything else (text, images, buttons, forms, language switch) works either way.

## 🌍 Deploying to GitHub Pages

1. Create a new **public** GitHub repository.
2. Upload everything **inside** the `site` folder (not the `site` folder itself) to the root of the repository — `index.html` should sit at the top level.
3. Go to the repo's **Settings → Pages**, set the branch to `main` and the folder to `/ (root)`, then save.
4. Your site will be live at `https://your-username.github.io/your-repo-name/`.

## ✏️ Editing content

| To change... | Edit this file |
|---|---|
| Text, sections, links | `index.html` |
| Colors, fonts, spacing, layout | `css/styles.css` |
| Language switcher, mobile menu, booking form | `js/main.js` |
| Background animation | `js/particles.js` |
| Photos, logos, book/course covers | replace the matching file in `images/` (keep the same filename, or update the reference in `index.html`) |

Every piece of bilingual text in `index.html` uses two attributes on the same element:

```html
<p data-en="English text" data-ar="النص بالعربي">English text</p>
```

Edit both attributes together to keep the two languages in sync.

## 📩 Contact form behavior

The "Book a Session" and "Order the Book" buttons open a small popup asking for name and phone number. Since this is a static site with no backend/server, submitting the form opens a **pre-filled WhatsApp message** to the number set in `js/main.js` (search for `201033708703`) rather than saving to a database. Update that number there if it ever changes.

## 🔧 Tech used

- Plain HTML5, CSS3, vanilla JavaScript (no framework, no build tools)
- [Three.js](https://threejs.org/) for the background particle animation (loaded from a CDN)
- [GSAP](https://gsap.com/) + ScrollTrigger for scroll-based effects (loaded from a CDN)
- Google Fonts: Playfair Display, Amiri, Manrope
