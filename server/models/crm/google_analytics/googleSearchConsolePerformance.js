import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

/**
 * GoogleSearchConsolePerformance - Stores search analytics performance data from GSC
 * 
 * This model stores time-series data for search performance including:
 * - Queries (search terms)
 * - Pages (URLs)
 * - Impressions, clicks, CTR, position
 * - Date-based analytics for trend analysis
 */
export const GoogleSearchConsolePerformance = sequelize.define(
  'GoogleSearchConsolePerformance',
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
    // Reference to the site this data belongs to
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'GoogleSearchConsoleSites', key: 'id' }
    },
    // Date of the performance data
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Dimension type: 'query', 'page', 'country', 'device', 'aggregate'
    dimensionType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'aggregate'
    },
    // Dimension value (e.g., the query string, page URL, country code, device type)
    // NULL for aggregate data
    dimensionValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Number of times the site appeared in search results
    impressions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Number of clicks from search results to the site
    clicks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Click-through rate (clicks / impressions)
    ctr: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    // Average position in search results
    position: {
      type: DataTypes.DOUBLE,
      allowNull: true
    }
  },
  { 
    modelName: 'GoogleSearchConsolePerformance', 
    timestamps: true,
    indexes: [
      // Primary lookup: site + date range
      {
        fields: ['siteId', 'date']
      },
      // Organisation-level queries
      {
        fields: ['organisationId', 'date']
      },
      // Dimension queries (for top queries, top pages, etc.)
      {
        fields: ['siteId', 'dimensionType', 'date']
      },
      // Unique constraint to prevent duplicate data
      {
        fields: ['siteId', 'date', 'dimensionType', 'dimensionValue'],
        unique: true,
        where: { dimensionValue: { [sequelize.Sequelize.Op.ne]: null } }
      },
      // Aggregate data unique constraint
      {
        fields: ['siteId', 'date', 'dimensionType'],
        unique: true,
        where: { dimensionType: 'aggregate' }
      }
    ]
  }
)

