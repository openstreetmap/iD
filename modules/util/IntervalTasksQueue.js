/**
 * IntervalTasksQueue
 * Enabled task execution under interval limit
 */
export class IntervalTasksQueue {

  /**
   * Interval in milliseconds inside which only 1 task can execute.
   * e.g. if interval is 200ms, and 5 async tasks are unqueued,
   * they will complete in ~1s if not cleared
   * @param {number} intervalInMs
   */
  constructor(intervalInMs) {
    this.intervalInMs = intervalInMs;
    this.pendingHandles = [];
    this.time = 0;
  }

  enqueue(task) {
    let taskTimeout = this.time;
    this.time += this.intervalInMs;
    this.pendingHandles.push(setTimeout(() => {
      this.time -= this.intervalInMs;
      task();
    }, taskTimeout));
  }

  clear() {
    this.pendingHandles.forEach((timeoutHandle) => {
      clearTimeout(timeoutHandle);
    });
    this.pendingHandles = [];
    this.time = 0;
  }
}
