# Prapti Das — Portfolio

Gothic Victorian maximalist portfolio website. Multi-page, fully static HTML/CSS/JS. Ready to deploy on Vercel, Netlify, or GitHub Pages.

---

## File Structure

```
prapti-portfolio/
├── index.html                  ← entire site lives here (all pages)
├── css/
│   └── style.css               ← all styles
├── js/
│   └── main.js                 ← routing, carousel, page animations
├── assets/
│   ├── images/
│   │   ├── poster.jpg          ← Zariya Productions poster
│   │   ├── carousel-1.png      ← Smash Guys campaign post 1
│   │   ├── carousel-2.png      ← Smash Guys campaign post 2
│   │   ├── carousel-3.png      ← Smash Guys campaign post 3
│   │   └── storytelling.png    ← storytelling thumbnail
│   └── videos/
│       ├── event_reel.mp4
│       ├── story_telling.mp4
│       ├── fast_paced_edit.mp4
│       ├── montage.mp4
│       ├── story_board.mp4
│       └── typography_based.mp4
├── .gitattributes              ← tells Git to use LFS for video files
├── .gitignore
└── README.md
```

---

## Pages

| Page | Nav Label | Theme |
|---|---|---|
| Home | Home | Frankenstein / Gothic Victorian |
| Work | Work | Dark laboratory |
| Resume | Resume | Harry Potter parchment |
| Writing | Writing | The Book Thief |
| Skills | Skills | Mortal Instruments |
| Experience | Experience | Percy Jackson |
| Industries | Industries | Before the Coffee Gets Cold |

---

## How to Upload to GitHub (With Large Video Files)

Videos are between 7MB and 22MB. GitHub allows individual files up to 100MB, but warns at 50MB and can be slow. The correct solution is **Git LFS (Large File Storage)** — GitHub gives you 1GB of LFS storage free.

The `.gitattributes` file in this repo is already configured to track `.mp4` files with LFS. You just need to install LFS once.

---

### Step 1 — Install Git LFS on your computer

**Windows:**
1. Download Git from https://git-scm.com (if you don't have it already)
2. Download Git LFS from https://git-lfs.com
3. Run the installer
4. Open **Git Bash** (or Command Prompt) and run:
   ```
   git lfs install
   ```
   You should see: `Git LFS initialized.`

**Mac:**
1. Open Terminal
2. If you have Homebrew: `brew install git-lfs`
3. Then run: `git lfs install`

---

### Step 2 — Create a GitHub repository

1. Go to https://github.com and log in
2. Click the **+** button in the top right → **New repository**
3. Name it: `prapti-portfolio` (or anything you like)
4. Set it to **Public** (required for free Vercel hosting)
5. Do NOT check "Add a README" — the repo must be empty
6. Click **Create repository**
7. Copy the URL it shows you. It will look like:
   `https://github.com/YOUR-USERNAME/prapti-portfolio.git`

---

### Step 3 — Upload the repo from your computer

Open **Git Bash** (Windows) or **Terminal** (Mac) and run these commands one by one.

Replace `YOUR-GITHUB-URL` with the URL you copied in Step 2.

```bash
# 1. Go into the portfolio folder
cd path/to/prapti-portfolio

# 2. Start a git repo
git init

# 3. Make sure LFS is active
git lfs install

# 4. Stage everything
git add .

# 5. Make your first commit
git commit -m "Initial commit — portfolio"

# 6. Connect to GitHub
git remote add origin YOUR-GITHUB-URL

# 7. Push everything (videos go via LFS, code goes normally)
git push -u origin main
```

> **Note:** The first push may take a few minutes because the videos upload via LFS. That is normal.

---

### Step 4 — Deploy on Vercel (free)

1. Go to https://vercel.com and sign in with your GitHub account
2. Click **Add New Project**
3. Select your `prapti-portfolio` repository
4. Vercel will detect it is a static site automatically
5. Leave all settings as default
6. Click **Deploy**
7. In about 60 seconds you will have a live URL like `prapti-portfolio.vercel.app`

You can also set a custom domain later from the Vercel dashboard.

---

### Troubleshooting

**"error: File too large" when pushing:**
This means LFS was not initialized before you ran `git add`. Fix:
```bash
git lfs install
git lfs track "*.mp4"
git add .gitattributes
git add assets/videos/
git commit -m "Add videos via LFS"
git push
```

**"remote: error: GH001: Large files detected":**
Same fix as above — make sure `git lfs install` runs before `git add`.

**Videos don't play on the live site:**
Vercel serves LFS files correctly. If videos don't play, check that the `src` paths in `index.html` match the actual filenames in `assets/videos/` exactly (case-sensitive).

**Page is blank:**
Open browser DevTools (F12) → Console tab. Look for 404 errors on CSS or JS files. Make sure `css/style.css` and `js/main.js` exist in the right folders.

---

## Making Changes

To update the site after the first push:

```bash
# Make your edits in index.html, css/style.css, or js/main.js
# Then:
git add .
git commit -m "Update — describe what you changed"
git push
```

Vercel will automatically redeploy within 30 seconds of every push.

---

## Contact

**Prapti Das**  
das.2006prapti@gmail.com  
linkedin.com/in/praptid2006  
+91 761 950 5512
