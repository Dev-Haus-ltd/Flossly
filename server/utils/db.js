import { Sequelize } from 'sequelize'

const config = useRuntimeConfig()
const {
  DATABASE_URL,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_SCHEMA,
} = config

const baseOptions = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
    keepAlive: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 15000, // fail in 15s, not 60s (prevents nginx gateway timeout)
    idle: 10000,
    evict: 5000,   // check for dead connections every 5s
  },
  define: {
    timestamps: false,
    ...(DB_SCHEMA ? { schema: DB_SCHEMA } : {}),
  },
}

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, baseOptions)
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      ...baseOptions,
      host: DB_HOST,
      port: DB_PORT ? Number(DB_PORT) : undefined,
    })

export default sequelize
