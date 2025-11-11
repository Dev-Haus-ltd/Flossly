/**
 * Create OrganisationScripts Table
 * 
 * This script creates the OrganisationScripts table if it doesn't exist.
 * Usage: node server/sql/create-organisation-scripts-table.js
 */

import { Sequelize } from 'sequelize';

// Database connection (matches server/utils/db.js)
const sequelize = new Sequelize('flossly', 'neondb_owner', 'npg_hlVU5KX3Lmbs', {
  host: 'ep-plain-shape-abembemo-pooler.eu-west-2.aws.neon.tech',
  port: 5432,
  schema: 'dev',
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
  define: {
    timestamps: false,
  }
});

async function createTable() {
  console.log('🔄 Creating OrganisationScripts table...\n');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Set search path to dev schema
    await sequelize.query('SET search_path TO dev');
    
    // Create table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "OrganisationScripts" (
        id SERIAL PRIMARY KEY,
        "organisationId" INTEGER NOT NULL,
        "scriptKey" VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "OrganisationScripts_organisationId_scriptKey_key" UNIQUE ("organisationId", "scriptKey"),
        CONSTRAINT "OrganisationScripts_organisationId_fkey" FOREIGN KEY ("organisationId")
          REFERENCES "Organisations"(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "OrganisationScripts_organisationId_idx" 
        ON "OrganisationScripts"("organisationId");
    `);
    
    console.log('✅ OrganisationScripts table created successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Failed to create table:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run
createTable();

