import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

/**
 * GoogleSearchConsoleSitePages - Stores individual page URLs discovered under a GSC site
 * 
 * This model stores all pages/URLs that exist under a verified GSC site.
 * Multiple organizations can connect the same Google account and select the same site,
 * so organisationId is included to ensure proper data isolation between workspaces.
 * 
 * Designed to support:
 * - Periodic cron jobs to fetch new pages as the site grows
 * - Tracking page discovery and activity status
 * - Efficient queries for analytics fetching
 */
export const GoogleSearchConsoleSitePage = sequelize.define(
  'GoogleSearchConsoleSitePages',
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    // Organisation ID for data isolation between workspaces
    organisationId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Organisations', key: 'id' } 
    },
    // Reference to the parent GSC site
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'GoogleSearchConsoleSites', key: 'id' }
    },
    // Full URL of the page (e.g., "https://example.com/about")
    pageUrl: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Timestamp when this page was last discovered/fetched from GSC API
    lastFetchedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Whether this page is still active/exists
    // Can be set to false if page is no longer returned by GSC API
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Last time analytics were synced for this specific page
    lastAnalyticsSyncAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Any error message from last analytics sync attempt
    lastSyncError: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  { 
    modelName: 'GoogleSearchConsoleSitePages', 
    timestamps: true,
    indexes: [
      // Unique constraint to prevent duplicate pages per org/site
      {
        fields: ['organisationId', 'siteId', 'pageUrl'],
        unique: true
      },
      // Efficient queries for active pages under a site
      {
        fields: ['siteId', 'isActive']
      },
      // Organisation-level queries
      {
        fields: ['organisationId']
      },
      // For cron jobs to find pages needing analytics refresh
      {
        fields: ['siteId', 'isActive', 'lastAnalyticsSyncAt']
      }
    ]
  }
)

