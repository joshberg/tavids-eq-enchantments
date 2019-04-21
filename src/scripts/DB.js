import Database from 'better-sqlite3';

const spells = new Database('.\\db\\spells.db');
const mobs = new Database('.\\db\\mobs.db');
const equipment = new Database('.\\db\\equipment.db');
const maps = new Database('.\\db\\maps.db');

function closeDBs(){
    spells.close();
    mobs.close();
    equipment.close();
    maps.close();
}

process.on('exit', () => { closeDBs();});
process.on('SIGINT', () => { closeDBs();});
process.on('SIGHUP', () => { closeDBs();});
process.on('SIGTERM', () => { closeDBs();});

module.exports = {
    spells,
    mobs,
    equipment,
    maps
}