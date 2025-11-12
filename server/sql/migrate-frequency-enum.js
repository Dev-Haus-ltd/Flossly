/**
 * Migration script to update frequency ENUM values
 * - Biweekly -> Fortnightly
 * - Quarterly -> 6 Monthly
 * - Ad Hoc -> null (removed)
 * 
 * Run with: node server/sql/migrate-frequency-enum.js
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

async function migrateFrequencyEnum() {
  console.log('🔄 Starting Frequency ENUM Migration...\n');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    // Step 1: Update existing data
    console.log('📝 Step 1: Updating existing frequency values...');
    
    // Update Tasks table (with schema prefix)
    const [tasksResult] = await sequelize.query(`
      UPDATE "dev"."Tasks" 
      SET "defaultFrequency" = CASE 
        WHEN "defaultFrequency" = 'Biweekly' THEN 'Fortnightly'
        WHEN "defaultFrequency" = 'Quarterly' THEN '6 Monthly'
        WHEN "defaultFrequency" = 'Ad Hoc' THEN NULL
        ELSE "defaultFrequency"
      END
      WHERE "defaultFrequency" IN ('Biweekly', 'Quarterly', 'Ad Hoc');
    `, { transaction });
    
    console.log(`  ✅ Updated ${tasksResult[1] || 0} rows in Tasks table`);
    
    // Update UserTasks table (with schema prefix)
    const [userTasksResult] = await sequelize.query(`
      UPDATE "dev"."UserTasks" 
      SET frequency = CASE 
        WHEN frequency = 'Biweekly' THEN 'Fortnightly'
        WHEN frequency = 'Quarterly' THEN '6 Monthly'
        WHEN frequency = 'Ad Hoc' THEN NULL
        ELSE frequency
      END
      WHERE frequency IN ('Biweekly', 'Quarterly', 'Ad Hoc');
    `, { transaction });
    
    console.log(`  ✅ Updated ${userTasksResult[1] || 0} rows in UserTasks table\n`);
    
    // Commit data updates
    await transaction.commit();
    
    // Step 2: Alter ENUM types (requires new transaction)
    console.log('🔧 Step 2: Altering ENUM types...');
    const alterTransaction = await sequelize.transaction();
    
    try {
      // Get the schema name (default to 'public' or from config)
      const schema = process.env.DB_SCHEMA || 'public';
      
      // Find and update Tasks ENUM
      const [tasksEnum] = await sequelize.query(`
        SELECT t.typname 
        FROM pg_type t 
        JOIN pg_namespace n ON t.typnamespace = n.oid 
        WHERE t.typname LIKE '%defaultFrequency%' 
        OR (t.typname LIKE '%frequency%' AND n.nspname = '${schema}')
        LIMIT 1;
      `);
      
      // Create new ENUM type for Tasks
      await sequelize.query(`
        DO $$ 
        BEGIN
          -- Create new ENUM type
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_enum_new') THEN
            CREATE TYPE frequency_enum_new AS ENUM (
              'Daily', 'Weekly', 'Fortnightly', 'Monthly', '6 Monthly', 'Yearly'
            );
          END IF;
        END $$;
      `, { transaction: alterTransaction });
      
      // Alter Tasks table to use new ENUM
      await sequelize.query(`
        DO $$ 
        BEGIN
          -- Alter Tasks table
          ALTER TABLE "dev"."Tasks" 
          ALTER COLUMN "defaultFrequency" TYPE frequency_enum_new 
          USING "defaultFrequency"::text::frequency_enum_new;
          
          -- Drop old type and rename new one
          DROP TYPE IF EXISTS "dev"."Tasks_defaultFrequency_enum" CASCADE;
          ALTER TYPE frequency_enum_new RENAME TO "Tasks_defaultFrequency_enum";
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Error altering Tasks table: %', SQLERRM;
        END $$;
      `, { transaction: alterTransaction });
      
      // Create new ENUM type for UserTasks
      await sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_frequency_enum_new') THEN
            CREATE TYPE user_frequency_enum_new AS ENUM (
              'Daily', 'Weekly', 'Fortnightly', 'Monthly', '6 Monthly', 'Yearly'
            );
          END IF;
        END $$;
      `, { transaction: alterTransaction });
      
      // Alter UserTasks table to use new ENUM
      await sequelize.query(`
        DO $$ 
        BEGIN
          -- Alter UserTasks table
          ALTER TABLE "dev"."UserTasks" 
          ALTER COLUMN frequency TYPE user_frequency_enum_new 
          USING frequency::text::user_frequency_enum_new;
          
          -- Drop old type and rename new one
          DROP TYPE IF EXISTS "dev"."UserTasks_frequency_enum" CASCADE;
          ALTER TYPE user_frequency_enum_new RENAME TO "UserTasks_frequency_enum";
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Error altering UserTasks table: %', SQLERRM;
        END $$;
      `, { transaction: alterTransaction });
      
      await alterTransaction.commit();
      console.log('  ✅ ENUM types updated successfully\n');
      
    } catch (alterError) {
      await alterTransaction.rollback();
      console.error('  ⚠️  Error altering ENUM types:', alterError.message);
      console.log('  💡 You may need to manually alter the ENUM types in your database.\n');
    }
    
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
      GROUP BY 
        t.typname
      ORDER BY 
        t.typname;
    `);
    
    if (verify.length > 0) {
      console.log('\nFinal ENUM values:');
      verify.forEach((row) => {
        console.log(`  ${row.enum_name}: ${row.enum_values}`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Biweekly → Fortnightly');
    console.log('  - Quarterly → 6 Monthly');
    console.log('  - Ad Hoc → NULL (removed)');
    console.log('\n💡 Note: If ENUM alteration failed, you may need to run it manually in your database.');
    
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrateFrequencyEnum()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });

