import { Sequelize } from 'sequelize'

const config = useRuntimeConfig()

const dbConfig = {
  name: config.DB_NAME ?? process.env.DB_NAME,
  user: config.DB_USER ?? process.env.DB_USER,
  password: config.DB_PASSWORD ?? process.env.DB_PASSWORD,
  host: config.DB_HOST ?? process.env.DB_HOST,
  port: Number(config.DB_PORT ?? process.env.DB_PORT),
  schema: config.DB_SCHEMA ?? process.env.DB_SCHEMA,
  url: config.DATABASE_URL ?? process.env.DATABASE_URL,
}
if (!dbConfig.url) {
  const required = ['name', 'user', 'password', 'host', 'port']
  const missing = required.filter(k => !dbConfig[k])

  if (missing.length) {
    throw new Error(
      `Missing DB config: ${missing.join(', ')}`
    )
  }
}
const sequelize = dbConfig.url
  ? new Sequelize(dbConfig.url, {
      schema: dbConfig.schema,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      define: {
        timestamps: false,
      },
    })
  : new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
      host: dbConfig.host,
      port: dbConfig.port,
      schema: dbConfig.schema,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      define: {
        timestamps: false,
      },
    })

export default sequelize
