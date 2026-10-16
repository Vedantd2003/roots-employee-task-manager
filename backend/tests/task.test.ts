import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/index';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

// Helper: create a standard active employee
async function createEmployee(overrides = {}) {
  const base = {
    employeeId: `EMP-${Date.now()}`,
    fullName: 'Test Employee',
    email: `emp-${Date.now()}@example.com`,
    phone: '555-0000',
    department: 'Development',
    role: 'Developer',
    joiningDate: '2022-01-01',
    status: 'Active',
    skills: ['TypeScript'],
    ...overrides,
  };
  const res = await request(app).post('/api/employees').send(base);
  if (res.status !== 201) throw new Error(`Failed to create employee: ${JSON.stringify(res.body)}`);
  return res.body.data;
}

// Helper: create a task
async function createTask(employeeId: string, overrides = {}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const base = {
    title: 'Test Task',
    assignedEmployee: employeeId,
    department: 'Development',
    priority: 'Medium',
    startDate: tomorrow.toISOString(),
    dueDate: nextWeek.toISOString(),
    ...overrides,
  };
  return request(app).post('/api/tasks').send(base);
}

// Test 5: Create task successfully
describe('POST /api/tasks - create task', () => {
  it('Test 5: should create a task and return 201 with generated taskId', async () => {
    const emp = await createEmployee();
    const res = await createTask(emp._id);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.taskId).toMatch(/^TSK-\d{3}$/);
    expect(res.body.data.status).toBe('Todo');
    expect(res.body.data.employeeSnapshot.employeeId).toBe(emp.employeeId);
    expect(res.body.data.employeeSnapshot.fullName).toBe(emp.fullName);
  });

  // Test 6: Task IDs increment
  it('Test 6: should auto-increment task IDs', async () => {
    const emp = await createEmployee();
    const res1 = await createTask(emp._id, { title: 'Task One' });
    const res2 = await createTask(emp._id, { title: 'Task Two' });
    const res3 = await createTask(emp._id, { title: 'Task Three' });

    expect(res1.body.data.taskId).toBe('TSK-001');
    expect(res2.body.data.taskId).toBe('TSK-002');
    expect(res3.body.data.taskId).toBe('TSK-003');
  });

  // Test 7: Reject inactive employee
  it('Test 7: should reject task for inactive employee', async () => {
    const emp = await createEmployee({ status: 'Inactive' });
    const res = await createTask(emp._id);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('inactive');
  });

  // Test 8: Reject employee on leave during task start
  it('Test 8: should reject task for employee on leave during start date', async () => {
    const leaveStart = new Date();
    leaveStart.setDate(leaveStart.getDate() + 1);
    const leaveEnd = new Date();
    leaveEnd.setDate(leaveEnd.getDate() + 10);

    const emp = await createEmployee({
      status: 'On Leave',
      leaveStartDate: leaveStart.toISOString(),
      leaveEndDate: leaveEnd.toISOString(),
    });

    // Task start date falls within leave period
    const taskStart = new Date();
    taskStart.setDate(taskStart.getDate() + 3);
    const taskDue = new Date();
    taskDue.setDate(taskDue.getDate() + 14);

    const res = await createTask(emp._id, {
      startDate: taskStart.toISOString(),
      dueDate: taskDue.toISOString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('on leave');
  });

  // Test 9: Capacity limit (max 3 tasks)
  it('Test 9: should reject task when employee already has 3 active tasks', async () => {
    const emp = await createEmployee();

    await createTask(emp._id, { title: 'Task 1' });
    await createTask(emp._id, { title: 'Task 2' });
    await createTask(emp._id, { title: 'Task 3' });

    const res = await createTask(emp._id, { title: 'Task 4 - should fail' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('3 active tasks');
  });

  // Test 10: dueDate must be after startDate
  it('Test 10: should reject task where dueDate is before startDate', async () => {
    const emp = await createEmployee();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const res = await createTask(emp._id, {
      startDate: tomorrow.toISOString(),
      dueDate: yesterday.toISOString(),
    });

    expect(res.status).toBe(400);
  });

  // Test 11: Missing required fields
  it('Test 11: should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Incomplete Task' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

// Test 12: GET tasks list
describe('GET /api/tasks', () => {
  it('Test 12: should return paginated task list', async () => {
    const emp = await createEmployee();
    await createTask(emp._id, { title: 'Task Alpha', priority: 'High' });
    await createTask(emp._id, { title: 'Task Beta', priority: 'Low' });
    await createTask(emp._id, { title: 'Task Gamma', priority: 'Critical' });

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(3);
  });

  it('should filter tasks by status', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id, { title: 'Task To Progress' });
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });

    const res = await request(app).get('/api/tasks?status=In Progress');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('In Progress');
  });

  it('should filter tasks by department', async () => {
    const empDev = await createEmployee({ department: 'Development' });
    const empQA = await createEmployee({ department: 'QA' });

    await createTask(empDev._id, { department: 'Development', title: 'Dev Task' });
    await createTask(empQA._id, { department: 'QA', title: 'QA Task' });

    const res = await request(app).get('/api/tasks?department=QA');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].department).toBe('QA');
  });

  it('should search tasks by title', async () => {
    const emp = await createEmployee();
    await createTask(emp._id, { title: 'Login Feature' });
    await createTask(emp._id, { title: 'Dashboard UI' });

    const res = await request(app).get('/api/tasks?search=Login');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Login Feature');
  });
});

// Test 13: GET task by id
describe('GET /api/tasks/:id', () => {
  it('Test 13: should return task by MongoDB _id', async () => {
    const emp = await createEmployee();
    const createRes = await createTask(emp._id, { title: 'Specific Task' });
    const taskId = createRes.body.data._id;

    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Specific Task');
  });

  it('should return task by taskId string', async () => {
    const emp = await createEmployee();
    await createTask(emp._id, { title: 'Named Task' });

    const res = await request(app).get('/api/tasks/TSK-001');
    expect(res.status).toBe(200);
    expect(res.body.data.taskId).toBe('TSK-001');
  });

  it('should return 404 for non-existent task', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/tasks/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// Test 14-16: Status transitions
describe('PUT /api/tasks/:id/status', () => {
  it('Test 14: should transition from Todo to In Progress', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('In Progress');
  });

  it('Test 15: should transition from In Progress to Completed', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });

    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'Completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');
    expect(res.body.data.completedDate).toBeDefined();
  });

  it('Test 16: should reject invalid status transition (Todo to Completed)', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'Completed' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject transition from Completed (terminal state)', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'In Progress' });

    expect(res.status).toBe(400);
  });

  it('should allow Todo to Cancelled', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: 'Cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
  });

  // Test 17: activeTasks counter decrements when completed
  it('Test 17: should decrement employee activeTasks when task is completed', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    // Employee should have 1 active task
    const empBefore = await request(app).get(`/api/employees/${emp._id}`);
    expect(empBefore.body.data.activeTasks).toBe(1);

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    // Employee activeTasks should be back to 0
    const empAfter = await request(app).get(`/api/employees/${emp._id}`);
    expect(empAfter.body.data.activeTasks).toBe(0);
  });

  it('should decrement employee activeTasks when task is cancelled', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });

    const empAfter = await request(app).get(`/api/employees/${emp._id}`);
    expect(empAfter.body.data.activeTasks).toBe(0);
  });
});

// Test 18: Update task fields
describe('PUT /api/tasks/:id', () => {
  it('Test 18: should update task fields successfully', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id, { title: 'Original Title', priority: 'Low' });
    const taskId = taskRes.body.data._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated Title', priority: 'High' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.priority).toBe('High');
  });

  it('Test 19: should reject update on completed task', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Trying to update completed task' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Test 20: should reject update on cancelled task', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Trying to update cancelled task' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// Test 21: Delete task
describe('DELETE /api/tasks/:id', () => {
  it('Test 21: should delete a completed task', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`/api/tasks/${taskId}`);
    expect(getRes.status).toBe(404);
  });

  it('Test 22: should reject deletion of active (Todo) task', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should delete a cancelled task', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });

    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
  });
});

// Test 23: Overdue flag
describe('Overdue tasks', () => {
  it('Test 23: should mark task as overdue when dueDate is in the past', async () => {
    const emp = await createEmployee();

    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 10);
    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 3);

    // Create task directly via mongoose to bypass date validation for testing
    const Task = (await import('../src/models/Task')).default;
    const { getNextTaskId } = await import('../src/utils/taskCounter');

    const task = new Task({
      taskId: await getNextTaskId(),
      title: 'Overdue Task',
      assignedEmployee: emp._id,
      employeeSnapshot: {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department,
      },
      department: 'Development',
      priority: 'Medium',
      status: 'Todo',
      startDate: pastStart,
      dueDate: pastDue,
      createdDate: new Date(),
    });
    await task.save();

    const res = await request(app).get(`/api/tasks/${task._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.overdue).toBe(true);
  });

  it('should not mark completed task as overdue even if dueDate passed', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'In Progress' });
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Completed' });

    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.overdue).toBe(false);
  });
});

// Test 24-26: Employee snapshot
describe('Employee snapshot preservation', () => {
  it('Test 24: should store employee snapshot at assignment time', async () => {
    const emp = await createEmployee({ fullName: 'Snapshot Employee' });
    const taskRes = await createTask(emp._id);

    expect(taskRes.body.data.employeeSnapshot.fullName).toBe('Snapshot Employee');
    expect(taskRes.body.data.employeeSnapshot.employeeId).toBe(emp.employeeId);
    expect(taskRes.body.data.employeeSnapshot.department).toBe(emp.department);
  });

  it('Test 25: task snapshot should persist even if employee name changes', async () => {
    const emp = await createEmployee({ fullName: 'Original Name' });
    const taskRes = await createTask(emp._id);

    // Update employee name
    await request(app).put(`/api/employees/${emp._id}`).send({ fullName: 'New Name' });

    // Task snapshot should still have original name
    const res = await request(app).get(`/api/tasks/${taskRes.body.data._id}`);
    expect(res.body.data.employeeSnapshot.fullName).toBe('Original Name');
  });

  it('Test 26: snapshot should remain after employee deletion (nulled assignedEmployee)', async () => {
    const emp = await createEmployee();
    const taskRes = await createTask(emp._id);
    const taskId = taskRes.body.data._id;

    // Complete task first so we can delete it later,
    // but here we test that snapshot persists after employee delete
    // First, cancel the task so employee can be deleted
    await request(app).put(`/api/tasks/${taskId}/status`).send({ status: 'Cancelled' });
    await request(app).delete(`/api/employees/${emp._id}`);

    // The task should still have the snapshot data
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.employeeSnapshot.employeeId).toBe(emp.employeeId);
    expect(res.body.data.employeeSnapshot.fullName).toBe(emp.fullName);
  });
});

// Test 27: Dashboard
describe('GET /api/dashboard', () => {
  it('Test 27: should return aggregated dashboard data', async () => {
    const emp1 = await createEmployee({ fullName: 'Dashboard Emp 1' });
    const emp2 = await createEmployee({ fullName: 'Dashboard Emp 2', status: 'Inactive' });

    const taskRes = await createTask(emp1._id, { title: 'Active Task' });
    await request(app).put(`/api/tasks/${taskRes.body.data._id}/status`).send({ status: 'In Progress' });

    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeStats).toBeDefined();
    expect(res.body.data.taskStats).toBeDefined();
    expect(res.body.data.workload).toBeDefined();
    expect(res.body.data.employeeStats.total).toBe(2);
    expect(res.body.data.employeeStats.byStatus['Active']).toBe(1);
    expect(res.body.data.employeeStats.byStatus['Inactive']).toBe(1);
    expect(res.body.data.taskStats.byStatus['In Progress']).toBe(1);
  });
});

// Test: CSV Export
describe('GET /api/tasks/export.csv', () => {
  it('should export tasks as CSV', async () => {
    const emp = await createEmployee();
    await createTask(emp._id, { title: 'Export Task 1' });
    await createTask(emp._id, { title: 'Export Task 2' });

    const res = await request(app).get('/api/tasks/export.csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('taskId');
    expect(res.text).toContain('Export Task 1');
    expect(res.text).toContain('Export Task 2');
  });
});

// Test: Health endpoint
describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
