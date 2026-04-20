import { Variant } from "./types";

/**
 * Maps an NCBI ClinVar Summary result to our internal Variant interface.
 */
function mapNCBIToVariant(uid: string, data: any): Variant {
    const title = data.title || "";
    // Format: NM_000142.4(FGFR3):c.[1130T>G;1138G>A]
    // Get cDNA change after the colon
    const cdnaChange = title.includes(":") ? title.split(":").pop() : title;
    
    const germSig = data.germline_classification?.description || "Uncertain Significance";
    
    // Extract conditions from trait_set
    const traits = data.germline_classification?.trait_set || [];
    const conditions = traits
        .map((t: any) => t.trait_name)
        .filter((name: string) => name && name.toLowerCase() !== "not provided");
    
    const disease = conditions.length > 0 ? conditions[0] : "N/A";

    // Extract ALL Genomic IDs and identify a primary GRCh38 location
    const genomicIDs: string[] = [];
    const cdnaChanges: string[] = [];
    const variationSet = data.variation_set || [];
    let primaryLoc: any = null;
    
    variationSet.forEach((vSet: any) => {
      if (vSet.cdna_change && !cdnaChanges.includes(vSet.cdna_change)) {
        cdnaChanges.push(vSet.cdna_change);
      }

      // Extract alleles from THIS set's cDNA change
      const vSetCdna = vSet.cdna_change || "";
      const alleleMatch = vSetCdna.match(/([A-Z])>([A-Z])/);

      const locs = vSet.variation_loc || [];
      locs.forEach((loc: any) => {
        if (loc.assembly_name === "GRCh38" && loc.status === "current") {
          // Extract alleles from this specific cDNA if missing in loc record
          let lRef = loc.ref || "";
          let lAlt = loc.alt || "";
          if ((!lRef || !lAlt) && alleleMatch) {
            if (!lRef) lRef = alleleMatch[1];
            if (!lAlt) lAlt = alleleMatch[2];
          }
          
          if (loc.chr && loc.start && lRef && lAlt) {
            const gid = `${loc.chr}:${loc.start}:${lRef}:${lAlt}`;
            if (!genomicIDs.includes(gid)) {
              genomicIDs.push(gid);
            }
            
            // Set primary location for standard fields
            if (!primaryLoc) {
              primaryLoc = { ...loc, ref: lRef, alt: lAlt };
            }
          }
        }
      });
    });

    if (!primaryLoc) primaryLoc = {};
    const genomicID = genomicIDs.length > 0 ? genomicIDs[0] : "Not found";

    return {
        id: uid,
        gene: title.match(/\(([^)]+)\)/)?.[1] || "Unknown",
        disease: disease,
        genomicID: genomicID,
        genomicIDs: genomicIDs,
        cdnaChanges: cdnaChanges,
        isHaplotype: data.variant_type_nm === "Haplotype" || variationSet.length > 1,
        chromosome: primaryLoc.chr || "N/A",
        position: primaryLoc.start || 0,
        rsIDs: [], // NCBI Summary API doesn't always provide rsID directly in this field
        reference: primaryLoc.ref || "N/A",
        alternate: primaryLoc.alt || "N/A",
        transcript: title.split("(")[0] || "N/A",
        hgvsConsequence: cdnaChange,
        proteinConsequence: data.protein_change || "N/A",
        vepAnnotation: "missense_variant", // Default
        clinvarGermlineClassification: germSig,
        clinvarVariationID: data.variation_id || uid,
        alleleFrequency: 0,
        sourceType: "clinvar",
        conditions: conditions.length > 0 ? conditions : ["Not provided"],
        clinvar: {
            // Minimal shell to avoid breaking components expecting this structure
            _license: "",
            allele_id: null,
            alt: primaryLoc.alt || "",
            chrom: primaryLoc.chr || "",
            cytogenic: "",
            gene: { id: "", symbol: "" },
            hg19: { start: null, end: null },
            hg38: { start: primaryLoc.start, end: primaryLoc.stop },
            hgvs: {
                coding: [cdnaChange],
                genomic: [],
                protein: [data.protein_change || ""],
                "non-coding": ""
            },
            omim: "",
            rcv: {
                accession: "",
                clinical_significance: germSig,
                conditions: { identifiers: {}, name: disease, synonyms: [] },
                last_evaluated: "",
                number_submitters: 0,
                origin: "",
                preferred_name: title,
                review_status: ""
            },
            ref: primaryLoc.ref || "",
            rsid: "",
            type: "",
            variant_id: parseInt(data.variation_id || uid)
        }
    };
}

/**
 * Fetches ClinVar variants for a given gene symbol using ONLY NCBI API.
 * Supports incremental loading via onChunk callback.
 */
export async function fetchClinVarVariants(
  symbol: string,
  onChunk?: (variants: Variant[], total: number) => void
): Promise<{ variants: Variant[]; total: number }> {
  try {
    let allNCBIVariants: Variant[] = [];
    
    // Step 1: Search for ALL variant IDs for the gene
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=${symbol}[gene]&retmax=10000&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`NCBI Search Error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const idList = searchData.esearchresult?.idlist || [];
    const totalCount = parseInt(searchData.esearchresult?.count || "0");
    
    if (idList.length > 0) {
      // Step 2: Fetch detailed summaries in batches
      const batchSize = 500;
      for (let i = 0; i < idList.length; i += batchSize) {
        const batch = idList.slice(i, i + batchSize);
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${batch.join(",")}&retmode=json`;
        const summaryResponse = await fetch(summaryUrl);
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const result = summaryData.result || {};
          const uids = result.uids || [];
          
          const chunk: Variant[] = [];
          uids.forEach((uid: string) => {
            if (result[uid]) {
              chunk.push(mapNCBIToVariant(uid, result[uid]));
            }
          });
          
          allNCBIVariants.push(...chunk);
          
          // Incremental update if callback provided
          if (onChunk) {
            onChunk([...allNCBIVariants], totalCount);
          }
        }
      }
    }

    return {
      variants: allNCBIVariants,
      total: totalCount || allNCBIVariants.length,
    };
  } catch (error) {
    console.error("Failed to fetch ClinVar data from NCBI:", error);
    return { variants: [], total: 0 };
  }
}
