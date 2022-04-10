'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};
require("dotenv").config();
const PGDATABASE = process.env.PGDATABASE;
const PGUSER = process.env.PGUSER;
const PGPASSWORD = process.env.PGPASSWORD;
const PGHOST = process.env.PGHOST;
const PGDEVPASSWORD = process.env.PGDEVPASSWORD;
const NODE_ENV = process.env.NODE_ENV;
const sequelize = new Sequelize(NODE_ENV=="production"?PGDATABASE:"social_media_github", NODE_ENV=="production"?PGUSER:"postgres", NODE_ENV=="production"?PGPASSWORD:PGDEVPASSWORD, {
  host: NODE_ENV=="production"?PGHOST:PGHOST,
  dialect: 'postgres'
});
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
