import type { Activity } from "./activity.ts";
import { metersToMiles } from "./distance.ts";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type RunningOverview = {
  longestRun?: Activity;
  mostPopularDay?: {
    day: string;
    count: number;
  };
  totalMilesRun: number;
  yearsOfActivity: number;
  activityCount: number;
};

export function calculateRunningOverview(activities: Activity[]): RunningOverview {
  const runs = activities.filter((activity) => activity.activityType === "run");
  const longestRun = runs.reduce<Activity | undefined>((current, activity) => {
    if (!current || activity.distanceMeters > current.distanceMeters) return activity;
    return current;
  }, undefined);

  const dayCounts = new Map<number, number>();
  const years = new Set<number>();
  let totalDistanceMeters = 0;

  for (const activity of runs) {
    const day = activity.startTime.getDay();
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    years.add(activity.startTime.getFullYear());
    totalDistanceMeters += activity.distanceMeters;
  }

  const popularDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];

  return {
    longestRun,
    mostPopularDay: popularDayEntry ? { day: weekdays[popularDayEntry[0]], count: popularDayEntry[1] } : undefined,
    totalMilesRun: metersToMiles(totalDistanceMeters),
    yearsOfActivity: years.size,
    activityCount: runs.length
  };
}
