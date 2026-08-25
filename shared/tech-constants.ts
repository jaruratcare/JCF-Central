export const PARENT_TYPE_CONSTRAINTS: Record<string, string | null> = {
  epic: null,
  story: "epic",
  task: "story",
  bug: null,
  subtask: "task",
};
