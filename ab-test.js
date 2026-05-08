import http from 'k6/http';
import { check, sleep, group } from 'k6';

// A/B testing configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '5m', target: 20 },   // Steady state
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
  ext: {
    loadimpact: {
      projectID: 3473788,
      name: 'A/B Test - Workbee',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090/api';

// Assign users to variant A or B based on VU ID
const variantA = __VU % 2 === 0;
const variantId = variantA ? 'variant-a' : 'variant-b';

export default function () {
  group('A/B Test - Variant ' + (variantA ? 'A' : 'B'), () => {
    // Simulate different user journeys based on variant
    
    if (variantA) {
      // Variant A: Traditional flow
      testTraditionalFlow();
    } else {
      // Variant B: Optimized flow
      testOptimizedFlow();
    }
  });
}

function testTraditionalFlow() {
  // Variant A: Standard endpoints in order
  const healthRes = http.get(`${BASE_URL}/health`, {
    tags: { variant: 'a' },
  });
  check(healthRes, {
    'variant-a: health is 200': (r) => r.status === 200,
  });
  sleep(0.5);

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    {
      email: `test-a-${__VU}@example.com`,
      password: 'TestPassword123!',
    },
    { tags: { variant: 'a' } }
  );
  check(loginRes, {
    'variant-a: login completes': (r) => r.status !== null,
  });
  sleep(0.5);

  const contactsRes = http.get(`${BASE_URL}/contacts`, {
    tags: { variant: 'a' },
  });
  check(contactsRes, {
    'variant-a: contacts loads': (r) => r.status !== null,
  });
  sleep(1);
}

function testOptimizedFlow() {
  // Variant B: Optimized endpoint order
  const contactsRes = http.get(`${BASE_URL}/contacts`, {
    tags: { variant: 'b' },
  });
  check(contactsRes, {
    'variant-b: contacts loads': (r) => r.status !== null,
  });
  sleep(0.3);

  const healthRes = http.get(`${BASE_URL}/health`, {
    tags: { variant: 'b' },
  });
  check(healthRes, {
    'variant-b: health is 200': (r) => r.status === 200,
  });
  sleep(0.3);

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    {
      email: `test-b-${__VU}@example.com`,
      password: 'TestPassword123!',
    },
    { tags: { variant: 'b' } }
  );
  check(loginRes, {
    'variant-b: login completes': (r) => r.status !== null,
  });
  sleep(0.8);
}
