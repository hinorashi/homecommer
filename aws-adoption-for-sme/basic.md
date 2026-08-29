# Option 1 - Basic Hybrid Cloud Pilot

[Quay lại tài liệu định hướng](readme.md)

## 1. Mục tiêu và phạm vi

Option Basic tạo một nền tảng AWS đủ an toàn để chạy workload thật, đo hiệu năng và kiểm chứng mô hình hybrid trước khi đầu tư landing zone, Direct Connect và platform tooling đầy đủ.

- Pilot 3-5 microservice stateless hoặc ít phụ thuộc database lõi.
- Một AWS account và một VPC tại `ap-southeast-1`.
- Amazon EKS chạy workload; database lõi tiếp tục ở on-premises.
- Site-to-Site VPN hai tunnel là kết nối hybrid chính.
- Rolling update là chiến lược triển khai mặc định.
- Capacity/cost bên dưới giữ dư địa onboarding tối đa khoảng 20 microservice; thực chi có thể thấp hơn nếu pilot chỉ cấp tài nguyên cho 3-5 service.

## 2. AWS Service Catalog

### 2.1 Infrastructure & Network

| Dịch vụ | Vai trò | Thiết kế Basic |
| :--- | :--- | :--- |
| Amazon VPC | Mạng riêng cho workload | Public subnet cho ALB/NAT; private subnet cho EKS/RDS trên 2 AZ |
| Internet Gateway | Kết nối public ingress | Chỉ ALB internet-facing và NAT có route phù hợp |
| Site-to-Site VPN | Kết nối AWS với on-premises | Hai tunnel tới Virtual Private Gateway |
| NAT Gateway | Outbound cho private workload | 2 NAT để tránh phụ thuộc một AZ; có thể giảm còn 1 nếu chấp nhận downtime |
| Route 53 | Public DNS | Alias record tới ALB |
| Application Load Balancer | HTTPS ingress | Tích hợp AWS Load Balancer Controller và ACM |
| VPC Endpoints | Truy cập dịch vụ AWS riêng tư | S3 Gateway; cân nhắc ECR và CloudWatch interface endpoint |

### 2.2 Security

| Dịch vụ | Vai trò | Thiết kế Basic |
| :--- | :--- | :--- |
| IAM | Xác thực và phân quyền | Least privilege; EKS Pod Identity/IRSA cho workload |
| KMS | Mã hóa | Mã hóa EBS, RDS, EKS secrets và S3 |
| ACM | Chứng chỉ TLS | TLS termination tại ALB |
| Secrets Manager | Quản lý secret | Không lưu credential trong image hoặc manifest |
| AWS WAF | Bảo vệ HTTP(S) | Managed rules cơ bản, gắn với ALB |
| GuardDuty | Threat detection | Bật cho account ngay từ đầu |
| Shield Standard | DDoS baseline | Tự động áp dụng cho ALB/Route 53 |

### 2.3 Platform & Governance

| Dịch vụ | Vai trò | Thiết kế Basic |
| :--- | :--- | :--- |
| CloudTrail | Audit API | Multi-Region trail, log lưu S3 |
| CloudWatch | Log, metric và alarm | Dashboard tối thiểu cho EKS, ALB, VPN và RDS |
| AWS Config | Kiểm tra cấu hình | Một số managed rule trọng yếu |
| AWS Backup | Backup tập trung | RDS/EFS hằng ngày; kiểm thử restore |
| AWS Budgets/Cost Explorer | Quản trị chi phí | Alert theo ngưỡng tháng và forecast |
| Systems Manager | Truy cập và vận hành | Session Manager; không mở SSH công khai |
| ECR image scanning | Kiểm tra image | Scan khi push; chặn image critical theo pipeline policy |

### 2.4 Application

| Dịch vụ | Vai trò | Thiết kế Basic |
| :--- | :--- | :--- |
| Amazon EKS | Kubernetes control plane | Managed control plane; worker node trải trên 2 AZ |
| Amazon EC2 | EKS worker | 6 `m6g.xlarge` Graviton, điều chỉnh sau load test |
| Amazon ECR | Container registry | Repository riêng theo service, lifecycle policy |
| Amazon RDS | Database microservice | 4 instance Single-AZ; database/schema riêng theo service |
| Amazon ElastiCache | Cache/session | Một node nhỏ, không HA |
| Amazon S3 | Object/backup/log archive | Versioning và lifecycle |
| Amazon EFS | Shared file | Chỉ dùng cho workload thực sự cần ReadWriteMany |

## 3. Kiến trúc đề xuất

```mermaid
---
config:
  layout: elk
---
flowchart LR
  User(["Internet users"]) --> R53["Route 53"]
  R53 --> WAF["AWS WAF"]
  WAF --> ALB["Public ALB + ACM"]

  subgraph OnPrem["On-premises"]
    OPK8s["Kubernetes hiện hữu"]
    CoreDB[("Core database")]
    OPK8s --> CoreDB
  end

  subgraph AWS["AWS ap-southeast-1 - một account"]
    subgraph VPC["VPC - 2 AZ"]
      IGW["Internet Gateway"]
      NAT["NAT Gateway per AZ"]
      VGW["Virtual Private Gateway"]
      subgraph Private["Private subnets"]
        EKS["EKS - 6 Graviton workers"]
        RDS[("4 RDS Single-AZ groups")]
        Cache[("ElastiCache")]
      end
      ALB --> EKS
      EKS --> RDS
      EKS --> Cache
      NAT --> EKS
      IGW --- ALB
      IGW --- NAT
    end
    ECR["ECR"]
    S3[("S3 / Backup")]
    CW["CloudWatch / CloudTrail"]
    EKS --> ECR
    EKS --> S3
    EKS --> CW
  end

  OnPrem <-->|"Site-to-Site VPN - 2 tunnels"| VGW
  EKS -. "Private query qua VPN" .-> CoreDB

  classDef onprem fill:#2c3e50,stroke:#1a252f,color:#fff;
  classDef internet fill:#3498db,stroke:#2471a3,color:#fff;
  classDef network fill:#16a085,stroke:#0e6655,color:#fff;
  classDef security fill:#e74c3c,stroke:#a93226,color:#fff;
  classDef platform fill:#f39c12,stroke:#b9770e,color:#fff;
  classDef application fill:#9b59b6,stroke:#7d3c98,color:#fff;
  class User internet;
  class OPK8s,CoreDB onprem;
  class R53,ALB,IGW,NAT,VGW network;
  class WAF security;
  class CW platform;
  class EKS,RDS,Cache,ECR,S3 application;
```

Public traffic đi theo `Route 53 -> WAF tại ALB -> ALB -> EKS`. Internet Gateway là attachment của VPC, không phải một thiết bị inspection nối tiếp. Traffic hybrid đi riêng qua VPN và route table private.

Quy ước màu kiến trúc dùng thống nhất trong cả ba option: **Infrastructure & Network** xanh lá đậm, **Security** đỏ, **Platform & Governance** cam, **Application** tím, **On-premises** xám than, **Internet** xanh dương và **DR** xám nhạt.

## 4. Database và Kubernetes

| Nhóm RDS | Phạm vi | Sizing tham khảo |
| :--- | :--- | :--- |
| A | 4 service giao dịch quan trọng | `db.t3.large`, Single-AZ |
| B | 6 service nghiệp vụ chính | `db.t3.large`, Single-AZ |
| C | 6 service hỗ trợ | `db.t3.medium`, Single-AZ |
| D | 4 service ít traffic | `db.t3.medium`, Single-AZ |

- Mỗi service sở hữu database/schema và credential riêng; không truy cập schema của service khác.
- Basic chấp nhận mục tiêu tham khảo **RPO <= 24 giờ, RTO <= 4 giờ** cho RDS Single-AZ; workload không chấp nhận mục tiêu này phải dùng Multi-AZ ngay.
- EKS bắt buộc có requests/limits, liveness/readiness probe, PodDisruptionBudget, topology spread và HPA cho service phù hợp.
- Dùng NetworkPolicy default-deny theo namespace; kiểm thử quyền bằng `kubectl auth can-i` và kiểm thử kết nối từ test pod.
- Trước mỗi lần nâng cấp cluster phải kiểm tra add-on/CNI/CSI compatibility, backup dữ liệu và diễn tập rollback.

## 5. CI/CD và vận hành

```mermaid
flowchart LR
  Dev["Developer"] --> Git["Git repository hiện hữu\non-premises"]
  Git --> Runner["CI runner hiện hữu"]
  Runner --> Test["Unit / integration test"]
  Test --> Build["Build multi-arch image"]
  Build --> Scan["ECR image scanning"]
  Scan --> ECR["Amazon ECR"]
  ECR --> Manifest["Cập nhật manifest"]
  Manifest --> Deploy["Amazon EKS\nrolling deployment"]
  Deploy --> Smoke["Smoke test + CloudWatch alarm"]
  Secret["External Secrets Operator"] -. "Đồng bộ" .-> Deploy
  SM["AWS Secrets Manager"] --> Secret

  classDef existing fill:#2c3e50,stroke:#1a252f,color:#fff;
  classDef selfbuilt fill:#f39c12,stroke:#b9770e,color:#fff;
  classDef awsnative fill:#16a085,stroke:#0e6655,color:#fff;
  class Dev,Git,Runner existing;
  class Test,Build,Manifest,Secret selfbuilt;
  class Scan,ECR,Deploy,Smoke,SM awsnative;
```

**Chú giải CI/CD:** xám than = dịch vụ/công cụ đã có sẵn ở on-premises; cam = thành phần mới do đội tự xây dựng và vận hành, có thể dùng open source; xanh lá = dịch vụ AWS native.

- Có thể dùng GitLab CI/GitHub Actions hiện hữu hoặc pipeline tạm thời; Option 1 không dựng một platform DevOps mới.
- Secret lấy từ Secrets Manager qua External Secrets Operator hoặc CSI driver.
- Alarm tối thiểu: VPN tunnel down, ALB 5xx/latency, pod unavailable, node pressure, RDS CPU/storage/connections và ngân sách forecast.
- Thực hiện game day mất một worker node, VPN tunnel và restore RDS trước khi kết luận pilot.

## 6. Dự toán chi phí

| Lớp | Hạng mục | USD/tháng |
| :--- | :--- | ---: |
| Network | 2 NAT Gateway, VPN, Route 53/data transfer, VPC endpoints | 237 |
| Security | GuardDuty, Secrets Manager/KMS, WAF | 61 |
| Governance | CloudWatch, Config, Backup và ECR | 73 |
| Application | EKS control plane | 73 |
| Application | 6 x `m6g.xlarge` worker | 725 |
| Application | ALB | 60 |
| Application | 4 RDS Single-AZ groups | 396 |
| Application | ElastiCache | 50 |
| Application | S3 và EFS | 20 |
| **AWS usage subtotal** | | **1.695** |
| AWS Business Support, ước tính 10% | | 170 |
| **Tổng tham khảo** | | **~1.865** |

Sai số dự kiến ±20-30%. Chi phí chưa gồm thuế, nhân sự, license ngoài AWS và migration one-time. Nếu chỉ triển khai 3-5 service, cần tạo estimate nhỏ hơn thay vì cấp trước toàn bộ 4 nhóm RDS và 6 worker.

## 7. Lộ trình triển khai Option 1

```mermaid
%%{ init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#1a1a1a', 'primaryBorderColor': '#2c3e50', 'lineColor': '#2c3e50', 'tertiaryColor': '#f4f4f4', 'cScale0': '#2c3e50', 'cScaleLabel0': '#ffffff', 'cScale1': '#16a085', 'cScaleLabel1': '#ffffff', 'cScale2': '#9b59b6', 'cScaleLabel2': '#ffffff', 'cScale3': '#f39c12', 'cScaleLabel3': '#ffffff', 'cScale4': '#e74c3c', 'cScaleLabel4': '#ffffff' } } }%%
timeline
  title Lộ trình Option 1 - Basic Hybrid Cloud Pilot
  Tuần 1-2 : Khảo sát on-premises và dependency
             : Xác định 3-5 service pilot
  Tuần 2-4 : Thiết lập VPC, IAM và Site-to-Site VPN
             : Hoàn thiện security baseline
  Tuần 4-8 : Triển khai EKS, ECR và RDS
             : Di chuyển 3-5 service pilot
  Tuần 8-10 : Thiết lập CI/CD, observability và backup
              : Chuẩn hóa runbook vận hành
  Tuần 10-12 : Load test, failover và restore test
               : Decision gate và bàn giao đầu vào cho Option 3
```

## 8. Điều kiện hoàn tất và chuyển tiếp

- [Option 2](reuse-on-prem-platform.md) được dùng để so sánh chi phí, SLA và mức tái sử dụng nếu platform on-premises vượt qua đánh giá HA/capacity/security; đây không phải trạng thái đích của lộ trình.
- Chuyển sang [Option 3](build-platform-on-aws.md) sau khi pilot đạt KPI và có đủ baseline để sizing landing zone, platform, observability và DR.
- Nâng Direct Connect khi VPN không đạt ngưỡng latency, jitter, throughput hoặc độ ổn định đã thống nhất.
