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

const shouldLogSql =
  String(process.env.SEQUELIZE_LOG_SQL || '').toLowerCase() === 'true'

const sqlLogger = shouldLogSql
  ? (message) => console.log(message)
  : false

const baseOptions = {
  dialect: 'postgres',
  logging: sqlLogger,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
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
