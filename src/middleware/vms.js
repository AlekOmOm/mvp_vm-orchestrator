/**
 * Middleware for VM-related routes
 * 
 * prime responsibility:
 * - make sure that the VM is registered in the database
 * -- when the ssh-hosts are loading from ~/.ssh/config -> then check if the VM is registered (by using cache instead of getting all the time (cache at start up, then refresh every 5 minutes or when new VM is added))
 * -- if not registered, then register it (and update cache)
 * -- if registered, then return the VM (and update cache)
 * 
 *  dependencies:
 * - ../lib/ssh-manager
 * 
 * 
 * 
 * 
 * 
 */