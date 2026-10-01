import { db } from './db';
import { catalog } from './catalog';

export async function getStoreCatalog() {
  try {
    const categories = await db.storeCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { products: { where: { active: true }, orderBy: { sortOrder: 'asc' }, include: { packages: { where: { active: true }, orderBy: { sortOrder: 'asc' } } } } },
    });
    if (categories.length) return categories;
  } catch {}
  return [
    { id: 'fallback-instagram', slug: 'instagram', name: 'Instagram', description: catalog.instagram.description, imageUrl: catalog.instagram.image, active: true, products: catalog.instagram.products },
    { id: 'fallback-free-fire', slug: 'free-fire', name: 'Free Fire', description: catalog.freeFire.description, imageUrl: catalog.freeFire.image, active: true, products: catalog.freeFire.products },
  ];
}
