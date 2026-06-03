export function getTrackedLessons(items, getLesson) {
  return [...new Set(
    items
      .map(item => Number(getLesson(item)))
      .filter(lessonId => Number.isFinite(lessonId) && lessonId > 0)
  )].sort((a, b) => a - b)
}
