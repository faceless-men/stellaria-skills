import json
import os
import sys
from pathlib import Path

CONFIG_PATH = Path.home() / ".codex" / "config.json"
CONFIG_KEY = "STELLARIA_ACCESS_KEY"


def read_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_access_key(key: str) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    config = read_config()
    config[CONFIG_KEY] = key
    CONFIG_PATH.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")


def prompt_access_key() -> str:
    try:
        return input("请输入 Access Key: ").strip()
    except (EOFError, KeyboardInterrupt):
        return ""


def get_base_url() -> str:
    url = os.environ.get("STELLARIA_API_BASE_URL", "").strip()
    if not url:
        url = read_config().get("STELLARIA_API_BASE_URL", "").strip()
    if not url:
        url = "http://127.0.0.1:8888"
    return url.rstrip("/")


def get_access_key() -> str:
    # 1. 优先读取环境变量
    key = os.environ.get("STELLARIA_ACCESS_KEY", "").strip()

    # 2. 从本地配置文件读取 (~/.codex/config.json)
    if not key:
        key = read_config().get(CONFIG_KEY, "").strip()

    # 3. 提示用户输入并保存
    if not key:
        print("未找到 Access Key，请输入后将自动保存至 ~/.codex/config.json", file=sys.stderr)
        key = prompt_access_key()
        if not key:
            print("❌ 错误: Access Key 不能为空，已退出。", file=sys.stderr)
            sys.exit(1)
        save_access_key(key)
        print("✅ Access Key 已保存至 ~/.codex/config.json")

    return key
