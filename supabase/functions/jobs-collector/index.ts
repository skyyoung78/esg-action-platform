import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseStringPromise } from "https://esm.sh/xml2js@0.6.2";

type JobRow = {
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  deadline: string | null;
  apply_url: string;
  rss_guid: string;
  collected_at: string;
};

const KEYWORDS = ["ESG", "지속가능", "CSR", "탄소중립", "환경경영"];
const SARAMIN_RSS_BASE = "https://www.saramin.co.kr/zf_user/rss";

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

function parseDeadline(input: string): string | null {
  const match = input.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m}-${d}`;
}

function extractCompany(title: string): string {
  // Common RSS title format: "[회사명] 공고 제목"
  const bracketMatch = title.match(/^\[(.+?)\]/);
  return bracketMatch?.[1]?.trim() || "미상";
}

function inferJobType(text: string): string | null {
  if (text.includes("인턴")) return "인턴";
  if (text.includes("계약직")) return "계약직";
  if (text.includes("정규직")) return "정규직";
  return null;
}

async function fetchRssItems(keyword: string): Promise<Array<Record<string, unknown>>> {
  const url = new URL(SARAMIN_RSS_BASE);
  url.searchParams.set("search_area", "main");
  url.searchParams.set("search_done", "y");
  url.searchParams.set("keyword", keyword);

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`Saramin RSS failed for keyword=${keyword}`, await response.text());
    return [];
  }

  const xml = await response.text();
  const parsed = await parseStringPromise(xml);
  const items = parsed?.rss?.channel?.[0]?.item;
  return Array.isArray(items) ? items : [];
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const collectedAt = new Date().toISOString();
  const rows: JobRow[] = [];

  for (const keyword of KEYWORDS) {
    const items = await fetchRssItems(keyword);
    for (const item of items) {
      const title = stripHtml(String(item?.title?.[0] ?? ""));
      const guid = String(item?.guid?.[0] ?? "").trim();
      const link = String(item?.link?.[0] ?? "").trim();
      const description = stripHtml(String(item?.description?.[0] ?? ""));

      if (!title || !guid || !link) continue;

      const company = extractCompany(title);
      rows.push({
        title,
        company,
        location: null,
        job_type: inferJobType(`${title} ${description}`),
        deadline: parseDeadline(description),
        apply_url: link,
        rss_guid: guid,
        collected_at: collectedAt,
      });
    }
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ ok: true, attempted: 0, message: "No rows collected" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await supabase.from("jobs").upsert(rows, {
    onConflict: "rss_guid",
    ignoreDuplicates: true,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, attempted: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
