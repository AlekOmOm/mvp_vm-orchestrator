/**
 * SSH Hosts API Routes
 *
 * Provides endpoints for discovering and managing SSH hosts from ~/.ssh/config
 * Makes SSH configuration the single source of truth for VM discovery.
 *
 * @fileoverview SSH hosts API routes
 */

import express from 'express';
import { SSHManager } from '../lib/ssh-manager.js';

const router = express.Router();

/**
 * GET /api/ssh-hosts
 * Get all available SSH hosts from ~/.ssh/config
 * Filters out git hosts and includes only server-like hosts
 */
router.get('/', async (req, res) => {
  try {
    const hosts = SSHManager.getAllHosts();
    
    // Transform for frontend consumption
    const sshHosts = hosts.map(host => ({
      alias: host.alias,
      suggestedVMName: host.suggestedVMName,
      hostname: host.config.host,
      user: host.config.user,
      port: host.config.port,
      identityFile: host.config.identityFile,
      // Additional metadata for UI
      isCloudInstance: host.config.host && (
        host.config.host.includes('amazonaws.com') ||
        host.config.host.includes('googleusercontent.com') ||
        host.config.host.includes('azure') ||
        host.config.host.includes('digitalocean')
      ),
      cloudProvider: getCloudProvider(host.config.host)
    }));

    res.json(sshHosts);
  } catch (error) {
    console.error('Error getting SSH hosts:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve SSH hosts',
      details: error.message 
    });
  }
});

/**
 * GET /api/ssh-hosts/:alias
 * Get specific SSH host configuration
 */
router.get('/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    const config = SSHManager.getConnectionConfig(alias);
    
    res.json({
      alias,
      config,
      suggestedVMName: SSHManager.generateVMName(alias, config)
    });
  } catch (error) {
    console.error(`Error getting SSH host ${req.params.alias}:`, error);
    res.status(404).json({ 
      error: `SSH host '${req.params.alias}' not found`,
      details: error.message 
    });
  }
});

/**
 * POST /api/ssh-hosts/:alias/test
 * Test SSH connection to a specific host
 */
router.post('/:alias/test', async (req, res) => {
  try {
    const { alias } = req.params;
    const { timeout = 10 } = req.body;
    
    const result = await SSHManager.testConnection(alias, timeout);
    
    res.json({
      alias,
      success: result.success,
      message: result.message,
      responseTime: result.responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error testing SSH connection to ${req.params.alias}:`, error);
    res.status(500).json({ 
      error: 'Failed to test SSH connection',
      details: error.message 
    });
  }
});

/**
 * GET /api/ssh-hosts/:alias/validate
 * Validate SSH host configuration
 */
router.get('/:alias/validate', async (req, res) => {
  try {
    const { alias } = req.params;
    const validation = SSHManager.validateHostConfig(alias);
    
    res.json({
      alias,
      valid: validation.valid,
      issues: validation.issues,
      config: validation.config
    });
  } catch (error) {
    console.error(`Error validating SSH host ${req.params.alias}:`, error);
    res.status(404).json({ 
      error: `SSH host '${req.params.alias}' not found`,
      details: error.message 
    });
  }
});

/**
 * Helper function to determine cloud provider from hostname
 * @param {string} hostname - The hostname to analyze
 * @returns {string|null} Cloud provider name or null
 */
function getCloudProvider(hostname) {
  if (!hostname) return null;
  
  const host = hostname.toLowerCase();
  
  if (host.includes('amazonaws.com')) return 'AWS';
  if (host.includes('googleusercontent.com') || host.includes('gcp')) return 'Google Cloud';
  if (host.includes('azure')) return 'Azure';
  if (host.includes('digitalocean')) return 'DigitalOcean';
  if (host.includes('linode')) return 'Linode';
  if (host.includes('vultr')) return 'Vultr';
  
  return null;
}

export default router;
