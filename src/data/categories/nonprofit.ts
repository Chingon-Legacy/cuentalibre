import type { CategoryPack } from './types';

export const nonprofitPack: CategoryPack = {
  id: 'nonprofit',
  income: [
    { id: 'individual-donations', en: 'Individual donations', es: 'Donaciones individuales' },
    { id: 'grants', en: 'Grants', es: 'Subvenciones' },
    { id: 'fundraising-events', en: 'Fundraising events', es: 'Eventos de recaudación' },
    { id: 'program-fees', en: 'Program fees', es: 'Cuotas de programas' },
    { id: 'sponsorships', en: 'Sponsorships', es: 'Patrocinios' },
    { id: 'in-kind-donations', en: 'In-kind donations', es: 'Donaciones en especie' },
    { id: 'other-revenue', en: 'Other revenue', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'program-expenses', en: 'Program expenses', es: 'Gastos de programas' },
    { id: 'fundraising-expenses', en: 'Fundraising expenses', es: 'Gastos de recaudación' },
    { id: 'management-admin', en: 'Management & admin', es: 'Administración' },
    { id: 'grants-scholarships', en: 'Grants & scholarships paid', es: 'Subvenciones y becas otorgadas' },
    { id: 'supplies', en: 'Supplies', es: 'Suministros' },
    { id: 'rent-utilities', en: 'Rent & utilities', es: 'Renta y servicios' },
    { id: 'contractor-payments', en: 'Contractor payments', es: 'Pagos a contratistas' },
    { id: 'other-expenses', en: 'Other expenses', es: 'Otros gastos' },
  ],
};
