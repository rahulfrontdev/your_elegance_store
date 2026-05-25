/**
 * Static product catalog for development.
 * Replace imports of `PRODUCTS` / helpers with API + React Query (or your Redux thunks) when the backend is ready.
 */
export const PRODUCTS = [
  {
    id: '1',
    name: 'Diamond Solitaire Ring',
    description:
      'Elegant solitaire diamond ring crafted in white gold, perfect for engagements and special occasions.',
    price: 74999,
    category: 'Rings',
    brand: 'Tanishq',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=60',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '2',
    name: 'Gold Floral Ring',
    description:
      'Beautiful floral design gold ring for daily wear with a modern yet traditional touch.',
    price: 25999,
    category: 'Rings',
    brand: 'Malabar Gold',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '3',
    name: 'Luxury Leather Handbag',
    description:
      'Premium leather handbag with spacious compartments, ideal for office and casual outings.',
    price: 4999,
    category: 'Bags',
    brand: 'Lavie',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '4',
    name: 'Designer Sling Bag',
    description:
      'Trendy sling bag with stylish design, perfect for parties and travel.',
    price: 2499,
    category: 'Bags',
    brand: 'Caprese',
    image: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '5',
    name: 'Heart Pendant Necklace',
    description:
      'Charming heart-shaped pendant with a delicate chain, perfect gift for loved ones.',
    price: 3999,
    category: 'Pendants',
    brand: 'CaratLane',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1588444650733-d4a48c37d66b?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '6',
    name: 'Diamond Pendant Set',
    description:
      'Premium diamond pendant set with matching chain for weddings and special occasions.',
    price: 55999,
    category: 'Pendants',
    brand: 'Kalyan Jewellers',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '7',
    name: 'Minimal Gold Ring',
    description:
      'Simple and elegant gold ring suitable for everyday wear with a classy finish.',
    price: 14999,
    category: 'Rings',
    brand: 'Tanishq',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1588444650733-d4a48c37d66b?auto=format&fit=crop&w=800&q=60',
    ],
  },
  {
    id: '8',
    name: 'Stylish Tote Bag',
    description:
      'Large capacity tote bag with modern design, perfect for shopping and daily use.',
    price: 1999,
    category: 'Bags',
    brand: 'Baggit',
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=60',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60',
    ],
  },
];

/** @param {string | undefined} productId */
export function getProductById(productId) {
  if (productId == null || productId === '') return null
  return PRODUCTS.find((p) => String(p.id) === String(productId)) ?? null
}

export function getProductCategoryOptions() {
  const categories = [...new Set(PRODUCTS.map((p) => p.category))]
  categories.sort((a, b) => a.localeCompare(b))
  return ['All', ...categories]
}

export function getPriceBounds(products = PRODUCTS) {
  if (products.length === 0) return { min: 0, max: 0 }
  const prices = products.map((p) => p.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
