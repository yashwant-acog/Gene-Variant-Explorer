import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import fs from "fs";
import os from "os";
import path from "path";
import { pipeline } from "stream/promises";
import { from as copyFrom } from "pg-copy-streams";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const form = await req.formData();

    const file = form.get("file") as File;
    const chr = String(form.get("chr") || "").trim().toLowerCase();

    if (!file || !chr) {
      return NextResponse.json(
        { error: "Missing file or chromosome" },
        { status: 400 }
      );
    }

    const table = `chr${chr}_dbnsfp`;

    // Save uploaded file temporarily
    const tempFile = path.join(
      os.tmpdir(),
      `${Date.now()}-${file.name}`
    );

    await fs.promises.writeFile(
      tempFile,
      Buffer.from(await file.arrayBuffer())
    );

    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        chr TEXT,
        pos BIGINT,
        ref TEXT,
        alt TEXT,
        gene TEXT,
        cdna TEXT,
        protein TEXT,
        vest4_score REAL,
        revel_score REAL,
        mutpred_score REAL,
        bayesdel_addaf_score REAL
      )
    `);

    // Clear previous data
    await client.query(`TRUNCATE TABLE ${table}`);

    await client.query("BEGIN");

    const copyStream = client.query(
      copyFrom(`
        COPY ${table}
        (
          chr,
          pos,
          ref,
          alt,
          gene,
          cdna,
          protein,
          vest4_score,
          revel_score,
          mutpred_score,
          bayesdel_addaf_score
        )
        FROM STDIN
        WITH (
          FORMAT csv,
          HEADER true,
          NULL 'NA'
        )
      `)
    );

    await pipeline(
      fs.createReadStream(tempFile),
      copyStream
    );

    await client.query("COMMIT");

    await fs.promises.unlink(tempFile);

    return NextResponse.json({
      success: true,
      table,
    });

  } catch (err: any) {
    await client.query("ROLLBACK");

    console.error(err);

    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}