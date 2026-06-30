# BRICK Protocol

<p align="center">
  <img src="./logo-diamond.png" alt="BRICK Protocol logo" width="120">
</p>

<p align="center">
  <strong>HACD is the gold, BRICK is the craft — a fixed-supply building protocol on Hacash.</strong>
</p>

Static website and dashboard package for the BRICK Protocol project. This repository contains the public landing experience, whitepaper/genesis routing, and the dashboard workspace used for wallet connection, stacked HACD display, workers, construction area, and assets.

## Live Links

| Surface | URL |
| --- | --- |
| Main Site | [https://brickprotocol.org](https://brickprotocol.org) |
| Dashboard | [https://brickprotocol.org/dashboard/](https://brickprotocol.org/dashboard/) |
| Launchpad | [https://hacd.it/launchpad](https://hacd.it/launchpad) |
| X / Twitter | [https://x.com/protocolbrick](https://x.com/protocolbrick) |
| Telegram | [https://t.me/protocolbrick](https://t.me/protocolbrick) |

## Preview

![BRICK Protocol homepage preview](./assets/github/brick-home-preview.png)

## Feature Summary

| Area | Included |
| --- | --- |
| Landing page | BRICK homepage, navigation, BUILD NOW flow |
| Whitepaper | Embedded long-form whitepaper page |
| Genesis | Genesis / mint presentation and reveal timeline |
| Dashboard | Wallet bar, stacked HACD cards, workers, construction area, assets |
| Launchpad reference | Linked to [hacd.it/launchpad](https://hacd.it/launchpad) |
| Stack | Static HTML, CSS, and JavaScript |

## Project Structure

```text
brick-preview/
|-- index.html
|-- styles.css
|-- script.js
|-- favicon.png
|-- README.md
|-- .gitignore
|-- assets/
|   `-- github/
|       `-- brick-home-preview.png
`-- dashboard/
    |-- index.html
    |-- styles.css
    `-- script.js
```

## Local Preview

This project is static, so no build step is required.

## Files You Should Upload To GitHub

Upload these files and folders:

- `index.html`
- `styles.css`
- `script.js`
- `favicon.png`
- `README.md`
- `.gitignore`
- `assets/github/brick-home-preview.png`
- `dashboard/index.html`
- `dashboard/styles.css`
- `dashboard/script.js`

Do not upload:

- `server.err.log`
- `server.out.log`
- Any temporary local test files

## How To Upload On GitHub Web

1. Create a new repository on GitHub.
2. Open the repository page.
3. Click `Add file` -> `Upload files`.
4. Drag the full contents of this `brick-preview` folder, except log files.
5. Wait until all files finish uploading.
6. Write a commit message like `Initial BRICK Protocol site upload`.
7. Click `Commit changes`.

## How To Upload With Git

```bash
git init
git branch -M main
git add .
git commit -m "Initial BRICK Protocol site upload"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## Optional: Publish With GitHub Pages

1. Open your repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select branch `main`.
5. Select folder `/ (root)`.
6. Save.

If you use GitHub Pages, the homepage will load from the repository root and the dashboard will continue to work from the `dashboard/` folder.

## Notes

- The dashboard lives in the `dashboard/` folder.
- The main router and embedded pages live in `script.js`.
- If you deploy on a VPS or static host, keep the folder structure exactly the same.
