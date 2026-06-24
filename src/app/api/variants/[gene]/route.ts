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
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      return NextResponse.json({ error: "Invalid gene name" }, { status: 400 });
    }

    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
      [tableName]
    );

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json([], { status: 200 });
    }

    const result = await pool.query(`SELECT * FROM ${tableName}${genomicIdFilter ? ' WHERE genomic_id = $1' : ''}`, genomicIdFilter ? [genomicIdFilter] : []);

    // Return everything from the DB. 
    // We map snake_case columns back to the names the frontend expects.
    const mappedRows = result.rows.map((row: any) => {
      const mapped: any = {
        Protein_change: row.protein_change,
        cDNA_change: row.cdna_change,
        Genomic_ID: row.genomic_id,
        condition: row.condition,
        Mutation_type: row.mutation_type,
        REVEL: row.revel || row.REVEL,
        VEST4_score: row.vest4_score || row.VEST4_score,
        MutPred_score: row.mutpred_score || row.MutPred_score,
        BayesDel_addAF_score: row.bayesdel_addaf_score || row.BayesDel_addAF_score,
        ACMG: row.acmg || row.ACMG,
        Functional: row.functional || row.Functional,
        Pvalue_functional: row.pvalue_functional || row.Pvalue_functional,
      };

      // Merge remaining columns (populations, phenotypes, etc)
      Object.keys(row).forEach(key => {
        if (!mapped[key] && !['protein_change', 'cdna_change', 'genomic_id', 'condition', 'mutation_type', 'created_at', 'updated_at'].includes(key)) {
          mapped[key] = row[key];
        }
      });
      
      return mapped;
    });

    return NextResponse.json(mappedRows);
  } catch (error) {
    console.error(`Error fetching variants for ${gene}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
      return NextResponse.json({ error: "No variants provided" }, { status: 400 });
    }

    // 1. Define the populations list for guaranteed columns
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

    // 2. Identify all Phenotype_ columns and any other columns from the payload
    const allPayloadKeys = new Set<string>();
    variants.forEach((v: any) => {
      Object.keys(v).forEach((k) => allPayloadKeys.add(k));
    });

    // 3. Build the core schema (guaranteed columns)
    // We create these even if missing from the CSV
    const coreColumns = [
      "genomic_id TEXT PRIMARY KEY",
      "protein_change TEXT",
      "cdna_change TEXT",
      "condition TEXT",
      "mutation_type TEXT",
      "revel TEXT",
      "vest4_score TEXT",
      "mutpred_score TEXT",
      "bayesdel_addaf_score TEXT",
      "acmg TEXT",
      "functional TEXT",
      "pvalue_functional TEXT",
      '"Allele Count" TEXT',
      '"Allele Number" TEXT',
      '"Allele Frequency" TEXT',
    ];

    // Add population guaranteed columns
    populations.forEach(pop => {
      coreColumns.push(`"Allele Count ${pop}" TEXT`);
      coreColumns.push(`"Allele Number ${pop}" TEXT`);
    });

    // Add dynamic columns from payload (e.g. Phenotype_ etc)
    // We already handled "standard" ones in coreColumns mapping below
    const dynamicColsSql: string[] = [];
    allPayloadKeys.forEach(key => {
      const kLow = key.toLowerCase();
      // Skip fields already handled or standard internal fields
      if (key.startsWith("Phenotype_") || (!["id", "proteinchange", "cdnachange", "condition", "revel", "acmg", "functional", "pvaluefunctional"].includes(kLow) && !coreColumns.some(c => c.includes(`"${key}"`)))) {
         dynamicColsSql.push(`"${key}" TEXT`);
      }
    });

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${coreColumns.join(", ")}${dynamicColsSql.length > 0 ? ", " + dynamicColsSql.join(", ") : ""},
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await pool.query(createTableSql);

    // Fetch the actual column list from the DB to filter out non-existent columns in the payload
    const colFetch = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
      [tableName]
    );
    const dbColumnNames = new Set(colFetch.rows.map(r => r.column_name));

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const v of variants) {
        // Field matching for INSERTS
        const mapping: Record<string, string> = {
          genomic_id: "genomic_id",
          protein_change: "protein_change",
          proteinChange: "protein_change",
          "p.change": "protein_change",
          cdna_change: "cdna_change",
          cdnaChange: "cdna_change",
          "c.change": "cdna_change",
          condition: "condition",
          mutation_type: "mutation_type",
          revel: "revel",
          REVEL: "revel",
          vest4_score: "vest4_score",
          VEST4_score: "vest4_score",
          mutpred_score: "mutpred_score",
          MutPred_score: "mutpred_score",
          bayesdel_addaf_score: "bayesdel_addaf_score",
          BayesDel_addAF_score: "bayesdel_addaf_score",
          acmg: "acmg",
          ACMG: "acmg",
          functional: "functional",
          Functional: "functional",
          pvalue_functional: "pvalue_functional",
          pvalueFunctional: "pvalue_functional",
          Pvalue_functional: "pvalue_functional",
          id: "genomic_id",
          ID: "genomic_id",
          Genomic_ID: "genomic_id",
        };

        const columns: string[] = [];
        const values: any[] = [];

        // 1. Handle Genomic ID (Primary Key)
        const gid = v.id || v.genomic_id || v.Genomic_ID || v.genomicId;
        if (!gid) continue; 
        
        columns.push("genomic_id");
        values.push(gid);

        // 2. Map standard fields
        Object.entries(mapping).forEach(([jsonKey, dbCol]) => {
           if (v[jsonKey] !== undefined && v[jsonKey] !== null && dbCol !== "genomic_id" && dbColumnNames.has(dbCol) && !columns.includes(dbCol)) {
              columns.push(dbCol);
              values.push(v[jsonKey]);
           }
        });

        // 3. Add dynamic fields (phenotypes, populations)
        Object.keys(v).forEach(key => {
           // Skip if already handled or internal
           if (mapping[key] || ["id", "genomicId"].includes(key)) return;
           
           // Check if it exists in DB (strip quotes for the set lookup)
           if (dbColumnNames.has(key) && !columns.includes(`"${key}"`)) {
              columns.push(`"${key}"`);
              values.push(v[key]);
           }
        });

        if (columns.length <= 1) {
           // Only genomic_id found, nothing to update or insert really worth doing
           continue;
        }

        const placeholders = columns.map((_, i) => `$${i + 1}`);
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
      throw (e);
    } finally {
      client.release();
    }

    return NextResponse.json({
      message: `Successfully loaded ${variants.length} variants into ${tableName}`,
    });
  } catch (error: any) {
    console.error(`Error uploading variants for ${gene}:`, error);
    
    // Specifically handle the "index row size" error for better user feedback
    if (error.message?.includes("index row size") || error.code === "22021" || error.code === "54000") {
       return NextResponse.json({ 
         error: "One or more variants have an ID that is too large to index (Max ~2700 characters). Please check your CSV for long sequence strings in the ID column." 
       }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gene: string }> },
) {
  const { gene } = await params;
  const tableName = gene.toLowerCase();

  try {
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      return NextResponse.json({ error: "Invalid gene name" }, { status: 400 });
    }

    await pool.query(`DROP TABLE IF EXISTS ${tableName}`);

    return NextResponse.json({
      message: `Successfully deleted table for ${gene}`,
    });
  } catch (error: any) {
    console.error(`Error deleting table for ${gene}:`, error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
