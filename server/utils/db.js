import { Sequelize } from 'sequelize'
const config = useRuntimeConfig()
const sequelize = new Sequelize('flossly', 'neondb_owner', 'npg_hlVU5KX3Lmbs', {
    host: 'ep-plain-shape-abembemo-pooler.eu-west-2.aws.neon.tech',
    port: 5432,
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