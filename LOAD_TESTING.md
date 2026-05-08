# k6 Load & A/B Testing Guide

This directory contains k6 scripts for stress testing and A/B testing your workbee.space application.

## Prerequisites

1. **Install k6**: https://k6.io/docs/getting-started/installation/
   ```bash
   # macOS with Homebrew
   brew install k6
   
   # Verify installation
   k6 version
   ```

2. **Ensure your services are running**:
   - Frontend: `npm run dev` (runs on http://localhost:3000)
   - API: Should be running on http://localhost:8090/api
   - PocketBase: Running on http://localhost:8090 (or your configured port)

## Running the Tests

### 1. Stress Test (load-test.js)

This script gradually ramps up load to identify performance bottlenecks:

```bash
# Run against local API
k6 run load-test.js

# Run against production
BASE_URL=https://workbee.space/api k6 run load-test.js

# Run with custom output
k6 run --out csv=results.csv load-test.js

# Run in Cloud (requires k6 Cloud account)
k6 cloud load-test.js
```

**Test Profile:**
- Ramps up to 100 concurrent users
- Duration: 24 minutes total
- Thresholds:
  - 95% of requests must complete in <500ms
  - 99% of requests must complete in <1s
  - Failure rate must be <10%

### 2. A/B Test (ab-test.js)

This script splits traffic between two variants to compare performance:

```bash
# Run against local API
k6 run ab-test.js

# Run against production
BASE_URL=https://workbee.space/api k6 run ab-test.js

# Run with results file
k6 run --out csv=ab-results.csv ab-test.js
```

**Test Profile:**
- 20 concurrent users split 50/50 between variants
- Duration: 7 minutes total
- Compares performance metrics between variant A and B
- Results tagged by variant for analysis

## Understanding the Results

k6 outputs key metrics:

- **http_req_duration**: Response time (milliseconds)
- **http_req_failed**: Failed requests percentage
- **http_reqs**: Total requests made
- **vus_max**: Maximum concurrent users
- **iteration_duration**: Total time per user iteration

Example output interpretation:
```
checks...................: 95.5% ✓ 1909 ✗ 91
data_received............: 245 kB
data_sent................: 156 kB
http_req_blocked.........: avg=21.3ms min=3.2ms med=9.1ms max=145.2ms p(90)=42.3ms p(95)=89.2ms
http_req_duration........: avg=234.5ms min=102.1ms med=195.3ms max=2.1s p(90)=412.3ms p(95)=523.2ms
http_req_failed..........: 4.5% ✓ 95 ✗ 2000
```

## Analyzing A/B Test Results

The A/B test script tags requests with `variant: a` or `variant: b`. To analyze:

1. **CSV Results**: Open `ab-results.csv` in a spreadsheet
2. **Filter by variant**: Look for the `tags` column
3. **Compare metrics**:
   - Average response time per variant
   - Failure rate per variant
   - Throughput per variant

Example analysis query (if using InfluxDB):
```
SELECT mean("value") FROM "http_req_duration" 
WHERE "variant"='a' OR "variant"='b' 
GROUP BY "variant"
```

## Advanced Usage

### Custom Load Profile

Edit the `stages` array in either script:
```javascript
stages: [
  { duration: '5m', target: 100 },   // 5 minutes to 100 users
  { duration: '10m', target: 100 },  // Hold at 100 for 10 minutes
  { duration: '5m', target: 0 },     // Ramp down
],
```

### Real-time Monitoring

Use k6 Dashboard (requires k6 Cloud):
```bash
k6 cloud --web load-test.js
```

### Spike Testing

Create a new script with aggressive ramp-up:
```javascript
stages: [
  { duration: '30s', target: 500 },  // Sudden spike to 500 users
  { duration: '2m', target: 500 },   // Hold spike
  { duration: '30s', target: 0 },    // Drop
],
```

## Troubleshooting

### "Connection refused" errors
- Ensure your API is running on the specified port
- Check BASE_URL environment variable
- Verify CORS settings in your API

### High failure rates
- Check API logs for errors
- Reduce concurrent users in stages
- Verify database connections
- Check rate limiting settings

### Timeout errors
- Increase threshold duration
- Check API response times under baseline load
- Look for database query bottlenecks

## Next Steps

1. Identify endpoints with high response times
2. Analyze error logs for patterns
3. Optimize slow endpoints
4. Run tests again to verify improvements
5. Set up automated testing in CI/CD pipeline

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/load-testing/)
- [k6 Scripting API](https://k6.io/docs/javascript-api/)
