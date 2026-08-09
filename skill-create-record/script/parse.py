#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from parser import parse_xlsx


def main() -> None:
    if len(sys.argv) < 2:
        print("❌ 用法: python3 parse.py <Excel文件路径>", file=sys.stderr)
        sys.exit(1)

    xlsx_path = os.path.realpath(sys.argv[1])
    if not os.path.exists(xlsx_path):
        print(f"❌ 文件不存在: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    try:
        raw = parse_xlsx(xlsx_path)
    except Exception as e:
        print(f"❌ Excel 解析失败: {e}", file=sys.stderr)
        sys.exit(1)

    questions_text = "\n".join(
        f"{i + 1}. {q}" for i, q in enumerate(raw.page3_questions)
    )
    print(f"=== Page1（基本信息）===\n{raw.page1_text}\n")
    print(f"=== Page2（诊疗经过）===\n{raw.page2_text}\n")
    print(f"=== Page3（患者问题）===\n{questions_text}")


if __name__ == "__main__":
    main()
