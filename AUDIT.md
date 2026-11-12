# Checked Lab audit

Reviewed the shared templates, `assets/site.css`, `assets/site.js`, `assets/card.js`, and the pages `scripts/build.mjs` writes. URLs, titles, descriptions, canonicals, and the homepage Google and Impact verification tags were left in place. No Thanksgiving files were edited.

## Design

The previous chrome was a gray page, a blurred white header, and text rows. A handful of cards showed manufacturer photos. Hubs opened with a headline and no artwork. Category links were small gray icons.

The shared stylesheet now uses a bright lab palette (violet, magenta, yellow, cyan, orange) on a warm background, Newsreader for headings, and Source Sans 3 for UI text. Hubs, gifts, winter safety, toy safety, Black Friday, compare, and the recall desk each get an original inline SVG scene with a CHECKED stamp. Category links are colored cards. Cards lift on hover. Sections fade in on scroll. Motion is turned off when `prefers-reduced-motion` is set. The existing line “CHECKED BEFORE YOU BUY” stays in the header. No new tested or bought claims were added.

## Mobile UX

Under 800px the header hid every link except Recall checks, and How we check plus BIN list were `display: none`. The email strip stacked into three lines. Product art, when it existed, sat under the writeup.

Header links now wrap so Recall checks, How we check, BIN list, gift guides, toy safety, and winter safety stay reachable. The email strip hides on small screens (the footer still lists the addresses). Touch targets stay at least 44px. The product illustration is the first thing in the card. A sticky bar holds the region’s Amazon button when the page has one, otherwise “Is it recalled?”, plus a Back to top control. On wide screens the Amazon bar is hidden so it does not cover the third card; Back to top stays.

## Performance

The homepage preloaded a large product WebP and the header used a backdrop blur. Those requests and the blur are gone. Heroes and product art are inline SVG, so a card does not wait on an image file and does not shift when a photo is missing. Scripts stay vanilla. The body font preload is still low priority. Lighthouse was not run in this environment. The change removes the previous hero image from the critical path and does not add a library.

## Accessibility

The skip-link rule existed in CSS and the markup did not. Pages now include “Skip to content” pointing at `main#main`. Focus outlines stay 3px. The recall search and gift finder use real labels, legends, and buttons. Checklist rows become checkboxes with an accessible name. Badge text is dark on light fills. The magenta button is `#9D174D` with white type so it clears ordinary text contrast. The US/CA control is still a pair of buttons.

## SEO

Titles, meta descriptions, canonicals, Open Graph tags, and the sitemap URL set are unchanged. The build still rejects `offers`, `aggregateRating`, prices, and review fields in JSON-LD. Product schema no longer points at the old `/images/` files, because those were manufacturer photos without a license. A future `image` value that is an `http(s)` URL is copied into the same schema `image` field. New internal links: safety-note badges to the winter and toy guides, the gift finder, and the CPSC and Health Canada search links on the recall widget. The homepage still has the Google site verification meta and the Impact verification meta.

## Conversion

The Amazon control was a quiet text link, and on a phone it sat below a long recall answer. It is now a filled button in the card and, on small screens, a sticky bar that follows the active region so the US tag and the CA tag never cross. The homepage shows the search, the category tiles, and the pick grid before the gift finder, so the catalogue is not buried under the tools.

## Product images

Every pick renders an image slot. With no licensed photo, the slot is an original drawing of the product type (blender, heater, headphones, bricks, scooter, and the rest) on a brand-color ground, with an accessible name and lazy loading when the slot is a real `<img>`. `product.image` is used when it is an `http(s)` URL, including a later Amazon PA-API or SiteStripe URL, without a template change. Amazon hosts are still allowed only when that URL is the product’s own `image` value. The committed files in `/images/` were manufacturer photos, so they are not rendered and have been removed from the tree.

## What still sits outside this pass

The recall index stays a text list so that page does not inline an illustration for every model. Local Lighthouse numbers were not collected here. Checklist state is stored in `localStorage` on this browser only.
