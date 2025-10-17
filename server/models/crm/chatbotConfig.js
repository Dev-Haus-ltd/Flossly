import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const ChatbotConfig = sequelize.define(
  'ChatbotConfigs',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Organisations', key: 'id' } 
    },
    managerId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: 'Users', key: 'id' } 
    },
    messages: { 
      type: DataTypes.JSONB, 
      allowNull: true,
      defaultValue: []
    },
    prompt: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    color: { 
      type: DataTypes.STRING(50), 
      allowNull: true,
      defaultValue: '#007bff'
    },
    avatar: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    welcomeMessage: { 
      type: DataTypes.TEXT, 
      allowNull: true,
      defaultValue: 'Hello! How can I help you today?'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  { 
    modelName: 'ChatbotConfigs', 
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['organisationId']
      }
    ]
  }
)
