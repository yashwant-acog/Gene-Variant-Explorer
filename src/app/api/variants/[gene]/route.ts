import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gene: string }> }
) {
  const { gene } = await params;
  const tableName = gene.toLowerCase();

  const { searchParams } = new URL(request.url);
  const genomicIdFilter = searchParams.get("genomicId");

  try {
    // Validate table name to prevent SQL injection (only allow alphanumeric)
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      return NextResponse.json({ error: "Invalid gene name" }, { status: 400 });
    }

    // Check if table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
      [tableName]
    );

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json([], { status: 200 });
    }

    let query = `SELECT * FROM ${tableName}`;
    let values: any[] = [];

    if (genomicIdFilter) {
      query += ` WHERE genomic_id = $1`;
      values = [genomicIdFilter];
    }

    const result = await pool.query(query, values);

    // Map database fields to the structure expected by the frontend
    // The database has snake_case (revel) but frontend expects uppercase (REVEL)
    // The database has quoted "Allele Count" etc.
    const mappedRows = result.rows.map((row: any) => ({
      Protein_change: row.protein_change,
      cDNA_change: row.cdna_change,
      Genomic_ID: row.genomic_id,
      condition: row.condition,
      Mutation_type: row.mutation_type,
      "Allele Count": row["Allele Count"],
      "Allele Number": row["Allele Number"],
      "Allele Frequency": row["Allele Frequency"],
      "Allele Count African/African American": row["Allele Count African/African American"],
      "Allele Number African/African American": row["Allele Number African/African American"],
      "Allele Count Admixed American": row["Allele Count Admixed American"],
      "Allele Number Admixed American": row["Allele Number Admixed American"],
      "Allele Count Ashkenazi Jewish": row["Allele Count Ashkenazi Jewish"],
      "Allele Number Ashkenazi Jewish": row["Allele Number Ashkenazi Jewish"],
      "Allele Count East Asian": row["Allele Count East Asian"],
      "Allele Number East Asian": row["Allele Number East Asian"],
      "Allele Count European (Finnish)": row["Allele Count European (Finnish)"],
      "Allele Number European (Finnish)": row["Allele Number European (Finnish)"],
      "Allele Count Middle Eastern": row["Allele Count Middle Eastern"],
      "Allele Number Middle Eastern": row["Allele Number Middle Eastern"],
      "Allele Count European (non-Finnish)": row["Allele Count European (non-Finnish)"],
      "Allele Number European (non-Finnish)": row["Allele Number European (non-Finnish)"],
      "Allele Count Amish": row["Allele Count Amish"],
      "Allele Number Amish": row["Allele Number Amish"],
      "Allele Count South Asian": row["Allele Count South Asian"],
      "Allele Number South Asian": row["Allele Number South Asian"],
      REVEL: row.revel,
      VEST4_score: row.vest4_score,
      MutPred_score: row.mutpred_score,
      BayesDel_addAF_score: row.bayesdel_addaf_score,
      ACMG: row.acmg,
      Functional: row.functional,
      Pvalue_functional: row.pvalue_functional,
      Meta_height: row.meta_height,
      Meta_height_SE: row.meta_height_se,
      Meta_ratio: row.meta_ratio,
      Meta_ratio_SE: row.meta_ratio_se,
    }));

    return NextResponse.json(mappedRows);
  } catch (error) {
    console.error(`Error fetching variants for ${gene}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gene: string }> },
) {
  const { gene } = await params;
  const tableName = gene.toLowerCase();

  try {
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      return NextResponse.json({ error: "Invalid gene name" }, { status: 400 });
    }

    const body = await request.json();
    const variants = body.variants;

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: "No variants provided" },
        { status: 400 },
      );
    }

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        genomic_id TEXT PRIMARY KEY,
        protein_change TEXT,
        cdna_change TEXT,
        condition TEXT,
        revel TEXT,
        vest4_score TEXT,
        mutpred_score TEXT,
        bayesdel_addaf_score TEXT,
        acmg TEXT,
        functional TEXT,
        pvalue_functional TEXT,
        meta_height TEXT,
        meta_height_se TEXT,
        meta_ratio TEXT,
        meta_ratio_se TEXT,
        "Allele Count" TEXT,
        "Allele Number" TEXT,
        "Allele Frequency" TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert rows with a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const v of variants) {
        await client.query(
          `
          INSERT INTO ${tableName} (
            genomic_id, protein_change, cdna_change, condition, 
            acmg, functional, pvalue_functional, 
            meta_height, meta_height_se, meta_ratio, meta_ratio_se
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (genomic_id) DO UPDATE SET
            protein_change = EXCLUDED.protein_change,
            cdna_change = EXCLUDED.cdna_change,
            condition = EXCLUDED.condition,
            acmg = EXCLUDED.acmg,
            functional = EXCLUDED.functional,
            pvalue_functional = EXCLUDED.pvalue_functional,
            meta_height = EXCLUDED.meta_height,
            meta_height_se = EXCLUDED.meta_height_se,
            meta_ratio = EXCLUDED.meta_ratio,
            meta_ratio_se = EXCLUDED.meta_ratio_se,
            updated_at = NOW()
        `,
          [
            v.id,
            v.proteinChange,
            v.cdnaChange,
            v.condition,
            v.acmg,
            v.functional,
            v.pvalueFunctional,
            v.metaHeight,
            v.metaHeightSe,
            v.metaRatio,
            v.metaRatioSe,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({
      message: `Successfully loaded ${variants.length} variants into ${tableName}`,
    });
  } catch (error) {
    console.error(`Error uploading variants for ${gene}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
