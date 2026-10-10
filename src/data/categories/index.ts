import type { CategoryPack } from './types';
import { restaurantPack } from './restaurant';
import { foodtruckPack } from './foodtruck';
import { retailPack } from './retail';
import { salonPack } from './salon';
import { constructionPack } from './construction';
import { cleaningPack } from './cleaning';
import { landscapingPack } from './landscaping';
import { autorepairPack } from './autorepair';
import { freelancerPack } from './freelancer';
import { childcarePack } from './childcare';

export interface BusinessTypeMeta {
  id: string;
  en: string;
  es: string;
  icon: string;
}

export const businessTypes: BusinessTypeMeta[] = [
  { id: 'restaurant', en: 'Restaurant', es: 'Restaurante', icon: '🍽️' },
  { id: 'foodtruck', en: 'Food truck / Catering', es: 'Lonchera / Catering', icon: '🚚' },
  { id: 'retail', en: 'Retail store', es: 'Tienda', icon: '🏪' },
  { id: 'salon', en: 'Salon / Barbershop', es: 'Salón / Barbería', icon: '💈' },
  { id: 'construction', en: 'Construction / Contractor', es: 'Construcción / Contratista', icon: '🔨' },
  { id: 'cleaning', en: 'Cleaning services', es: 'Servicios de limpieza', icon: '🧹' },
  { id: 'landscaping', en: 'Landscaping / Lawn care', es: 'Jardinería', icon: '🌿' },
  { id: 'autorepair', en: 'Auto repair', es: 'Taller mecánico', icon: '🔧' },
  { id: 'freelancer', en: 'Freelancer / Services', es: 'Freelancer / Servicios', icon: '💼' },
  { id: 'childcare', en: 'Childcare', es: 'Cuidado de niños', icon: '🧸' },
];

export const categoryPacks: Record<string, CategoryPack> = {
  restaurant: restaurantPack,
  foodtruck: foodtruckPack,
  retail: retailPack,
  salon: salonPack,
  construction: constructionPack,
  cleaning: cleaningPack,
  landscaping: landscapingPack,
  autorepair: autorepairPack,
  freelancer: freelancerPack,
  childcare: childcarePack,
};

export function getPack(businessTypeId: string): CategoryPack {
  return categoryPacks[businessTypeId] ?? freelancerPack;
}
