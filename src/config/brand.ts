import type { TermsProfileId } from '../content/terms'
import xInfissiLogo from '../assets/images/x-infissi-logo.png'
import ecoSolutionsLogo from '../assets/images/eco-solutions-logo.jpeg'

export type PDFTheme = {
  accent: string
  soft: string
}

export type BrandProfile = {
  id: 'xinfissi' | 'ecosolution'
  label: string
  defaultTermsProfileId: TermsProfileId
  logoAsset: string
  companyDetails: string[]
  pdfTheme: PDFTheme
}

const XINFISSI_PROFILE: BrandProfile = {
  id: 'xinfissi',
  label: 'X Infissi',
  defaultTermsProfileId: 'privato',
  logoAsset: xInfissiLogo,
  companyDetails: [
    'Eco Solution Sas',
    'P.IVA 04640600161',
    'sede legale Via Primo Maggio 3',
    'Via Roma, 8',  ],
  pdfTheme: {
    accent: '#3fb26b',
    soft: '#e8f7ec',
  },
}

const ECOSOLUTION_PROFILE: BrandProfile = {
  id: 'ecosolution',
  label: 'MRK-EcoSolution',
  defaultTermsProfileId: 'privato',
  logoAsset: ecoSolutionsLogo,
  companyDetails: [
    'MRK-EcoSolution',
    'C.F. e P.IVA 04640600161',
    'VIA PRIMO MAGGIO 3',
    '23892 BULCIAGO LC',
    'info@ecosolutionsas.it · www.ecosolutionsas.it · +334 222 1212',
  ],
  pdfTheme: {
    accent: '#3fb26b',
    soft: '#e8f7ec',
  },
}

const BRAND_PROFILES: Record<BrandProfile['id'], BrandProfile> = {
  xinfissi: XINFISSI_PROFILE,
  ecosolution: ECOSOLUTION_PROFILE,
}

export function getActiveBrandProfile(): BrandProfile {
  const raw = String(import.meta.env.VITE_BRAND_PROFILE || 'xinfissi').trim().toLowerCase()
  if (
    raw === 'ecosolution' ||
    raw === 'ecosolutions' ||
    raw === 'ecosolutionsas' ||
    raw === 'eco_solutions' ||
    raw === 'eco-solution'
  ) {
    return BRAND_PROFILES.ecosolution
  }
  return BRAND_PROFILES.xinfissi
}
