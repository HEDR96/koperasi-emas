import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ltmovptzzaufxxhxewbn.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bW92cHR6emF1Znh4aHhld2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3MjI1MCwiZXhwIjoyMDk0OTQ4MjUwfQ.jXWk6XUIS_yFw-VD2bqsQk73hnzoCGXk3kTkukNB9X0";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const EMAIL    = "master@master.com";
  const PASSWORD = "master@master";

  console.log("Creating auth user...");
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (authErr) {
    // Might already exist — try to find it
    if (authErr.message.includes("already") || authErr.message.includes("exists")) {
      console.log("User already exists, looking up...");
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === EMAIL);
      if (!existing) { console.error("Cannot find existing user:", authErr.message); process.exit(1); }
      authData = { user: existing };
    } else {
      console.error("Auth error:", authErr.message);
      process.exit(1);
    }
  }

  const userId = authData.user.id;
  console.log("User ID:", userId);

  // Upsert profile
  const { error: profErr } = await supabase.from("profiles").upsert({
    id: userId,
    name: "Master Admin",
    role: "master",
    status: "active",
    gold_grams: 0,
    rupiah_balance: 0,
  }, { onConflict: "id" });

  if (profErr) {
    console.error("Profile error:", profErr.message);
    process.exit(1);
  }

  console.log("\n✅ Master user ready!");
  console.log("   Email   :", EMAIL);
  console.log("   Password:", PASSWORD);
  console.log("   Role    : master");
  console.log("\nLogin di: /master");
}

main();
