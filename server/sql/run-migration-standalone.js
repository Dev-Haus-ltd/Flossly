/**
 * Standalone Frequency ENUM Migration Runner
 * 
 * This script runs the migration to update frequency ENUM values.
 * Usage: node server/sql/run-migration-standalone.js
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

async function runMigration() {
  console.log('🔄 Starting Frequency ENUM Migration...\n');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // First transaction: Add ENUM values (must be committed before using them)
    const transaction1 = await sequelize.transaction();
    
    try {
      // Step 1: Check current ENUM values
      console.log('📊 Checking current ENUM values...');
      const [enumCheck] = await sequelize.query(`
        SELECT 
          t.typname AS enum_name,
          string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
        FROM 
          pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE 
          (t.typname LIKE '%frequency%' OR t.typname LIKE '%Frequency%')
          AND t.typname NOT LIKE '%_new%'
        GROUP BY 
          t.typname
        ORDER BY 
          t.typname;
      `, { transaction: transaction1 });
      
      console.log('Current ENUM types found:');
      if (enumCheck.length === 0) {
        console.log('  ⚠️  No ENUM types found. They might be created by Sequelize automatically.');
      } else {
        enumCheck.forEach(row => {
          console.log(`  - ${row.enum_name}: ${row.enum_values}`);
        });
      }
      console.log('');
      
      // Step 2: Add new ENUM values FIRST (before updating data)
      console.log('🔄 Step 1: Adding new ENUM values...');
      
      // Set search path to dev schema
      await sequelize.query('SET search_path TO dev', { transaction: transaction1 });
      
      // We know the exact ENUM type names from the check above
      const enumNames = ['enum_Tasks_defaultFrequency', 'enum_UserTasks_frequency'];
      const newValues = ['Biweekly', 'Quarterly', 'Yearly', 'Ad Hoc'];
      
      // Add new values to ENUM types
      for (const enumName of enumNames) {
        for (const value of newValues) {
          try {
            // Escape single quotes in value
            const escapedValue = value.replace(/'/g, "''");
            await sequelize.query(`
              DO $$ 
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_enum e
                  JOIN pg_type t ON t.oid = e.enumtypid
                  JOIN pg_namespace n ON n.oid = t.typnamespace
                  WHERE e.enumlabel = '${escapedValue}'
                  AND t.typname = '${enumName}'
                  AND n.nspname = 'dev'
                ) THEN
                  EXECUTE format('ALTER TYPE dev.%I ADD VALUE %L', '${enumName}', '${escapedValue}');
                END IF;
              END $$;
            `, { transaction: transaction1 });
            console.log(`  ✅ Added '${value}' to ${enumName}`);
          } catch (err) {
            if (err.message.includes('already exists')) {
              console.log(`  ℹ️  '${value}' already exists in ${enumName}`);
            } else {
              console.log(`  ⚠️  Error adding '${value}' to ${enumName}: ${err.message}`);
              throw err; // Stop on first real error
            }
          }
        }
      }
      
      // Commit ENUM additions first (PostgreSQL requirement)
      await transaction1.commit();
      console.log('');
      
      // Second transaction: Update existing data (now that ENUM values are committed)
      console.log('🔄 Step 2: Updating existing data...');
      const transaction2 = await sequelize.transaction();
      
      try {
        const [tasksResult] = await sequelize.query(`
          UPDATE "dev"."Tasks" 
          SET "defaultFrequency" = CASE 
            WHEN "defaultFrequency" = 'Fortnightly' THEN 'Biweekly'
            WHEN "defaultFrequency" = '6 Monthly' THEN 'Quarterly'
            WHEN "defaultFrequency" = 'Annualy' THEN 'Yearly'
            WHEN "defaultFrequency" = 'Every 24 Months' THEN 'Yearly'
            ELSE "defaultFrequency"
          END
          WHERE "defaultFrequency" IN ('Fortnightly', '6 Monthly', 'Annualy', 'Every 24 Months');
        `, { transaction: transaction2 });
        
        const [userTasksResult] = await sequelize.query(`
          UPDATE "dev"."UserTasks" 
          SET frequency = CASE 
            WHEN frequency = 'Fortnightly' THEN 'Biweekly'
            WHEN frequency = '6 Monthly' THEN 'Quarterly'
            WHEN frequency = 'Annualy' THEN 'Yearly'
            WHEN frequency = 'Every 24 Months' THEN 'Yearly'
            ELSE frequency
          END
          WHERE frequency IN ('Fortnightly', '6 Monthly', 'Annualy', 'Every 24 Months');
        `, { transaction: transaction2 });
        
        console.log(`  ✅ Updated ${tasksResult[1] || 0} rows in Tasks table`);
        console.log(`  ✅ Updated ${userTasksResult[1] || 0} rows in UserTasks table\n`);
        
        // Commit data updates
        await transaction2.commit();
      
      // Verify
      console.log('📊 Verifying migration...');
      const [verify] = await sequelize.query(`
        SELECT 
          t.typname AS enum_name,
          string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
        FROM 
          pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE 
          (t.typname LIKE '%frequency%' OR t.typname LIKE '%Frequency%')
          AND t.typname NOT LIKE '%_new%'
        GROUP BY 
          t.typname
        ORDER BY 
          t.typname;
      `);
      
      if (verify.length > 0) {
        console.log('\nFinal ENUM values:');
        verify.forEach(row => {
          console.log(`  - ${row.enum_name}: ${row.enum_values}`);
        });
      }
      
      console.log('\n✅ Migration completed successfully!');
      console.log('\n🎉 Database now supports: Daily, Weekly, Biweekly, Monthly, Quarterly, Yearly, Ad Hoc');
      console.log('\n💡 You can now create tasks with "Quarterly", "Biweekly", "Yearly", and "Ad Hoc" frequencies!');
      
      } catch (error) {
        await transaction2.rollback();
        throw error;
      }
      
    } catch (error) {
      await transaction1.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run migration
runMigration();

