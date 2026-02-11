import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const WhapiChannelConfig = sequelize.define(
  "WhapiChannelConfigs",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Organisations", key: "id" },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Users", key: "id" },
    },
    channelId: { type: DataTypes.STRING(64), allowNull: false },
    tokenEnc: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "Active" },
    displayName: { type: DataTypes.STRING(150), allowNull: true },
    phoneNumber: { type: DataTypes.STRING(32), allowNull: true },
    connectedAt: { type: DataTypes.DATE, allowNull: true },
    lastQrAt: { type: DataTypes.DATE, allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    webhookUrl: { type: DataTypes.TEXT, allowNull: true },
  },
  { modelName: "WhapiChannelConfigs", timestamps: true }
);
