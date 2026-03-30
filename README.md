# 面试题自动化产出工具

输入一道面试题，自动产出：

- 标题（`title.txt`）
- 简介（`intro_en.txt`）
- 正文稿（`内容文字稿.md`）
- 卡片图片（`card_01.png` ...）

## 1. 安装依赖

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. 配置环境变量

复制并填写：

```bash
cp .env.example .env
```

必填项：

- 大模型密钥（任选其一）：`OPENAI_API_KEY` / `DASHSCOPE_API_KEY`（通义千问）/ `ARK_API_KEY`（火山方舟/豆包）
- `MD2CARD_API_KEY`

可选项：

- `OPENAI_BASE_URL`（默认 `https://api.openai.com`）
- `OPENAI_MODEL`
- `OPENAI_CHAT_COMPLETIONS_PATH`（极少数网关需手动指定完整 `.../chat/completions` 地址时填写）
- `HTTP_TRUST_PROXY`（默认 `false`：不使用系统代理，可避免错误代理导致 `Connection reset`）
- `MD2CARD_THEME`
- `MD2CARD_THEME_MODE`
- `MD2CARD_SPLIT_MODE`
- `MD2CARD_OVER_HIDDEN_MODE`（`true/false`，对应 UI 的“高度超出隐藏”）
- `MD2CARD_WIDTH`
- `MD2CARD_HEIGHT`

> MD2Card API Key 可在官网控制台获取：<https://md2card.cn/>

### 国内厂商（通义千问 / 豆包）

二者均为 **OpenAI 兼容** 接口，只需改 `OPENAI_BASE_URL`、`OPENAI_MODEL` 和对应 Key；程序会自动拼接正确的 `.../chat/completions` 路径。

**通义千问（阿里云百炼 / DashScope）**

- 控制台与文档：<https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope>
- 示例：

```env
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-plus
DASHSCOPE_API_KEY=你的DashScope_API_Key
```

**豆包（火山引擎 · 火山方舟）**

- 文档：<https://www.volcengine.com/docs/82379/1330626>
- `OPENAI_MODEL` 请填控制台创建的 **推理接入点 ID**（常以 `ep-` 开头），不是随便写的模型昵称。
- `OPENAI_BASE_URL` 只填**基础地址**，到 `/api/v3` 为止；不要把文档里的完整路径 `.../chat/completions` 粘进这一项，否则会变成双重路径并出现 **404**。
- 若接口返回 **404** 且响应里有 `ModelNotOpen`，表示**该模型未在方舟控制台开通**，请在控制台开通后再调，或把 `OPENAI_MODEL` 换成已开通的模型 / `ep-` 接入点。
- 示例：

```env
OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
OPENAI_MODEL=ep-xxxxxxxx
ARK_API_KEY=你的方舟API_Key
```

## 3. 运行

```bash
python -m auto_redbook run --track frontend --question "React Hooks 如何避免闭包陷阱？"
```

`--track` 可选值：

- `frontend`
- `backend`
- `ai-agent`

默认输出目录为 `output/`，每次运行会自动创建时间戳子目录。
