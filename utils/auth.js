const process = require('process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(os.homedir(), '.codex', 'config.json');
const CONFIG_KEY = 'MY_SERVICE_ACCESS_KEY';

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function saveAccessKey(key) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const config = readConfig();
  config[CONFIG_KEY] = key;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function promptAccessKey() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('请输入 Access Key: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getAccessKey() {
  // 1. 优先读取环境变量
  let key = process.env.STELLARIA_ACCESS_KEY;

  // 2. 从本地配置文件读取 (~/.codex/config.json)
  if (!key) {
    const config = readConfig();
    key = config[CONFIG_KEY];
  }

  // 3. 校验未通过，提示用户输入并保存
  if (!key) {
    console.error('未找到 Access Key，请输入后将自动保存至 ~/.codex/config.json');
    key = await promptAccessKey();
    if (!key) {
      console.error('❌ 错误: Access Key 不能为空，已退出。');
      process.exit(1);
    }
    saveAccessKey(key);
    console.log('✅ Access Key 已保存至 ~/.codex/config.json');
  }

  return key;
}

module.exports = { getAccessKey };