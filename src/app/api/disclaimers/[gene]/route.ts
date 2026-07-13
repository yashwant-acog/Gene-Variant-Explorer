import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gene: string }> }
) {
  const { gene } = await params;
  try {
    const result = await pool.query(
      "SELECT tab, disclaimer FROM gene_disclaimers WHERE gene = $1",
      [gene.toLowerCase()]
    );
    const disclaimerMap: Record<string, string> = {};
    result.rows.forEach((r: any) => {
      disclaimerMap[r.tab] = r.disclaimer;
    });
    return NextResponse.json(disclaimerMap);
  } catch (error) {
    console.error("Error fetching disclaimers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gene: string }> }
) {
  const { gene } = await params;
  try {
    const { tab, disclaimer } = await request.json();
    await pool.query(
      `INSERT INTO gene_disclaimers (gene, tab, disclaimer)
       VALUES ($1, $2, $3)
       ON CONFLICT (gene, tab)
       DO UPDATE SET disclaimer = EXCLUDED.disclaimer`,
      [gene.toLowerCase(), tab, disclaimer]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving disclaimer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
