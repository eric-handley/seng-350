import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

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
