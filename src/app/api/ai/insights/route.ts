/* ============================================================
   API: AI Insights — Grok streaming
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tables, charts, mode, prompt } = body;

    const apiKey = process.env.GROQ_API_KEY;

    // Base prompts for different modes
    const modePrompts = {
      data: `Analyze the provided dataset(s) rows and values. Focus on:
        1. Key Summaries (trends, totals)
        2. Notable Outliers or Anomalies
        3. Strategic Recommendations based on the actual numbers.`,
      schema: `Analyze the Table Structure and Schema. Focus on:
        1. Data Quality and Completeness
        2. Suggested Relationships or Joins
        3. Observations about the data model (types, naming, structure).`,
      charts: `Analyze the Visualizations currently on the dashboard. Focus on:
        1. The business story told by these charts
        2. Redundancies or Gaps in the current visuals
        3. How these specific charts interact to show performance.`
    };

    const dataContext = mode === "charts" 
      ? `Dashboard Visuals:\n${JSON.stringify(charts, null, 2)}`
      : tables.map((t: any) => 
          `Table "${t.name}" (${t.rowCount} rows):\nColumns: ${t.columns.map((c: any) => `${c.name} (${c.type})`).join(", ")}\n` +
          (mode === "data" ? `Sample data: ${JSON.stringify(t.rows)}` : "")
        ).join("\n\n");

    const systemPrompt = `You are a Senior Business Intelligence analyst. ${modePrompts[mode as keyof typeof modePrompts] || modePrompts.data} Be professional, concise, and thorough. Use bullet points.`;

    const userPrompt = prompt
      ? `${prompt}\n\nContext Data:\n${dataContext}`
      : `Analyze this context and provide a thorough report.\n\nContext Data:\n${dataContext}`;

    if (!apiKey || apiKey === "your_groq_api_key_here") {
      const summary = generateBasicSummary(tables || []);
      return NextResponse.json({ summary: summary + "\n\n*Configure API key for full mode-specific analysis.*" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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
