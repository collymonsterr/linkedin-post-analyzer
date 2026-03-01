# LinkedIn Post Analyzer

A Chrome extension that scrapes your LinkedIn posts and generates in-depth analytics, writing analysis, and personalised coaching to improve your content performance.

## What It Does

- **Scrapes your LinkedIn posts** directly from your profile — likes, comments, views, and full text
- **Analyses engagement patterns** across categories, hook types, post length, timing, and hashtags
- **Generates a Writing Style Profile** — an editorial-quality report on your voice, structure, and signature patterns
- **Provides personalised coaching** — identifies your biggest improvement levers, diagnoses why weak posts failed, and builds a 30-day challenge based on your data

## Tabs

| Tab | What It Shows |
|-----|---------------|
| **Overview** | Stat cards, top/bottom posts, engagement charts, views distribution, posting frequency |
| **Deep Analysis** | Category breakdown, hook pattern analysis, hashtag insights, structure analysis, content calendar, timing heatmap |
| **Writing Analysis** | 8-section editorial report: opening patterns, voice & tone, structure, argument construction, closing patterns, sentence rhythm, avoidance patterns, engagement correlations |
| **Growth & Coaching** | Biggest lever, post autopsies, underused weapons, rewrites, engagement flywheel, comment multiplier, growth trajectory, 30-day challenge |

## Installation

1. Clone this repo or download as ZIP
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the project folder
5. The extension icon appears in your toolbar

## Usage

1. Go to your LinkedIn profile and scroll to your posts
2. Click the extension icon in the toolbar
3. Set a post limit or date range (optional)
4. Click **Start Scraping** — the extension scrolls through your posts and extracts data
5. When done, click **Analyse Posts** to open the full dashboard

### Exporting

- **CSV** — raw post data for spreadsheets
- **JSON** — structured data for further processing
- **Print / PDF** — print the full analysis report directly from the dashboard

## How It Works

**Scraping** (`content.js`): Injects into LinkedIn pages, scrolls through your posts, and extracts text, engagement metrics, dates, and URNs. Uses randomised delays (1.5–2.5s) between scrolls. Parses K/M abbreviations for metrics. All data stays local — nothing is sent to any server.

**Analysis** (`analyze.js`): ~2,500 lines of client-side analytics. Auto-categorises posts into topics (AI & Tech, Business, Crypto, Career, etc.), classifies hook types (Question, Bold Statement, Story, Contrarian, etc.), detects structural patterns, and computes engagement correlations. No external APIs — everything runs in your browser.

**Storage**: Uses Chrome's `storage.local` API. Your scraped data persists between sessions and can be re-analysed without re-scraping.

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript (ES5, no frameworks, no build step)
- Canvas-based charts (no charting library)
- Chrome Storage API for persistence

## Project Structure

```
manifest.json        # Extension config, permissions, content scripts
content.js           # LinkedIn scraper (injected into page)
popup.html / .js     # Extension popup UI and controls
analyze.html / .js   # Analytics dashboard (4 tabs, ~2,500 lines of analysis)
preview.html         # Local dev preview (mirrors analyze.html)
preview-data.js      # Sample post data for local testing
preview-shim.js      # Mocks Chrome storage API for local dev
serve.py             # Simple Python dev server
icons/               # Extension icons (16, 32, 48, 128px)
```

## Local Development

To work on the dashboard without the Chrome extension context:

```bash
python3 serve.py
```

Then open `http://localhost:8000/preview.html`. The preview loads sample data from `preview-data.js` and mocks Chrome storage via `preview-shim.js`.

## Privacy

All data stays on your machine. The extension:
- Does **not** send data to any external server
- Does **not** require any API keys
- Does **not** access other people's posts
- Only reads your own LinkedIn profile page when you explicitly trigger a scrape

## License

MIT
