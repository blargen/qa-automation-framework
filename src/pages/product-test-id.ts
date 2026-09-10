export const productTestId = (productName: string): string =>
  productName.toLowerCase().replace(/\s+/g, '-')
