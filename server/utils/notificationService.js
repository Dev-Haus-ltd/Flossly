import sequelize from './db.js';
import { DataTypes } from 'sequelize';

const OrgNotificationEvent = sequelize.define(
  'OrgNotificationEvents',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    key: { type: DataTypes.STRING(128), allowNull: false },
    period: { type: DataTypes.STRING(7), allowNull: false },
  },
  { modelName: 'OrgNotificationEvents', timestamps: true }
);

const getCurrentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const createEventNotification = async (organisationId, userId, key, period = getCurrentPeriod()) => {
  try {
    const existing = await OrgNotificationEvent.findOne({ where: { organisationId, userId, key, period } });
    if (existing) return;
    await OrgNotificationEvent.create({ organisationId, userId, key, period });
  } catch (err) {
    console.error('createEventNotification error:', err?.message);
  }
};

export const getPendingEventNotifications = async (organisationId, userId, seenKeys = new Set()) => {
  try {
    const period = getCurrentPeriod();
    const rows = await OrgNotificationEvent.findAll({ where: { organisationId, userId, period }, raw: true });
    return new Set(rows.map((r) => r.key).filter((k) => !seenKeys.has(k)));
  } catch (err) {
    console.error('getPendingEventNotifications error:', err?.message);
    return new Set();
  }
};
