import { Variant } from "./types";

/**
 * Maps a MyVariant.info API hit to our internal Variant interface.
 */
function mapApiHitToVariant(hit: any): Variant {
    const c = hit.clinvar || {};
    const hgvs = c.hgvs || {};
    const rcvList = Array.isArray(c.rcv) ? c.rcv : (c.rcv ? [c.rcv] : []);
    const firstRcv = rcvList.length > 0 ? rcvList[0] : {};

    // Extract conditions and aggregated clinical significance
    const sigCounts: Record<string, number> = {};
    const conditionsSet = new Set<string>();
    
    rcvList.forEach((rcvItem: any) => {
        const sig = rcvItem.clinical_significance;
        
        // Only consider the significance if the origin is germline
        const isGermline = (rcvItem.origin || "").toLowerCase() === "germline" || 
                           (Array.isArray(rcvItem.origin) && rcvItem.origin.some((o: string) => (o || "").toLowerCase() === "germline"));

        if (sig && isGermline) {
            sigCounts[sig] = (sigCounts[sig] || 0) + 1;
        }
        
        if (rcvItem.conditions) {
            const normalizedCondList = Array.isArray(rcvItem.conditions) ? rcvItem.conditions : [rcvItem.conditions];
            normalizedCondList.forEach((cond: any) => {
                if (cond.name) conditionsSet.add(cond.name);
            });
        }
    });

    const conditions = Array.from(conditionsSet);
    const disease = conditions.length > 0 ? conditions[0] : "N/A";
    
    // Aggregated clinical significance for germline-only records
    const aggregatedSig = Object.keys(sigCounts).join(" || ") || "Uncertain Significance";

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
        clinvarGermlineClassification: aggregatedSig,
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
                accession: firstRcv.accession || "",
                clinical_significance: firstRcv.clinical_significance || "",
                conditions: {
                    identifiers: firstRcv.conditions?.identifiers || {},
                    name: firstRcv.conditions?.name || "",
                    synonyms: firstRcv.conditions?.synonyms || []
                },
                last_evaluated: firstRcv.last_evaluated || "",
                number_submitters: firstRcv.number_submitters || 0,
                origin: firstRcv.origin || "",
                preferred_name: firstRcv.preferred_name || "",
                review_status: firstRcv.review_status || ""
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
export async function fetchClinVarVariants(
  symbol: string,
  from: number = 0,
  size: number = 1000
): Promise<{ variants: Variant[]; total: number }> {
  try {
    const url = `https://myvariant.info/v1/query?q=clinvar.gene.symbol:${symbol}&fields=clinvar&from=${from}&size=${size}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const hits = data.hits || [];
    const total = data.total || 0;

    return {
      variants: hits.map(mapApiHitToVariant),
      total,
    };
  } catch (error) {
    console.error("Failed to fetch ClinVar data:", error);
    return { variants: [], total: 0 };
  }
}
