# Cairn — visual direction

UI/UX Pro Max returned the relevant minimal/Swiss layout and Outfit/Work Sans typography. Its general-purpose pink palette was not specific to invitation access. This art direction deliberately overrides that palette and pairing; the accessibility, hierarchy, and interaction guidance still applies.

## Product
A private invitation gate for small field teams, retreats, and research circles. A cairn marks a route without telling the story of everyone who passed it. The same idea informs the product: public proof of access, private invitation credentials.

## Tokens
- Fog `#f1f4f5`: day canvas
- Snow `#ffffff`: day surfaces
- Basalt `#172d39`: primary ink
- Glacier `#b4e2ee`: hero actions / night accent
- Deep water `#17627c`: day accent and focus
- Blue hour `#101d27`: night canvas
- Muted slate `#536774` (day), `#aec0ca` (night): secondary text

Typography: self-hosted Bricolage Grotesque for identity and large headings; self-hosted Manrope for UI and readable body. System monospace only for actual hashes/code. No decorative all-caps labels.

## Layout
```
[ cairn       Overview  Your invitation  Registry  Field guide     sun  wallet ]
[ alpine photograph                                                       ]
[ Access is personal.                         [illustrative invitation]   ]
[ Your identity stays that way.                [private / public boundary] ]
[ Use invitation     Set up a gate                                         ]
[ invitation → proof → public receipt: an actual three-step workflow       ]
[ choose your next step          three quiet, unequal action rows          ]
[ landscape inset                public/private disclosure explanation     ]
```

The landscape is the sole visual spectacle. Avoid 3D orbits, neon glows, gradients as filler, invented activity, fake wallet sessions, and fabricated privacy metrics. Illustration labels must say they are illustrative. Operational pages retain the same comfortable spacing but put task forms before decoration.

## Interaction and accessibility
44px controls; visible focus; keyboard disclosure navigation; correct current-page states; real progress stages rather than fake percentages. Theme preference persisted under a Cairn-only key, defaulting to OS. No automatic parallax; reduced motion respected. At 375px, every form, hash, and navigation panel must fit without horizontal overflow. No secret storage in browser localStorage. Local images reserve dimensions; offscreen images lazy-load.
