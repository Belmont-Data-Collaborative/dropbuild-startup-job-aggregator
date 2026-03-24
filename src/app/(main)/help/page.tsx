import type { Metadata } from 'next';
import { Terminal, Filter, Mail, Bookmark, Settings, RefreshCw, Search, ToggleRight, Lock, Send, PanelRight, ArrowUpDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guide',
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-outline-variant rounded-shape-md p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-shape-sm bg-primary-container flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-on-primary-container" />
        </div>
        <h2 className="text-sm font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-shape-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-semibold mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded-shape-xs text-xs font-mono border border-outline-variant">
      {children}
    </code>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-surface-container border border-outline-variant rounded-shape-sm px-4 py-3 text-xs font-mono text-on-surface overflow-x-auto whitespace-pre-wrap mt-1">
      {children}
    </pre>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-primary-container/40 border border-primary-container rounded-shape-sm px-3 py-2.5 text-xs text-on-surface-variant leading-relaxed">
      <span className="text-primary font-bold flex-shrink-0">↗</span>
      <span>{children}</span>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header — matches chrome zone treatment */}
      <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
        <h1 className="text-lg font-semibold text-on-surface">User Guide</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          How to use Startup Jobs — scraping, filtering, browsing, and email digest.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl space-y-4">

          {/* Overview */}
          <Section icon={RefreshCw} title="How it works">
            <p>
              This tool scrapes job listings from <strong className="text-on-surface font-medium">16 VC portfolio job boards</strong> (a16z, Sequoia, Kleiner Perkins, Lightspeed, etc.) and <strong className="text-on-surface font-medium">7 startup job newsletters</strong> weekly. All listings are stored in a database and surfaced in this dashboard.
            </p>
            <p>
              Jobs are automatically scored against your curated keywords. The ones that match appear under <strong className="text-on-surface font-medium">Startup roles only</strong> — the rest are still available with the toggle off.
            </p>
          </Section>

          {/* Browsing — detail panel */}
          <Section icon={PanelRight} title="Browsing jobs & the detail panel">
            <p>
              Click any row in the job list to open the <strong className="text-on-surface font-medium">detail panel</strong> on the right. It shows the full role title, company, source, dates, matched tags, and job description if available.
            </p>
            <p>
              The panel footer has two actions:
            </p>
            <div className="space-y-2">
              <p>
                <strong className="text-on-surface font-medium">View &amp; Apply</strong> — opens the listing directly on the employer&apos;s ATS (Greenhouse, Ashby, Lever, etc.), not the VC board page.
              </p>
              <p>
                <strong className="text-on-surface font-medium">Browse all jobs at [source]</strong> — opens the full VC board or newsletter, useful for exploring that fund&apos;s entire portfolio.
              </p>
            </div>
            <p>
              On mobile, the panel slides up as a bottom sheet. Tap the scrim or the close button to dismiss it.
            </p>
            <Tip>New listings (scraped in the last 7 days) are marked with a filled indigo dot on the left of each row.</Tip>
          </Section>

          {/* Sorting */}
          <Section icon={ArrowUpDown} title="Sorting the list">
            <p>
              Click any column header — <strong className="text-on-surface font-medium">Role</strong>, <strong className="text-on-surface font-medium">Company</strong>, <strong className="text-on-surface font-medium">Source</strong>, or <strong className="text-on-surface font-medium">When</strong> — to sort the list. Click again to reverse the order.
            </p>
            <p>
              Sorting is applied server-side on the <strong className="text-on-surface font-medium">full dataset</strong>, not just the visible page. When sorted, all matching results are ordered before pagination — so "Sort by Company A→Z" gives you the correct first results even across pages.
            </p>
            <p>
              The default sort is newest first (<Code>When ↓</Code>). Sort state lives in the URL — you can bookmark a sorted view.
            </p>
            <Tip>Changing the sort resets to page 1 automatically so you always see the top of the sorted list.</Tip>
          </Section>

          {/* Login */}
          <Section icon={Lock} title="Login">
            <p>
              The dashboard is password-protected. You will be redirected to the login page if you are not authenticated.
            </p>
            <p>
              Enter your password and click <strong className="text-on-surface font-medium">Sign in</strong>. Your session is stored in a secure cookie and persists until you close the browser or the session expires.
            </p>
            <p>
              The password is set via the <Code>APP_PASSWORD</Code> environment variable on the server. Contact the admin to reset it.
            </p>
          </Section>

          {/* Running the scraper */}
          <Section icon={Terminal} title="Running the scraper">
            <p>
              The scraper is a standalone Python script that runs locally. It is <strong className="text-on-surface font-medium">not automatic</strong> — you run it manually whenever you want fresh listings (typically once a week).
            </p>
            <div className="space-y-2">
              <Step n={1}>Open a terminal and navigate to the scraper folder:</Step>
              <Block>cd path/to/startup-job-aggregator/scraper</Block>
              <Step n={2}>Install dependencies (first time only):</Step>
              <Block>{`pip install -r requirements.txt\npython -m playwright install chromium`}</Block>
              <Step n={3}>Run the scraper:</Step>
              <Block>python scrape.py</Block>
              <Step n={4}>
                The scraper prints a summary when it finishes. Check the Admin page to see the run logged in Pipeline History.
              </Step>
            </div>
            <p className="text-on-surface-variant/70 text-xs">
              Each run takes 2–5 minutes. Jobs already scraped in the last 28 days are skipped automatically (deduplication).
            </p>
          </Section>

          {/* Email digest */}
          <Section icon={Mail} title="Weekly email digest">
            <p>
              A digest email can be sent to all configured recipients with this week&apos;s curated picks and a preview of all new listings. Each job title links directly to the application page — not the VC board.
            </p>
            <p>
              <strong className="text-on-surface font-medium">SMTP setup</strong> — the scraper sends email via Gmail SMTP. Set these in <Code>scraper/.env</Code>:
            </p>
            <Block>{`SMTP_USER=your_gmail@gmail.com\nSMTP_PASS=your_app_password`}</Block>
            <p className="text-on-surface-variant/70 text-xs">
              Gmail requires an <strong className="text-on-surface-variant font-medium">App Password</strong> — not your regular password. Generate one at myaccount.google.com → Security → 2-Step Verification → App passwords.
            </p>
            <p>
              <strong className="text-on-surface font-medium">Managing recipients</strong> — the recipient list is managed from the <strong className="text-on-surface font-medium">Admin</strong> page (sidebar → Admin → Email Notifications). Add or remove addresses there; changes are saved to the database immediately.
            </p>
          </Section>

          {/* Send digest from Admin */}
          <Section icon={Send} title="Sending the digest manually">
            <p>
              You can send the digest at any time without re-running the scraper. Go to <strong className="text-on-surface font-medium">Admin → Email Notifications</strong> and click <strong className="text-on-surface font-medium">Send Digest</strong>. This pulls the current week&apos;s listings from the database and emails all configured recipients.
            </p>
            <p>
              Use <strong className="text-on-surface font-medium">Send Test</strong> to send a quick test to all recipients — useful for verifying SMTP config without waiting for a full scraper run.
            </p>
            <p className="text-on-surface-variant/70 text-xs">
              Both actions require at least one recipient to be configured and valid SMTP credentials in <Code>scraper/.env</Code>.
            </p>
          </Section>

          {/* Filters */}
          <Section icon={Filter} title="How the curated filter works">
            <p>
              Every scraped listing is checked against four keyword lists applied in this order:
            </p>
            <div className="space-y-2">
              <p>
                <strong className="text-on-surface font-medium">1. Exclude keywords</strong> — checked first. Any listing whose role title or company name matches is marked not curated, regardless of include keywords. Examples: <Code>intern</Code>, <Code>entry level</Code>, <Code>junior</Code>.
              </p>
              <p>
                <strong className="text-on-surface font-medium">2. Include role levels</strong> — seniority/title matches (e.g. <Code>COO</Code>, <Code>VP Operations</Code>, <Code>Director</Code>). Matching values become tags on the listing.
              </p>
              <p>
                <strong className="text-on-surface font-medium">3. Include keywords</strong> — topic/function matches (e.g. <Code>healthcare</Code>, <Code>operations</Code>, <Code>strategy</Code>). Matching values become tags.
              </p>
              <p>
                <strong className="text-on-surface font-medium">4. Include industries</strong> — industry matches checked against role title and company name. Matching values become tags.
              </p>
            </div>
            <p>
              A listing is curated if it survives the exclude check and matches at least one include rule. The tags shown on each row are the specific keywords that matched.
            </p>
            <p className="text-on-surface-variant/70 text-xs">
              Edit these lists in Admin → Filter Config. Changes take effect on the next scraper run. To re-apply updated keywords to existing listings, re-run the scraper (duplicates are skipped, filters are re-applied).
            </p>
          </Section>

          {/* Browsing toggle */}
          <Section icon={ToggleRight} title="Startup roles only toggle">
            <p>
              The <strong className="text-on-surface font-medium">Startup roles only</strong> toggle in the sidebar filters the job list to only show listings that matched your include keywords. It is <strong className="text-on-surface font-medium">on by default</strong>.
            </p>
            <p>
              Turn it <strong className="text-on-surface font-medium">off</strong> to see all scraped listings regardless of keywords — useful for browsing roles outside your usual scope or checking what was scraped that week.
            </p>
            <p>
              The results bar above the list always shows the total count. The <Code>curated</Code> badge appears when the toggle is on.
            </p>
          </Section>

          {/* Search & week */}
          <Section icon={Search} title="Search and week filter">
            <p>
              <strong className="text-on-surface font-medium">Week selector</strong> — listings are grouped by the week they were scraped. Use this to look back at previous weeks. The most recent week is selected by default.
            </p>
            <p>
              <strong className="text-on-surface font-medium">Search box</strong> — searches role titles and company names in real time (300ms debounce). Use it to find specific companies or roles within the current week.
            </p>
            <p>
              All filter state lives in the URL — you can bookmark or share a filtered view directly.
            </p>
          </Section>

          {/* Saving */}
          <Section icon={Bookmark} title="Saving jobs">
            <p>
              Click the <strong className="text-on-surface font-medium">Bookmark icon</strong> in the footer of the detail panel to save a listing. Saved jobs appear in the <strong className="text-on-surface font-medium">Saved</strong> tab in the sidebar.
            </p>
            <p>
              Saved jobs are stored in your browser&apos;s local storage (up to 200 listings). They persist between sessions on the same browser but are not synced across devices.
            </p>
            <p>
              To remove a saved job, click the bookmark icon again in the detail panel or from the Saved tab.
            </p>
          </Section>

          {/* Admin */}
          <Section icon={Settings} title="Admin — sources, filter config & email">
            <p>
              The <strong className="text-on-surface font-medium">Admin</strong> page (sidebar → Admin settings) has three sections:
            </p>
            <p>
              <strong className="text-on-surface font-medium">Pipeline History</strong> — a table of every scraper run showing date, total scraped, new listings, duplicates skipped, filtered (curated) count, and error count. Error rows are flagged with a red dot.
            </p>
            <p>
              <strong className="text-on-surface font-medium">Sources</strong> — the list of VC boards and newsletters the scraper reads from. Add a new source (name, URL, type) or remove an existing one. Changes are saved to the database and take effect on the next scraper run.
            </p>
            <p>
              <strong className="text-on-surface font-medium">Filter Config</strong> — four keyword lists: exclude keywords, include role levels, include keywords, include industries. Each entry on its own line. Hit <strong className="text-on-surface font-medium">Save Filter Config</strong> to persist immediately.
            </p>
            <p>
              <strong className="text-on-surface font-medium">Email Notifications</strong> — manage the digest recipient list, trigger a digest send, or send a test email — all without re-running the scraper.
            </p>
            <p className="text-on-surface-variant/70 text-xs">
              Updating filter config only affects future scraper runs. To re-score existing listings with new keywords, re-run the scraper.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}
