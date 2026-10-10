import type { CategoryPack } from './types';

export const autorepairPack: CategoryPack = {
  id: 'autorepair',
  income: [
    { id: 'labor-charges', en: 'Labor charges', es: 'Mano de obra' },
    { id: 'parts-markup', en: 'Parts markup', es: 'Ganancia sobre refacciones' },
    { id: 'diagnostics', en: 'Diagnostics & inspections', es: 'Diagnósticos e inspecciones' },
    { id: 'oil-tire-services', en: 'Oil changes & tire services', es: 'Cambios de aceite y servicio de llantas' },
    { id: 'fleet-contracts', en: 'Fleet contracts', es: 'Contratos con flotillas' },
    { id: 'towing', en: 'Towing', es: 'Grúas y remolques' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'parts', en: 'Parts & components', es: 'Refacciones y componentes' },
    { id: 'oils-fluids', en: 'Oils & fluids', es: 'Aceites y líquidos' },
    { id: 'tires', en: 'Tires', es: 'Llantas' },
    { id: 'shop-supplies', en: 'Shop supplies (rags, cleaners, gloves)', es: 'Insumos del taller (trapos, limpiadores, guantes)' },
    { id: 'diagnostic-tools', en: 'Diagnostic tools & scanners', es: 'Herramientas y escáneres de diagnóstico' },
    { id: 'lifts-equipment', en: 'Lifts & shop equipment', es: 'Elevadores y equipo del taller' },
    { id: 'equipment-repairs', en: 'Equipment repairs', es: 'Reparaciones de equipo' },
    { id: 'wages-techs', en: 'Wages — technicians', es: 'Sueldos — técnicos' },
    { id: 'wages-front-desk', en: 'Wages — front desk', es: 'Sueldos — recepción' },
    { id: 'rent-lease', en: 'Rent or lease', es: 'Renta o arrendamiento' },
    { id: 'utilities', en: 'Utilities', es: 'Servicios (luz, agua, gas)' },
    { id: 'hazardous-waste', en: 'Hazardous waste disposal', es: 'Desecho de materiales peligrosos' },
    { id: 'insurance', en: 'Shop insurance', es: 'Seguro del taller' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'shop-software', en: 'Shop management software', es: 'Software de gestión del taller' },
  ],
};
