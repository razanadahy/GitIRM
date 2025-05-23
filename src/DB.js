const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const dbPath = path.join(app.getPath('userData'), 'ArisManagerSession.db');
const getUserMachineGUID = require('./UserMachineGUID');
const db = new Database(dbPath);

function initDB() {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            value TEXT,
            attr text
        )
  `).run();
}

function insertSession(attr, value) {
     getUserMachineGUID().then(({guid})=>{
         const stmt = db.prepare('INSERT OR REPLACE INTO sessions (id, value, attr) VALUES (?, ?, ?)');
         stmt.run(guid, value, attr);
     });
}

function getSession(userMachine) {
    const stmt = db.prepare("SELECT value FROM sessions where id=? limit 1");
    const result = stmt.get(userMachine);
    return result ? result.value : null;
}

function deleteDB() {
    db.prepare('DELETE FROM sessions').run();
}

module.exports = {
    initDB,
    insertSession,
    getSession,
    deleteDB
};
