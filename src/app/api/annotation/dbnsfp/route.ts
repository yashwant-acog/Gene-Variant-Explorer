import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genomicId = searchParams.get("genomicId") || "";

    if (!genomicId) {
      return NextResponse.json({ error: "Missing genomicId parameter" }, { status: 400 });
    }

    let chr = "";
    let pos: number | null = null;
    let ref = "";
    let alt = "";

    const cleanId = decodeURIComponent(genomicId).trim();

    // NC_000004.12:g.1805662G>T
    const ncMatch = cleanId.match(/NC_(\d+)\.\d+:g\.(\d+)([A-Z]+)>([A-Z]+)/i);
    if (ncMatch) {
      chr = String(parseInt(ncMatch[1], 10)); // e.g. "4"
      pos = parseInt(ncMatch[2], 10);
      ref = ncMatch[3].toUpperCase();
      alt = ncMatch[4].toUpperCase();
    } else {
      // 4:1793940:C:T or 4-1793940-C-T
      const delims = /[:\-]/;
      const parts = cleanId.split(delims);
      if (parts.length === 4) {
        chr = parts[0].trim().toLowerCase().replace(/^chr/, "");
        pos = parseInt(parts[1].trim(), 10);
        ref = parts[2].trim().toUpperCase();
        alt = parts[3].trim().toUpperCase();
      }
    }

    if (!chr || pos === null || isNaN(pos) || !ref || !alt) {
      return NextResponse.json({
        error: "Invalid genomicId format",
        parsed: { chr, pos, ref, alt }
      }, { status: 400 });
    }

    // Sanitize chr name to prevent SQL injection
    const cleanChrName = chr.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const tableName = `chr${cleanChrName}_dbnsfp`;

    // Check if table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
      [tableName]
    );

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({
        message: `Database table ${tableName} does not exist`,
        scores: null
      });
    }

    const query = `
      SELECT 
        vest4_score, 
        revel_score, 
        mutpred_score, 
        bayesdel_addaf_score,
        gene,
        cdna
      FROM ${tableName} 
      WHERE pos = $1 AND UPPER(ref) = $2 AND UPPER(alt) = $3
      LIMIT 1
    `;

    const result = await pool.query(query, [pos, ref, alt]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        message: "No database entry found for given genomic position",
        scores: null,
        parsed: { chr, pos, ref, alt }
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      scores: {
        revel: row.revel_score,
        vest4: row.vest4_score,
        mutpred: row.mutpred_score,
        bayesdel: row.bayesdel_addaf_score,
        gene: row.gene,
        cdna: row.cdna
      }
    });

  } catch (error: any) {
    console.error("Error fetching dbNSFP values:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
