export interface Variant {
    id: string; // Internal dashboard ID
    gene: string;
    disease: string;

    // New specific genetic fields requested
    genomicID?: string;
    chromosome: string;
    position: number;
    rsIDs: string[];
    reference: string;
    alternate: string;
    transcript: string;
    hgvsConsequence: string;
    proteinConsequence: string;
    vepAnnotation: string;
    clinvarGermlineClassification: string;
    clinvarVariationID: string;
    alleleFrequency: number;
    
    // Population fields (some used for ClinVar, some for Custom)
    alleleCount?: number;
    alleleNumber?: number;
    
    alleleCountAfrican?: number;
    alleleNumberAfrican?: number;
    
    alleleCountAdmixedAmerican?: number;
    alleleNumberAdmixedAmerican?: number;
    
    alleleCountAshkenaziJewish?: number;
    alleleNumberAshkenaziJewish?: number;
    
    alleleCountEastAsian?: number;
    alleleNumberEastAsian?: number;
    
    alleleCountEuropeanFinnish?: number;
    alleleNumberEuropeanFinnish?: number;
    
    alleleCountMiddleEastern?: number;
    alleleNumberMiddleEastern?: number;
    
    alleleCountEuropeanNonFinnish?: number;
    alleleNumberEuropeanNonFinnish?: number;
    
    alleleCountAmish?: number;
    alleleNumberAmish?: number;
    
    alleleCountSouthAsian?: number;
    alleleNumberSouthAsian?: number;
    
    alleleCountRemaining?: number;
    alleleNumberRemaining?: number;

    // Predictive Score extras
    spliceai_ds_max?: number;
    pangolin_largest_ds?: number;

    // Association / Functional study fields
    Effect_height?: number;
    Pvalue_height?: number;
    Effect_ratio?: number;
    Pvalue_ratio?: number;

    sourceType: "clinvar" | "custom";
    conditions?: string[];
    Mutation_type?: string;
    Points?: string;
    C_REVEL?: string;
    condition?: string;
    Genomic_ID?: string;
    freq_background?: number;
    freq_DD?: number;
    sift?: number;
    polyphen?: number;
    REVEL?: string | number;

    // New columns added
    VEST4_score?: string;
    MutPred_score?: string;
    BayesDel_addAF_score?: string;
    ACMG?: string;
    Functional?: string;
    Pvalue_functional?: string;
    Meta_height?: string;
    Meta_height_SE?: string;
    Meta_ratio?: string;
    Meta_ratio_SE?: string;

    // ClinVar API response structure
    _id?: string;
    _score?: number;
    clinvar?: {
        _license: string;
        allele_id: number | null;
        alt: string;
        chrom: string;
        cytogenic: string;
        gene: {
            id: string;
            symbol: string;
        };
        hg19: {
            start: number | null;
            end: number | null;
        };
        hg38: {
            start: number | null;
            end: number | null;
        };
        hgvs: {
            coding: string[];
            genomic: string[];
            protein: string[];
            "non-coding": string;
        };
        omim: string;
        rcv: {
            accession: string;
            clinical_significance: string;
            conditions: {
                identifiers: {
                    medgen?: string;
                    mondo?: string;
                    omim?: string;
                    orphanet?: string;
                };
                name: string;
                synonyms: string[];
            };
            last_evaluated: string;
            number_submitters: number;
            origin: string;
            preferred_name: string;
            review_status: string;
        };
        ref: string;
        rsid: string;
        type: string;
        variant_id: number | null;
    };
}

export interface CustomVariant {
    // Specifically requested 22 columns
    Protein_change: string;
    cDNA_change: string;
    Genomic_ID: string;
    condition: string;
    Mutation_type: string;
    "Allele Count": string;
    "Allele Number": string;
    "Allele Frequency": string;
    "Allele Count African/African American": string;
    "Allele Number African/African American": string;
    "Allele Count Admixed American": string;
    "Allele Number Admixed American": string;
    "Allele Count Ashkenazi Jewish": string;
    "Allele Number Ashkenazi Jewish": string;
    "Allele Count East Asian": string;
    "Allele Number East Asian": string;
    "Allele Count European (Finnish)": string;
    "Allele Number European (Finnish)": string;
    "Allele Count Middle Eastern": string;
    "Allele Number Middle Eastern": string;
    "Allele Count European (non-Finnish)": string;
    "Allele Number European (non-Finnish)": string;
    "Allele Count Amish": string;
    "Allele Number Amish": string;
    "Allele Count South Asian": string;
    "Allele Number South Asian": string;
    REVEL: string;
    // New columns added
    VEST4_score: string;
    MutPred_score: string;
    BayesDel_addAF_score: string;
    ACMG: string;
    Functional: string;
    Pvalue_functional: string;
    Meta_height: string;
    Meta_height_SE: string;
    Meta_ratio: string;
    Meta_ratio_SE: string;
}

export interface TabItem {
    id: string;
    label: string;
    content?: React.ReactNode;
}
