// Icon nguyên liệu: mỗi nguyên liệu một hình riêng (xem ingicons-data.js).
import { icon } from './icons.js';
import { ING_ICON_BY_ID } from './ingicons-data.js';
import { INGREDIENTS, INGREDIENT_GROUPS } from '../data/ingredients.js';

export function ingIconName(id) {
  return ING_ICON_BY_ID[id] || INGREDIENT_GROUPS[INGREDIENTS[id]?.group]?.icon || 'sparkle';
}
export const ingIcon = (id, size = 24, cls = '') => icon(ingIconName(id), size, cls);
