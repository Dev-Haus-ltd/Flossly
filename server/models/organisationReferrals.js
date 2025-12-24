import { DataTypes } from "sequelize";
import sequelize  from "../utils/db";
export const OrganisationReferral = sequelize.define(
  "OrganisationReferrals",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orgName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    orgEmail: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    managerName: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    referredBy: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        },
        allowNull: false,
    },
    isAccountCreated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
  },
  {
    modelName: "OrganisationReferrals",
    timestamps: true,
  }
);
