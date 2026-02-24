import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const CrmDmAccount = sequelize.define(
  "CrmDmAccounts",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Organisations", key: "id" },
    },
    connectedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
    },
    platform: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    accountId: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    accountName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    accessTokenEnc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Active",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    modelName: "CrmDmAccounts",
    timestamps: true,
    indexes: [
      { fields: ["organisationId", "platform"] },
      { unique: true, fields: ["organisationId", "platform", "accountId"] },
    ],
  }
);
