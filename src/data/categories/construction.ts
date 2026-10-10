import type { CategoryPack } from './types';

export const constructionPack: CategoryPack = {
  id: 'construction',
  income: [
    { id: 'job-contracts', en: 'Job contracts', es: 'Contratos de trabajo' },
    { id: 'change-orders', en: 'Change orders & extras', es: 'Cambios y trabajos extra' },
    { id: 'repairs-handyman', en: 'Repairs & handyman jobs', es: 'Reparaciones y trabajitos' },
    { id: 'hourly-labor', en: 'Hourly labor', es: 'Mano de obra por hora' },
    { id: 'material-markup', en: 'Material markup', es: 'Ganancia sobre materiales' },
    { id: 'equipment-rental-out', en: 'Equipment rental income', es: 'Ingresos por renta de equipo' },
    { id: 'deposits-received', en: 'Customer deposits received', es: 'Anticipos recibidos de clientes' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'materials', en: 'Building materials', es: 'Materiales de construcción' },
    { id: 'lumber-wood', en: 'Lumber & wood', es: 'Madera y tablones' },
    { id: 'tools', en: 'Tools', es: 'Herramientas' },
    { id: 'tool-repairs', en: 'Tool repairs & sharpening', es: 'Reparaciones y afilado de herramientas' },
    { id: 'equipment-rental', en: 'Equipment rental', es: 'Renta de equipo' },
    { id: 'subcontractors', en: 'Subcontractors', es: 'Subcontratistas' },
    { id: 'wages-crew', en: 'Wages — crew', es: 'Sueldos — cuadrilla' },
    { id: 'work-truck-fuel', en: 'Fuel for work truck', es: 'Gasolina para la camioneta de trabajo' },
    { id: 'truck-maintenance', en: 'Truck maintenance & repairs', es: 'Mantenimiento y reparaciones de la camioneta' },
    { id: 'permits-inspections', en: 'Permits & inspections', es: 'Permisos e inspecciones' },
    { id: 'dump-fees', en: 'Dump & disposal fees', es: 'Cuotas de tiradero y desechos' },
    { id: 'insurance-bonds', en: 'Insurance & bonds', es: 'Seguros y fianzas' },
    { id: 'safety-gear', en: 'Safety gear & work clothes', es: 'Equipo de seguridad y ropa de trabajo' },
    { id: 'plans-blueprints', en: 'Plans & blueprints', es: 'Planos y diseños' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'estimating-software', en: 'Estimating & job software', es: 'Software de presupuestos y trabajos' },
  ],
};
