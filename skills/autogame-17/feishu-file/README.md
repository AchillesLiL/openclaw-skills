# Feishu File Skill

Manage file uploads and downloads via Feishu API. For full usage, options, and environment variables see [SKILL.md](SKILL.md).

## Commands

### Send File
Upload a local file and send it to a chat or user.
```bash
node skills/feishu-file/send.js --target <chat_id_or_user_id> --file <local_path> [--parent-node <token>]
```

### Upload Only
Upload a file and get its `file_key` (for use in cards or rich text).
```bash
node skills/feishu-file/upload.js --file <local_path> [--parent-node <token>]
```

### Download File
Download a file or image from a message (or from drive for type=file).
```bash
node skills/feishu-file/download.js [--message-id <msg_id>] --file-key <key> --output <path> [--type file|image]
```
**Note:** The bot must have access to the message (be in the chat). For `--type image`, `--message-id` is required. For files sent by others, the `im:resource:read` scope is required.

### Download (v3)
```bash
node skills/feishu-file/download_v3.js <file_key> <output_path> <message_id>
```

### Download Image
```bash
node skills/feishu-file/download_image.js --image-key <key> --output <path>
```

## Environment
- Required: `FEISHU_APP_ID`, `FEISHU_APP_SECRET`
- Upload: `FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN` (or use `--parent-node` per call)
