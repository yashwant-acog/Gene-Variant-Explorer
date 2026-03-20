import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genomicId = searchParams.get('genomicId');
    const cdnaToMatch = searchParams.get('cdnaToMatch');

    if (!genomicId || !cdnaToMatch) {
      return NextResponse.json(
        { error: 'Missing genomicId or cdnaToMatch' },
        { status: 400 }
      );
    }

    const [chr, pos, ref, alt] = genomicId.split(':');

    // 1️⃣ Search ClinVar
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=${chr}[Chromosome]+AND+${pos}[Base Position]+AND+${ref}>${alt}&retmode=json`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const ids = searchData?.esearchresult?.idlist || [];
    if (!ids.length) {
      console.log('No ClinVar IDs found.');
      return NextResponse.json([]);
    }

    // 2️⃣ Fetch all IDs
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${ids.join(',')}&retmode=json`;

    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    const matchedResults: any[] = [];

    // 3️⃣ Iterate through all records
    ids.forEach((uid: string) => {
      const record = summaryData.result?.[uid];
      if (!record?.variation_set) return;

      record.variation_set.forEach((variation: any) => {
        if (variation.cdna_change === cdnaToMatch) {
          matchedResults.push({
            variationID: uid, // Store the actual ClinVar ID used for API call
            accession: record?.accession || '',
            germlineClassification:
              record?.germline_classification?.description || '',
            conditions:
              record?.germline_classification?.trait_set?.map(
                (t: any) => t.trait_name
              ) || [],
          });
        }
      });
    });

    console.log('Matched Variants:', matchedResults);

    return NextResponse.json(matchedResults);

  } catch (error) {
    console.error('Error fetching ClinVar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ClinVar data' },
      { status: 500 }
    );
  }
}
