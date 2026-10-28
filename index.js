const cron = require("node-cron");
const { backupShreddedFarmer } = require("./backupScripts/shreddedFarmer");

const startBackupJobs = () => {
  cron.schedule("0 23 * * *", () => {
    console.log(" Running daily scheduled backups...");
  });
};

backupShreddedFarmer();

startBackupJobs();
