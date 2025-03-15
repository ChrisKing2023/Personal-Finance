import generateUserBudget from "./generateUserBudget";
import generateReports from "./generateReports";
import generateUserReport from "./generateUserReport";
import getAvailableDates from "./getAvailableDates";
import generateUserSummaryReport from "./generateUserSummeryReport";

const reportController = {
  ...generateReports,
  ...generateUserBudget,
  ...generateUserReport,
  ...getAvailableDates,
  ...generateUserSummaryReport,
};

export default reportController;
