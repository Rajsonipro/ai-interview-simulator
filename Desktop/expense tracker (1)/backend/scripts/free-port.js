import { execSync } from 'child_process';

const port = process.env.PORT || 5003;

try {
  const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
  const pids = new Set();

  for (const line of output.split('\n')) {
    const match = line.trim().match(/LISTENING\s+(\d+)\s*$/i);
    if (match) pids.add(match[1]);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`Freed port ${port} (stopped PID ${pid})`);
    } catch {
      // process may have already exited
    }
  }

  if (pids.size === 0) {
    console.log(`Port ${port} is already free.`);
  }
} catch {
  console.log(`Port ${port} is already free.`);
}
