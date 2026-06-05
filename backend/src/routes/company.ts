import { Router } from 'express';

export const companyRoutes = Router();

interface CompanyDetails {
  orgNumber: string;
  name: string;
  organizationForm: string;
  industry: string[];
  employees: number | null;
  founded: string | null;
  registered: string | null;
  location: string | null;
  website: string | null;
  ownershipSector: string | null;
  purpose: string | null;
  isStateOwned: boolean;
  isPubliclyListed: boolean;
  isBankrupt: boolean;
  lastAnnualReport: string | null;
  phone: string | null;
}

companyRoutes.get('/:orgNumber', async (req, res) => {
  const { orgNumber } = req.params;

  try {
    const response = await fetch(
      `https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`
    );

    if (!response.ok) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    const data = await response.json();

    const industries: string[] = [];
    if (data.naeringskode1) industries.push(data.naeringskode1.beskrivelse);
    if (data.naeringskode2) industries.push(data.naeringskode2.beskrivelse);
    if (data.naeringskode3) industries.push(data.naeringskode3.beskrivelse);

    const address = data.forretningsadresse;
    const location = address
      ? `${(address.adresse || []).join(', ')}, ${address.postnummer} ${address.poststed}`
      : null;

    const sectorDesc = data.institusjonellSektorkode?.beskrivelse || null;
    const isStateOwned = sectorDesc?.toLowerCase().includes('statlig') || false;

    const details: CompanyDetails = {
      orgNumber: data.organisasjonsnummer,
      name: data.navn,
      organizationForm: data.organisasjonsform?.beskrivelse || data.organisasjonsform?.kode || 'Ukjent',
      industry: industries,
      employees: data.antallAnsatte ?? null,
      founded: data.stiftelsesdato || null,
      registered: data.registreringsdatoEnhetsregisteret || null,
      location,
      website: data.hjemmeside || null,
      ownershipSector: sectorDesc,
      purpose: data.vedtektsfestetFormaal?.join(' ') || null,
      isStateOwned,
      isPubliclyListed: data.organisasjonsform?.kode === 'ASA',
      isBankrupt: data.konkurs || false,
      lastAnnualReport: data.sisteInnsendteAarsregnskap || null,
      phone: data.telefon || null,
    };

    res.json(details);
  } catch (error) {
    console.error('Company details error:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});
