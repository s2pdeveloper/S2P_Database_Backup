const path = require("path");
const { backupDatabase } = require("../backupHelper");

const shreddedFarmerConfig = {
  MONGO_URL: "mongodb+srv://theshreddedfarmers2p:SnTgh5aBp24uuZV3@cluster1.grfyjj6.mongodb.net/the_shredded_farmer_prod",
  BACKUP_NAME: "shredded-farmer-db-backup",
  CREDENTIALS_PATH: path.join(__dirname, "../credentials/shreddedCredential.json"),
  DRIVE_FOLDER_ID: "1ro0QK2esxTHD1A7vfgl3nAeV5pt3gu3T",
};
console.log("shreddedFarmerConfig", shreddedFarmerConfig);


const backupShreddedFarmer = () => backupDatabase(shreddedFarmerConfig);

module.exports = { backupShreddedFarmer };
