const { getAccessKey } = require('../utils/auth');

async function main(customerName) {
  const key = await getAccessKey();

  console.log(`🔑 成功获取 Access Key: ${key.substring(0, 4)}****`);
  console.log(`📡 正在查询客户 "${customerName}" 的病例记录...`);

  // https://orbit.stellaria.biz/api/auth/findRecord
  const url = new URL('http://127.0.0.1:8888/auth/findRecord');
  url.searchParams.set('name', customerName);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'XTOKEN': key,
      },
    });
  } catch (err) {
    console.error(`❌ 请求失败: ${err.message}`);
    process.exit(1);
  }

  const text = await response.text();

  if (!response.ok) {
    console.error(`❌ 请求失败 (HTTP ${response.status}): ${text}`);
    process.exit(1);
  }

  console.log('✅ 查询成功，记录如下：');
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

const name = process.argv[2];
if (!name) {
  console.error('❌ 用法: node index.js <客户姓名>');
  process.exit(1);
}

main(name);
