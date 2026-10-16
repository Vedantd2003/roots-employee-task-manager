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

const validEmployee = {
  employeeId: 'EMP-001',
  fullName: 'Alice Johnson',
  email: 'alice@example.com',
  phone: '555-1234',
  department: 'Development',
  role: 'Senior Developer',
  joiningDate: '2022-01-15',
  status: 'Active',
  skills: ['TypeScript', 'Node.js'],
};

// Test 1: Create employee successfully
describe('POST /api/employees', () => {
  it('should create a new employee and return 201', async () => {
    const res = await request(app).post('/api/employees').send(validEmployee);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId).toBe('EMP-001');
    expect(res.body.data.fullName).toBe('Alice Johnson');
    expect(res.body.data.email).toBe('alice@example.com');
    expect(res.body.data.activeTasks).toBe(0);
  });

  // Test 2: Reject duplicate employeeId
  it('should return 409 for duplicate employeeId', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    const res = await request(app).post('/api/employees').send(validEmployee);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Test 2b: Reject duplicate email
  it('should return 409 for duplicate email', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    const res = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, employeeId: 'EMP-002' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Validation errors
  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/employees').send({
      fullName: 'Bob Smith',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid department', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, department: 'InvalidDept' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should require leaveStartDate and leaveEndDate when status is On Leave', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, status: 'On Leave' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create employee with On Leave status when dates provided', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({
        ...validEmployee,
        status: 'On Leave',
        leaveStartDate: '2024-08-01',
        leaveEndDate: '2024-08-15',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('On Leave');
  });
});

// Test 4: GET employees list
describe('GET /api/employees', () => {
  beforeEach(async () => {
    await request(app).post('/api/employees').send(validEmployee);
    await request(app)
      .post('/api/employees')
      .send({
        ...validEmployee,
        employeeId: 'EMP-002',
        email: 'bob@example.com',
        fullName: 'Bob Smith',
        department: 'QA',
        status: 'Inactive',
      });
  });

  it('should return paginated list of employees', async () => {
    const res = await request(app).get('/api/employees');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
  });

  it('should filter employees by department', async () => {
    const res = await request(app).get('/api/employees?department=QA');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].department).toBe('QA');
  });

  it('should filter employees by status', async () => {
    const res = await request(app).get('/api/employees?status=Inactive');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('Inactive');
  });

  it('should search employees by name', async () => {
    const res = await request(app).get('/api/employees?search=Alice');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].fullName).toBe('Alice Johnson');
  });

  it('should paginate correctly', async () => {
    const res = await request(app).get('/api/employees?page=1&limit=1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.totalPages).toBe(2);
  });
});

// Test: GET employee by ID
describe('GET /api/employees/:id', () => {
  it('should return employee by MongoDB _id', async () => {
    const createRes = await request(app).post('/api/employees').send(validEmployee);
    const id = createRes.body.data._id;

    const res = await request(app).get(`/api/employees/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('should return employee by employeeId string', async () => {
    await request(app).post('/api/employees').send(validEmployee);
    const res = await request(app).get('/api/employees/EMP-001');

    expect(res.status).toBe(200);
    expect(res.body.data.employeeId).toBe('EMP-001');
  });

  it('should return 404 for non-existent employee', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/employees/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// Test: UPDATE employee
describe('PUT /api/employees/:id', () => {
  it('should update employee fields', async () => {
    const createRes = await request(app).post('/api/employees').send(validEmployee);
    const id = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/employees/${id}`)
      .send({ fullName: 'Alice Williams', role: 'Lead Developer' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Alice Williams');
    expect(res.body.data.role).toBe('Lead Developer');
  });

  it('should clear leave dates when status changes from On Leave to Active', async () => {
    const createRes = await request(app)
      .post('/api/employees')
      .send({
        ...validEmployee,
        status: 'On Leave',
        leaveStartDate: '2024-08-01',
        leaveEndDate: '2024-08-15',
      });
    const id = createRes.body.data._id;

    const res = await request(app).put(`/api/employees/${id}`).send({ status: 'Active' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Active');
    expect(res.body.data.leaveStartDate).toBeUndefined();
    expect(res.body.data.leaveEndDate).toBeUndefined();
  });
});

// Test: DELETE employee
describe('DELETE /api/employees/:id', () => {
  it('should delete employee with no active tasks', async () => {
    const createRes = await request(app).post('/api/employees').send(validEmployee);
    const id = createRes.body.data._id;

    const res = await request(app).delete(`/api/employees/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`/api/employees/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 400 when employee has active tasks', async () => {
    const empRes = await request(app).post('/api/employees').send(validEmployee);
    const employeeId = empRes.body.data._id;

    // Create a task assigned to this employee
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 7);

    await request(app).post('/api/tasks').send({
      title: 'Active Task',
      assignedEmployee: employeeId,
      department: 'Development',
      priority: 'High',
      startDate: tomorrow.toISOString(),
      dueDate: dayAfter.toISOString(),
    });

    const res = await request(app).delete(`/api/employees/${employeeId}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
