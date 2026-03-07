
  const { spawn } = require('child_process');
  const child = spawn('npx', ['drizzle-kit', 'push', '--force'], {
    stdio: ['pipe', 'inherit', 'inherit']
  });
  child.stdin.write('1\n');
  child.stdin.end();
  