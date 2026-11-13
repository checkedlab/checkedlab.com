# Checked Lab design v3

Visual system for a recall-checked buying guide. The job of the page is to be believed: one model, one public recall check, one way to the store. Nothing on the page imitates a lab score, a seal, or a press logo.

## What was studied

Screenshots, 10 November 2026, desktop Chrome, 1440px wide.

**Wirecutter** (nytimes.com/wirecutter). White page, black wordmark, text navigation (Home & Garden, Kitchen, Tech), and a single quiet commission sentence above the stories. Color lives in the photography. The chrome is black, white, and one black button. A review URL was stopped by the New York Times human check, so the pick-box interior was not captured; the homepage was enough for the chrome, the disclosure, and the type.

**RTINGS.** White header, one red wordmark, plain text navigation, and photography of a real test bench. The numbers on that homepage (products tested, facility size) are theirs. Checked Lab does not borrow scores, counts, or “tested by us.”

**Consumer Reports.** Near-black hero, one green used for figures and the join button, white story cards. The lesson is restraint: one accent, a lot of quiet space. The black full-bleed hero was not copied. This site has no hero photograph to fill it.

**Good Housekeeping Institute.** White page, one teal bar, heavy black headlines, a hairline under the title. The oval seal and “quality tested” marks were not copied. Checked Lab does not certify products.

**Which?** White page, black wordmark with a single red mark, text categories, one blue primary button. A cookie dialog covered the middle of the shot. Best Buy badges and prices were not copied.

**The Strategist** (nymag.com/strategist). White page, a large black display wordmark, small tracked navigation, and the commission sentence directly under the masthead. One small green control. Photography, not drawings.

## Palette

| Role | Hex | Use |
| --- | --- | --- |
| Page | `#F7F6F3` | Background. Warm only by a shade, so it does not read as craft paper. |
| Surface | `#FFFFFF` | Header, cards, photo wells. |
| Ink | `#1A1916` | Headlines and titles. |
| Secondary ink | `#3E3C38` | Body. |
| Muted | `#5E5C57` | Meta, captions, breadcrumbs. |
| Hairline | `#E4E2DC` | Card borders, rules. |
| Strong hairline | `#C9C6BE` | Secondary button borders. |
| Brand | `#173652` | The one identity color. Logo mark, current hub, primary store button, footer. |
| Brand deep | `#102538` | Primary button hover. |
| Clear ink | `#0C5436` | “No recall found” text. |
| Clear tint | `#E7F4ED` | Clear status background. |
| BIN | `#9E1C2E` | Reserved. Not used as decoration. |
| BIN ink | `#8C1526` | BIN text. |
| BIN tint | `#FDECEE` | BIN background. |
| Waiting ink | `#3E3C38` | Unconfirmed or not-yet-checked status. |
| Waiting tint | `#F1F0EC` | Waiting status background. |
| Footer text | `#E4ECF4` | On the brand band. |

Every pair above clears WCAG AA for normal text (the lowest planned pair, muted on the page background, is about 6.2:1). White on brand is about 12.5:1. Clear ink on clear tint is about 7.9:1. BIN ink on BIN tint is about 8.2:1.

Green is the recall accent, and only the recall accent. Red appears only when a record matches the model. A waiting check stays neutral, so it cannot be read as a pass. Hubs do not get their own colors. Wirecutter, Which?, and the Strategist do not paint each vertical a different hue, and the old rainbow bars were the part that looked amateur.

## Type

**Newsreader** for headings (self-hosted, latin, `font-display: swap`). A text serif with a real optical size, used at a controlled scale. Fraunces was the previous display face; its soft terminals read as a lifestyle shop.

**Source Sans 3** for body, navigation, buttons, and meta (self-hosted variable latin, `font-display: swap`). A plain institutional sans, closer to Which? and RTINGS than to a geometric startup face.

Scale, from a 16px body:

| Step | Size | Use |
| --- | --- | --- |
| Meta | 12px | Eyebrows, model line, badge |
| Small | 12–14px | Footer disclosure line, notes, store buttons |
| Body | 16px | Cards, evidence |
| Lede | 17–18px | Prose, “why it’s listed” |
| Sub | 20px | Home deck |
| Title | 22px | Hub tiles |
| Section | 28px | Section headings |
| Hub | 36–48px | Hub and prose titles |
| Home | 36–56px | Home title. Capped so the all-caps line does not become a poster. |

Headings use weight 500 and a line-height near 1.05. Body uses 1.5, prose 1.65.

## Spacing

A 4/8 scale: 4, 8, 12, 16, 24, 32, 48, 64, 80. The content column is 1120px. Cards use 8px corners and a 1px hairline, not a heavy black stroke and not a soft 20px blob. Page padding is 24px, 16px under 720px. Store buttons and hub links are at least 44px tall.

## Cards

A card is a white split: the writeup on the left, the photograph on white on the right. On a narrow screen the photograph moves above the text. The status is an inline label (Recall-checked, Check model, or BIN), not a sticker hanging off the border. Under the title: why the model is listed, then the recall line, then the store buttons. Evidence links are underlined in the brand navy. They are not colored pills.

Where there is no photograph, the card does not reserve a media column. The writeup runs full width, and the model name stays in the title. The old hub drawings were clip-art on a tinted wash, so they are not used.

## Trust cues

- The affiliate disclosure is one small muted line in the footer: “As an Amazon Associate, Checked Lab earns from qualifying purchases.”
- The footer is a solid brand band. That line sits in the band once per page, in 12px type and a low-contrast gray, with no bold label.
- The current hub is an underline, not a filled pill.
- US / CA is a small segmented control. The active side is the brand color.
- Status color is meaningful: green means the recorded check found no matching recall, red means BIN, gray means the check is not a pass.

## What was deliberately left out

Prices, star ratings, review counts, “tested by us,” testimonials, and any seal or press logo. Those are how the reference sites signal authority, and they would be false here. The authority on Checked Lab is the named model, the public recall source, and the maker page.
