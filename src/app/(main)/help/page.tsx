import { Terminal, Filter, Mail, Bookmark, Settings, RefreshCw, Search, ToggleRight, Lock, Send } from 'lucide-react';

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon size={16} className="text-violet-400 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-semibold mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-zinc-800/60 border border-zinc-700 rounded-md px-4 py-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  );
}

export default function HelpPage() {
  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-50">User Guide</h1>
        <p className="text-sm text-zinc-500 mt-1">
          How to use the Startup Job Aggregator — scraping, filtering, browsing, and email digest.
        </p>
      </div>

      <div className="space-y-5">

        {/* Overview */}
        <Section icon={RefreshCw} title="How it works">
          <p>
            This tool scrapes job listings from <strong className="text-zinc-300">16 VC portfolio job boards</strong> (a16z, Sequoia, Kleiner Perkins, Lightspeed, etc.) and <strong className="text-zinc-300">7 startup job newsletters</strong> weekly. All listings are stored in a database and surfaced in this dashboard.
          </p>
          <p>
            Jobs are automatically scored against your curated keywords. The ones that match appear under <strong className="text-zinc-300">Curated Only</strong> — the rest are still available with the toggle off.
          </p>
        </Section>

        {/* Login */}
        <Section icon={Lock} title="Login">
          <p>
            The dashboard is password-protected. You will be redirected to the login page if you are not authenticated.
          </p>
          <p>
            Enter your password and click <strong className="text-zinc-300">Sign in</strong>. Your session is stored in a secure cookie and persists until you close the browser or the session expires.
          </p>
          <p>
            The password is set via the <Code>APP_PASSWORD</Code> environment variable on the server. Contact the admin to reset it.
          </p>
        </Section>

        {/* Running the scraper */}
        <Section icon={Terminal} title="Running the scraper">
          <p>
            The scraper is a standalone Python script that runs locally. It is <strong className="text-zinc-300">not automatic</strong> — you run it manually whenever you want fresh listings (typically once a week).
          </p>
          <div className="space-y-2">
            <Step n={1}>Open a terminal and navigate to the scraper folder:</Step>
            <Block>cd path/to/startup-job-aggregator/scraper</Block>
            <Step n={2}>Install dependencies (first time only):</Step>
            <Block>{`pip install -r requirements.txt\npython -m playwright install chromium`}</Block>
            <Step n={3}>Run the scraper:</Step>
            <Block>python scrape.py</Block>
            <Step n={4}>
              The scraper prints a summary when it finishes. The weekly email digest is sent automatically after a successful run (requires SMTP config in <Code>scraper/.env</Code>).
            </Step>
          </div>
          <p className="text-zinc-500 text-xs">
            Each run takes 2–5 minutes. Jobs already scraped in the last 28 days are skipped automatically (deduplication).
          </p>
        </Section>

        {/* Email digest */}
        <Section icon={Mail} title="Weekly email digest">
          <p>
            After every scraper run, a digest email is automatically sent to all configured recipients with this week&apos;s curated picks and a preview of all new listings. Each job title links directly to the application page (Greenhouse, Ashby, Lever, etc.) — not the VC board.
          </p>
          <p>
            <strong className="text-zinc-300">SMTP setup</strong> — the scraper sends email via Gmail SMTP. Set these in <Code>scraper/.env</Code>:
          </p>
          <Block>{`SMTP_USER=your_gmail@gmail.com\nSMTP_PASS=your_app_password`}</Block>
          <p className="text-zinc-500 text-xs">
            Gmail requires an <strong className="text-zinc-400">App Password</strong> — not your regular password. Generate one at myaccount.google.com → Security → 2-Step Verification → App passwords.
          </p>
          <p>
            <strong className="text-zinc-300">Managing recipients</strong> — the recipient list is managed from the <strong className="text-zinc-300">Admin</strong> page (sidebar → Admin → Email Notifications). Add or remove addresses there; changes are saved to the database immediately and used on the next scraper run.
          </p>
        </Section>

        {/* Send digest from Admin */}
        <Section icon={Send} title="Sending the digest manually">
          <p>
            You can send the weekly digest at any time without re-running the scraper. Go to <strong className="text-zinc-300">Admin → Email Notifications</strong> and click <strong className="text-zinc-300">Send digest now</strong>. This pulls the current week&apos;s listings from the database and emails all configured recipients.
          </p>
          <p>
            Use <strong className="text-zinc-300">Send test email</strong> to send a quick test to all recipients — useful for verifying SMTP config without waiting for a full scraper run.
          </p>
          <p className="text-zinc-500 text-xs">
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
              <strong className="text-zinc-300">1. Exclude keywords</strong> — checked first. Any listing whose role title or company name matches an exclude keyword is marked not curated, regardless of include keywords. Examples: <Code>intern</Code>, <Code>entry level</Code>, <Code>junior</Code>.
            </p>
            <p>
              <strong className="text-zinc-300">2. Include role levels</strong> — seniority/title matches (e.g. <Code>COO</Code>, <Code>VP Operations</Code>, <Code>Director</Code>). Matching values become tags on the listing.
            </p>
            <p>
              <strong className="text-zinc-300">3. Include keywords</strong> — topic/function matches (e.g. <Code>healthcare</Code>, <Code>operations</Code>, <Code>strategy</Code>). Matching values become tags.
            </p>
            <p>
              <strong className="text-zinc-300">4. Include industries</strong> — industry matches checked against role title and company name. Matching values become tags.
            </p>
          </div>
          <p>
            A listing is curated if it survives the exclude check and matches at least one include rule. Tags shown on each listing are the specific keywords that matched.
          </p>
          <p className="text-zinc-500 text-xs">
            Edit these lists in Admin → Filter Config. Changes take effect on the next scraper run. To re-apply updated keywords to existing listings, re-run the scraper (duplicates are skipped, filters are re-applied).
          </p>
        </Section>

        {/* Browsing */}
        <Section icon={ToggleRight} title="Curated Only toggle">
          <p>
            The <strong className="text-zinc-300">Curated only</strong> toggle in the sidebar filters the job list to only show listings that matched your include keywords. It is <strong className="text-zinc-300">on by default</strong>.
          </p>
          <p>
            Turn it <strong className="text-zinc-300">off</strong> to see all scraped listings regardless of keywords — useful for browsing roles outside your usual scope or checking what was scraped that week.
          </p>
          <p>
            The results bar above the list always shows the total count for the current filter. The <Code>curated</Code> badge appears when the toggle is on.
          </p>
        </Section>

        {/* Search & week */}
        <Section icon={Search} title="Search and week filter">
          <p>
            <strong className="text-zinc-300">Week selector</strong> — listings are grouped by the week they were scraped. Use this to look back at previous weeks. The most recent week is selected by default.
          </p>
          <p>
            <strong className="text-zinc-300">Search box</strong> — searches role titles and company names in real time (300ms debounce). Use it to find specific companies or roles within the current week.
          </p>
          <p>
            All filter state lives in the URL — you can bookmark or share a filtered view directly.
          </p>
        </Section>

        {/* Saving */}
        <Section icon={Bookmark} title="Saving jobs">
          <p>
            Click the <strong className="text-zinc-300">Bookmark icon</strong> in the footer of the detail panel to save a listing. Saved jobs appear in the <strong className="text-zinc-300">Saved</strong> tab in the sidebar.
          </p>
          <p>
            Saved jobs are stored in your browser&apos;s local storage (up to 200 listings). They persist between sessions on the same browser but are not synced across devices.
          </p>
          <p>
            To remove a saved job, click the bookmark icon again in the detail panel or the Saved tab.
          </p>
        </Section>

        {/* Admin */}
        <Section icon={Settings} title="Admin — sources, filter config & email">
          <p>
            The <strong className="text-zinc-300">Admin</strong> page (sidebar → Admin) has three sections:
          </p>
          <p>
            <strong className="text-zinc-300">Pipeline History</strong> — a table of every scraper run showing date, total scraped, new listings, duplicates skipped, filtered (curated) count, and error count. Error rows are flagged with a red dot.
          </p>
          <p>
            <strong className="text-zinc-300">Sources</strong> — the list of VC boards and newsletters the scraper reads from. Add a new source (name, URL, type) or remove an existing one. Changes are saved to the database and take effect on the next scraper run.
          </p>
          <p>
            <strong className="text-zinc-300">Filter Config</strong> — four keyword lists: exclude keywords, include role levels, include keywords, include industries. Each entry on its own line. Hit <strong className="text-zinc-300">Save</strong> to persist immediately.
          </p>
          <p>
            <strong className="text-zinc-300">Email Notifications</strong> — manage the digest recipient list, trigger a digest send, or send a test email — all without re-running the scraper.
          </p>
          <p className="text-zinc-500 text-xs">
            Updating filter config only affects future scraper runs. To re-score existing listings with new keywords, re-run the scraper.
          </p>
        </Section>

      </div>
    </div>
  );
}
