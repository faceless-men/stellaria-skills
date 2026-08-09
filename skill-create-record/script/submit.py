#!/usr/bin/env python3
import json
import os
import re
import sys
import urllib.request
from urllib.error import HTTPError, URLError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "utils"))

from auth import get_access_key


def create_record(record: dict) -> None:
    key = get_access_key()

    base_url = (os.getenv("STELLARIA_API_BASE_URL") or "http://localhost:8888").rstrip("/")

    organize_id = os.getenv("STELLARIA_ORGANIZE_ID", "").strip()
    if organize_id:
        record.setdefault("patient", {})["organizeId"] = int(organize_id)

    data = json.dumps(record, ensure_ascii=False).encode()
    req = urllib.request.Request(
        f"{base_url}/public/createRecord",
        data=data,
        headers={"Content-Type": "application/json", "XTOKEN": key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
    except HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            j = json.loads(body)
            code, message = j.get("code", e.code), j.get("message", body)
        except Exception:
            code, message = e.code, body
        print(f"❌ 录入失败 ({code}): {message}", file=sys.stderr)
        sys.exit(1)
    except URLError as e:
        print(f"❌ 连接后端失败: {e.reason}", file=sys.stderr)
        sys.exit(1)


def format_success(patient_name: str, record: dict) -> str:
    lines = [f"✅ 患者档案已成功录入：{patient_name}"]
    patient = record.get("patient") or {}

    gender_label = {1: "男", 2: "女"}.get(patient.get("gender"))
    if gender_label:
        lines.append(f"• 性别：{gender_label}")

    birthday = (patient.get("birthday") or "")[:10]
    if birthday:
        lines.append(f"• 出生日期：{birthday}")

    if patient.get("nationality"):
        lines.append(f"• 国籍：{patient['nationality']}")
    if patient.get("languages"):
        lines.append(f"• 语言：{patient['languages']}")

    hw = []
    if patient.get("height"):
        hw.append(f"{patient['height']}cm")
    if patient.get("weight"):
        hw.append(f"{patient['weight']}kg")
    if hw:
        lines.append(f"• 身高/体重：{' / '.join(hw)}")

    disease = record.get("diseaseInfo") or {}
    if disease.get("diseaseName"):
        lines.append(f"• 病名：{disease['diseaseName']}")
    if disease.get("purpose"):
        lines.append(f"• 就医目的：{disease['purpose']}")
    if disease.get("currentTreat"):
        lines.append(f"• 当前治疗：{disease['currentTreat']}")
    if patient.get("reports"):
        lines.append(f"• 携带资料：{patient['reports']}")

    mc = len(record.get("medicineHistory") or [])
    tc = len(record.get("treatHistory") or [])
    qc = len(record.get("questionAnswer") or [])
    if mc:
        lines.append(f"• 服药记录：{mc} 条")
    if tc:
        lines.append(f"• 诊疗经过：{tc} 条")
    if qc:
        lines.append(f"• 患者提问：{qc} 条")

    return "\n".join(lines)


def main() -> None:
    if len(sys.argv) < 2:
        print("❌ 用法: python3 submit.py '<JSON字符串>'", file=sys.stderr)
        sys.exit(1)

    try:
        record = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析失败: {e}", file=sys.stderr)
        sys.exit(1)

    birthday = (record.get("patient") or {}).get("birthday") or ""
    if birthday and not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", birthday):
        print(f"❌ 创建失败：出生年月日格式不合法 ({birthday})，请检查表单后重试。", file=sys.stderr)
        sys.exit(1)

    patient_name = (record.get("patient") or {}).get("name") or ""
    if not patient_name:
        print("❌ 未能从表单中识别患者姓名，请确认表单格式是否正确后重试。", file=sys.stderr)
        sys.exit(1)

    print(f"📡 正在提交患者档案: {patient_name}")
    create_record(record)
    print(format_success(patient_name, record))


if __name__ == "__main__":
    main()
