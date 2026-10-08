import { UtensilsCrossed, ShoppingCart, Scissors, Flower2, Hammer, Cookie, MapPin } from 'lucide-react';

export const CATEGORY_STYLES = {
  restaurants: { icon: UtensilsCrossed, bg: 'bg-orange-50', text: 'text-orange-600' },
  grocery: { icon: ShoppingCart, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  barbers: { icon: Scissors, bg: 'bg-sky-50', text: 'text-sky-600' },
  florists: { icon: Flower2, bg: 'bg-rose-50', text: 'text-rose-600' },
  hardware: { icon: Hammer, bg: 'bg-amber-50', text: 'text-amber-600' },
  bakeries: { icon: Cookie, bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

export const getCategoryStyle = (slug) =>
  CATEGORY_STYLES[slug] || { icon: MapPin, bg: 'bg-gray-50', text: 'text-gray-500' };