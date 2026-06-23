import type { Activity } from "./activity.ts";
import { metersToMiles } from "./distance.ts";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fiveKilometersMeters = 5000;
const tenKilometersMeters = 10000;
const fastestReasonableSecondsPerKilometer = 120;
const slowestReasonableSecondsPerKilometer = 900;

export type EstimatedBestEffort = {
  activity: Activity;
  distanceMeters: number;
  estimatedSeconds: number;
};

export type RunningOverview = {
  longestRun?: Activity;
  fastest5k?: EstimatedBestEffort;
  fastest10k?: EstimatedBestEffort;
  mostPopularDay?: {
    day: string;
    count: number;
  };
  annualDistance: Array<{
    year: number;
    miles: number;
  }>;
  totalMilesRun: number;
  yearsOfActivity: number;
  activityCount: number;
};

export type YearRunningOverview = {
  year: number;
  previousYear?: number;
  nextYear?: number;
  longestRun?: Activity;
  fastest5k?: EstimatedBestEffort;
  allTimeFastest5k?: EstimatedBestEffort;
  mostPopularDay?: {
    day: string;
    count: number;
  };
  monthlyDistance: Array<{
    month: number;
    miles: number;
  }>;
  totalMilesRun: number;
  activityCount: number;
};

export type MonthRunningOverview = {
  year: number;
  month: number;
  dailyDistance: Array<{
    day: number;
    miles: number;
  }>;
  totalMilesRun: number;
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
  const annualDistanceMeters = new Map<number, number>();
  let totalDistanceMeters = 0;

  for (const activity of runs) {
    const day = activity.startTime.getDay();
    const year = activity.startTime.getFullYear();
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    years.add(year);
    annualDistanceMeters.set(year, (annualDistanceMeters.get(year) ?? 0) + activity.distanceMeters);
    totalDistanceMeters += activity.distanceMeters;
  }

  const popularDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const annualDistance = [...annualDistanceMeters.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, meters]) => ({
      year,
      miles: metersToMiles(meters)
    }));

  return {
    longestRun,
    fastest5k: findFastestEstimatedEffort(runs, fiveKilometersMeters),
    fastest10k: findFastestEstimatedEffort(runs, tenKilometersMeters),
    mostPopularDay: popularDayEntry ? { day: weekdays[popularDayEntry[0]], count: popularDayEntry[1] } : undefined,
    annualDistance,
    totalMilesRun: metersToMiles(totalDistanceMeters),
    yearsOfActivity: years.size,
    activityCount: runs.length
  };
}

export function calculateYearRunningOverview(activities: Activity[], year: number): YearRunningOverview {
  const allRuns = activities.filter((activity) => activity.activityType === "run");
  const yearRuns = allRuns.filter((activity) => activity.startTime.getFullYear() === year);
  const availableYears = [...new Set(allRuns.map((activity) => activity.startTime.getFullYear()))].sort((a, b) => a - b);
  const previousYear = availableYears.filter((availableYear) => availableYear < year).at(-1);
  const nextYear = availableYears.find((availableYear) => availableYear > year);
  const longestRun = yearRuns.reduce<Activity | undefined>((current, activity) => {
    if (!current || activity.distanceMeters > current.distanceMeters) return activity;
    return current;
  }, undefined);

  const dayCounts = new Map<number, number>();
  const monthlyDistanceMeters = new Map<number, number>();
  let totalDistanceMeters = 0;

  for (const activity of yearRuns) {
    const day = activity.startTime.getDay();
    const month = activity.startTime.getMonth() + 1;
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    monthlyDistanceMeters.set(month, (monthlyDistanceMeters.get(month) ?? 0) + activity.distanceMeters);
    totalDistanceMeters += activity.distanceMeters;
  }

  const popularDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const monthlyDistance = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      month,
      miles: metersToMiles(monthlyDistanceMeters.get(month) ?? 0)
    };
  });

  return {
    year,
    previousYear,
    nextYear,
    longestRun,
    fastest5k: findFastestEstimatedEffort(yearRuns, fiveKilometersMeters),
    allTimeFastest5k: findFastestEstimatedEffort(allRuns, fiveKilometersMeters),
    mostPopularDay: popularDayEntry ? { day: weekdays[popularDayEntry[0]], count: popularDayEntry[1] } : undefined,
    monthlyDistance,
    totalMilesRun: metersToMiles(totalDistanceMeters),
    activityCount: yearRuns.length
  };
}

export function calculateMonthRunningOverview(activities: Activity[], year: number, month: number): MonthRunningOverview {
  const runs = activities.filter((activity) =>
    activity.activityType === "run"
    && activity.startTime.getFullYear() === year
    && activity.startTime.getMonth() + 1 === month
  );
  const dailyDistanceMeters = new Map<number, number>();
  let totalDistanceMeters = 0;

  for (const activity of runs) {
    const day = activity.startTime.getDate();
    dailyDistanceMeters.set(day, (dailyDistanceMeters.get(day) ?? 0) + activity.distanceMeters);
    totalDistanceMeters += activity.distanceMeters;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyDistance = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day,
      miles: metersToMiles(dailyDistanceMeters.get(day) ?? 0)
    };
  });

  return {
    year,
    month,
    dailyDistance,
    totalMilesRun: metersToMiles(totalDistanceMeters),
    activityCount: runs.length
  };
}

function findFastestEstimatedEffort(runs: Activity[], distanceMeters: number): EstimatedBestEffort | undefined {
  return runs
    .filter((activity) => activity.distanceMeters >= distanceMeters && hasReasonableAveragePace(activity))
    .map((activity) => ({
      activity,
      distanceMeters,
      estimatedSeconds: Math.round(activity.movingSeconds * distanceMeters / activity.distanceMeters)
    }))
    .sort((a, b) => a.estimatedSeconds - b.estimatedSeconds)[0];
}

function hasReasonableAveragePace(activity: Activity): boolean {
  if (activity.movingSeconds <= 0 || activity.distanceMeters <= 0) return false;
  const secondsPerKilometer = activity.movingSeconds / (activity.distanceMeters / 1000);
  return secondsPerKilometer >= fastestReasonableSecondsPerKilometer
    && secondsPerKilometer <= slowestReasonableSecondsPerKilometer;
}
