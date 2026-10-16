export function isOverdue(dueDate: Date, status: string): boolean {
  if (status === 'Completed' || status === 'Cancelled') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return today > due;
}
