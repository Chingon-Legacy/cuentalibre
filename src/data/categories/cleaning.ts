import type { CategoryPack } from './types';

export const cleaningPack: CategoryPack = {
  id: 'cleaning',
  income: [
    { id: 'recurring-clients', en: 'Recurring cleaning clients', es: 'Clientes de limpieza recurrente' },
    { id: 'one-time-cleans', en: 'One-time deep cleans', es: 'Limpiezas profundas únicas' },
    { id: 'move-in-out', en: 'Move-in / move-out cleaning', es: 'Limpieza de entrada y salida de vivienda' },
    { id: 'commercial-contracts', en: 'Commercial contracts', es: 'Contratos comerciales' },
    { id: 'post-construction', en: 'Post-construction cleanup', es: 'Limpieza después de construcción' },
    { id: 'add-on-services', en: 'Add-on services (windows, laundry)', es: 'Servicios extra (ventanas, lavandería)' },
    { id: 'tips-income', en: 'Tips received', es: 'Propinas recibidas' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'cleaning-supplies', en: 'Cleaning supplies (chemicals, sprays)', es: 'Insumos de limpieza (químicos, aerosoles)' },
    { id: 'mops-vacuums', en: 'Mops, vacuums & brushes', es: 'Trapeadores, aspiradoras y cepillos' },
    { id: 'equipment-repairs', en: 'Equipment repairs', es: 'Reparaciones de equipo' },
    { id: 'trash-bags-gloves', en: 'Bags, gloves & paper products', es: 'Bolsas, guantes y papel' },
    { id: 'wages-staff', en: 'Wages — staff', es: 'Sueldos — empleados' },
    { id: 'mileage-gas', en: 'Mileage & gas for jobs', es: 'Millaje y gasolina para los trabajos' },
    { id: 'vehicle-maintenance', en: 'Vehicle maintenance', es: 'Mantenimiento del vehículo' },
    { id: 'uniforms', en: 'Uniforms & aprons', es: 'Uniformes y delantales' },
    { id: 'insurance-bonds', en: 'Insurance & bonding', es: 'Seguros y fianzas' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'booking-software', en: 'Booking & scheduling software', es: 'Software de citas y agenda' },
    { id: 'laundry-service', en: 'Laundry service for rags & towels', es: 'Lavandería para trapos y toallas' },
    { id: 'storage-rent', en: 'Storage or office rent', es: 'Renta de bodega u oficina' },
  ],
};
