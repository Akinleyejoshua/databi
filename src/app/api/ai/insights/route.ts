/* ============================================================
   API: AI Insights — Grok streaming
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tables, prompt } = body;

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey || apiKey === "your_xai_api_key_here") {
      // Fallback: generate a basic summary without AI
      const summary = generateBasicSummary(tables);
      return NextResponse.json({ summary });
    }

    // Build context from tables
    const dataContext = tables
      .map(
        (t: { name: string; rowCount: number; columns: { name: string; type: string }[]; rows: Record<string, unknown>[] }) =>
          `Table "${t.name}" (${t.rowCount} rows):\nColumns: ${t.columns
            .map((c: { name: string; type: string }) => `${c.name} (${c.type})`)
            .join(", ")}\nSample data (first 5 rows): ${JSON.stringify(
            t.rows.slice(0, 5)
          )}`
      )
      .join("\n\n");

    const systemPrompt = `You are a Business Intelligence analyst. Analyze the following dataset(s) and provide key insights, trends, and recommendations for stakeholders. Be concise but thorough. Use bullet points for clarity. Include specific numbers and percentages where possible.`;

    const userPrompt = prompt
      ? `${prompt}\n\nData:\n${dataContext}`
      : `Analyze this data and provide:\n1. Key Summaries (3-5 bullet points)\n2. Notable Trends\n3. Outliers or Anomalies\n4. Recommendations\n\nData:\n${dataContext}`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini-fast",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI API error:", errorData);
      // Fallback to basic summary
      const summary = generateBasicSummary(tables);
      return NextResponse.json({ summary });
    }

    const data = await response.json();
    const summary =
      data.choices?.[0]?.message?.content || generateBasicSummary(tables);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "AI analysis failed", summary: "Unable to generate AI insights at this time." },
      { status: 500 }
    );
  }
}

function generateBasicSummary(
  tables: { name: string; rowCount: number; columns: { name: string; type: string }[]; rows: Record<string, unknown>[] }[]
): string {
  if (!tables || tables.length === 0) {
    return "No data available for analysis.";
  }

  const summaries = tables.map((table) => {
    const numericCols = table.columns.filter((c) => c.type === "number");
    let stats = "";

    for (const col of numericCols.slice(0, 3)) {
      const values = table.rows
        .map((r) => Number(r[col.name]))
        .filter((v) => !isNaN(v));

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        stats += `\n  • **${col.name}**: Sum=${sum.toLocaleString()}, Avg=${avg.toFixed(2)}, Min=${min.toLocaleString()}, Max=${max.toLocaleString()}`;
      }
    }

    return `### 📊 ${table.name}\n- **Rows**: ${table.rowCount.toLocaleString()}\n- **Columns**: ${table.columns.length} (${numericCols.length} numeric)${stats}`;
  });

  return `## Data Analysis Summary\n\n${summaries.join("\n\n")}\n\n---\n*Configure your XAI API key for AI-powered deep insights.*`;
}
