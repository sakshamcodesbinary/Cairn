# Cairn assets and implementation references

## Local visual assets

- `frontend/public/images/cairn-summit.jpg`: alpine valley image downloaded from Unsplash image `photo-1464822759023-fed622ff2c3b`, resized to 2200px wide for the hero.
- `frontend/public/images/cairn-forest.jpg`: granite mountain and forest image downloaded from Unsplash image `photo-1472396961693-142e6e269027`, resized to 1200px wide.
- Both are local files at runtime. Review the current Unsplash license and image provenance before commercial redistribution. No photographer name is invented here.
- `frontend/public/favicon.svg` and `components/CairnMark.tsx`: Cairn’s stacked-stone mark, authored for this product.
- Invitation landscape linework: authored SVG illustration. Explicitly labeled an illustration, not an on-chain receipt.

Fonts are locally packaged through `@fontsource-variable/manrope` and `@fontsource-variable/bricolage-grotesque`; their packages include the applicable font licenses. Lucide icons retain their upstream license.

## Skills applied

- UI/UX Pro Max: generated design-system research, responsive layout, labels, contrast, touch targets and reduced motion.
- Frontend Design: product-specific alpine direction and intentional typography; documented palette override in `design-system/cairn/DIRECTION.md`.
- Midnight RPC: application/indexer versus node RPC boundary and safe exposure guidance.
- Imported from skills.sh: `vercel-labs/agent-skills`, `vercel-react-best-practices`. Applied route/SDK lazy loading, independent async work and semantic rendering. The installed skill is under `.agents/skills`; no skill text is part of the public UI.

## Guide reconciliation

The Midnight master reference was consulted for the toolchain, explicit witness model, Compact compilation, browser provider pattern and level checklists. Installed SDK declarations were used to correct sample-code assumptions: witnesses attach to the compiled contract, connector submission can return void, providers include a separate submission role, and a submitted transaction is not automatically a confirmed one. Privacy claims are narrower than “inputs never leave the browser.”
