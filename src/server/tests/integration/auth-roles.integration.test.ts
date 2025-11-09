import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from './auth-test-helpers';

describe('Authorization (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let staffUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    staffUser = userRepository.create({
      email: `authz-staff-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    staffUser = await userRepository.save(staffUser);

    adminUser = userRepository.create({
      email: `authz-admin-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users endpoint (Admin only)', () => {
    it('should deny access to unauthenticated users', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should deny access to non-admin users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/users').expect(403);
    });

    it('should allow access to admin users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' })
        .expect(200);

      return agent
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
        });
    });

    it('should allow admin to create users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' })
        .expect(200);

      const newUser = {
        email: `new-user-${Date.now()}@uvic.ca`,
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role: UserRole.STAFF,
      };

      return agent
        .post('/users')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe(newUser.email);
          expect(res.body.role).toBe(newUser.role);
        });
    });

    it('should deny staff from creating users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      const newUser = {
        email: `blocked-user-${Date.now()}@uvic.ca`,
        password: 'password123',
        first_name: 'Blocked',
        last_name: 'User',
        role: UserRole.STAFF,
      };

      return agent.post('/users').send(newUser).expect(403);
    });
  });

  describe('Protected endpoints (authenticated users)', () => {
    it('should deny unauthenticated access to /bookings', () => {
      return request(app.getHttpServer()).get('/bookings').expect(401);
    });

    it('should deny unauthenticated access to /rooms', () => {
      return request(app.getHttpServer()).get('/rooms').expect(401);
    });

    it('should deny unauthenticated access to /buildings', () => {
      return request(app.getHttpServer()).get('/buildings').expect(401);
    });

    it('should deny unauthenticated access to /equipment', () => {
      const testRoomId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/equipment/room/${testRoomId}`)
        .expect(401);
    });

    it('should allow Staff to access /bookings', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/bookings').expect(200);
    });

    it('should allow Staff to access /rooms', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/rooms').expect(200);
    });

    it('should allow Staff to access /buildings', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/buildings').expect(200);
    });

    it('should allow Admin to access /bookings', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/bookings').expect(200);
    });
  });
});

describe('REGISTRAR role (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let registrarUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    registrarUser = userRepository.create({
      email: `registrar-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Registrar',
      last_name: 'User',
      role: UserRole.REGISTRAR,
    });
    registrarUser = await userRepository.save(registrarUser);

    adminUser = userRepository.create({
      email: `admin-registrar-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow Registrar to login', async () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.role).toBe(UserRole.REGISTRAR);
      });
  });

  it('should allow Registrar to access /bookings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/bookings').expect(200);
  });

  it('should allow Registrar to access /rooms', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/rooms').expect(200);
  });

  it('should allow Registrar to access /buildings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/buildings').expect(200);
  });

  it('should allow Registrar to view all users', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/users').expect(200);
  });

  it('should allow Registrar to create Staff users', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    const newStaffUser = {
      email: `staff-by-registrar-${Date.now()}@uvic.ca`,
      password: 'password123',
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newStaffUser).expect(201);
  });

  it('should deny Registrar from creating Registrar users', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    const newRegistrarUser = {
      email: `registrar-by-registrar-${Date.now()}@uvic.ca`,
      password: 'password123',
      first_name: 'Registrar',
      last_name: 'User',
      role: UserRole.REGISTRAR,
    };

    return agent.post('/users').send(newRegistrarUser).expect(403);
  });

  it('should deny Registrar from creating Admin users', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    const newAdminUser = {
      email: `admin-by-registrar-${Date.now()}@uvic.ca`,
      password: 'password123',
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    };

    return agent.post('/users').send(newAdminUser).expect(403);
  });

  it('should allow Registrar to access /logs', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent
      .get('/logs')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});

describe('Role update restrictions (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let staffUser: User;
  let registrarUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);
    const testId = randomUUID();

    staffUser = userRepository.create({
      email: `staff-role-test-${testId}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    staffUser = await userRepository.save(staffUser);

    registrarUser = userRepository.create({
      email: `registrar-role-test-${testId}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Registrar',
      last_name: 'User',
      role: UserRole.REGISTRAR,
    });
    registrarUser = await userRepository.save(registrarUser);

    adminUser = userRepository.create({
      email: `admin-role-test-${testId}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow STAFF to update own profile with role unchanged', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${staffUser.id}`)
      .send({ first_name: 'Updated', role: UserRole.STAFF })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('Updated');
        expect(res.body.role).toBe(UserRole.STAFF);
      });
  });

  it('should block STAFF from changing own role to ADMIN', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${staffUser.id}`)
      .send({ role: UserRole.ADMIN })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toContain('Admins');
      });
  });

  it('should block STAFF from changing own role to REGISTRAR', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${staffUser.id}`)
      .send({ role: UserRole.REGISTRAR })
      .expect(403);
  });

  it('should allow REGISTRAR to update own profile with role unchanged', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${registrarUser.id}`)
      .send({ first_name: 'UpdatedRegistrar', role: UserRole.REGISTRAR })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('UpdatedRegistrar');
        expect(res.body.role).toBe(UserRole.REGISTRAR);
      });
  });

  it('should block REGISTRAR from changing own role to ADMIN', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${registrarUser.id}`)
      .send({ role: UserRole.ADMIN })
      .expect(403);
  });

  it('should allow ADMIN to update own profile with role unchanged', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${adminUser.id}`)
      .send({ first_name: 'UpdatedAdmin', role: UserRole.ADMIN })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('UpdatedAdmin');
        expect(res.body.role).toBe(UserRole.ADMIN);
      });
  });
});
