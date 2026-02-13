#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { uploadFile } = require('./send.js');

// Standalone upload script (Cycle #1648)
// Extracts upload logic to return file_key without sending a message.

async function main() {
    program
      .option('--file <path>', 'File path to upload')
      .option('--parent-node <token>', 'Drive folder token (overrides FEISHU_DRIVE_UPLOAD_FOLDER_TOKEN)')
      .parse(process.argv);

    const options = program.opts();

    if (!options.file) {
        console.error('Usage: node skills/feishu-file/upload.js --file <path> [--parent-node <token>]');
        process.exit(1);
    }

    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
        console.error('Error: File not found:', filePath);
        process.exit(1);
    }

    try {
        const { getToken } = require('../common/feishu-client.js');
        const token = await getToken();

        const fileKey = await uploadFile(token, filePath, {
            parentNode: options.parentNode || undefined
        });

        console.log(JSON.stringify({
            status: "success",
            file_key: fileKey,
            file_path: filePath
        }));

    } catch (e) {
        console.error(JSON.stringify({
            status: "error",
            error: e.message
        }));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
