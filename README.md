# CivicSense

CivicSense is a Smart Public Issue Reporting Platform that allows citizens to report civic problems and helps officers and administrators manage and resolve them.

## 🚀 Live Application

**Application:** http://23.23.60.48

**API Health Check:** http://23.23.60.48/api/health

---

## ☁️ AWS Cloud Deployment

CivicSense is deployed on Amazon Web Services (AWS).

### AWS Services Used

- Amazon EC2 – Application server
- Amazon RDS MySQL – Production database
- Elastic IP – Static public IP
- Nginx – Reverse proxy
- PM2 – Node.js process management
- systemd – Automatic PM2 startup
- AWS Security Groups – Network access control

### CloudWatch Monitoring & Alarm

- CPU utilization of the EC2 instance is monitored using Amazon CloudWatch.
- A CloudWatch alarm `CivicSense-High-CPU-Alarm` is configured.
- Alarm condition: CPUUtilization > 70%
- Evaluation period: 5 minutes
- SNS notification topic: `CivicSense-CPU-Alerts`
- Current alarm state: OK

### Cloud Architecture

```text
Internet
    |
    v
Elastic IP
23.23.60.48
    |
    v
AWS EC2
Ubuntu 24.04 LTS
    |
    v
Nginx
    |
    v
Node.js / Express
    |
    v
Amazon RDS MySQL
