import { db } from "./client";
import { Allergen, Product } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    await db.delete(Product);
    await db.delete(Allergen);

    // Insert allergens
    const allergens = await db
      .insert(Allergen)
      .values([
        { name: "Milk" },
        { name: "Eggs" },
        { name: "Peanuts" },
        { name: "Tree Nuts" },
        { name: "Soy" },
        { name: "Wheat" },
        { name: "Fish" },
        { name: "Shellfish" },
        { name: "Sesame" },
      ])
      .returning();

    console.log(`✅ Inserted ${allergens.length} allergens`);

    // Insert sample products
    const products = await db
      .insert(Product)
      .values([
        {
          name: "Whole Milk",
          barcode: "1234567890123",
          allergenWarning: "Contains milk",
          riskLevel: "HIGH",
          ingredients: ["Milk", "Vitamin D3"],
          imageUrl: "https://example.com/milk.jpg",
          brand: "Dairy Farm",
        },
        {
          name: "Peanut Butter",
          barcode: "2345678901234",
          allergenWarning: "Contains peanuts, may contain tree nuts",
          riskLevel: "HIGH",
          ingredients: ["Peanuts", "Salt", "Sugar"],
          imageUrl: "https://example.com/peanut-butter.jpg",
          brand: "Nutty Co",
        },
        {
          name: "Wheat Bread",
          barcode: "3456789012345",
          allergenWarning: "Contains wheat, may contain eggs",
          riskLevel: "MEDIUM",
          ingredients: ["Wheat flour", "Water", "Yeast", "Salt"],
          imageUrl: "https://example.com/bread.jpg",
          brand: "Baker's Best",
        },
        {
          name: "Chocolate Chip Cookies",
          barcode: "4567890123456",
          allergenWarning: "Contains wheat, milk, eggs, may contain nuts",
          riskLevel: "HIGH",
          ingredients: [
            "Wheat flour",
            "Sugar",
            "Butter",
            "Eggs",
            "Chocolate chips",
          ],
          imageUrl: "https://example.com/cookies.jpg",
          brand: "Sweet Treats",
        },
        {
          name: "Rice Crackers",
          barcode: "5678901234567",
          allergenWarning: "Gluten-free",
          riskLevel: "LOW",
          ingredients: ["Rice", "Salt", "Sesame oil"],
          imageUrl: "https://example.com/rice-crackers.jpg",
          brand: "Healthy Snacks",
        },
        {
          name: "Salmon Fillet",
          barcode: "6789012345678",
          allergenWarning: "Contains fish",
          riskLevel: "MEDIUM",
          ingredients: ["Atlantic Salmon"],
          imageUrl: "https://example.com/salmon.jpg",
          brand: "Ocean Fresh",
        },
        {
          name: "Mixed Nuts",
          barcode: "7890123456789",
          allergenWarning: "Contains tree nuts, may contain peanuts",
          riskLevel: "HIGH",
          ingredients: ["Almonds", "Cashews", "Walnuts", "Pecans"],
          imageUrl: "https://example.com/mixed-nuts.jpg",
          brand: "Nut Mix Co",
        },
        {
          name: "Soy Sauce",
          barcode: "8901234567890",
          allergenWarning: "Contains soy, wheat",
          riskLevel: "MEDIUM",
          ingredients: ["Soybeans", "Wheat", "Salt", "Water"],
          imageUrl: "https://example.com/soy-sauce.jpg",
          brand: "Asian Kitchen",
        },
      ])
      .returning();

    console.log(`✅ Inserted ${products.length} products`);

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
