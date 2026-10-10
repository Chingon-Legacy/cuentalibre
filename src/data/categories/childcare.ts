import type { CategoryPack } from './types';

export const childcarePack: CategoryPack = {
  id: 'childcare',
  income: [
    { id: 'weekly-tuition', en: 'Weekly tuition / care fees', es: 'Colegiatura semanal / cuotas de cuidado' },
    { id: 'part-time-care', en: 'Part-time & drop-in care', es: 'Cuidado de medio tiempo y por visita' },
    { id: 'after-school', en: 'After-school care', es: 'Cuidado después de la escuela' },
    { id: 'summer-camps', en: 'Summer camps & programs', es: 'Campamentos y programas de verano' },
    { id: 'registration-fees', en: 'Registration & enrollment fees', es: 'Cuotas de registro e inscripción' },
    { id: 'late-pickup-fees', en: 'Late pickup fees', es: 'Recargos por recogida tardía' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'snacks-meals', en: 'Snacks & meals', es: 'Snacks y comidas' },
    { id: 'toys-learning', en: 'Toys & learning materials', es: 'Juguetes y material didáctico' },
    { id: 'diapers-wipes', en: 'Diapers & wipes', es: 'Pañales y toallitas' },
    { id: 'cribs-furniture', en: 'Cribs & kid furniture', es: 'Cunas y muebles para niños' },
    { id: 'safety-childproofing', en: 'Safety & childproofing supplies', es: 'Insumos de seguridad y protección' },
    { id: 'cleaning-disinfecting', en: 'Cleaning & disinfecting supplies', es: 'Insumos de limpieza y desinfección' },
    { id: 'wages-helpers', en: 'Wages — helpers', es: 'Sueldos — ayudantes' },
    { id: 'rent-lease', en: 'Rent or lease', es: 'Renta o arrendamiento' },
    { id: 'utilities', en: 'Utilities', es: 'Servicios (luz, agua, gas)' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'insurance', en: 'Liability insurance', es: 'Seguro de responsabilidad' },
    { id: 'training-cpr', en: 'Training & CPR certification', es: 'Capacitación y certificación de RCP' },
    { id: 'field-trips', en: 'Field trips & outings', es: 'Paseos y excursiones' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'parent-communication', en: 'Parent communication apps', es: 'Apps de comunicación con padres' },
  ],
};
