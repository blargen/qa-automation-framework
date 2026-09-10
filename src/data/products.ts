export const PRODUCTS = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  fleeceJacket: 'Sauce Labs Fleece Jacket',
  onesie: 'Sauce Labs Onesie',
  redTShirt: 'Test.allTheThings() T-Shirt (Red)',
} as const

export type ProductName = (typeof PRODUCTS)[keyof typeof PRODUCTS]

export const CATALOGUE_PRICES: Record<ProductName, number> = {
  [PRODUCTS.backpack]: 29.99,
  [PRODUCTS.bikeLight]: 9.99,
  [PRODUCTS.boltTShirt]: 15.99,
  [PRODUCTS.fleeceJacket]: 49.99,
  [PRODUCTS.onesie]: 7.99,
  [PRODUCTS.redTShirt]: 15.99,
}

export const TAX_RATE = 0.08
