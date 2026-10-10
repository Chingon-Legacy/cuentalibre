import type { CategoryPack } from './types';

export const retailPack: CategoryPack = {
  id: 'retail',
  income: [
    { id: 'in-store-sales', en: 'In-store sales', es: 'Ventas en la tienda' },
    { id: 'online-sales', en: 'Online sales', es: 'Ventas en línea' },
    { id: 'wholesale-sales', en: 'Wholesale sales', es: 'Ventas al mayoreo' },
    { id: 'returns-discounts', en: 'Returns & discounts', es: 'Devoluciones y descuentos' },
    { id: 'services-repairs', en: 'Services & repairs', es: 'Servicios y reparaciones' },
    { id: 'consignment-sales', en: 'Consignment sales', es: 'Ventas en consignación' },
    { id: 'gift-cards', en: 'Gift card sales', es: 'Ventas de tarjetas de regalo' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'inventory-purchases', en: 'Inventory purchases', es: 'Compra de mercancía' },
    { id: 'freight-shipping-in', en: 'Freight & shipping in', es: 'Fletes y envíos de mercancía' },
    { id: 'wages-staff', en: 'Wages — staff', es: 'Sueldos — empleados' },
    { id: 'rent-lease', en: 'Rent or lease', es: 'Renta o arrendamiento' },
    { id: 'utilities', en: 'Utilities', es: 'Servicios (luz, agua, gas)' },
    { id: 'store-supplies', en: 'Store supplies (bags, tags, hangers)', es: 'Insumos de tienda (bolsas, etiquetas, ganchos)' },
    { id: 'display-fixtures', en: 'Shelving & display fixtures', es: 'Estantería y exhibidores' },
    { id: 'pos-software', en: 'POS & software', es: 'Sistema de punto de venta y software' },
    { id: 'shoplifting-shrinkage', en: 'Theft & damaged goods', es: 'Robos y mercancía dañada' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'packaging-shipping-out', en: 'Shipping & packaging for orders', es: 'Envíos y empaques de pedidos' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'insurance', en: 'Business insurance', es: 'Seguro del negocio' },
    { id: 'cleaning-maintenance', en: 'Cleaning & maintenance', es: 'Limpieza y mantenimiento' },
    { id: 'uniforms', en: 'Uniforms', es: 'Uniformes' },
  ],
};
