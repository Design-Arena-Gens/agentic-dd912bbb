"use client";

import { useEffect, useMemo, useState } from "react";

type RoutineTask = {
  id: string;
  title: string;
  time: string;
  block: "Morning" | "Midday" | "Afternoon" | "Evening";
  details: string;
  completed: boolean;
};

const STORAGE_KEY = "minimal-routine-dashboard";

function createFallbackState(): RoutineState {
  return {
    tasks: defaultTasks.map((task) => ({ ...task })),
    hydrated: false,
  };
}

type RoutineState = {
  tasks: RoutineTask[];
  hydrated: boolean;
};

function mergeTaskState(storedTasks: unknown): RoutineTask[] {
  if (!Array.isArray(storedTasks)) {
    return defaultTasks;
  }

  const storedById = new Map(
    storedTasks
      .map((item) => {
        if (item && typeof item === "object" && "id" in item) {
          return [String((item as { id: string }).id), item] as const;
        }
        return null;
      })
      .filter(Boolean) as readonly (readonly [string, unknown])[],
  );

  return defaultTasks.map((task) => {
    const candidate = storedById.get(task.id) as
      | Partial<RoutineTask>
      | undefined;

    if (!candidate) return task;

    return {
      ...task,
      completed: Boolean(candidate.completed),
    };
  });
}

function loadRoutineState(): RoutineState {
  if (typeof window === "undefined") {
    return createFallbackState();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createFallbackState();

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return {
        tasks: mergeTaskState(parsed),
        hydrated: false,
      };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "tasks" in parsed &&
      Array.isArray((parsed as RoutineState).tasks)
    ) {
      return {
        tasks: mergeTaskState((parsed as RoutineState).tasks),
        hydrated: Boolean((parsed as RoutineState).hydrated),
      };
    }
  } catch (error) {
    console.error("Failed to parse routine from localStorage", error);
  }

  return createFallbackState();
}

const defaultTasks: RoutineTask[] = [
  {
    id: "hydrate",
    title: "Hydrate and stretch",
    time: "06:30",
    block: "Morning",
    details: "500ml water + 5 minute mobility routine",
    completed: false,
  },
  {
    id: "plan",
    title: "Plan the day",
    time: "07:15",
    block: "Morning",
    details: "Review calendar and set top 3 priorities",
    completed: false,
  },
  {
    id: "deep-work",
    title: "Deep work sprint",
    time: "09:00",
    block: "Midday",
    details: "90 minute focus block with notifications silenced",
    completed: false,
  },
  {
    id: "movement",
    title: "Movement break",
    time: "12:30",
    block: "Midday",
    details: "20 minute walk and light stretching",
    completed: false,
  },
  {
    id: "check-in",
    title: "Quick inbox sweep",
    time: "15:00",
    block: "Afternoon",
    details: "Respond to priority messages only",
    completed: false,
  },
  {
    id: "wrap-up",
    title: "Daily review",
    time: "17:30",
    block: "Afternoon",
    details: "Log progress and queue tasks for tomorrow",
    completed: false,
  },
  {
    id: "unwind",
    title: "Unwind routine",
    time: "20:30",
    block: "Evening",
    details: "Digital sunset, 30 minutes reading",
    completed: false,
  },
];

const blockOrder: RoutineTask["block"][] = [
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
];

const blockLabels: Record<RoutineTask["block"], string> = {
  Morning: "Daybreak",
  Midday: "Momentum",
  Afternoon: "Execution",
  Evening: "Reset",
};

function parseMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function Home() {
  const initialState = useMemo(() => loadRoutineState(), []);

  const [tasks, setTasks] = useState<RoutineTask[]>(initialState.tasks);
  const [hydrated, setHydrated] = useState(initialState.hydrated);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({ tasks, hydrated });
    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [tasks, hydrated]);

  const totalCompleted = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  const totalTasks = tasks.length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);

  const upcoming = useMemo(() => {
    return [...tasks]
      .filter((task) => !task.completed)
      .sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time))
      .slice(0, 3);
  }, [tasks]);

  const now = useMemo(() => new Date(), []);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  const trend = completionRate >= 80 ? "On track" : "Keep going";

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Daily Rhythm
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">Routine Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 px-3 py-1 backdrop-blur">
              {formattedDate}
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
              {trend}
            </span>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <p className="text-sm text-slate-400">Completion</p>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-4xl font-semibold">{completionRate}%</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {totalCompleted} / {totalTasks} tasks
              </span>
            </div>
            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <p className="text-sm text-slate-400">Upcoming focus</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {upcoming.length === 0 ? (
                <li className="text-slate-400">All set for today.</li>
              ) : (
                upcoming.map((task) => (
                  <li key={task.id} className="flex items-center justify-between">
                    <span>{task.title}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                      {task.time}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <p className="text-sm text-slate-400">Quick check-in</p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <button
                  type="button"
                  onClick={() => setHydrated(!hydrated)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/10 transition ${hydrated ? "bg-sky-400/30 text-sky-200" : "bg-transparent text-slate-500"}`}
                >
                  {hydrated ? "✓" : ""}
                </button>
                Logged water intake
              </label>
              <p className="rounded-2xl border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-slate-300">
                Tap the circle once you&apos;ve refilled your bottle. Aim for 3 refills before the evening routine.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-6">
          {blockOrder.map((block) => {
            const tasksInBlock = tasks
              .filter((task) => task.block === block)
              .sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time));

            return (
              <div
                key={block}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
              >
                <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {block}
                    </p>
                    <h2 className="text-xl font-medium text-slate-100">
                      {blockLabels[block]}
                    </h2>
                  </div>
                  <span className="text-sm text-slate-400">
                    {tasksInBlock.length} task{tasksInBlock.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ul className="space-y-3">
                  {tasksInBlock.map((task) => (
                    <li
                      key={task.id}
                      className={`flex items-start justify-between gap-4 rounded-2xl border border-white/10 p-4 transition ${task.completed ? "bg-emerald-500/10" : "bg-white/5"}`}
                    >
                      <div className="flex flex-1 items-start gap-4">
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${task.completed ? "border-emerald-300 bg-emerald-400/20 text-emerald-200" : "border-white/10 text-transparent"}`}
                          aria-label={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`}
                        >
                          <span className="text-sm font-semibold">✓</span>
                        </button>
                        <div className="space-y-1">
                          <p className={`text-sm font-medium ${task.completed ? "text-emerald-100" : "text-slate-100"}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-400">{task.details}</p>
                        </div>
                      </div>
                      <span className="mt-1 inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {task.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
