#!/usr/bin/env node

/**
 * Test script for serverless API endpoints
 * 
 * This script tests the VM and command management API endpoints
 * to ensure they're working correctly after deployment.
 */

import { ServerlessAPIClient } from '../src/lib/serverless-api-client.js';

const API_URL = process.env.SERVERLESS_API_URL || 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Serverless API at:', API_URL);
  console.log('');

  const client = new ServerlessAPIClient(API_URL);

  try {
    // Test 1: Create a VM
    console.log('1️⃣  Testing VM creation...');
    const testVM = {
      name: 'test-vm',
      host: '192.168.1.100',
      user: 'ubuntu',
      environment: 'development',
      description: 'Test VM for API validation'
    };

    const createdVM = await client.createVM(testVM);
    console.log('✅ VM created:', createdVM.id);

    // Test 2: Get all VMs
    console.log('2️⃣  Testing VM listing...');
    const vms = await client.getVMs();
    console.log('✅ Found', vms.length, 'VMs');

    // Test 3: Get specific VM
    console.log('3️⃣  Testing VM retrieval...');
    const retrievedVM = await client.getVM(createdVM.id);
    console.log('✅ Retrieved VM:', retrievedVM.name);

    // Test 4: Create a command for the VM
    console.log('4️⃣  Testing command creation...');
    const testCommand = {
      name: 'test-command',
      cmd: 'echo "Hello from test command"',
      type: 'stream',
      description: 'Test command for API validation'
    };

    const createdCommand = await client.createCommand(createdVM.id, testCommand);
    console.log('✅ Command created:', createdCommand.id);

    // Test 5: Get commands for VM
    console.log('5️⃣  Testing command listing...');
    const commands = await client.getVMCommands(createdVM.id);
    console.log('✅ Found', commands.length, 'commands for VM');

    // Test 6: Update command
    console.log('6️⃣  Testing command update...');
    const updatedCommand = await client.updateCommand(createdCommand.id, {
      description: 'Updated test command description'
    });
    console.log('✅ Command updated:', updatedCommand.description);

    // Test 7: Test job cache
    console.log('7️⃣  Testing job cache...');
    const jobData = {
      vmId: createdVM.id,
      status: 'completed',
      command: 'test command',
      type: 'stream',
      exitCode: 0
    };

    await client.updateJobCache('test-job-123', jobData);
    console.log('✅ Job cache updated');

    const jobs = await client.getVMJobs(createdVM.id);
    console.log('✅ Found', jobs.length, 'cached jobs for VM');

    // Cleanup: Delete command
    console.log('8️⃣  Cleaning up command...');
    await client.deleteCommand(createdCommand.id);
    console.log('✅ Command deleted');

    // Cleanup: Delete VM
    console.log('9️⃣  Cleaning up VM...');
    await client.deleteVM(createdVM.id);
    console.log('✅ VM deleted');

    console.log('');
    console.log('🎉 All tests passed! Serverless API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}
