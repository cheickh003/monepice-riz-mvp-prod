import { 
  ExecArgs, 
  RemoteQueryFunction,
} from "@medusajs/framework/types"

export default async function seedScript({ container }: ExecArgs) {
  const remoteQuery: RemoteQueryFunction = container.resolve("remoteQuery")
  
  console.log("🌱 Starting seed script for MonEpiceRiz...")

  // Create default region for Côte d'Ivoire
  const regionService = container.resolve("regionService")
  
  try {
    const regions = await remoteQuery({
      entryPoint: "region",
      fields: ["id", "name", "currency_code"],
    })

    if (regions.length === 0) {
      console.log("Creating default region for Côte d'Ivoire...")
      await regionService.create({
        name: "Côte d'Ivoire",
        currency_code: "XOF",
        countries: ["CI"],
      })
      console.log("✅ Default region created")
    } else {
      console.log("✅ Regions already exist")
    }

    // Create default store
    const storeService = container.resolve("storeService")
    const stores = await remoteQuery({
      entryPoint: "store",
      fields: ["id", "name"],
    })

    if (stores.length === 0) {
      console.log("Creating default store...")
      await storeService.create({
        name: "MonEpiceRiz",
        default_currency_code: "XOF",
      })
      console.log("✅ Default store created")
    } else {
      console.log("✅ Store already exists")
    }

    console.log("🎉 Seed script completed successfully!")
  } catch (error) {
    console.error("❌ Error in seed script:", error)
    throw error
  }
}