import moment from "moment-timezone";

export const toBuddhistYear = (moment: moment.Moment, format): string => {
  const christianYear = moment.format("YYYY");
  const buddhishYear = (parseInt(christianYear) + 543).toString();
  return moment
    .format(
      format
        .replace("YYYY", buddhishYear)
        .replace("YY", buddhishYear.substring(2, 4))
    )
    .replace(christianYear, buddhishYear);
};
