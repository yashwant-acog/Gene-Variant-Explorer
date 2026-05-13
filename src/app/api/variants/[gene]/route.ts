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

    const populations = [
      "African/African American",
      "Admixed American",
      "Ashkenazi Jewish",
      "East Asian",
      "European (Finnish)",
      "Middle Eastern",
      "European (non-Finnish)",
      "Amish",
      "South Asian",
    ];

    const populationColumns = populations
      .map(
        (pop) => `
        "Allele Count ${pop}" TEXT, 
        "Allele Number ${pop}" TEXT`,
      )
      .join(",");

    // Create table if not exists with all potential columns
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
        ${populationColumns},
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Dynamic mapping from variant properties to DB columns
      const fieldMapping: Record<string, string> = {
        proteinChange: "protein_change",
        cdnaChange: "cdna_change",
        condition: "condition",
        revel: "revel",
        revel_score: "revel",
        REVEL: "revel",
        REVEL_score: "revel",
        vest4: "vest4_score",
        vest4_score: "vest4_score",
        VEST4: "vest4_score",
        VEST4_score: "vest4_score",
        mutPred: "mutpred_score",
        mutpred_score: "mutpred_score",
        MutPred: "mutpred_score",
        MutPred_score: "mutpred_score",
        bayesDel: "bayesdel_addaf_score",
        bayesdel_addaf_score: "bayesdel_addaf_score",
        BayesDel: "bayesdel_addaf_score",
        BayesDel_addAF_score: "bayesdel_addaf_score",
        acmg: "acmg",
        functional: "functional",
        pvalueFunctional: "pvalue_functional",
        metaHeight: "meta_height",
        metaHeightSe: "meta_height_se",
        metaRatio: "meta_ratio",
        metaRatioSe: "meta_ratio_se",
        "Allele Count": '"Allele Count"',
        "Allele Number": '"Allele Number"',
        "Allele Frequency": '"Allele Frequency"',
      };

      // Add population mappings
      populations.forEach((pop) => {
        fieldMapping[`Allele Count ${pop}`] = `"Allele Count ${pop}"`;
        fieldMapping[`Allele Number ${pop}`] = `"Allele Number ${pop}"`;
      });

      for (const v of variants) {
        const columns = ["genomic_id"];
        const values = [v.id];
        const placeholders = ["$1"];

        // Dynamically add columns present in the payload
        Object.entries(fieldMapping).forEach(([jsonKey, dbCol]) => {
          if (v[jsonKey] !== undefined && v[jsonKey] !== null) {
            // Avoid adding same DB column twice if multiple jsonKeys map to it
            if (!columns.includes(dbCol)) {
              columns.push(dbCol);
              values.push(v[jsonKey]);
              placeholders.push(`$${values.length}`);
            }
          }
        });

        const updateSet = columns
          .filter((c) => c !== "genomic_id")
          .map((c) => `${c} = EXCLUDED.${c}`)
          .join(", ");

        const query = `
          INSERT INTO ${tableName} (${columns.join(", ")})
          VALUES (${placeholders.join(", ")})
          ON CONFLICT (genomic_id) DO UPDATE SET
            ${updateSet},
            updated_at = NOW()
        `;

        await client.query(query, values);
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
