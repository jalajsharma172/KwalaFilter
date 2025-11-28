import { config } from '../server/config.js';

export interface SubscriptionRow {
  id?: number;
  address: string;
  topic0: string;
  abi: any;
  api?: string | null;
  created_at?: string;
}

/**
 * Fetch all subscriptions from Supabase `subscriptions` table.
 * Returns an array of rows (may be empty).
 * Throws an Error on network/authorization failure.
 */
export async function getAllDataForCheckingLogs(): Promise<SubscriptionRow[]> {
  if (!config?.SUPABASE_URL || !config?.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  }

  const sbUrl = `${String(config.SUPABASE_URL).replace(/\/$/, '')}/rest/v1/subscriptions?select=*`;

  const resp = await fetch(sbUrl, {
    method: 'GET',
    headers: {
      'apikey': String(config.SUPABASE_SERVICE_ROLE_KEY),
      'Authorization': `Bearer ${String(config.SUPABASE_SERVICE_ROLE_KEY)}`,
      'Accept': 'application/json'
    }
  });

  const text = await resp.text();

  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    throw new Error(`Invalid JSON response from Supabase: ${err?.message || err}`);
  }

  if (!resp.ok) {
    // Supabase may return an error object
    const message = (json && (json.message || json.error || JSON.stringify(json))) || resp.statusText;
    throw new Error(`Supabase responded with ${resp.status}: ${message}`);
  }

  // Ensure rows are an array
  if (!Array.isArray(json)) {
    throw new Error('Unexpected Supabase response shape: expected an array of rows');
  }

  return json as SubscriptionRow[];
}

export default getAllDataForCheckingLogs;
