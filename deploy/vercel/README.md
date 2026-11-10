# Vercel deployment

Vercel isn't linked to this GitHub account, so the live site is a small page plus the `api/` functions, deployed through the Vercel connector. The page's code, styles and icons are served from this repo at a pinned commit through jsDelivr (see `vercel.json`).

To ship a change: commit the new `assets/` files, then redeploy with the new commit in `vercel.json`. Or link the GitHub account in Vercel and import this repo directly.
