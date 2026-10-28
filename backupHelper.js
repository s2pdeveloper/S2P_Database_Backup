const { spawn } = require("child_process");
const { google } = require("googleapis");

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

// Streams `mongodump --archive --gzip` straight to Google Drive; nothing is written to local disk.
// Restore with: mongorestore --uri="<MONGO_URL>" --archive=<file>.archive.gz --gzip
const backupDatabase = async ({
  MONGO_URL,
  BACKUP_NAME,
  CREDENTIALS_PATH,
  DRIVE_FOLDER_ID,
}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${BACKUP_NAME}-${timestamp}.archive.gz`;

  const drive = await authenticateGoogleDrive(CREDENTIALS_PATH);
  if (!drive) return;

  console.log(`Running backup for ${BACKUP_NAME}...`);

  const dump = spawn("mongodump", [`--uri=${MONGO_URL}`, "--archive", "--gzip"]);
  let stderr = "";
  dump.stderr.on("data", (chunk) => (stderr += chunk));
  const dumpDone = new Promise((resolve) =>
    dump.on("close", (code) => resolve(code))
  );
  dump.on("error", (err) =>
    console.error(`Could not start mongodump for ${BACKUP_NAME}:`, err.message)
  );

  try {
    const response = await drive.files.create({
      resource: { name: fileName, parents: [DRIVE_FOLDER_ID] },
      media: { mimeType: "application/gzip", body: dump.stdout },
      fields: "id",
    });

    const code = await dumpDone;
    if (code !== 0) {
      console.error(`Backup failed for ${BACKUP_NAME}:`, stderr.trim());
      await drive.files.delete({ fileId: response.data.id });
      return;
    }
    console.log(`Backup uploaded: ${fileName} (File ID ${response.data.id})`);
  } catch (error) {
    dump.kill();
    console.error(`Error uploading backup for ${BACKUP_NAME}:`, error.message);
  }
};

module.exports = { backupDatabase };
