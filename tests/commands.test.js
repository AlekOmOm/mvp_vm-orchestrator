import assert from 'assert';
process.env.PORT = 0;
const { COMMANDS } = await import('../src/server.js');
assert.ok(COMMANDS['vm-status']);
assert.ok(COMMANDS['vm-logs']);
assert.ok(COMMANDS['docker-ps']);
console.log('COMMANDS object validation passed'); 