
export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
}


export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export function validateProduct(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const name = values.name.trim();
  if (name.length < 2 || name.length > 150) {
    errors.name = "Name must be between 2 and 150 characters.";
  }
  const description = values.description.trim();
  if (description.length < 5 || description.length > 5000) {
    errors.description = "Description must be between 5 and 5000 characters.";
  }


  const category = values.category.trim();
  if (category.length < 2 || category.length > 50) {
    errors.category = "Category must be between 2 and 50 characters.";
  }

  const price = Number(values.price);
  if (values.price.trim() === "" || Number.isNaN(price) || price <= 0 || price > 1000000) {
    errors.price = "Price must be more than 0 and at most 1,000,000.";
  }
  const stock = Number(values.stock);
  if (values.stock.trim() === "" || !Number.isInteger(stock) || stock < 0 || stock > 1000000) {
    errors.stock = "Stock must be a whole number, 0 or more.";
  }

  const imageUrl = values.imageUrl.trim();
  if (imageUrl !== "") {
    try {
      new URL(imageUrl);
    } catch {
      errors.imageUrl = "Image URL must be a valid link.";  
    }
  }

  return errors;
}
