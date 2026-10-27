Edit templates/navbar.html for the shared navigation component. Every generated page uses this same navbar.

Edit templates/site.html for the shared page layout and content/site-copy.json for expanded page copy. Verified project and service records are in arcane-knowledge.js.

Run node scripts/build-pages.cjs from the repository root after changing the template, copy or records. This regenerates the 23 public pages, structured data, metadata, sitemap, page manifest and shared assistant knowledge. Changes to arcane.css, arcane.js, arcane-craft.js (the interactive project-menu craft scenes) and arcane-guide.js are maintained directly.

Deploy the generated HTML and assets together. Internal links use regular page URLs. Legacy fragment routes remain supported on the homepage. Direct visits retain the opening animation; internal page navigation skips replaying it.
