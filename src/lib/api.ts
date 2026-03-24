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
        genomicID: hit._id,
        chromosome: c.chrom || "N/A",
        position: c.hg38?.start || c.hg19?.start || 0,
        rsIDs: c.rsid ? (Array.isArray(c.rsid) ? c.rsid : [c.rsid]) : [],
        reference: c.ref || "N/A",
        alternate: c.alt || "N/A",
        transcript: hgvs.coding?.[0] || "N/A",
        hgvsConsequence: hgvs.coding?.[0] || "N/A",
        proteinConsequence: hgvs.protein?.[0] || hgvs.coding?.[0] || "N/A",
        vepAnnotation: "missense_variant",
        clinvarGermlineClassification: rcv.clinical_significance || "VUS",
        clinvarVariationID: String(c.variant_id || ""),
        alleleFrequency: 0,
        sift: 0,
        polyphen: 0,
        alleleCountAfrican: 0,
        alleleCountEastAsian: 0,
        alleleCountEuropeanFinnish: 0,
        alleleCountSouthAsian: 0,
        sourceType: "clinvar",
        conditions,
        // Store exact ClinVar API response structure
        _id: hit._id,
        _score: hit._score || 0,
        clinvar: {
            _license: c._license || "",
            allele_id: c.allele_id || null,
            alt: c.alt || "",
            chrom: c.chrom || "",
            cytogenic: c.cytogetic || "",
            gene: {
                id: c.gene?.id || "",
                symbol: c.gene?.symbol || ""
            },
            hg19: {
                start: c.hg19?.start || null,
                end: c.hg19?.end || null
            },
            hg38: {
                start: c.hg38?.start || null,
                end: c.hg38?.end || null
            },
            hgvs: {
                coding: hgvs.coding || [],
                genomic: hgvs.genomic || [],
                protein: hgvs.protein || [],
                "non-coding": hgvs["non-coding"] || ""
            },
            omim: c.omim || "",
            rcv: {
                accession: rcv.accession || "",
                clinical_significance: rcv.clinical_significance || "",
                conditions: {
                    identifiers: rcv.conditions?.identifiers || {},
                    name: rcv.conditions?.name || "",
                    synonyms: rcv.conditions?.synonyms || []
                },
                last_evaluated: rcv.last_evaluated || "",
                number_submitters: rcv.number_submitters || 0,
                origin: rcv.origin || "",
                preferred_name: rcv.preferred_name || "",
                review_status: rcv.review_status || ""
            },
            ref: c.ref || "",
            rsid: c.rsid || "",
            type: c.type || "",
            variant_id: c.variant_id || null
        }
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
