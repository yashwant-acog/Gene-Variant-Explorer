import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gene = searchParams.get("gene") || "";
    const chr = searchParams.get("chr") || "";

    if (!gene || !chr) {
      return NextResponse.json(
        { error: "Missing gene or chr parameter" },
        { status: 400 }
      );
    }

    const cleanChrName = chr.trim().toLowerCase().replace(/^chr/, "").replace(/[^a-z0-9]/g, "");
    const tableName = `chr${cleanChrName}_dbnsfp`;

    // Check if table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
      [tableName]
    );

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({
        message: `Database table ${tableName} does not exist`,
        variants: []
      });
    }

    const query = `
      SELECT 
        pos,
        ref,
        alt,
        gene,
        cdna,
        protein,
        revel_score
      FROM ${tableName} 
      WHERE UPPER(gene) = UPPER($1) AND revel_score IS NOT NULL
    `;

    const result = await pool.query(query, [gene.trim()]);

    return NextResponse.json({
      success: true,
      variants: result.rows.map((row: any) => ({
        pos: row.pos,
        ref: row.ref,
        alt: row.alt,
        cdna: row.cdna,
        protein: row.protein,
        revel: row.revel_score
      }))
    });

  } catch (error: any) {
    console.error("Error fetching dbNSFP gene variants:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
