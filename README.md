# Stellaria Skills

为 Codex 提供两个跨境医疗场景的 Skill，对接 Stellaria 患者档案系统。

## Skills

### skill-create-record — 录入患者档案

解析患者填写的 Excel 调查表（`.xlsx`），通过 LLM 提取结构化信息，经用户确认后提交至 Stellaria 系统。

**触发示例：**
> 请录入这份调查表：/path/to/患者调查表.xlsx

**流程：**
1. 解析 Excel → 2. AI 提取结构化信息并展示确认 → 3. 用户确认 → 4. 提交系统

---

### skill-find-record — 查询并生成诊疗情报书

按患者姓名从系统查询病例记录，撰写赴日就医所需的诊疗情报提供书，支持一键下载为 Markdown 文件。

**触发示例：**
> 给我一份关于张三的诊疗情报书

**流程：**
1. 识别患者姓名 → 2. 查询病例 → 3. 撰写诊疗情报书 → 4. 确认后保存为 `<姓名>赴日诊疗情报书.md`

---

## 安装

### 前置要求

- [Codex](https://openai.com/codex) CLI
- Node.js
- Python 3

### 步骤

**1. 克隆仓库**

```bash
git clone git@github.com:<your-org>/stellaria-skills.git
cd stellaria-skills
```

**2. 运行安装脚本**

```bash
node bin/install.js
```

脚本会自动将所有 Skill 软链接到 `~/.codex/skills/`，并检查 `~/.codex/config.json` 中是否已配置服务器地址。

**3. 填写服务器地址**

编辑 `~/.codex/config.json`，添加以下配置：

```json
{
  "STELLARIA_API_BASE_URL": "https://your-server-address"
}
```

> 真实服务器地址请联系团队负责人获取。

**4. 配置 Access Key**

首次运行任意 Skill 时，会提示输入 Access Key，输入后自动保存至 `~/.codex/config.json`，后续无需重复输入。

也可通过环境变量提前设置：

```bash
export STELLARIA_ACCESS_KEY=your-access-key
```

---

## 环境变量

| 变量 | 说明 | 必填 |
|---|---|---|
| `STELLARIA_API_BASE_URL` | Stellaria 后端服务地址 | 是 |
| `STELLARIA_ACCESS_KEY` | 认证密钥 | 是（也可交互输入） |
| `STELLARIA_ORGANIZE_ID` | 机构 ID，会覆盖表单中的值 | 否 |
