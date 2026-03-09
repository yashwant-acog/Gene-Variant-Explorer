import { Variant } from "./types";

/**
 * Maps a MyVariant.info API hit to our internal Variant interface.
 */
function mapApiHitToVariant(hit: any): Variant {
    const c = hit.clinvar || {};
    const hgvs = c.hgvs || {};
    const rcv = Array.isArray(c.rcv) ? c.rcv[0] : (c.rcv || {});

    // Extract conditions
    let disease = "N/A";
    let conditions: string[] = [];
    if (rcv.conditions) {
        const condList = Array.isArray(rcv.conditions) ? rcv.conditions : [rcv.conditions];
        conditions = condList.map((c: any) => c.name).filter(Boolean);
        if (conditions.length > 0) {
            disease = conditions[0];
        }
    }

    return {
        id: hit._id,
        gene: c.gene?.symbol || "Unknown",
        disease: disease || "N/A",
        gnomAD_ID: hit._id,
        chromosome: c.chrom || "N/A",
        position: c.hg38?.start || c.hg19?.start || 0,
        rsIDs: c.rsid ? (Array.isArray(c.rsid) ? c.rsid : [c.rsid]) : [],
        reference: c.ref || "N/A",
        alternate: c.alt || "N/A",
        transcript: hgvs.coding?.[0] || "N/A",
        hgvsConsequence: hgvs.coding?.[0] || "N/A",
        proteinConsequence: hgvs.protein?.[0] || hgvs.coding?.[0] || "N/A",
        vepAnnotation: "missense_variant", // Defaulting as API sample doesn't specify VEP
        clinvarGermlineClassification: rcv.clinical_significance || "VUS",
        clinvarVariationID: String(c.variant_id || ""),
        alleleFrequency: 0, // Not in simple clinvar field query
        cadd: 0,
        revel: 0,
        sift: 0,
        polyphen: 0,
        alleleCountAfrican: 0,
        alleleCountEastAsian: 0,
        alleleCountEuropeanFinnish: 0,
        alleleCountSouthAsian: 0,
        sourceType: "clinvar",
        conditions,
    };
}

/**
 * Fetches ClinVar variants for a given gene symbol.
 */
export async function fetchClinVarVariants(symbol: string): Promise<Variant[]> {
    const url = `https://myvariant.info/v1/query?q=clinvar.gene.symbol:${symbol}&fields=clinvar&from=0&size=1000`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.hits) return [];

        return data.hits.map(mapApiHitToVariant);
    } catch (error) {
        console.error("Failed to fetch ClinVar data:", error);
        return [];
    }
}
