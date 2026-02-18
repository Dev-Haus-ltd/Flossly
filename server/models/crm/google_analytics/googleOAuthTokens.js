import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

/**
 * GoogleOAuthToken - Stores OAuth tokens for Google services (GSC & Business Profile)
 * 
 * Flexible multi-account support:
 * - Users may have different Google accounts for GSC vs. Google Business Profile
 * - Tokens can have both scopes (single account) or separate tokens for each service
 * - Multiple token sets are allowed per organization
 * - The 'scopes' field tracks which scopes were actually granted
 */
export const GoogleOAuthToken = sequelize.define(
  'GoogleOAuthTokens',
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
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Users', key: 'id' } 
    },
    // Google account identifier (email) to distinguish between different accounts
    googleAccountEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Google account ID (sub claim from ID token)
    googleAccountId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // Encrypted access token
    accessTokenEnc: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    // Encrypted refresh token
    refreshTokenEnc: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    // Array of scopes that were actually granted during OAuth
    // Stored as JSON array: ["https://www.googleapis.com/auth/webmasters.readonly", ...]
    scopes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    // Token expiration timestamp
    expiresAt: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    // Token status
    status: {
      type: DataTypes.ENUM('Active', 'Revoked', 'Expired'),
      allowNull: false,
      defaultValue: 'Active'
    },
    // Last time token was successfully used
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Timestamp when connection was established
    connectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  { 
    modelName: 'GoogleOAuthTokens', 
    timestamps: true,
    indexes: [
      {
        fields: ['organisationId', 'status']
      },
      {
        fields: ['organisationId', 'googleAccountId'],
        unique: true,
        where: { status: 'Active' }
      }
    ]
  }
)

// Helper constants for Google OAuth scopes
export const GOOGLE_SCOPES = {
  SEARCH_CONSOLE: 'https://www.googleapis.com/auth/webmasters.readonly',
  BUSINESS_PROFILE: 'https://www.googleapis.com/auth/business.manage'
}

// Check if token has a specific scope
GoogleOAuthToken.prototype.hasScope = function(scope) {
  return Array.isArray(this.scopes) && this.scopes.includes(scope)
}

// Check if token has GSC scope
GoogleOAuthToken.prototype.hasSearchConsoleScope = function() {
  return this.hasScope(GOOGLE_SCOPES.SEARCH_CONSOLE)
}

// Check if token has Business Profile scope
GoogleOAuthToken.prototype.hasBusinessProfileScope = function() {
  return this.hasScope(GOOGLE_SCOPES.BUSINESS_PROFILE)
}

