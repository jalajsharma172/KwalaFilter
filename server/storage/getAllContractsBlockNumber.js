import fetch from "node-fetch";
import { config } from "../config.js";

/**
 * Fetch all contract rows from Supabase using REST API
 */
export async function getContractBlockNumber() {
  try {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing or invalid.");
    }

    const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscription_latest_blocks`;

    console.log("📡 Fetching all subscription_latest_blocks...");

    const resp = await fetch(sbUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });

    const json = await resp.json();

    if (!resp.ok) {
      console.error("❌ Supabase fetch error:", resp.status, json);
      return null;
    }

    console.log("✓ Supabase data received:", json);
    return json;

  } catch (error) {
    console.error("❌ Error fetching Supabase data:", error.message);
    return null;
  }
}

