import Database from 'better-sqlite3';

const spells = new Database('.\\db\\spells.db');
const mobs = new Database('.\\db\\mobs.db');
const equipment = new Database('.\\db\\equipment.db');
const maps = new Database('.\\db\\maps.db');

module.exports = {
    spells,
    mobs,
    equipment,
    maps
}