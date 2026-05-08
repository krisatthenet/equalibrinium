import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Configure test behavior
export const options = {
  // Stress test configuration - gradually ramp up load
  stages: [
    { duration: '2m', target: 10 },    // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },    // Ramp up to 50 users over 5 minutes
    { duration: '10m', target: 100 },  // Ramp up to 100 users over 10 minutes
    { duration: '5m', target: 50 },    // Ramp down to 50 users over 5 minutes
    { duration: '2m', target: 0 },     // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.1'],                   // Failure rate under 10%
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090/api';

export default function () {
  // Test health endpoint
  group('Health Check', () => {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
    sleep(1);
  });

  // Test auth endpoints
  group('Auth Endpoints', () => {
    // Test login endpoint
    const loginRes = http.post(`${BASE_URL}/auth/login`, {
      email: `loadtest-${__VU}-${__ITER}@example.com`,
      password: 'TestPassword123!',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(loginRes, {
      'login attempt completed': (r) => r.status !== null,
      'login response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    sleep(0.5);

    // Test signup endpoint
    const signupRes = http.post(`${BASE_URL}/auth/signup`, {
      email: `loadtest-${__VU}-${__ITER}-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Load',
      lastName: 'Test',
      userType: 'client',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(signupRes, {
      'signup attempt completed': (r) => r.status !== null,
      'signup response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    sleep(0.5);
  });

  // Test contacts endpoints
  group('Contacts Endpoints', () => {
    const contactsRes = http.get(`${BASE_URL}/contacts`);
    check(contactsRes, {
      'contacts endpoint responds': (r) => r.status !== null,
      'contacts response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    sleep(0.5);
  });

  // Random think time between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}
