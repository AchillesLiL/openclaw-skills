#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getToken, fetchWithRetry } = require('../common/feishu-client.js');

// Drive upload: small files use upload_all, large use multipart. Threshold per Feishu docs (commonly 20MB).
const UPLOAD_ALL_SIZE_LIMIT = 20 * 1024 * 1024;
const DRIVE_UPLOAD_BASE = 'https://open.feishu.cn/open-apis/drive/v1/upload';
const DRIVE_MULTIPART_BASE = 'https://open.feishu.cn/open-apis/drive/v1/upload/multipart-upload-file-';

function getParentNode(options = {}) {
    return options.parentNode || process.env.FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN || null;
}

/**
 * Drive upload_all: single request for small files.
 * POST /drive/v1/files/upload_all, multipart: parent_type, parent_node, file_name, file.
 * Returns file_token (used as file_key for IM message).
 */
async function uploadAll(token, parentNode, filePath) {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('parent_type', 'explorer');
    formData.append('parent_node', parentNode);
    formData.append('file_name', fileName);
    formData.append('file', blob, fileName);

    const res = await fetchWithRetry(`${DRIVE_UPLOAD_BASE}/upload_all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
    const data = await res.json();
    if (data.code !== 0) {
        throw new Error(`Drive upload_all Error ${data.code}: ${data.msg}`);
    }
    return data.data.file_token;
}

/**
 * Drive multipart upload: prepare -> upload parts -> finish.
 * Uses upload_prepare, upload_part, upload_finish per Feishu multipart docs.
 */
async function uploadMultipart(token, parentNode, filePath) {
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    const fd = fs.openSync(filePath, 'r');

    try {
        // 1. Prepare
        const prepareRes = await fetchWithRetry(`${DRIVE_MULTIPART_BASE}/upload_prepare`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parent_type: 'explorer',
                parent_node: parentNode,
                file_name: fileName,
                file_size: fileSize
            })
        });
        const prepareData = await prepareRes.json();
        if (prepareData.code !== 0) {
            throw new Error(`Drive upload_prepare Error ${prepareData.code}: ${prepareData.msg}`);
        }
        const { upload_id, block_size } = prepareData.data;

        // 2. Upload parts
        const partList = [];
        let partIndex = 0;
        let offset = 0;
        const buffer = Buffer.alloc(block_size);
        while (offset < fileSize) {
            const n = fs.readSync(fd, buffer, 0, block_size, offset);
            if (n === 0) break;
            offset += n;
            const chunk = buffer.slice(0, n);

            const partForm = new FormData();
            partForm.append('upload_id', upload_id);
            partForm.append('part_index', String(partIndex));
            partForm.append('file', new Blob([chunk]));

            const partRes = await fetchWithRetry(`${DRIVE_MULTIPART_BASE}/upload_part`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: partForm
            });
            const partData = await partRes.json();
            if (partData.code !== 0) {
                throw new Error(`Drive upload_part Error ${partData.code}: ${partData.msg}`);
            }
            partList.push({ part_index: partIndex });
            partIndex++;
        }

        // 3. Finish
        const finishRes = await fetchWithRetry(`${DRIVE_MULTIPART_BASE}/upload_finish`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                upload_id,
                block_list: partList
            })
        });
        const finishData = await finishRes.json();
        if (finishData.code !== 0) {
            throw new Error(`Drive upload_finish Error ${finishData.code}: ${finishData.msg}`);
        }
        return finishData.data.file_token;
    } finally {
        fs.closeSync(fd);
    }
}

/**
 * Upload file to Feishu Drive (upload_all or multipart by size).
 * options.parentNode overrides FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN.
 * Returns file_token (use as file_key when sending IM file message).
 */
async function uploadFile(token, filePath, options = {}) {
    const parentNode = getParentNode(options);
    if (!parentNode) {
        throw new Error('Drive upload requires parent folder: set FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN or pass options.parentNode');
    }

    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    if (fileSize > 2 * 1024 * 1024 * 1024) {
        throw new Error(`File too large (${(fileSize / 1024 / 1024 / 1024).toFixed(2)} GB). Drive supports up to 2GB.`);
    }

    console.log(`Uploading ${fileName} (${fileSize} bytes)...`);

    const fileToken = fileSize <= UPLOAD_ALL_SIZE_LIMIT
        ? await uploadAll(token, parentNode, filePath)
        : await uploadMultipart(token, parentNode, filePath);

    return fileToken;
}

async function sendFileMessage(target, filePath, options = {}) {
    const token = await getToken();

    const fileKey = await uploadFile(token, filePath, options);
    console.log(`File uploaded. Key: ${fileKey}`);

    const receiveIdType = target.startsWith('oc_') ? 'chat_id' : 'open_id';

    const messageBody = {
        receive_id: target,
        msg_type: 'file',
        content: JSON.stringify({ file_key: fileKey })
    };

    console.log(`Sending file message to ${target}...`);

    const res = await fetchWithRetry(
        `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(messageBody)
        }
    );

    const data = await res.json();

    if (data.code !== 0) {
        throw new Error(`Send API Error ${data.code}: ${data.msg}`);
    }

    console.log('✅ Sent successfully!', data.data.message_id);
    return data.data;
}

module.exports = { sendFileMessage, uploadFile, getParentNode };

if (require.main === module) {
    program
      .option('--target <id>', 'Target Chat/User ID')
      .option('--file <path>', 'File path')
      .option('--parent-node <token>', 'Drive folder token (overrides FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN)')
      .parse(process.argv);

    const options = program.opts();

    (async () => {
        if (!options.target || !options.file) {
            console.error('Usage: node send.js --target <id> --file <path> [--parent-node <token>]');
            process.exit(1);
        }

        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            process.exit(1);
        }

        try {
            await sendFileMessage(options.target, filePath, {
                parentNode: options.parentNode || undefined
            });
        } catch (e) {
            console.error('Error:', e.message);
            process.exit(1);
        }
    })();
}
