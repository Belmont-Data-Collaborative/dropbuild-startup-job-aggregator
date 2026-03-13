import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import { renderDigestHtml, renderDigestPlain } from '@/lib/emailRenderer';
import type { Job } from '@/types';

const SENDER = 'databelmont@gmail.com';

function initSendGrid() {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
}

export async function POST(req: Request) {
  try {
    const { action, payload } = (await req.json()) as {
      action: string;
      payload: unknown;
    };
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'save_sources') {
      const { error } = await supabase
        .from('app_config')
        .upsert({ key: 'sources', value: payload }, { onConflict: 'key' });
      if (error) throw error;

    } else if (action === 'save_filter_config') {
      const { error } = await supabase
        .from('app_config')
        .upsert({ key: 'filter_config', value: payload }, { onConflict: 'key' });
      if (error) throw error;

    } else if (action === 'save_email_recipients') {
      const { error } = await supabase
        .from('app_config')
        .upsert({ key: 'email_recipients', value: payload }, { onConflict: 'key' });
      if (error) throw error;

    } else if (action === 'send_digest') {
      const { data: weekRows } = await supabase
        .from('jobs')
        .select('week_key')
        .order('week_key', { ascending: false })
        .limit(1);
      const weekKey: string = weekRows?.[0]?.week_key ?? '';
      if (!weekKey) {
        return NextResponse.json({ error: 'No jobs found in database' }, { status: 400 });
      }
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('week_key', weekKey)
        .order('date_scraped', { ascending: false });

      const { data: recipientsRow } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'email_recipients')
        .single();
      const recipients: string[] = (recipientsRow?.value as string[]) ?? [];
      if (recipients.length === 0) {
        return NextResponse.json({ error: 'No recipients configured' }, { status: 400 });
      }

      const jobList = (jobs ?? []) as Job[];
      const html = renderDigestHtml(jobList, weekKey);
      const plain = renderDigestPlain(jobList, weekKey);
      initSendGrid();
      await sgMail.sendMultiple({
        from: SENDER,
        to: recipients,
        subject: `Startup Jobs Digest — ${weekKey} (${jobList.length} listings)`,
        text: plain,
        html,
      });

    } else if (action === 'send_test_email') {
      const recipients = payload as string[];
      if (!recipients || recipients.length === 0) {
        return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
      }
      initSendGrid();
      await sgMail.sendMultiple({
        from: SENDER,
        to: recipients,
        subject: 'Test — Startup Jobs Digest',
        text: 'This is a test email from the Startup Jobs admin panel.',
        html: `
          <div style="background:#09090b;color:#fafafa;font-family:sans-serif;padding:32px;border-radius:8px;max-width:480px">
            <div style="font-size:18px;font-weight:700;margin-bottom:8px">Startup Jobs Digest</div>
            <div style="color:#a1a1aa;font-size:13px;margin-bottom:20px">Test email from the admin panel</div>
            <div style="background:#18181b;border:1px solid #27272a;border-radius:6px;padding:16px;font-size:13px;color:#d4d4d8">
              If you received this, your email configuration is working correctly.<br><br>
              <strong style="color:#a78bfa">From:</strong> ${SENDER}<br>
              <strong style="color:#a78bfa">To:</strong> ${recipients.join(', ')}
            </div>
          </div>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
