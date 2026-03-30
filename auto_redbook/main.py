from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv


TRACK_TO_PROMPT_FILE = {
    "frontend": "给AI的提示词【前端】.md",
    "backend": "给AI的提示词【后端】.md",
    "ai-agent": "给AI的提示词【AI-Agent】.md",
}


@dataclass
class AppConfig:
    openai_api_key: str
    openai_base_url: str
    openai_model: str
    md2card_api_key: str
    md2card_theme: str
    md2card_theme_mode: str | None
    md2card_split_mode: str
    md2card_over_hidden_mode: bool
    md2card_width: int
    md2card_height: int


def load_config() -> AppConfig:
    load_dotenv()
    openai_api_key = resolve_llm_api_key()
    md2card_api_key = require_env("MD2CARD_API_KEY")
    return AppConfig(
        openai_api_key=openai_api_key,
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        md2card_api_key=md2card_api_key,
        md2card_theme=os.getenv("MD2CARD_THEME", "xiaohongshu"),
        md2card_theme_mode=os.getenv("MD2CARD_THEME_MODE") or None,
        md2card_split_mode=os.getenv("MD2CARD_SPLIT_MODE", "autoSplit"),
        md2card_over_hidden_mode=parse_bool_env("MD2CARD_OVER_HIDDEN_MODE", False),
        md2card_width=int(os.getenv("MD2CARD_WIDTH", "440")),
        md2card_height=int(os.getenv("MD2CARD_HEIGHT", "586")),
    )


def require_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing environment variable: {key}")
    return value


def resolve_llm_api_key() -> str:
    for key in ("OPENAI_API_KEY", "DASHSCOPE_API_KEY", "ARK_API_KEY"):
        value = os.getenv(key)
        if value and value.strip():
            return value.strip()
    raise RuntimeError(
        "Missing LLM API key: set OPENAI_API_KEY, or DASHSCOPE_API_KEY (通义千问), "
        "or ARK_API_KEY (火山方舟/豆包)."
    )


def parse_bool_env(key: str, default: bool) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def read_prompt(track: str) -> str:
    prompt_path = project_root() / TRACK_TO_PROMPT_FILE[track]
    return prompt_path.read_text(encoding="utf-8")


def read_title_prompt() -> str:
    prompt_path = project_root() / "生成标题的提示词.md"
    return prompt_path.read_text(encoding="utf-8")


def normalize_llm_base_url(url: str) -> str:
    """Strip accidental /chat/completions so we do not double-append paths (404 on Ark/OpenAI)."""
    u = url.strip().rstrip("/")
    for suffix in ("/v1/chat/completions", "/chat/completions"):
        if u.endswith(suffix):
            u = u[: -len(suffix)].rstrip("/")
    return u


def chat_completions_endpoint(base_url: str) -> str:
    base_url = normalize_llm_base_url(base_url)
    override = os.getenv("OPENAI_CHAT_COMPLETIONS_PATH", "").strip()
    if override:
        if override.startswith("http://") or override.startswith("https://"):
            return override
        base = base_url.rstrip("/")
        if override.startswith("/"):
            return f"{base}{override}"
        return f"{base}/{override}"

    base = base_url.rstrip("/")
    if base.endswith("/v1") or base.endswith("/compatible-mode/v1"):
        return f"{base}/chat/completions"
    if "/api/v3" in base or base.endswith("/api/v3"):
        return f"{base}/chat/completions"
    return f"{base}/v1/chat/completions"


def httpx_client() -> httpx.Client:
    return httpx.Client(
        timeout=120.0,
        follow_redirects=True,
        trust_env=parse_bool_env("HTTP_TRUST_PROXY", False),
    )


def _llm_http_error_hint(status_code: int, body: str) -> str:
    code = ""
    message = ""
    try:
        parsed = json.loads(body)
        err = parsed.get("error") if isinstance(parsed, dict) else None
        if isinstance(err, dict):
            code = str(err.get("code", "") or "")
            message = str(err.get("message", "") or "")
    except (json.JSONDecodeError, TypeError):
        pass

    if code == "ModelNotOpen" or "not activated the model" in message.lower():
        return (
            "提示（火山方舟）：该模型未在控制台开通。请到方舟控制台「模型」或「推理接入点」中开通/激活对应模型，"
            "或把 OPENAI_MODEL 换成已开通的模型名 / 推理接入点 ID（ep-...）。\n"
        )
    if status_code == 404 and ("chat/completions" in body or not code):
        return (
            "提示：若使用火山方舟，OPENAI_BASE_URL 只写到 /api/v3；OPENAI_MODEL 填已开通的模型或 ep- 接入点。"
            "若接口返回 404 但 body 里有 ModelNotOpen，实为模型未开通，而非地址错误。\n"
        )
    return (
        "提示：检查 OPENAI_BASE_URL（基础地址勿含 /chat/completions）、OPENAI_MODEL、以及各厂商控制台是否已开通该模型。\n"
    )


def call_chat_completions(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float = 0.4,
) -> str:
    endpoint = chat_completions_endpoint(base_url)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    with httpx_client() as client:
        response = client.post(endpoint, headers=headers, json=payload)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = (exc.response.text or "")[:1200]
            hint = _llm_http_error_hint(exc.response.status_code, detail)
            raise RuntimeError(
                f"LLM request failed: HTTP {exc.response.status_code} {exc.request.url!s}\n"
                f"Response (truncated): {detail}\n"
                f"{hint}"
            ) from exc
        data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("LLM returned no choices.")
    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise RuntimeError("LLM returned empty content.")
    return content.strip()


def generate_content_markdown(config: AppConfig, track: str, question: str) -> str:
    prompt_text = read_prompt(track)
    if "{{用户输入的面试题}}" in prompt_text:
        prompt_text = prompt_text.replace("{{用户输入的面试题}}", question)
        messages = [
            {"role": "user", "content": prompt_text},
            {"role": "user", "content": "请仅输出最终 Markdown 正文，不要额外说明。"},
        ]
    else:
        messages = [
            {"role": "system", "content": prompt_text},
            {
                "role": "user",
                "content": (
                    "请根据以下中文面试题生成内容，并只输出最终 Markdown：\n"
                    f"{question}"
                ),
            },
        ]
    return call_chat_completions(
        base_url=config.openai_base_url,
        api_key=config.openai_api_key,
        model=config.openai_model,
        messages=messages,
        temperature=0.5,
    )


def extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise RuntimeError("Failed to parse JSON for title/introduction.")
    return json.loads(match.group(0))


def generate_title_and_intro(
    config: AppConfig,
    question: str,
    markdown_content: str,
) -> dict[str, str]:
    title_prompt = read_title_prompt()
    json_guard = (
        "你必须只返回一个 JSON 对象，且不允许任何额外文本。"
        '格式为：{"title":"...","intro_en":"..."}。'
        "其中 title 为中文标题，intro_en 为英文简介（不超过70词）。"
    )
    messages = [
        {"role": "system", "content": title_prompt},
        {"role": "system", "content": json_guard},
        {
            "role": "user",
            "content": (
                f"中文面试题：{question}\n\n"
                "以下是已生成的正文内容，请据此生成标题与英文简介：\n"
                f"{markdown_content}"
            ),
        },
    ]
    result_text = call_chat_completions(
        base_url=config.openai_base_url,
        api_key=config.openai_api_key,
        model=config.openai_model,
        messages=messages,
        temperature=0.4,
    )
    payload = extract_json(result_text)
    title = str(payload.get("title", "")).strip()
    intro = str(payload.get("intro_en", "")).strip()
    if not title or not intro:
        raise RuntimeError("Missing title or intro_en in model JSON output.")
    return {"title": title, "intro_en": intro}


def md2card_generate_and_download(
    config: AppConfig,
    markdown_content: str,
    out_dir: Path,
) -> list[Path]:
    payload: dict[str, Any] = {
        "markdown": markdown_content,
        "theme": config.md2card_theme,
        "width": config.md2card_width,
        "height": config.md2card_height,
        "splitMode": config.md2card_split_mode,
        "overHiddenMode": config.md2card_over_hidden_mode,
    }
    if config.md2card_theme_mode:
        payload["themeMode"] = config.md2card_theme_mode

    headers = {
        "x-api-key": config.md2card_api_key,
        "Content-Type": "application/json",
    }
    with httpx_client() as client:
        response = client.post("https://md2card.cn/api/generate", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        images = data.get("images") or []
        if not images:
            raise RuntimeError(f"MD2Card returned no images. Response: {data}")

        downloaded: list[Path] = []
        for i, item in enumerate(images, start=1):
            image_url = item.get("url")
            if not image_url:
                continue
            image_bytes = client.get(image_url).content
            image_path = out_dir / f"card_{i:02d}.png"
            image_path.write_bytes(image_bytes)
            downloaded.append(image_path)
    if not downloaded:
        raise RuntimeError("No valid image URLs found in MD2Card response.")
    return downloaded


def build_output_dir(base_output: Path, question: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", question).strip("_")
    slug = slug[:36] if slug else "question"
    path = base_output / f"{timestamp}_{slug}"
    path.mkdir(parents=True, exist_ok=False)
    return path


def run_pipeline(args: argparse.Namespace) -> int:
    config = load_config()
    base_output = Path(args.output_dir).resolve()
    base_output.mkdir(parents=True, exist_ok=True)
    out_dir = build_output_dir(base_output, args.question)

    markdown_content = generate_content_markdown(config, args.track, args.question)
    content_path = out_dir / "内容文字稿.md"
    content_path.write_text(markdown_content, encoding="utf-8")

    meta = generate_title_and_intro(config, args.question, markdown_content)
    (out_dir / "title.txt").write_text(meta["title"], encoding="utf-8")
    (out_dir / "intro_en.txt").write_text(meta["intro_en"], encoding="utf-8")
    (out_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    images = md2card_generate_and_download(config, markdown_content, out_dir)

    print("Pipeline completed.")
    print(f"Output directory: {out_dir}")
    print(f"Content file: {content_path}")
    print(f"Title: {meta['title']}")
    print(f"Intro: {meta['intro_en']}")
    print(f"Downloaded images: {len(images)}")
    for p in images:
        print(f"- {p}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="auto-redbook",
        description="Generate interview content, metadata, and card images automatically.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_parser = subparsers.add_parser("run", help="Run full generation pipeline")
    run_parser.add_argument(
        "--track",
        required=True,
        choices=sorted(TRACK_TO_PROMPT_FILE.keys()),
        help="Choose prompt track.",
    )
    run_parser.add_argument(
        "--question",
        required=True,
        help="Input interview question in Chinese.",
    )
    run_parser.add_argument(
        "--output-dir",
        default=str(project_root() / "output"),
        help="Base output directory.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "run":
        return run_pipeline(args)
    parser.print_help()
    return 1
