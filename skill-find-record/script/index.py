#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "utils"))

from auth import get_access_key, get_base_url


def main() -> None:
    if len(sys.argv) < 2:
        print("❌ 用法: python3 index.py <客户姓名>", file=sys.stderr)
        sys.exit(1)

    customer_name = sys.argv[1]
    key = get_access_key()

    print(f"🔑 成功获取 Access Key: {key[:4]}****")
    print(f"📡 正在查询客户 \"{customer_name}\" 的病例记录...")

    base_url = get_base_url()
    url = f"{base_url}/api/auth/findRecord?{urlencode({'name': customer_name})}"

    req = urllib.request.Request(url, headers={"auth-code": key}, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode(errors="replace")
    except HTTPError as e:
        text = e.read().decode(errors="replace")
        print(f"❌ 请求失败 (HTTP {e.code}): {text}", file=sys.stderr)
        sys.exit(1)
    except URLError as e:
        print(f"❌ 请求失败: {e.reason}", file=sys.stderr)
        sys.exit(1)

    print("✅ 查询成功，记录如下：")
    try:
        print(json.dumps(json.loads(text), indent=2, ensure_ascii=False))
    except Exception:
        print(text)


if __name__ == "__main__":
    main()
