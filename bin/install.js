#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/faceless-men/stellaria-skills.git';
const REPO_DIR = path.join(os.homedir(), 'stellaria-skills');
const ROOT_DIR = REPO_DIR;
const CODEX_SKILLS_DIR = path.join(os.homedir(), '.codex', 'skills');

// 辅助函数：安全删除旧目标
function clearTarget(target) {
  if (fs.existsSync(target) || fs.lstatSync(target, { throwIfNoEntry: false })) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// 辅助函数：递归复制目录 (Fallback 方案)
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installAllSkills() {
  console.log('📦 开始批量安装 Codex Skills...');
  fs.mkdirSync(CODEX_SKILLS_DIR, { recursive: true });

  // 1. 扫描根目录下所有包含 SKILL.md 的子目录
  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
  const skillFolders = entries.filter(
    (entry) => entry.isDirectory() && fs.existsSync(path.join(ROOT_DIR, entry.name, 'SKILL.md'))
  );

  if (skillFolders.length === 0) {
    console.warn('⚠️ 未查找到任何包含 SKILL.md 的 Skill 文件夹！');
    return;
  }

  // 2. 逐个安装 Skill
  for (const folder of skillFolders) {
    const skillName = folder.name;
    const sourceDir = path.join(ROOT_DIR, skillName);
    const targetDir = path.join(CODEX_SKILLS_DIR, skillName);

    console.log(`\n🚀 正在安装 [${skillName}]...`);
    clearTarget(targetDir);

    // 优先尝试软链接
    try {
      const symlinkType = os.platform() === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(sourceDir, targetDir, symlinkType);
      console.log(`  ✅ 软链接成功: ${targetDir} -> ${sourceDir}`);
      continue;
    } catch (err) {
      console.warn(`  ⚠️ 软链接失败 (${err.message})，正在降级为文件复制...`);
    }

    // 回退到文件复制
    try {
      clearTarget(targetDir);
      copyDirSync(sourceDir, targetDir);
      console.log(`  ✅ 复制安装成功: ${targetDir}`);
    } catch (err) {
      console.error(`  ❌ 安装 [${skillName}] 失败: ${err.message}`);
    }
  }

  console.log('\n🎉 所有技能安装完毕！请重启 Codex 查看生效状态。');
}

function checkConfig() {
  const configPath = path.join(os.homedir(), '.codex', 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
  }
  if (!config.STELLARIA_API_BASE_URL) {
    process.stdout.write('\n⚙️  未检测到 STELLARIA_API_BASE_URL，请输入服务器地址: ');
    const url = require('readline').createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    return new Promise((resolve) => {
      url.once('line', (line) => {
        url.close();
        const value = line.trim();
        if (!value) {
          console.warn('  ⚠️  未输入地址，跳过配置。请手动编辑 ~/.codex/config.json。');
          return resolve();
        }
        config.STELLARIA_API_BASE_URL = value;
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log('  ✅ 已保存至 ~/.codex/config.json');
        resolve();
      });
    });
  }
}

// 辅助函数：解析当前分支对应的远端上游分支（如 origin/main）
function getUpstreamBranch(repoDir) {
  try {
    const upstream = execSync(`git -C "${repoDir}" rev-parse --abbrev-ref @{upstream}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return upstream || 'origin/main';
  } catch {
    return 'origin/main';
  }
}

function cloneOrUpdateRepo() {
  if (fs.existsSync(path.join(REPO_DIR, '.git'))) {
    console.log(`\n🔄 仓库已存在，正在更新: ${REPO_DIR}`);
    try {
      execSync(`git -C "${REPO_DIR}" pull --ff-only`, { stdio: 'inherit' });
      console.log('  ✅ 更新成功');
      return;
    } catch (err) {
      const reason = String(err.message).split('\n')[0];
      console.warn(`  ⚠️ 快进更新失败: ${reason}`);
    }

    // 快进失败通常是本地分支与远端分叉（例如本地有重复/多余的提交）。
    // 安装目录以远端为准：拉取远端并强制同步到远端最新，避免静默使用旧代码。
    try {
      console.log('  🔄 本地与远端分叉，正在强制同步到远端最新版本...');
      const upstream = getUpstreamBranch(REPO_DIR);
      execSync(`git -C "${REPO_DIR}" fetch origin`, { stdio: 'inherit' });
      execSync(`git -C "${REPO_DIR}" reset --hard "${upstream}"`, { stdio: 'inherit' });
      console.log(`  ✅ 已强制同步到远端最新 (${upstream})`);
    } catch (err) {
      const reason = String(err.message).split('\n')[0];
      console.error(`  ❌ 无法从远端更新: ${reason}`);
      console.error('  安装目录可能停留在旧版本，请检查网络或手动执行:');
      console.error(`    git -C "${REPO_DIR}" fetch origin && git -C "${REPO_DIR}" reset --hard origin/main`);
      process.exit(1);
    }
  } else {
    console.log(`\n📥 正在克隆仓库到 ${REPO_DIR}...`);
    try {
      execSync(`git clone "${REPO_URL}" "${REPO_DIR}"`, { stdio: 'inherit' });
      console.log('  ✅ 克隆成功');
    } catch (err) {
      console.error(`  ❌ 克隆失败: ${err.message}`);
      process.exit(1);
    }
  }
}

async function main() {
  cloneOrUpdateRepo();
  await checkConfig();
  installAllSkills();
}

main();