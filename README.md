# Dynamic Cloud E-Commerce Flash Sale Queue

An enterprise-grade, full-stack cloud computing demonstration platform designed to handle massive concurrent traffic spikes during flash sales without server failure or inventory overselling.

---

## 1. Problem Statement

In standard e-commerce platforms, when a high-demand flash sale commences (e.g., 100 RTX 4090 Gaming Laptops discounted by 60%), tens of thousands of users click **“Buy Now”** simultaneously. 

Directly executing transactional updates (`UPDATE products SET stock = stock - 1`) under this **“thundering herd”** causes:
1. **Database Lock Contention & Thread Starvation**: Connection pools are quickly exhausted, leading to 500/504 gateway timeouts.
2. **Race Conditions & Overselling**: In multithreaded environments without distributed synchronization, read-modify-write delays cause inventory counts to drop below zero (e.g., selling 150 units when only 10 existed).
3. **Cascading Server Failures**: Backend instances spike to 100% CPU, crashing unrelated microservices.

---

## 2. Objectives

* **Decouple Ingress from Execution**: Use a cloud virtual queue (FIFO buffer) as an architectural shock absorber.
* **Guarantee Zero Overselling**: Mathematically enforce that successful orders never exceed available stock ($Orders \le Inventory$, strictly preventing $Stock < 0$).
* **Demonstrate Core Cloud Computing Principles**:
  * Layer 7 Load Balancing across multiple availability zones.
  * Elastic Horizontal Auto-Scaling of worker nodes based on queue depth.
  * In-memory caching and distributed locking with Redis.
  * Real-time duplex communication using WebSockets (Socket.IO).
  * Fault-tolerant reservation timeouts with automatic inventory rollback.

---

## 3. System Architecture

```
                       [ SHOOPER CLIENTS ]
                    (Thousands of Shoppers)
                               │
                               ▼
                    [ React 19 + Vite Frontend ]
                               │
                               ▼
               [ Application Load Balancer (ALB) ]
                    (L7 Round-Robin Algorithm)
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         [ API Node 1 ]   [ API Node 2 ]   [ API Node 3 ]
         (us-east-1a)     (us-east-1b)     (us-east-1c)
              └────────────────┬────────────────┘
                               │ (Stateless REST / JWT)
                               ▼
                [ Redis Distributed Queue & Cache ]
                   (In-Memory FIFO Token Queue)
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    [ Worker Node 1 ]   [ Worker Node 2 ]   [ Worker Node N ]
    (Auto-Scaling Dynamic Worker Fleet: 2 to 8 Nodes)
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │ (Conditional Atomic Decrement)
                               ▼
                   [ MongoDB Document Store ]
                     (Products, Orders, Ledgers)
                               │
                               ▼
                   [ Socket.IO Real-Time Bus ]
                  (Live Position & Stock Telemetry)
```

---

## 4. Key Cloud Computing Concepts Demonstrated

1. **Horizontal Scalability**: Separation of frontend, stateless API ingress, and background worker tiers allows each layer to scale independently.
2. **Elasticity & Auto-Scaling**: Worker pool automatically expands ($2 \rightarrow 8$ nodes) when queue length exceeds predefined thresholds ($>50, >250$ items) and shrinks when the queue drains.
3. **Layer 7 Load Balancing**: Simulates round-robin routing across virtual availability zones (`API-1`, `API-2`, `API-3`) with header tracking (`X-Handled-By`).
4. **Queue-Based Request Decoupling**: Absorbs traffic spikes into an in-memory queue, shielding the database from concurrency spikes.
5. **Zero-Overselling Concurrency Control**: Uses atomic conditional updates:
   ```javascript
   FlashSale.findOneAndUpdate(
     { _id: flashSaleId, remainingStock: { $gt: 0 } },
     { $inc: { remainingStock: -1 } },
     { new: true }
   );
   ```
   If no document matches, the request is marked `SOLD_OUT`. Stock never drops below zero.
6. **Fault Tolerance & Dead-Letter Handling**: Workers implement retry policies (max 2 retries). Unhandled failures release locks cleanly.
7. **Reservation Expiration Reaper**: A 120-second stock reservation window holds items for pending payments. If unpaid, inventory rolls back to the pool automatically.
8. **In-Memory Caching (Sub-Millisecond Read Latency)**: Rapid state lookup and queue position indexing without disk I/O bottlenecks.
9. **Stateless API Architecture**: Authentication handled via signed JWT tokens, allowing any API server node to handle any request.
10. **Real-Time Observability**: Real-time streaming of CPU %, RAM %, RPS throughput, and queue depth with interactive charts.

---

## 5. Technology Stack

### Frontend
* **React 19** with **Vite**
* **Tailwind CSS**
* **React Router v7**
* **Socket.IO Client**
* **Recharts** (Live Cloud Telemetry graphs)
* **Lucide React Icons**
* **Axios** (With JWT interceptor)

### Backend
* **Node.js** & **Express.js**
* **Socket.IO** (Duplex WebSocket server)
* **JWT** & **bcryptjs** (Secure authentication & role authorization)
* **Express Rate Limit** (DDoS & bot spam protection)
* **UUID**

### Database & Caching
* **MongoDB / Mongoose**: Cloud document database with dual-mode zero-config fallback store for instant local evaluation.
* **Redis / ioredis**: Queue management, caching, and atomic locks with embedded high-performance in-memory emulation fallback.

---

## 6. Database Models & Schema Design

* **`User`**: `_id`, `name`, `email`, `password`, `role` (`'USER'` | `'ADMIN'`), `createdAt`.
* **`Product`**: `_id`, `name`, `description`, `originalPrice`, `salePrice`, `stock`, `imageUrl`, `category`.
* **`FlashSale`**: `_id`, `productId`, `title`, `totalStock`, `remainingStock`, `startTime`, `endTime`, `status` (`'UPCOMING'` | `'ACTIVE'` | `'PAUSED'` | `'ENDED'`).
* **`QueueEntry`**: `queueId`, `userId`, `flashSaleId`, `productId`, `position`, `initialPosition`, `status` (`'WAITING'` | `'PROCESSING'` | `'PAYMENT_PENDING'` | `'SUCCESS'` | `'FAILED'` | `'EXPIRED'` | `'CANCELLED'`), `orderId`, `reservationExpiresAt`.
* **`Order`**: `orderId`, `userId`, `flashSaleId`, `productId`, `totalAmount`, `status` (`'PENDING'` | `'CONFIRMED'` | `'FAILED'` | `'CANCELLED'`), `paymentStatus` (`'PAYMENT_PENDING'` | `'PAYMENT_SUCCESS'` | `'PAYMENT_FAILED'`), `paymentId`.
* **`SystemMetric`**: `timestamp`, `activeWorkers`, `queueLength`, `rps`, `cpuUsage`, `memUsage`, `loadBalancerDistribution`.

---

## 7. REST API Documentation

### Authentication
* `POST /api/auth/register` - Create shopper account
* `POST /api/auth/login` - Authenticate & obtain JWT
* `GET /api/auth/me` - Fetch profile

### Products & Catalog
* `GET /api/products` - List active catalog products
* `GET /api/products/:id` - Product specifications
* `POST /api/products` - Create product *(Admin only)*
* `PUT /api/products/:id` - Update product *(Admin only)*
* `DELETE /api/products/:id` - Archive product *(Admin only)*

### Flash Sales
* `GET /api/flash-sales` - List all flash sales
* `GET /api/flash-sales/active` - Fetch current active sale
* `POST /api/flash-sales/:id/start` - Set status to ACTIVE *(Admin only)*
* `POST /api/flash-sales/:id/pause` - Pause sale *(Admin only)*
* `POST /api/flash-sales/:id/end` - End sale *(Admin only)*
* `POST /api/flash-sales/:id/reset-stock` - Reset inventory to 10 for demo *(Admin only)*

### Virtual Queue
* `POST /api/queue/join` - Authenticated queue entrance (Rate-limited)
* `GET /api/queue/:id` - Dynamic position & wait time
* `DELETE /api/queue/:id` - Cancel entry & exit queue

### Orders & Payment Simulation
* `GET /api/orders` - Authenticated user order history
* `POST /api/orders/:id/payment` - Complete simulated payment (1–2s delay, rollback on decline)

### Admin & Cloud Telemetry
* `GET /api/admin/metrics` - Live CPU, RAM, RPS, LB stats
* `GET /api/admin/system-health` - Heartbeats & latency matrix
* `GET /api/admin/queue` - Live queue distribution
* `POST /api/admin/simulation/start` - Generate 100–5000 test requests

---

## 8. Automated Testing: 100 Users vs 10 Stock Concurrency Test

A stress test is included to mathematically prove zero overselling:

```bash
cd backend
npm test
```

### Verification Assertions:
1. Exactly **10 successful stock reservations** are created.
2. Exactly **90 requests receive `SOLD_OUT` rejection**.
3. Flash sale stock reaches strictly **0** (never negative).
4. Auto-scaler automatically scales workers up to handle the queue pressure.

---

## 9. Local Installation & Quick Start

### Prerequisites
* Node.js (v18+)
* npm (v9+)

### Single-Command Start (Zero Configuration Required)

Run from the project root:

```bash
npm start
```

This launches:
* **Backend API & WebSockets** on `http://localhost:5000`
* **Vite Frontend Dashboard** on `http://localhost:5173`

> **Note on Zero Dependencies**: The system includes high-performance in-memory engines for Redis and MongoDB. If you do not have external Redis or Mongo daemons running, the application will automatically fall back to the in-memory engine, working instantly out-of-the-box.

---

## 10. Docker Deployment

To launch the full production stack with dedicated Redis and MongoDB containers:

```bash
docker compose up --build
```

Services:
* **Frontend**: `http://localhost:3000`
* **Backend**: `http://localhost:5000`
* **Redis**: `localhost:6379`
* **MongoDB**: `localhost:27017`

---

## 11. Demonstration Scenario Walkthrough

Follow this 10-step sequence for a live presentation:

1. **Open Frontend**: Navigate to `http://localhost:5173`.
2. **Login as Admin**: Click **Sign In**, then click the **Admin Demo** fast-fill button (`admin@cloudsale.com` / `Admin@123`).
3. **Verify Initial State**: Check `/admin/flash-sales`. Verify the **RTX 4090 Gaming Beast Laptop** flash sale has **10 units** of stock.
4. **Open Flash Sale**: Open `/flash-sale` in another window or tab.
5. **Open Cloud Monitoring**: Open `/admin/cloud-monitoring`.
6. **Trigger Traffic Simulation**: Under **Cloud High-Traffic Load Generator**, select **100 Users** and click **START TRAFFIC SIMULATION**.
7. **Observe Live Telemetry**:
   * **Queue Ingress**: Queue length spikes up to 100 requests.
   * **Auto-Scaling Event**: The engine triggers: `AUTO-SCALING TRIGGERED: Scaled UP from 2 to 5 workers`.
   * **Load Balancer**: API-1, API-2, and API-3 distribute the incoming traffic via Round-Robin.
8. **Verify Concurrency Control**:
   * Exactly **10 requests** successfully reserve stock.
   * The remaining **90 requests** transition to `SOLD_OUT`.
   * Remaining stock drops to strictly **0** with zero overselling.
9. **Simulate Payment**: Log in as a shopper (`user@cloudsale.com` / `User@123`), enter the queue, complete the simulated payment, and verify the order is marked `CONFIRMED` on `/orders`.
10. **Reset for Next Demo**: Click **RESET STOCK TO 10** in the admin header to immediately restore inventory for another demonstration.

---

## 12. Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@cloudsale.com` | `Admin@123` |
| **Verified Shopper** | `user@cloudsale.com` | `User@123` |

---

## 13. Production Cloud Architecture (AWS / GCP / Azure Mapping)

For production deployment in a hyperscaler cloud environment:

* **Ingress / Load Balancer**: AWS Application Load Balancer (ALB) or Google Cloud Load Balancing with SSL termination.
* **Frontend Hosting**: AWS S3 + CloudFront CDN or Vercel Edge Network.
* **API & Worker Fleet**: AWS ECS / Fargate or Kubernetes (EKS) with Horizontal Pod Autoscaler (HPA) driven by SQS/Redis queue length metrics.
* **Virtual Queue & Cache**: Amazon ElastiCache for Redis (Cluster mode enabled).
* **Database**: MongoDB Atlas with multi-AZ replica sets.
* **Monitoring**: CloudWatch Metrics + Prometheus & Grafana dashboarding.
