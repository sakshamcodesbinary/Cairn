# Cairn — Levels 1–4 cross-check

## Reading this checklist

**Implemented** means source or configuration exists. **Locally verified** means the validation command actually passed here. **Pending external evidence** requires the owner’s wallet, hosted repository, public profile, approval or recording. None of the four levels is claimed passed until its complete checklist is evidenced.

See `VALIDATION.md` for the local results. Repository initialization and commit creation were deliberately not performed.

## Level 1 — New Moon

| Requirement | Implementation / evidence | Remaining action |
|---|---|---|
| Node 22, Compact, Docker/proof tooling | npm tooling, WSL compiler wrapper, Compose | Node 22 verification recorded separately; Docker daemon must run for network tests |
| Compact public ledger + private witness | `contracts/cairn.compact`; explicit member/admin witnesses | None in source |
| Deliberate `disclose()` | Public policy, badge, nullifier and count only | Review privacy documentation |
| Real compile via Compact | Successful compiler run; fresh generated circuits and keys | Capture successful compile output showing circuits |
| Passing tests | Generated-contract test suite and adapter tests | Capture test output for submission |
| Generated managed directory | All three circuits with keys and ZKIR; synchronized to frontend | Include generated artifacts when creating repository |
| Preview or Preprod deployment | Browser admin deployer and optional CLI | Deploy with a funded wallet; publish verifiable address and screenshot |
| Initial product idea | README opening product paragraph | None in source |
| Public repository, README and setup | Complete documents prepared | Create and publish repository |
| Minimum 5 meaningful commits | No artificial history created | Owner maintains genuine development history |

**Level 1 status: code/tooling prepared; deployment and public evidence pending.**

## Level 2 — Waxing Crescent

| Requirement | Implementation / evidence | Remaining action |
|---|---|---|
| Lace connect/disconnect on Preprod | Connector discovery, network guard, session cleanup | Verify with an actual supported Lace extension and record it |
| Successful frontend circuit call | Witness-backed `prove_access` + indexed confirmation | Execute a real Preprod call; record transaction identifier |
| Observable privacy behavior | Public policy/badge/nullifier versus private secret/clearance | Show public ledger and receipt without exposing backup/secrets |
| Preprod contract address | Network-scoped runtime config; explorer links | Deploy specifically to Preprod and publish address |
| Live frontend | Vercel and Netlify configs | Publish frontend, set shared default address, add real demo URL |
| Demo video | Script in `docs/demo/README.md` | Record wallet connect and successful circuit call |
| Privacy claim in README | Includes public/private matrix and limitations | None in source |
| Minimum 8 meaningful commits | Owner-managed | Supply genuine history |

**Level 2 status: implemented; funded-wallet run, hosting and recording pending. Preview alone is insufficient.**

## Level 3 — First Quarter

| Requirement | Implementation / evidence | Remaining action |
|---|---|---|
| Meaningful Midnight privacy use | Private witnesses and clearance-bound credential proof | Live proof demonstration still needed |
| At least 3 passing tests | 25 generated-contract tests, plus adapter and browser checks | Attach actual output screenshot |
| Compile/test CI on every push | `.github/workflows/ci.yaml`, Node 22 | Push repository and obtain a passing hosted run |
| CI/CD | CI builds artifacts; hosting configs ready for connected-repo deployment | Attach Vercel/Netlify project and verify deployment |
| Provided idea selected | Private Allowlist Access | Submit `PROPOSAL.md` for approval; record approval |
| Privacy model documented | README, app field guide, security and architecture docs | None in source |
| One-minute full demo | Suggested script included | Record and publish |
| Minimum 10 meaningful commits | Owner-managed | Supply genuine history |

**Level 3 status: local engineering checks prepared; hosted runs, product approval and public evidence pending. Not independently audited production software.**

## Level 4 — Waxing Gibbous

| Requirement | Implementation / evidence | Remaining action |
|---|---|---|
| Working live Preprod MVP | Deployment, invitation proof, admin and registry flows | Host, deploy, run full Preprod flow and publish evidence |
| README + setup + usage | Complete product-specific documents | Add actual release address and URLs |
| Running product-repo CI/CD | Workflow and hosting configurations | Activate in the new repo; verify green run/deployment |
| Product X profile linked in README | No inherited/fake social profile | Create the real Cairn product account and link it |
| MVP demo video | Recording checklist included | Record funded-wallet flow |
| Minimum 15 meaningful commits | Owner-managed | Maintain genuine history; do not manufacture commits |

**Level 4 status: app/docs ready for deployment validation; public launch obligations pending.**

## Owner handoff — all external tasks

The original handoff mentioned deployment, screenshots and repository/commits. The full level rules additionally require hosting, a video, hosted passing CI, idea approval, and a product X profile. Do not overlook those:

- [ ] Start Docker/proving service if your wallet requires it; ensure DUST.
- [ ] Deploy the new contract to Preprod (Preview deployment is optional for Level 1).
- [ ] Verify a successful Lace connection, disconnect, admission and admin action.
- [ ] Publish contract address and actual explorer evidence.
- [ ] Create the public repository and meaningful history (5 / 8 / 10 / 15 minimums).
- [ ] Push and obtain a passing CI run; configure connected hosting deployment.
- [ ] Publish the demo with the correct shared Preprod address.
- [ ] Capture compile, tests, deployment and UI screenshots without secrets.
- [ ] Record wallet connect + admission + registry + admin flow.
- [ ] Submit the Private Allowlist Access proposal and obtain approval.
- [ ] Create the product X profile and add its real link to README.
- [ ] Replace README pending status entries only after the evidence exists.
