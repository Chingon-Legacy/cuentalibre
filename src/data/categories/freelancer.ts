import type { CategoryPack } from './types';

export const freelancerPack: CategoryPack = {
  id: 'freelancer',
  income: [
    { id: 'client-projects', en: 'Client projects', es: 'Proyectos de clientes' },
    { id: 'hourly-work', en: 'Hourly work', es: 'Trabajo por hora' },
    { id: 'retainers', en: 'Monthly retainers', es: 'Igualas mensuales' },
    { id: 'consulting', en: 'Consulting & advice', es: 'Consultoría y asesoría' },
    { id: 'digital-products', en: 'Digital products & templates', es: 'Productos digitales y plantillas' },
    { id: 'affiliate-income', en: 'Affiliate & referral income', es: 'Ingresos por afiliados y referidos' },
    { id: 'late-fees', en: 'Late fees charged', es: 'Recargos por pago tardío' },
    { id: 'other-income', en: 'Other income', es: 'Otros ingresos' },
  ],
  expense: [
    { id: 'software-subscriptions', en: 'Software subscriptions', es: 'Suscripciones de software' },
    { id: 'home-office', en: 'Home office (rent, supplies)', es: 'Oficina en casa (renta, insumos)' },
    { id: 'internet-phone', en: 'Internet & phone', es: 'Internet y teléfono' },
    { id: 'computer-gear', en: 'Computer & gear', es: 'Computadora y equipo' },
    { id: 'contractors', en: 'Contractors & helpers', es: 'Contratistas y ayudantes' },
    { id: 'mileage-travel', en: 'Mileage & travel', es: 'Millaje y viajes' },
    { id: 'coworking-space', en: 'Coworking space', es: 'Espacio de coworking' },
    { id: 'advertising', en: 'Advertising & marketing', es: 'Publicidad y mercadeo' },
    { id: 'professional-development', en: 'Courses & training', es: 'Cursos y capacitación' },
    { id: 'business-licenses', en: 'Business licenses & fees', es: 'Licencias comerciales y cuotas' },
    { id: 'insurance', en: 'Business insurance', es: 'Seguro del negocio' },
    { id: 'bank-payment-fees', en: 'Bank & payment fees', es: 'Comisiones bancarias y de pagos' },
    { id: 'meals-entertainment', en: 'Business meals', es: 'Comidas de negocio' },
    { id: 'office-supplies', en: 'Office supplies', es: 'Artículos de oficina' },
  ],
};
