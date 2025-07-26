import { spawn } from 'child_process';

export class TerminalSpawnStrategy {
  static spawn(command, workingDir = null) {
    const platform = process.platform;
    
    switch (platform) {
      case 'darwin': // macOS
        return this.spawnMacOS(command, workingDir);
      case 'linux':
        return this.spawnLinux(command, workingDir);
      case 'win32':
        return this.spawnWindows(command, workingDir);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static spawnMacOS(command, workingDir) {
    // Create AppleScript to open Terminal with the command
    const script = workingDir 
      ? `tell application "Terminal" to do script "cd '${workingDir}' && ${command}"`
      : `tell application "Terminal" to do script "${command}"`;
    
    return spawn('osascript', ['-e', script], {
      detached: true,
      stdio: 'ignore'
    });
  }

  static spawnLinux(command, workingDir) {
    // Try different terminal emulators in order of preference
    const terminals = [
      { cmd: 'gnome-terminal', args: ['--', 'bash', '-c'] },
      { cmd: 'xterm', args: ['-e', 'bash', '-c'] },
      { cmd: 'konsole', args: ['-e', 'bash', '-c'] },
      { cmd: 'xfce4-terminal', args: ['-e', 'bash', '-c'] }
    ];

    const fullCommand = workingDir 
      ? `cd '${workingDir}' && ${command}; exec bash`
      : `${command}; exec bash`;

    for (const terminal of terminals) {
      try {
        return spawn(terminal.cmd, [...terminal.args, fullCommand], {
          cwd: workingDir,
          detached: true,
          stdio: 'ignore'
        });
      } catch (error) {
        // Try next terminal if this one fails
        continue;
      }
    }

    throw new Error('No suitable terminal emulator found');
  }

  static spawnWindows(command, workingDir) {
    // Use Windows Terminal if available, otherwise fall back to cmd
    const fullCommand = workingDir 
      ? `cd /d "${workingDir}" && ${command}`
      : command;

    try {
      // Try Windows Terminal first
      return spawn('wt', ['cmd', '/k', fullCommand], {
        cwd: workingDir,
        detached: true,
        stdio: 'ignore'
      });
    } catch (error) {
      // Fall back to cmd
      return spawn('cmd', ['/k', fullCommand], {
        cwd: workingDir,
        detached: true,
        stdio: 'ignore'
      });
    }
  }
}
