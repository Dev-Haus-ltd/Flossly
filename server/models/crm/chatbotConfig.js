import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const ChatbotConfig = sequelize.define(
  'ChatbotConfigs',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    botId: { 
      type: DataTypes.UUID, 
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Users', key: 'id' } 
    },
    organizationId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Organisations', key: 'id' } 
    },
    name: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    companyName: { 
      type: DataTypes.STRING(255), 
      allowNull: true 
    },
    avatar: { 
      type: DataTypes.JSONB, 
      allowNull: true 
    },
    openingMessages: { 
      type: DataTypes.JSONB, 
      allowNull: true,
      defaultValue: []
    },
    appointmentGreeting: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    privacyPolicyUrl: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    companyOwnerEmail: { 
      type: DataTypes.STRING(255), 
      allowNull: true 
    },
    companyPhone: { 
      type: DataTypes.STRING(50), 
      allowNull: true 
    },
    companyWebsite: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    webhookUrl: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    gmailBrochureUrl: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    gmailCallbackUrl: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    themeColor: { 
      type: DataTypes.STRING(50), 
      allowNull: true,
      defaultValue: '#3B82F6'
    },
    position: { 
      type: DataTypes.STRING(20), 
      allowNull: true,
      defaultValue: 'right'
    },
    sideSpacing: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      defaultValue: 25
    },
    bottomSpacing: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      defaultValue: 25
    },
    showDesktop: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false,
      defaultValue: true
    },
    showMobile: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false,
      defaultValue: true
    },
    googleCalendarConnected: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false,
      defaultValue: false
    },
    calendarStatus: { 
      type: DataTypes.STRING(50), 
      allowNull: true 
    },
    appointmentFlow: { 
      type: DataTypes.JSONB, 
      allowNull: true 
    },
    treatmentFlow: { 
      type: DataTypes.JSONB, 
      allowNull: true 
    },
    callbackFlow: { 
      type: DataTypes.JSONB, 
      allowNull: true 
    }
  },
  { 
    modelName: 'ChatbotConfigs', 
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['organizationId']
      },
      {
        unique: true,
        fields: ['botId']
      }
    ]
  }
)
