#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT_DIR = path.join(__dirname, '..');
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
    console.log('\n⚙️  未检测到 STELLARIA_API_BASE_URL 配置。');
    console.log('  请在 ~/.codex/config.json 中添加：');
    console.log('  { "STELLARIA_API_BASE_URL": "https://your-server-address" }');
  }
}

checkConfig();
installAllSkills();