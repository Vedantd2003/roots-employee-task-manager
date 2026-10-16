import mongoose, { Schema } from 'mongoose';

interface ITaskCounter {
  _id: string;
  seq: number;
}

const TaskCounterSchema = new Schema<ITaskCounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const TaskCounter = mongoose.model<ITaskCounter>('TaskCounter', TaskCounterSchema);

export async function getNextTaskId(): Promise<string> {
  const counter = await TaskCounter.findByIdAndUpdate(
    'taskId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (!counter) throw new Error('Failed to generate task ID');
  return `TSK-${String(counter.seq).padStart(3, '0')}`;
}

export default TaskCounter;
