export type Job = {
  id: string;
  source_name: string;
  source_url: string;
  company: string;
  role_title: string;
  listing_url: string;
  url_hash: string;
  date_posted: string | null;
  date_scraped: string;
  week_key: string;
  tags: string[];
  is_filtered_in: boolean;
  raw_snippet: string | null;
};

export type FilterState = {
  keyword: string;
  weekKey: string;
  curatedOnly: boolean;
};

export type PipelineRun = {
  id: string;
  run_date: string;
  total_scraped: number;
  new_listings: number;
  duplicate_count: number;
  filtered_count: number;
  error_count: number;
  errors_json: string[] | null;
};

export type AppSource = {
  name: string;
  url: string;
  type: 'vc_board' | 'newsletter';
};
