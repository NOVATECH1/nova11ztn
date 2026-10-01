export type CatalogPackage = {
  id: string;
  name: string;
  detail: string;
  reward?: string;
  price: number;
  image: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  fieldLabel: string;
  packages: CatalogPackage[];
};

export const catalog = {
  instagram: {
    name: 'Instagram',
    image: '/media/instagram.svg',
    description: 'Followers and Likes',
    products: [
      {
        id: 'ig-followers', slug: 'followers', name: 'Instagram Followers',
        description: 'Choose the follower package you need, then enter the target username.',
        image: '/media/instagram-followers.svg', fieldLabel: 'Instagram username',
        packages: [
          { id: 'igf-100', name: '100 Followers', detail: 'Starter package', price: 50, image: '/media/instagram-followers.svg' },
          { id: 'igf-500', name: '500 Followers', detail: 'Growth package', price: 200, image: '/media/instagram-followers.svg' },
          { id: 'igf-1000', name: '1,000 Followers', detail: 'Large package', price: 350, image: '/media/instagram-followers.svg' },
        ],
      },
      {
        id: 'ig-likes', slug: 'likes', name: 'Instagram Likes',
        description: 'Choose the likes package, then provide the public Instagram post link.',
        image: '/media/instagram-likes.svg', fieldLabel: 'Instagram post link',
        packages: [
          { id: 'igl-100', name: '100 Likes', detail: 'Starter package', price: 30, image: '/media/instagram-likes.svg' },
          { id: 'igl-500', name: '500 Likes', detail: 'Growth package', price: 100, image: '/media/instagram-likes.svg' },
          { id: 'igl-1000', name: '1,000 Likes', detail: 'Large package', price: 180, image: '/media/instagram-likes.svg' },
        ],
      },
    ],
  },
  freeFire: {
    name: 'Free Fire',
    image: '/media/free-fire.svg',
    description: 'Top Up, Membership and Booyah Pass',
    products: [
      {
        id: 'ff-topup', slug: 'top-up', name: 'Free Fire Top Up',
        description: 'Choose a diamond package and provide the player UID.',
        image: '/media/free-fire-topup.svg', fieldLabel: 'Free Fire Player UID',
        packages: [
          { id: 'fft-100', name: '100 Diamonds', detail: 'Diamond package', price: 220, reward: '100 diamonds', image: '/media/free-fire-topup.svg' },
          { id: 'fft-210', name: '210 Diamonds', detail: 'Diamond package', price: 440, reward: '210 diamonds', image: '/media/free-fire-topup.svg' },
          { id: 'fft-530', name: '530 Diamonds', detail: 'Diamond package', price: 1050, reward: '530 diamonds', image: '/media/free-fire-topup.svg' },
        ],
      },
      {
        id: 'ff-membership', slug: 'membership', name: 'Free Fire Membership',
        description: 'Choose the membership package and provide the player UID.',
        image: '/media/free-fire-membership.svg', fieldLabel: 'Free Fire Player UID',
        packages: [
          { id: 'ffm-weekly', name: 'Weekly Membership', detail: '7 days', price: 100, image: '/media/free-fire-membership.svg' },
          { id: 'ffm-monthly', name: 'Monthly Membership', detail: '30 days', price: 300, image: '/media/free-fire-membership.svg' },
        ],
      },
    ],
  },
};

export function allProducts(): CatalogProduct[] {
  return [...catalog.instagram.products, ...catalog.freeFire.products];
}

export function productBySlug(category: string, product: string) {
  const group = category === 'instagram' ? catalog.instagram : catalog.freeFire;
  return group.products.find((p) => p.slug === product) || null;
}
