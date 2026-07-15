/**
 * Database connection singleton — Knex instance
 * Import this wherever you need to run queries.
 *
 * Usage:
 *   const db = require('../db/connection');
 *   const users = await db('users').select('*');
 */
const knex = require('knex');
const config = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

module.exports = db;
