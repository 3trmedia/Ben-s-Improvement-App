// One-off script: reads image files from a local folder named
// "<Item Name> $<price>.<ext>", uploads each to the reward-images Supabase
// Storage bucket, and inserts a matching row into `rewards` (cost in points,
// $1 = 10 points). Run with: node scripts/import-rewards.js "<folder path>"
// Requires SUPABASE_SECRET_KEY in .env.local (service role — bypasses RLS,
// same key used by the health-webhook route).

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const env = {};
  const envPath = path.join(__dirname, "..", ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function parseFilename(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const m = base.match(/^(.*)\$(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const name = m[1].trim();
  const dollars = parseFloat(m[2]);
  return { name, cost: Math.round(dollars * 10), ext };
}

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node scripts/import-rewards.js <folder path>");
    process.exit(1);
  }

  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

  const files = fs.readdirSync(folder).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  console.log(`Found ${files.length} image(s) in ${folder}`);

  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) {
      console.warn(`Skipping "${file}" — couldn't parse a "$price" out of the name.`);
      continue;
    }
    const { name, cost, ext } = parsed;
    const storagePath = `${crypto.randomUUID()}${ext}`;
    const bytes = fs.readFileSync(path.join(folder, file));
    const contentType = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[ext.toLowerCase()];

    const { error: uploadError } = await supabase.storage.from("reward-images").upload(storagePath, bytes, { contentType });
    if (uploadError) {
      console.error(`Upload failed for "${file}":`, uploadError.message);
      continue;
    }
    const { data: pub } = supabase.storage.from("reward-images").getPublicUrl(storagePath);

    const { error: insertError } = await supabase.from("rewards").insert({
      name,
      cost,
      image_url: pub.publicUrl,
    });
    if (insertError) {
      console.error(`Insert failed for "${name}":`, insertError.message);
      continue;
    }
    console.log(`Added "${name}" — ${cost} pts ($${(cost / 10).toFixed(2)})`);
  }
}

main();
