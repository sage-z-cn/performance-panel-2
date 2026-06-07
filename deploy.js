// only works on windows
import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';

const deployDir = process.env.DEPLOY_DIR;

try {
  if (!deployDir) throw new Error('DEPLOY_DIR not defined in .env file');

  // Build
  console.log('[Build] Building...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('[Build] Done');

  // Remove target directory if it exists
  if (existsSync(deployDir)) {
    rmSync(deployDir, { recursive: true, force: true });
  }
  
  // Ensure parent directory exists (xcopy /I only creates the last dir)
  mkdirSync(deployDir, { recursive: true });
  
  // Copy files with Windows native xcopy
  execSync(`xcopy "dist\\*" "${deployDir}\\" /E /Y /I`, { stdio: 'inherit' });
  
  console.log(`[Success] Files deployed to: ${deployDir}`);
} catch (error) {
  console.error(`[Error] Deployment failed: ${error.message}`);
  process.exit(1);
}