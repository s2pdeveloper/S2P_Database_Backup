const cron = require("node-cron");
const { backupShreddedFarmer } = require("./backupScripts/shreddedFarmer");
const { backupQlNagpur } = require("./backupScripts/qlnagpur");

const startBackupJobs = () => {
  cron.schedule("0 23 * * *", () => {
    console.log(" Running daily scheduled backups...");
    backupShreddedFarmer();
    backupQlNagpur();
  });

  cron.schedule("0 11 * * *", () => {
    console.log(" Running additional QL Nagpur backup...");
    backupQlNagpur();
  });
};

startBackupJobs();
