import { createClient } from '@supabase/supabase-js';
import AdminView from '@/components/AdminView';
import type { PipelineRun, AppSource } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: runs } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('run_date', { ascending: false })
    .limit(20);

  const { data: sourcesRow } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'sources')
    .single();

  const sources: AppSource[] = (sourcesRow?.value as AppSource[]) ?? [];

  const { data: filterRow } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'filter_config')
    .single();

  const filterConfig: Record<string, string[]> =
    (filterRow?.value as Record<string, string[]>) ?? {};

  const { data: emailRow } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'email_recipients')
    .single();

  const emailRecipients: string[] = (emailRow?.value as string[]) ?? [];

  return (
    <AdminView
      runs={(runs as PipelineRun[]) ?? []}
      sources={sources}
      filterConfig={filterConfig}
      emailRecipients={emailRecipients}
    />
  );
}
