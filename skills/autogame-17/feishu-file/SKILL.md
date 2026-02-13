---
name: feishu-file
description: 飞书文件上传与下载，支持上传本地文件到飞书并发送到会话/用户，以及从消息或云空间下载文件/图片到本地。
metadata:
  {
    "clawdbot":
      {
        "emoji": "📝",
        "requires": { "env": ["FEISHU_APP_ID", "FEISHU_APP_SECRET"] },
        "primaryEnv": "FEISHU_APP_ID",
      },
  }
---

# Feishu File Skill

Manage file uploads and downloads via Feishu API. Upload local files to Feishu Drive and send them to a chat or user; download file/image resources from messages or drive to local.

## Prerequisites

- Install **feishu-common** first. `send.js` and `upload.js` depend on `../feishu-common/feishu-client.js` (or `../common/feishu-client.js`) for token and Drive upload.
- **download.js** depends on `../feishu-post/utils/feishu-client.js` for token and retry logic (same client as feishu-post). Ensure feishu-post is available if you use the main download script.

## Commands

### Send File

Upload a local file and send it to a chat or user.

```bash
node skills/feishu-file/send.js --target <chat_id_or_user_id> --file <local_path> [--parent-node <token>]
```

- `--target`: Chat ID (`oc_...`) or user Open ID (`ou_...`). Treated as `chat_id` when target starts with `oc_`, otherwise `open_id`.
- `--file`: Local file path.
- `--parent-node`: Optional. Drive folder token for upload; overrides `FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN`.

### Upload Only

Upload a file to Feishu Drive and get its `file_key` (for use in cards, rich text, or later sending).

```bash
node skills/feishu-file/upload.js --file <local_path> [--parent-node <token>]
```

Output is JSON to stdout: `{"status":"success","file_key":"...","file_path":"..."}` or `{"status":"error","error":"..."}`.

### Download File

Download a file or image resource from a message (or, for files, from drive when message context is not required).

```bash
node skills/feishu-file/download.js [--message-id <msg_id>] --file-key <key> --output <path> [--type file|image]
```

- `--message-id`: Required for `--type image` or when downloading message-scoped resources. Optional for `--type file` (can use drive download URL as fallback).
- `--file-key`: File or image key from the message/content.
- `--output`: Local path to save the file.
- `--type`: `file` or `image`. Default `image`. For `file`, omitting `--message-id` uses drive download; for `image`, `--message-id` is required.

The bot must have access to the message (be in the chat). For files sent by others, the `im:resource:read` scope is required. The script uses retries and fallback URLs (message resource first, then drive where applicable).

### Download (v3)

Simplified download when you have the message ID. Automatically detects image vs file by `file_key` prefix (`img_` → image).

```bash
node skills/feishu-file/download_v3.js <file_key> <output_path> <message_id>
```

### Download Image

Download an image by key only (uses `im/v1/images` API).

```bash
node skills/feishu-file/download_image.js --image-key <key> --output <path>
```

### download_file.js

Thin wrapper that forwards arguments to `download.js` for backward compatibility. Use `download.js` directly for full options.

## Configuration / Environment

- **Required**: `FEISHU_APP_ID`, `FEISHU_APP_SECRET` (tenant auth).
- **Upload (send/upload)**: `FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN` — Drive folder token where files are uploaded. Can be overridden per call with `--parent-node`.

Load env from repo root `.env` (e.g. `skills/autogame-17/../../.env` or project `.env` as used by scripts).

## Notes

- **Large files**: Send and upload use Feishu Drive APIs: small files (e.g. ≤20MB) use `upload_all`; larger files use multipart upload (up to 2GB per file).
- **Download**: Main download script tries message-scoped resource URL first; on failure it may fallback to drive or generic file URL where supported.
