import type { CategoryPack } from './types';

export const restaurantPack: CategoryPack = {
  id: 'restaurant',
  income: [
    { id: 'dine-in-sales', en: 'Dine-in sales', es: 'Ventas en el comedor' },
    { id: 'takeout-delivery-sales', en: 'Takeout & delivery sales', es: 'Ventas para llevar y a domicilio' },
    { id: 'catering-events', en: 'Catering & events', es: 'Catering y eventos' },
    { id: 'alcohol-sales', en: 'Beer, wine & cocktail sales', es: 'Ventas de cerveza, vino y cocteles' },
    { id: 'desserts-drinks', en: 'Desserts & drinks', es: 'Postres y bebidas' },
    { id: 'tips-income', en: 'Tips received', es: 'Propinas recibidas' },
    { id: 'merchandise-gift-cards', en: 'Merchandise & gift cards', es: 'Mercancía y tarjetas de regalo' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'food-supplies', en: 'Food supplies', es: 'Insumos de comida' },
    { id: 'beverages', en: 'Beverages (non-alcoholic)', es: 'Bebidas (no alcohólicas)' },
    { id: 'alcohol-inventory', en: 'Beer, wine & liquor inventory', es: 'Inventario de cerveza, vino y licor' },
    { id: 'kitchen-equipment', en: 'Kitchen equipment', es: 'Equipo de cocina' },
    { id: 'equipment-repairs', en: 'Equipment repairs & maintenance', es: 'Reparaciones y mantenimiento de equipo' },
    { id: 'wages-kitchen-staff', en: 'Wages — kitchen staff', es: 'Sueldos — personal de cocina' },
    { id: 'wages-servers', en: 'Wages — servers', es: 'Sueldos — meseros' },
    { id: 'linens-uniforms', en: 'Linens & uniforms', es: 'Mantelería y uniformes' },
    { id: 'disposables-packaging', en: 'To-go boxes & disposables', es: 'Cajas para llevar y desechables' },
    { id: 'delivery-fees', en: 'Delivery app fees', es: 'Comisiones de apps de delivery' },
    { id: 'rent-lease', en: 'Rent or lease', es: 'Renta o arrendamiento' },
    { id: 'utilities', en: 'Utilities (gas, water, electric)', es: 'Servicios (gas, agua, luz)' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'pos-software', en: 'POS & software', es: 'Sistema de punto de venta y software' },
    { id: 'cleaning-pest-control', en: 'Cleaning & pest control', es: 'Limpieza y control de plagas' },
  ],
};
