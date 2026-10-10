import type { CategoryPack } from './types';

export const salonPack: CategoryPack = {
  id: 'salon',
  income: [
    { id: 'haircuts-styling', en: 'Haircuts & styling', es: 'Cortes y peinados' },
    { id: 'color-treatments', en: 'Color & chemical treatments', es: 'Tintes y tratamientos químicos' },
    { id: 'nails', en: 'Nails (manicure & pedicure)', es: 'Uñas (manicura y pedicura)' },
    { id: 'skincare-facials', en: 'Skincare & facials', es: 'Cuidado de la piel y faciales' },
    { id: 'product-sales', en: 'Retail product sales', es: 'Ventas de productos' },
    { id: 'chair-rentals-out', en: 'Chair rental income', es: 'Ingresos por renta de sillas' },
    { id: 'tips-income', en: 'Tips received', es: 'Propinas recibidas' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'hair-products', en: 'Hair products (color, shampoo, styling)', es: 'Productos de cabello (tintes, champú, peinado)' },
    { id: 'nail-supplies', en: 'Nail supplies', es: 'Insumos de uñas' },
    { id: 'skincare-products', en: 'Skincare products', es: 'Productos para la piel' },
    { id: 'tools-equipment', en: 'Tools & equipment (dryers, clippers, chairs)', es: 'Herramientas y equipo (secadoras, máquinas, sillas)' },
    { id: 'equipment-repairs', en: 'Equipment repairs', es: 'Reparaciones de equipo' },
    { id: 'capes-towels', en: 'Capes, towels & linens', es: 'Capas, toallas y mantelería' },
    { id: 'wages-staff', en: 'Wages — staff', es: 'Sueldos — empleados' },
    { id: 'chair-rental-paid', en: 'Chair or booth rent paid', es: 'Renta de silla o espacio pagada' },
    { id: 'rent-lease', en: 'Rent or lease', es: 'Renta o arrendamiento' },
    { id: 'utilities', en: 'Utilities', es: 'Servicios (luz, agua, gas)' },
    { id: 'licenses-permits', en: 'Licenses & permits', es: 'Licencias y permisos' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'booking-software', en: 'Booking & scheduling software', es: 'Software de citas y agenda' },
    { id: 'cleaning-laundry', en: 'Cleaning & laundry service', es: 'Limpieza y servicio de lavandería' },
    { id: 'insurance', en: 'Business insurance', es: 'Seguro del negocio' },
    { id: 'uniforms', en: 'Uniforms & aprons', es: 'Uniformes y delantales' },
  ],
};
