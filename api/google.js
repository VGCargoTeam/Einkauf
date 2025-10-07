// /api/google.js
// Universeller Proxy für Google Apps Script
// Verhindert CORS-Fehler, indem Anfragen serverseitig weitergeleitet werden.

export default async function handler(req, res) {
  // URL deines Google Apps Script Web-Apps:
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx0-S0zIf0i5f2gwufjgUanqGTdDDWdRKjnZVEx1EGYyL1Fylpv90sEiE5zu-39RoPU/exec";

  // Erlaube alle Domains (du kannst das später auf deine Domain einschränken)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS-Anfragen (CORS Preflight) direkt beantworten
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Query-Parameter weitergeben (z. B. ?sheet=products)
    const queryString = req.url.split("?")[1] || "";

    // Anfrage an Google Script weiterleiten
    const response = await fetch(
      `${GOOGLE_SCRIPT_URL}${queryString ? "?" + queryString : ""}`,
      {
        method: req.method,
        headers: { "Content-Type": "application/json" },
        body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
      }
    );

    // Antwort lesen (Text oder JSON)
    const text = await response.text();

    // JSON-Antwort durchreichen
    res.status(200).send(text);
  } catch (error) {
    console.error("Proxy-Fehler:", error);
    res.status(500).json({
      success: false,
      error: "Fehler beim Verbinden mit Google Apps Script: " + error.message,
    });
  }
}
