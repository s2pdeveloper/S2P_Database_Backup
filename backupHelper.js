const { exec } = require("child_process");
const fs = require("fs");
const archiver = require("archiver");
const { google } = require("googleapis");
const path = require("path");
const os = require("os");

// Dumps are staged in the OS temp dir and deleted after upload; Drive is the only copy.
const BACKUP_DIR = os.tmpdir();

const authenticateGoogleDrive = async (credentialsPath) => {
  try {
    console.log(`🔑 Reading credentials from: ${credentialsPath}`);
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("Google Drive authentication failed:", error.message);
    return null;
  }
};

const uploadToDrive = async (filePath, fileName, credentialsPath, folderId) => {
  const drive = await authenticateGoogleDrive(credentialsPath);
  if (!drive) return;

  try {
    const response = await drive.files.create({
      resource: { name: fileName, parents: [folderId] },
      media: {
        mimeType: "application/zip",
        body: fs.createReadStream(filePath),
      },
      fields: "id",
    });
    console.log(`Backup uploaded: File ID ${response.data.id}`);
  } catch (error) {
    console.error("Error uploading file:", error.message);
  }
};

const backupDatabase = async ({
  MONGO_URL,
  BACKUP_NAME,
  CREDENTIALS_PATH,
  DRIVE_FOLDER_ID,
}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dumpPath = path.join(BACKUP_DIR, `${BACKUP_NAME}-${timestamp}`);
  const zipPath = `${dumpPath}.zip`;
  const dumpCommand = `mongodump --uri="${MONGO_URL}" --out="${dumpPath}" --gzip`;

  console.log(`Running backup for ${BACKUP_NAME}...`);

  exec(dumpCommand, (error) => {
    if (error) {
      console.error(`Backup failed for ${BACKUP_NAME}:`, error.message);
      fs.rmSync(dumpPath, { recursive: true, force: true });
      return;
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(dumpPath, false);
    archive.finalize();

    output.on("close", async () => {
      console.log(`Backup ZIP created: ${zipPath}`);
      fs.rmSync(dumpPath, { recursive: true, force: true });
      try {
        await uploadToDrive(
          zipPath,
          `${BACKUP_NAME}-${timestamp}.zip`,
          CREDENTIALS_PATH,
          DRIVE_FOLDER_ID
        );
      } finally {
        fs.rmSync(zipPath, { force: true });
      }
    });

    archive.on("error", (err) => {
      console.error("Error creating ZIP:", err);
      fs.rmSync(dumpPath, { recursive: true, force: true });
      fs.rmSync(zipPath, { force: true });
    });
  });
};

module.exports = { backupDatabase };
