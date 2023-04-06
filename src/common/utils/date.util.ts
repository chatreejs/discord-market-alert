import { monthTH } from "../constants";

export function toBEYear(date: Date) {
  return date.getFullYear() + 543;
}

export function monthTHToMonth(month: string) {
  return monthTH.indexOf(month) + 1;
}
