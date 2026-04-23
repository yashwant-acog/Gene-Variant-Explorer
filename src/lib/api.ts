import { Variant } from "./types";

const AA_MAP: Record<string, string> = {
  Ala: "A", Arg: "R", Asn: "N", Asp: "D", Cys: "C", Gln: "Q", Glu: "E", Gly: "G", 
  His: "H", Ile: "I", Leu: "L", Lys: "K", Met: "M", Phe: "F", Pro: "P", Ser: "S", 
  Thr: "T", Trp: "W", Tyr: "Y", Val: "V", Asx: "B", Glx: "Z", Xaa: "X", Xle: "J", Ter: "*"
};

const formatProtein = (name: string): string => {
  if (!name) return "N/A";
  const match = name.match(/\(p\.([^)]+)\)/);
  if (!match) {
    const simpleMatch = name.match(/p\.([A-Z][a-z]{2}\d+[A-Z][a-z]{2})/);
    if (!simpleMatch) return "Not Provided";
    const pPart = simpleMatch[1];
    return pPart.replace(/([A-Z][a-z]{2})/g, (m) => AA_MAP[m] || m);
  }
  const pPart = match[1]; // Gly380Arg
  return pPart.replace(/([A-Z][a-z]{2})/g, (m) => AA_MAP[m] || m);
};

export const getProteinPosition = (proteinChange: string): number | null => {
  if (!proteinChange) return null;
  const match = proteinChange.match(/\d+/);
  return match ? parseInt(match[0]) : null;
};

export const getDomainInfo = (position: number | null) => {
  if (position === null) return { domain: "Unknown", subdomain: "None" };

  let domain = "Other";
  if (position >= 23 && position <= 375) domain = "Extracellular";
  else if (position >= 376 && position <= 396) domain = "Transmembrane";
  else if (position >= 397 && position <= 806) domain = "Cytoplasmic";

  let subdomain = "None";
  if (position >= 24 && position <= 126) subdomain = "Ig-like C2-type 1";
  else if (position >= 151 && position <= 244) subdomain = "Ig-like C2-type 2";
  else if (position >= 253 && position <= 355) subdomain = "Ig-like C2-type 3";
  else if (position >= 472 && position <= 761) subdomain = "Protein kinase";

  return { domain, subdomain };
};

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
    const proteinChanges: string[] = [];
    const variationSet = data.variation_set || [];
    let primaryLoc: any = null;
    
    variationSet.forEach((vSet: any) => {
      // Extract cDNA
      let rawCdna = vSet.cdna_change || "";
      let cleanedCdna = rawCdna.includes(":") ? rawCdna.split(":").pop() || rawCdna : rawCdna;

      if (cleanedCdna && !cdnaChanges.includes(cleanedCdna)) {
        cdnaChanges.push(cleanedCdna);
      }

      // Extract and format Protein
      const formattedP = formatProtein(vSet.variation_name || "");
      if (formattedP !== "N/A" && !proteinChanges.includes(formattedP)) {
        proteinChanges.push(formattedP);
      }

      // Extract alleles from THIS set's cDNA change
      const alleleMatch = cleanedCdna.match(/([A-Z])>([A-Z])/);

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
        proteinConsequence: proteinChanges.length > 0 ? proteinChanges[0] : "Not Provided",
        proteinChanges: proteinChanges.length > 0 ? proteinChanges : ["Not Provided"],
        ...getDomainInfo(getProteinPosition(proteinChanges.length > 0 ? proteinChanges[0] : "")),
        proteinPosition: getProteinPosition(proteinChanges.length > 0 ? proteinChanges[0] : ""),
        proteinDomain: getDomainInfo(getProteinPosition(proteinChanges.length > 0 ? proteinChanges[0] : "")).domain,
        proteinSubdomain: getDomainInfo(getProteinPosition(proteinChanges.length > 0 ? proteinChanges[0] : "")).subdomain,
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
 * Persistent cache using IndexedDB to store ClinVar results locally.
 */
class ClinVarDB {
  private dbName = "ClinVarCache";
  private storeName = "variants";
  private db: IDBDatabase | null = null;

  async init() {
    if (this.db) return;
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "symbol" });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async get(symbol: string) {
    await this.init();
    return new Promise<any>((resolve, reject) => {
      if (!this.db) return resolve(null);
      const transaction = this.db.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(symbol);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(symbol: string, variants: Variant[], total: number) {
    await this.init();
    return new Promise<void>((resolve, reject) => {
      if (!this.db) return resolve();
      const transaction = this.db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.put({
        symbol,
        variants,
        total,
        timestamp: Date.now()
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

const dbCache = new ClinVarDB();
// Session-level in-memory cache to handle immediate navigation
const sessionCache: Record<string, { variants: Variant[], total: number }> = {};

/**
 * Fetches ClinVar variants for a given gene symbol using ONLY NCBI API.
 * Supports incremental loading via onChunk callback.
 */
export async function fetchClinVarVariants(
  symbol: string,
  onChunk?: (variants: Variant[], total: number) => void
): Promise<{ variants: Variant[]; total: number }> {
  try {
    // 1. Check Session Cache (fastest - works for navigation)
    if (sessionCache[symbol]) {
      console.log(`[Cache] Loading ${symbol} from session cache.`);
      if (onChunk) onChunk(sessionCache[symbol].variants, sessionCache[symbol].total);
      return sessionCache[symbol];
    }

    // 2. Check IndexedDB Cache (works for reloads)
    const cached = await dbCache.get(symbol);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const isFresh = age < 24 * 60 * 60 * 1000; // 24 hours
      if (isFresh) {
        console.log(`[Cache] Loading ${symbol} from IndexedDB.`);
        
        // Ensure ALL cached variants have the new domain fields
        const processedVariants = cached.variants.map((v: Variant) => {
          if (!v.proteinDomain) {
            const pos = getProteinPosition(v.proteinConsequence);
            const domainInfo = getDomainInfo(pos);
            return {
              ...v,
              proteinPosition: pos,
              proteinDomain: domainInfo.domain,
              proteinSubdomain: domainInfo.subdomain,
              ...domainInfo
            };
          }
          return v;
        });

        sessionCache[symbol] = { variants: processedVariants, total: cached.total };
        if (onChunk) onChunk(processedVariants, cached.total);
        return { variants: processedVariants, total: cached.total };
      }
      console.log(`[Cache] ${symbol} cache expired. Refetching...`);
    }

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

      // 3. Save to Caches after full fetch
      sessionCache[symbol] = { variants: allNCBIVariants, total: totalCount };
      await dbCache.set(symbol, allNCBIVariants, totalCount);
    }

    return {
      variants: allNCBIVariants,
      total: totalCount || allNCBIVariants.length,
    };
  } catch (error) {
    console.error("Fetch ClinVar error:", error);
    return { variants: [], total: 0 };
  }
}
