import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

/**
 * GoogleSearchConsoleSite - Stores verified sites from Google Search Console
 * 
 * Sites are associated with an organization and linked to the OAuth token
 * that has access to the site.
 */
export const GoogleSearchConsoleSite = sequelize.define(
  'GoogleSearchConsoleSites',
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
    // Reference to the OAuth token that has access to this site
    googleOAuthTokenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'GoogleOAuthTokens', key: 'id' }
    },
    // Site URL as returned by GSC API (e.g., "https://www.example.com/" or "sc-domain:example.com")
    siteUrl: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    // Site type: URL_PREFIX or DOMAIN
    siteType: {
      type: DataTypes.ENUM('URL_PREFIX', 'DOMAIN'),
      allowNull: true
    },
    // Permission level: siteOwner, siteFullUser, siteRestrictedUser, siteUnverifiedUser
    permissionLevel: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Whether this site is currently active for data syncing
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Last time data was synced for this site
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
    modelName: 'GoogleSearchConsoleSites', 
    timestamps: true,
    indexes: [
      {
        fields: ['organisationId', 'isActive']
      },
      {
        fields: ['organisationId', 'siteUrl'],
        unique: true
      },
      {
        fields: ['googleOAuthTokenId']
      }
    ]
  }
)

