const path = require("path");
const { backupDatabase } = require("../backupHelper");

const qlNagpurConfig = {
  MONGO_URL: "mongodb+srv://qlnagpur:OoEwlQGxV0zsHJZe@qualichem.zu0g4.mongodb.net/lims_prod",
  BACKUP_NAME: "ql-nagpur-db-backup",
  CREDENTIALS_PATH: path.join(__dirname, "../credentials/qlNagpurCredential.json"),
  DRIVE_FOLDER_ID: "1ZXzQh057x-8-_5xCqoIgzYYDrdbAnWlu",
};

const backupQlNagpur = () => backupDatabase(qlNagpurConfig);

module.exports = { backupQlNagpur };
