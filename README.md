# CompressPDF — Professional Client-Side PDF Compressor

> **Tagline:** Reduce PDF Size. Save Space. Share Faster.

CompressPDF is a modern, responsive, production-ready online PDF compression tool built with React, Vite, and Tailwind CSS. It allows users to optimize and shrink PDF file sizes entirely within their browser without sending files to any external server.

---

## 🌟 Key Features

- **100% Client-Side Processing**: Documents are processed locally in your browser memory using WebAssembly, `pdf-lib`, and `pdfjs-dist`. Files never touch a remote server or database.
- **Three Optimized Compression Levels**:
  - **Low Compression** – Minimal loss, preserves full vector fidelity and crisp text.
  - **Recommended Compression** – Balanced profile providing 40%–70% size reduction with sharp readability.
  - **High Compression** – Maximum reduction (65%–85%) for strict upload caps and email attachments.
- **Custom Target File Size (Typeable KB / MB)**:
  - Users can enter an exact required file size limit (e.g. `40 KB`, `100 KB`, `500 KB`, `1 MB`).
  - Includes a unit toggle (`KB` / `MB`) and quick-select preset chips (`40 KB`, `100 KB`, `200 KB`, `500 KB`, `1 MB`, `2 MB`).
  - The compression engine dynamically calibrates per-page budgets, scaling, and compression to meet the requested size.
- **Advanced Controls**:
  - Mode Switcher: *Smart Hybrid*, *Lossless Structural Only*, and *Maximum Downsampling*.
  - Grayscale conversion toggle for extra savings on invoices, receipts, and text scans.
  - Metadata stripper (removes author, creator, title, and timestamp data).
- **Honest Size Verification**:
  - Real before-and-after byte calculation.
  - No fake progress or fake compression numbers.
  - If a file is already maximally compressed, the engine verifies the structure and retains the original to prevent file size inflation.
- **Visual Feedback & Results**:
  - Live Page 1 thumbnail preview.
  - Visual comparison bar demonstrating size reduction.
  - Confetti celebration when significant space is saved.
  - Clean automatic file naming (`[filename]-compressed.pdf`).
- **Interactive Sample PDFs**:
  - 1-click test buttons with pre-generated sample documents (*Visual Brochure*, *Presentation Deck*, *Business Invoice*) for immediate testing.
- **Modern UI & UX**:
  - Light and Dark mode with persistent `localStorage` theme memory.
  - Glassmorphism design system with Tailwind CSS.
  - Interactive FAQ accordion, How It Works guide, and feature highlights.
  - Full modal views for Privacy Policy, Terms of Service, and Contact Form.
- **Monetization & AdSense Ready**:
  - Built-in responsive reserved ad containers (`hero-bottom`, `mid-content`, `bottom`).
  - Remains hidden until real approved AdSense code is configured (no fake ad mockups).

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS 3.4 + PostCSS + Custom CSS Glassmorphism
- **PDF Engines**:
  - [`pdf-lib`](https://pdf-lib.js.org/) for PDF object optimization, metadata removal, and stream deflating.
  - [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) for high-resolution canvas rendering, page thumbnail extraction, and visual stream optimization.
- **Icons**: Lucide Icons
- **Celebration Effects**: `canvas-confetti`

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js (v18.0 or higher recommended, tested on Node v24)
- npm (v9.0 or higher)

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd "D:/Pdf Compressor"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

---

## 📦 Building for Production & Deployment

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### Deploying to Vercel
```bash
npx vercel
```
Or connect the repository on Vercel (Preset: **Vite**, Root Directory: `./`).

### Deploying to Netlify
```bash
npx netlify deploy --prod --dir=dist
```
Or drag-and-drop the `dist/` directory into your Netlify dashboard.

---

## 📬 Contact & Support

For issues, bug reports, or inquiries:
- **Email**: [businesswithsuchit@gmail.com](mailto:businesswithsuchit@gmail.com)
- **Interactive Form**: Available on the site via the **Contact** button.

---

## 📂 Project Architecture

```
d:/Pdf Compressor/
├── public/
│   ├── favicon.svg             # Modern vector logo favicon
│   ├── pdf.worker.min.js       # Static WebWorker for PDF.js engine
│   └── samples/                # Sample test PDFs
│       ├── sample-invoice.pdf
│       ├── sample-presentation.pdf
│       └── sample-brochure.pdf
├── src/
│   ├── components/
│   │   ├── Modals/
│   │   │   ├── PrivacyModal.jsx # Comprehensive privacy disclosures
│   │   │   ├── TermsModal.jsx   # Terms of service modal
│   │   │   └── ContactModal.jsx # Interactive contact form with validation
│   │   ├── Navbar.jsx           # Responsive header with theme toggle & mobile drawer
│   │   ├── HeroUpload.jsx       # Drag-and-drop zone with sample triggers
│   │   ├── FileConfigCard.jsx   # Level selector, thumbnail & advanced settings
│   │   ├── ResultCard.jsx       # Metrics, visual reduction bar & download action
│   │   ├── HowItWorks.jsx       # 3-step visual guide
│   │   ├── Features.jsx         # 6 core capability cards
│   │   ├── CompressionGuide.jsx # Detailed comparison table (Low vs Rec vs High)
│   │   ├── PrivacySection.jsx   # Security & GDPR/HIPAA compliance explanation
│   │   ├── FAQ.jsx              # Accordion with schema-friendly FAQ
│   │   ├── AdContainer.jsx      # AdSense-ready reserved slot
│   │   └── Footer.jsx           # Navigation, branding & legal links
│   ├── utils/
│   │   └── pdfCompressor.js     # Real client-side compression engine & helpers
│   ├── App.jsx                  # Main state container & page assembler
│   ├── index.css                # Tailwind directives & glassmorphic styling
│   └── main.jsx                 # React root bootstrap
├── tailwind.config.js           # Brand colors, dark mode & animations
├── postcss.config.js            # PostCSS configuration
├── vite.config.js               # Vite bundler configuration
└── package.json                 # Project dependencies & scripts
```

---

## 🔒 Security & Privacy

CompressPDF processes all document bytes directly inside your web browser sandbox using JavaScript `ArrayBuffer` and `Blob` APIs. Temporary `ObjectURL` references are immediately revoked upon completion or reset. No files are ever uploaded or transmitted across the network.
