import type { CategoryPack } from './types';

export const foodtruckPack: CategoryPack = {
  id: 'foodtruck',
  income: [
    { id: 'daily-sales', en: 'Daily sales', es: 'Ventas del día' },
    { id: 'private-events', en: 'Private events & parties', es: 'Eventos privados y fiestas' },
    { id: 'catering-gigs', en: 'Catering gigs', es: 'Trabajos de catering' },
    { id: 'festivals-markets', en: 'Festivals & farmers markets', es: 'Festivales y mercados' },
    { id: 'corporate-lunch-routes', en: 'Corporate lunch stops', es: 'Paradas de almuerzo en empresas' },
    { id: 'tips-income', en: 'Tips received', es: 'Propinas recibidas' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'food-supplies', en: 'Food supplies', es: 'Insumos de comida' },
    { id: 'beverages', en: 'Beverages', es: 'Bebidas' },
    { id: 'cooking-fuel', en: 'Propane & cooking fuel', es: 'Gas propano y combustible de cocina' },
    { id: 'truck-fuel', en: 'Fuel for the truck', es: 'Gasolina para la lonchera' },
    { id: 'truck-maintenance', en: 'Truck maintenance & repairs', es: 'Mantenimiento y reparaciones de la lonchera' },
    { id: 'kitchen-equipment', en: 'Kitchen equipment', es: 'Equipo de cocina' },
    { id: 'equipment-repairs', en: 'Equipment repairs', es: 'Reparaciones de equipo' },
    { id: 'disposables-packaging', en: 'To-go boxes & disposables', es: 'Cajas para llevar y desechables' },
    { id: 'wages-staff', en: 'Wages — staff', es: 'Sueldos — empleados' },
    { id: 'event-spot-fees', en: 'Event & spot fees', es: 'Cuotas de eventos y espacios' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'insurance', en: 'Truck & business insurance', es: 'Seguro del camión y del negocio' },
    { id: 'generator-power', en: 'Generator fuel & power', es: 'Combustible del generador' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'pos-software', en: 'POS & software', es: 'Sistema de punto de venta y software' },
    { id: 'uniforms', en: 'Uniforms & aprons', es: 'Uniformes y delantales' },
  ],
};
