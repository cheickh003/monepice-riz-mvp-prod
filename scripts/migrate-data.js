#!/usr/bin/env node

/**
 * Script de migration des données existantes vers Medusa.js
 * Usage: node scripts/migrate-data.js [--dry-run] [--type=products|categories|all]
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');

// Configuration de base
const config = {
  medusaDbUrl: process.env.DATABASE_URL || 'postgres://medusa_user:medusa_password@localhost:5432/medusa_db',
  dataPath: path.join(__dirname, '../frontend/lib/data'),
  dryRun: process.argv.includes('--dry-run'),
  migrationType: process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all'
};

console.log('🚀 MonEpiceRiz Data Migration Script');
console.log('=====================================');
console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
console.log(`Type: ${config.migrationType}`);
console.log(`Data Path: ${config.dataPath}`);
console.log('');

class DataMigrator {
  constructor() {
    this.db = new Client({ connectionString: config.medusaDbUrl });
    this.migrationLog = [];
  }

  async connect() {
    try {
      await this.db.connect();
      console.log('✅ Connected to Medusa database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.db.end();
    console.log('✅ Disconnected from database');
  }

  async loadJsonData(filename) {
    try {
      const filePath = path.join(config.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Failed to load ${filename}:`, error.message);
      return null;
    }
  }

  async migrateCategories() {
    console.log('📂 Migrating Categories...');
    
    const categories = await this.loadJsonData('categories.json');
    if (!categories) return;

    let successCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      try {
        const categoryData = {
          id: `pcat_${category.id}`,
          name: category.name,
          handle: category.slug,
          description: category.description,
          is_active: true,
          is_internal: false,
          parent_category_id: null,
          metadata: {
            icon: category.icon,
            legacy_id: category.id,
            product_count: category.productCount
          }
        };

        if (!config.dryRun) {
          await this.db.query(`
            INSERT INTO product_category (id, name, handle, description, is_active, is_internal, parent_category_id, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              handle = EXCLUDED.handle,
              description = EXCLUDED.description,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          `, [
            categoryData.id,
            categoryData.name,
            categoryData.handle,
            categoryData.description,
            categoryData.is_active,
            categoryData.is_internal,
            categoryData.parent_category_id,
            JSON.stringify(categoryData.metadata)
          ]);
        }

        this.logMigration('category', category.id, categoryData.id, 'success');
        successCount++;
        console.log(`  ✅ ${category.name} (${category.slug})`);

      } catch (error) {
        this.logMigration('category', category.id, null, 'error', error.message);
        errorCount++;
        console.error(`  ❌ ${category.name}: ${error.message}`);
      }
    }

    console.log(`📂 Categories Migration: ${successCount} success, ${errorCount} errors\n`);
  }

  async migrateProducts() {
    console.log('📦 Migrating Products...');
    
    const products = await this.loadJsonData('products.json');
    if (!products) return;

    let successCount = 0;
    let errorCount = 0;

    // Créer une région par défaut pour la Guinée si elle n'existe pas
    if (!config.dryRun) {
      await this.ensureGuineeRegion();
    }

    for (const product of products) {
      try {
        const productId = `prod_${product.id}`;
        const variantId = `variant_${product.id}`;

        // 1. Insérer le produit principal
        const productData = {
          id: productId,
          title: product.name,
          subtitle: product.brand,
          description: product.description,
          handle: product.slug,
          is_giftcard: false,
          status: product.stock === 'out_of_stock' ? 'draft' : 'published',
          thumbnail: product.images?.[0] || null,
          weight: this.parseWeight(product.weight),
          length: null,
          height: null,
          width: null,
          hs_code: product.barcode,
          origin_country: 'gn',
          mid_code: null,
          material: null,
          metadata: {
            legacy_id: product.id,
            ref: product.ref,
            barcode: product.barcode,
            main_category: product.mainCategory,
            rating: product.rating,
            review_count: product.reviewCount,
            is_featured: product.isFeatured,
            is_promo: product.isPromo,
            promo_price: product.promoPrice,
            unit: product.unit,
            brand: product.brand
          }
        };

        if (!config.dryRun) {
          await this.db.query(`
            INSERT INTO product (id, title, subtitle, description, handle, is_giftcard, status, thumbnail, weight, length, height, width, hs_code, origin_country, mid_code, material, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              subtitle = EXCLUDED.subtitle,
              description = EXCLUDED.description,
              handle = EXCLUDED.handle,
              status = EXCLUDED.status,
              thumbnail = EXCLUDED.thumbnail,
              weight = EXCLUDED.weight,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          `, [
            productData.id, productData.title, productData.subtitle, productData.description,
            productData.handle, productData.is_giftcard, productData.status, productData.thumbnail,
            productData.weight, productData.length, productData.height, productData.width,
            productData.hs_code, productData.origin_country, productData.mid_code,
            productData.material, JSON.stringify(productData.metadata)
          ]);

          // 2. Insérer la variante du produit
          const variantData = {
            id: variantId,
            title: 'Default',
            product_id: productId,
            sku: product.ref,
            barcode: product.barcode,
            ean: null,
            upc: null,
            variant_rank: 0,
            inventory_quantity: this.getStockQuantity(product.stock),
            allow_backorder: false,
            manage_inventory: true,
            weight: this.parseWeight(product.weight),
            length: null,
            height: null,
            width: null,
            hs_code: product.barcode,
            origin_country: 'gn',
            mid_code: null,
            material: null,
            metadata: {
              legacy_id: product.id,
              stock_status: product.stock
            }
          };

          await this.db.query(`
            INSERT INTO product_variant (id, title, product_id, sku, barcode, ean, upc, variant_rank, inventory_quantity, allow_backorder, manage_inventory, weight, length, height, width, hs_code, origin_country, mid_code, material, metadata, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              sku = EXCLUDED.sku,
              barcode = EXCLUDED.barcode,
              inventory_quantity = EXCLUDED.inventory_quantity,
              weight = EXCLUDED.weight,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          `, [
            variantData.id, variantData.title, variantData.product_id, variantData.sku,
            variantData.barcode, variantData.ean, variantData.upc, variantData.variant_rank,
            variantData.inventory_quantity, variantData.allow_backorder, variantData.manage_inventory,
            variantData.weight, variantData.length, variantData.height, variantData.width,
            variantData.hs_code, variantData.origin_country, variantData.mid_code,
            variantData.material, JSON.stringify(variantData.metadata)
          ]);

          // 3. Insérer les prix (en GNF)
          await this.insertProductPrices(variantId, product);

          // 4. Associer à la catégorie si elle existe
          if (product.category) {
            await this.linkProductToCategory(productId, product.category);
          }

          // 5. Insérer les images
          await this.insertProductImages(productId, product.images || []);
        }

        this.logMigration('product', product.id, productId, 'success');
        successCount++;
        console.log(`  ✅ ${product.name} (${product.ref})`);

      } catch (error) {
        this.logMigration('product', product.id, null, 'error', error.message);
        errorCount++;
        console.error(`  ❌ ${product.name}: ${error.message}`);
      }
    }

    console.log(`📦 Products Migration: ${successCount} success, ${errorCount} errors\n`);
  }

  async ensureGuineeRegion() {
    const regionId = 'reg_guinea';
    
    try {
      // Vérifier si la région existe
      const regionCheck = await this.db.query('SELECT id FROM region WHERE id = $1', [regionId]);
      
      if (regionCheck.rows.length === 0) {
        // Créer la région Guinée
        await this.db.query(`
          INSERT INTO region (id, name, currency_code, tax_rate, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [regionId, 'Guinée', 'GNF', 0, JSON.stringify({ country_code: 'GN' })]);

        // Ajouter la Guinée comme pays dans cette région
        await this.db.query(`
          INSERT INTO country (iso_2, iso_3, num_code, name, display_name, region_id)
          VALUES ('GN', 'GIN', 324, 'GUINEA', 'Guinea', $1)
          ON CONFLICT (iso_2) DO UPDATE SET region_id = EXCLUDED.region_id
        `, [regionId]);

        console.log('✅ Created Guinea region and country');
      }
    } catch (error) {
      console.error('❌ Failed to ensure Guinea region:', error.message);
    }
  }

  async insertProductPrices(variantId, product) {
    const regionId = 'reg_guinea';
    
    // Prix normal
    await this.db.query(`
      INSERT INTO money_amount (currency_code, amount, variant_id, region_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (currency_code, variant_id, region_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        updated_at = NOW()
    `, ['GNF', Math.round(product.priceTTC * 100), variantId, regionId]);

    // Prix promo si disponible
    if (product.isPromo && product.promoPrice) {
      await this.db.query(`
        INSERT INTO money_amount (currency_code, amount, variant_id, region_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (currency_code, variant_id, region_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          updated_at = NOW()
      `, ['GNF', Math.round(product.promoPrice * 100), variantId, regionId]);
    }
  }

  async linkProductToCategory(productId, categorySlug) {
    try {
      const categoryResult = await this.db.query(
        'SELECT id FROM product_category WHERE handle = $1',
        [categorySlug]
      );

      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        
        await this.db.query(`
          INSERT INTO product_category_product (product_category_id, product_id)
          VALUES ($1, $2)
          ON CONFLICT (product_category_id, product_id) DO NOTHING
        `, [categoryId, productId]);
      }
    } catch (error) {
      console.error(`❌ Failed to link product ${productId} to category ${categorySlug}:`, error.message);
    }
  }

  async insertProductImages(productId, images) {
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      const imageId = `img_${productId}_${i}`;
      
      try {
        await this.db.query(`
          INSERT INTO image (id, url, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            url = EXCLUDED.url,
            updated_at = NOW()
        `, [imageId, imageUrl, JSON.stringify({ product_id: productId, rank: i })]);

        await this.db.query(`
          INSERT INTO product_images (product_id, image_id)
          VALUES ($1, $2)
          ON CONFLICT (product_id, image_id) DO NOTHING
        `, [productId, imageId]);

      } catch (error) {
        console.error(`❌ Failed to insert image ${imageUrl}:`, error.message);
      }
    }
  }

  parseWeight(weight) {
    if (!weight) return null;
    const parsed = parseFloat(weight.toString().replace(/[^\d.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  getStockQuantity(stockStatus) {
    switch (stockStatus) {
      case 'in_stock': return 100;
      case 'low_stock': return 10;
      case 'out_of_stock': return 0;
      default: return 0;
    }
  }

  logMigration(type, legacyId, medusaId, status, errorMessage = null) {
    this.migrationLog.push({
      type,
      legacy_id: legacyId,
      medusa_id: medusaId,
      status,
      error_message: errorMessage,
      migrated_at: new Date().toISOString()
    });
  }

  async saveMigrationLog() {
    const logPath = path.join(__dirname, `migration-log-${Date.now()}.json`);
    await fs.writeFile(logPath, JSON.stringify(this.migrationLog, null, 2));
    console.log(`📋 Migration log saved to: ${logPath}`);
  }

  async run() {
    try {
      await this.connect();

      if (config.migrationType === 'categories' || config.migrationType === 'all') {
        await this.migrateCategories();
      }

      if (config.migrationType === 'products' || config.migrationType === 'all') {
        await this.migrateProducts();
      }

      await this.saveMigrationLog();

      console.log('🎉 Migration completed successfully!');
      
      if (config.dryRun) {
        console.log('ℹ️  This was a dry run. No data was actually migrated.');
        console.log('   Remove --dry-run flag to perform the actual migration.');
      }

    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Exécuter la migration
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.run().catch(console.error);
}

module.exports = DataMigrator;