import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

// Map file extensions to Bootstrap Icons
const iconMap = {
    '.html': 'bi-file-earmark-code',
    '.css': 'bi-file-earmark-code',
    '.js': 'bi-file-earmark-code',
    '.json': 'bi-file-earmark-code',
    '.txt': 'bi-file-earmark-text',
    '.pdf': 'bi-file-earmark-pdf',
    '.zip': 'bi-file-earmark-zip',
    '.mp4': 'bi-file-earmark-play',
    '.mp3': 'bi-file-earmark-music',
    '.wav': 'bi-file-earmark-music',
    '.png': 'bi-file-earmark-image',
    '.jpg': 'bi-file-earmark-image',
    '.jpeg': 'bi-file-earmark-image',
    '.gif': 'bi-file-earmark-image',
    '.svg': 'bi-file-earmark-image',
    '.doc': 'bi-file-earmark-word',
    '.docx': 'bi-file-earmark-word',
    '.xls': 'bi-file-earmark-excel',
    '.xlsx': 'bi-file-earmark-excel',
    '.ppt': 'bi-file-earmark-ppt',
    '.pptx': 'bi-file-earmark-ppt',
    '.odt': 'bi-file-earmark-text',
    '.ods': 'bi-file-earmark-excel',
    '.odp': 'bi-file-earmark-ppt',
    'folder': 'bi-folder',
    'unknown': 'bi-file-earmark',
};

// Get MIME type based on file extension
const getMimeType = (filePath) => {
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
    };
    return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
};

// Get Bootstrap icon class for the given file type or folder
const getIcon = (filePath) => {
    if (fs.statSync(filePath).isDirectory()) {
        return iconMap['folder']; // Folder icon
    }
    
    const ext = path.extname(filePath).toLowerCase();
    return iconMap[ext] || iconMap['unknown']; // Fallback to a generic file icon if not found
};

// Utility function to encode URLs properly only when needed
const encodeUrl = (url) => {
    // Only encode if it's not already encoded
    try {
        // Decode the URL and check if it matches the original one
        return decodeURIComponent(url) === url ? encodeURIComponent(url) : url;
    } catch (e) {
        // If decoding fails, it's already encoded, so return it as is
        return url;
    }
};

const server = http.createServer(async (req, res) => {
    let filePath = path.join(PUBLIC_DIR, decodeURIComponent(req.url));

    try {
        if (!filePath.startsWith(PUBLIC_DIR)) {
            throw new Error(`403 Forbidden: Access Denied to ${req.url}`);
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            fs.readdir(filePath, async (err, files) => {
                if (err) {
                    throw new Error(`500 Internal Server Error: Error reading directory ${filePath}: ${err.message}`);
                }

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Aetern Archive</title>`);
                res.write(`<link rel="stylesheet" href="/assets/css/bootstrap-icons.css">`);
                res.write(`<link rel="stylesheet" href="/assets/css/water.css">`);
                res.write(`<link rel="icon" href="/favicon.ico" type="image/x-icon">`);
                res.write(`<style>
                    @media (max-width: 768px) {
                        nav h1 {
                            font-size: 18px;
                        }
                        ul {
                            padding-left: 20px;
                        }
                    }
             
                    }
                    nav {
                        padding: 10px;
                        width: 100%;
                        position: fixed;
                        top: 0;
                        left: 0;
                        display: flex;
                        justify-content: flex-start;
                        align-items: center;
                        z-index: 10;
                    }
                    h1 {
                        color: white;
                        margin-left: 10px;
                    }
                    .logo {
                        width: 120px;
                        height: auto;
                    }
                    .content {
                        margin-top: 80px;
                        padding: 10px;
                        max-width: 100%;
                        overflow-x: auto;
                    }
                 
                </style></head><body>`);

                // Navbar code with logo
                res.write(`<nav>
                    <h1><a href="#" style="position: absolute; top: 10px; left: 10px;">
                        <img src="/assets/images/aetern-removebg-preview.png" alt="Aetern Logo" class="logo">
                    </a></h1>
                </nav>`);

                // Content section
                res.write(`<div class="content">
                    <h2>Index of ${req.url}</h2><ul>`);

                if (req.url !== '/') {
                    res.write('<li><a href=".." class="back-link"><i class="bi bi-arrow-left"></i> Back</a></li>');
                }

                // Loop through files and create links, only encode URL once
                for (const file of files) {
                    const fullPath = path.join(filePath, file);
                    const icon = getIcon(fullPath);
                    const urlPath = path.join(req.url, file).replace(/\\/g, '/');
                    const encodedUrlPath = encodeUrl(urlPath); // encode URL only when necessary
                    res.write(`<li><i class="bi ${icon}" style="font-size: 20px;"></i> <a href="${encodedUrlPath}">${file}</a></li>`);
                }

                res.write('</ul></div></body></html>');
                res.end();
            });
        } else if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
            fs.createReadStream(filePath).pipe(res);
        } else {
            throw new Error(`404 Not Found: The file ${req.url} was not found.`);
        }
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(createErrorPage("Error", error.message)); // Directly send the error message from the server
    }
});

// Utility function to generate error pages with dynamic messages
const createErrorPage = (title, message) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/css/bootstrap-icons.css">
    <link rel="stylesheet" href="/assets/css/water.css">
      <link rel="icon" href="/favicon.ico" type="image/x-icon">

      <style>
       
        
        nav {
            padding: 10px;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            z-index: 10;
        }
        h1 {
            color: white;
            margin-left: 10px;
        }
        .logo {
            width: 120px;
            height: auto;
        }
        .content {
            margin-top: 80px;
            padding: 10px;
            max-width: 100%;
            text-align: center;
        }
        .error-container {
            margin-top: 50px;
        }
        
    </style>
</head>
<body>
    <!-- Navbar with logo -->
    <nav>
        <h1><a href="/" style="position: absolute; top: 10px; left: 10px;">
            <img src="/assets/images/aetern-removebg-preview.png" alt="Aetern Logo" class="logo">
        </a></h1>
    </nav>

    <!-- Error page content -->
    <div class="content">
        <div class="error-container">
            <h2 style="font-size: 50px;">${title}</h2>
            <pre>${message}</pre>
            <p><a href="/" class="back-link"><i class="bi bi-arrow-left"></i> Go Back Home</a></p>
        </div>
    </div>
</body>
</html>`;
};

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
