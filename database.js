const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tea.db');

// Поиск чая по названию
const findTeaByName = (название, callback) => {
  db.get(`SELECT * FROM чай WHERE название = ?`, [название], callback);
};

// Поиск чая по типу
const findTeaByType = (тип, callback) => {
  db.all(`SELECT * FROM чай WHERE тип = ?`, [тип], callback);
};

module.exports = { findTeaByName, findTeaByType };