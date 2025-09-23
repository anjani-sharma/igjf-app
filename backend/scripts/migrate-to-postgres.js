// Migration script to transfer data from SQLite to PostgreSQL
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Set this to true to actually perform the migration
// Otherwise, it will just do a dry run
const PERFORM_MIGRATION = false;

// Source SQLite database
const sourceDb = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

// Target PostgreSQL database (from environment variable)
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const targetDb = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Define models for both databases (simplified versions)
const defineModels = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    memberId: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, { tableName: 'Users' });

  // Add other models as needed
  
  return { User };
};

const migrateData = async () => {
  try {
    // Test connections
    await sourceDb.authenticate();
    console.log('Connected to SQLite database');
    
    await targetDb.authenticate();
    console.log('Connected to PostgreSQL database');

    // Define models for both databases
    const sourceModels = defineModels(sourceDb);
    const targetModels = defineModels(targetDb);

    // Sync target database (don't force)
    if (PERFORM_MIGRATION) {
      await targetDb.sync();
      console.log('Target database synced');
    } else {
      console.log('DRY RUN: Would sync target database');
    }

    // Migrate Users
    const users = await sourceModels.User.findAll();
    console.log(`Found ${users.length} users to migrate`);

    if (PERFORM_MIGRATION) {
      for (const user of users) {
        await targetModels.User.create(user.toJSON());
      }
      console.log(`Migrated ${users.length} users successfully`);
    } else {
      console.log(`DRY RUN: Would migrate ${users.length} users`);
    }

    // Add other model migrations as needed

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sourceDb.close();
    await targetDb.close();
  }
};

// Run the migration
migrateData();