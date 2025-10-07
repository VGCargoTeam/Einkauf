// /api/google.js
// Universeller Proxy zwischen deinem Frontend (Vercel) und Google Apps Script
// Verhindert CORS-Probleme und erzwingt JSON-Antworten

export const config = {
  api: {
    bodyParser: false, // Verhindert automatisches Parsen, damit wir GET/POST sauber behandeln können
  },
};

export default async function handler(req, res) {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx0-S0zIf0i5f2gwufjgUanqGTdDDWdRKjnZVEx1EGYyL1Fylpv90sEiE5zu-39RoPU/exec";

  // ✅ CORS erlauben
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Querystring übernehmen (z. B. ?sheet=products)
    const query = req.url.split("?")[1] || "";
    const url = `${GOOGLE_SCRIPT_URL}${query ? "?" + query : ""}`;

    // Body aus Request lesen (wenn POST)
    let body = null;
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks).toString();
    }

    // Anfrage an Google weiterleiten
    const response = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "POST" ? body : undefined,
    });

    const text = await response.text();

    // Wenn Google HTML statt JSON liefert → Fehler behandeln
    if (text.startsWith("<!DOCTYPE")) {
      return res.status(502).json({
        success: false,
        error: "Google Script lieferte HTML statt JSON. Prüfe die Script-URL.",
        htmlSnippet: text.slice(0, 200) + "...",
      });
    }

    // Antwort unverändert weitergeben
    res.status(response.status).send(text);
  } catch (err) {
    console.error("Proxy-Fehler:", err);
    res.status(500).json({
      success: false,
      error: "Proxy-Fehler: " + err.message,
    });
  }
}
