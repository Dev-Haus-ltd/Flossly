import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

/**
 * GoogleBusinessProfile - Stores Google Business Profile locations
 * 
 * This is a placeholder model for future Google Business Profile analytics.
 * It stores the basic profile/location information linked to an OAuth token.
 */
export const GoogleBusinessProfile = sequelize.define(
  'GoogleBusinessProfiles',
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    organisationId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Organisations', key: 'id' } 
    },
    // Reference to the OAuth token that has access to this profile
    googleOAuthTokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'GoogleOAuthTokens', key: 'id' }
    },
    // Google Business Profile location name/ID (e.g., "accounts/{accountId}/locations/{locationId}")
    locationName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // Human-readable business name
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Business address (stored as JSON for flexibility)
    address: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // Primary phone number
    primaryPhone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Website URL
    websiteUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // Whether this profile is currently active for data syncing
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Last time data was synced for this profile
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Any error message from last sync attempt
    lastSyncError: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  { 
    modelName: 'GoogleBusinessProfiles', 
    timestamps: true,
    indexes: [
      {
        fields: ['organisationId', 'isActive']
      },
      {
        fields: ['organisationId', 'locationName'],
        unique: true
      },
      {
        fields: ['googleOAuthTokenId']
      }
    ]
  }
)

