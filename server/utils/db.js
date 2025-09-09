import { Sequelize } from 'sequelize'
const config = useRuntimeConfig()
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    schema: 'dev',
    dialect: 'postgres', 
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false, 
          },
      },
  define: {
    timestamps: false, 
  }
});

export default sequelize