import { Queue, type JobsOptions } from "bullmq";
const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  maxRetriesPerRequest: 1,
};
const names = [
  "productscroll",
  "productscroll-media",
  "productscroll-events",
  "productscroll-fanout",
];
export const queues = new Map(
  names.map((name) => [
    name,
    new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 2000,
      },
    }),
  ]),
);
export const queueName = (job: string) =>
  job === "media"
    ? names[1]
    : job === "events"
      ? names[2]
      : job === "post-notifications" || job === "reconcile" || job === "cleanup"
        ? names[3]
        : names[0];
export const jobs = {
  add(name: string, data: unknown, options?: JobsOptions) {
    return queues.get(queueName(name))!.add(name, data, options);
  },
  getJob(id: string, queue = "productscroll") {
    return queues.get(queue)?.getJob(id);
  },
  async getJobCounts(...states: Parameters<Queue["getJobCounts"]>) {
    const counts = await Promise.all(
      [...queues.values()].map((queue) => queue.getJobCounts(...states)),
    );
    const total: Record<string, number> = {};
    for (const count of counts)
      for (const [state, value] of Object.entries(count))
        total[state] = (total[state] || 0) + value;
    return total;
  },
  async close() {
    await Promise.all([...queues.values()].map((queue) => queue.close()));
  },
};
