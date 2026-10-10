import type { CategoryPack } from './types';

export const landscapingPack: CategoryPack = {
  id: 'landscaping',
  income: [
    { id: 'lawn-mowing', en: 'Lawn mowing (recurring)', es: 'Corte de césped (recurrente)' },
    { id: 'landscaping-projects', en: 'Landscaping projects', es: 'Proyectos de jardinería' },
    { id: 'tree-shrub-work', en: 'Tree & shrub work', es: 'Trabajo de árboles y arbustos' },
    { id: 'mulch-sod-install', en: 'Mulch & sod installation', es: 'Instalación de mantillo y pasto' },
    { id: 'leaf-snow-cleanup', en: 'Leaf & snow cleanup', es: 'Limpieza de hojas y nieve' },
    { id: 'irrigation-work', en: 'Irrigation work', es: 'Trabajo de riego' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'plants-soil', en: 'Plants, sod & soil', es: 'Plantas, pasto y tierra' },
    { id: 'mulch-rock', en: 'Mulch, rock & stone', es: 'Mantillo, grava y piedra' },
    { id: 'fertilizer-chemicals', en: 'Fertilizer & chemicals', es: 'Fertilizantes y químicos' },
    { id: 'equipment-purchases', en: 'Equipment purchases (mowers, trimmers)', es: 'Compra de equipo (podadoras, desbrozadoras)' },
    { id: 'equipment-repairs', en: 'Equipment repairs & blades', es: 'Reparaciones de equipo y cuchillas' },
    { id: 'fuel-oil', en: 'Fuel & oil for equipment', es: 'Gasolina y aceite para el equipo' },
    { id: 'wages-crew', en: 'Wages — crew', es: 'Sueldos — cuadrilla' },
    { id: 'trailer-truck', en: 'Trailer & truck maintenance', es: 'Mantenimiento de tráiler y camioneta' },
    { id: 'truck-fuel', en: 'Fuel for truck', es: 'Gasolina para la camioneta' },
    { id: 'dump-fees', en: 'Dump & disposal fees', es: 'Cuotas de tiradero y desechos' },
    { id: 'insurance', en: 'Business insurance', es: 'Seguro del negocio' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'safety-gear', en: 'Safety gear & work clothes', es: 'Equipo de seguridad y ropa de trabajo' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'scheduling-software', en: 'Scheduling & estimating software', es: 'Software de agenda y presupuestos' },
  ],
};
