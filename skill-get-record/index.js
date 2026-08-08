const { getAccessKey } = require('../utils/auth');

async function main() {
  // 共享校验，失败会自动报错退出，不会继续执行
  const key = getAccessKey();

  console.log(`🔑 成功获取 Access Key: ${key.substring(0, 4)}****`);
  console.log('📡 正在请求 Skill A 对应的后端接口...');
  // 执行具体的 API 请求...
}

main();