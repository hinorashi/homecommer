# AWS Adoption dành cho doanh nghiệp vừa và nhỏ

keywords: well-architected framework, AWS adoption, doanh nghiệp vừa và nhỏ, cloud migration, best practices

---

# AWS Cloud Adoption — Đề Xuất Triển Khai Hybrid Cloud

Tài liệu đề xuất mô hình **Hybrid Cloud (AWS Cloud Adoption)** cho hệ thống microservice đa công nghệ hiện đang chạy on-prem (gọi tắt là **Hệ thống X**), kết nối với AWS qua Site-to-Site VPN, khu vực triển khai **ap-southeast-1 (Singapore)**.

## Mục Lục

1. Tóm tắt điều hành
2. Hiện trạng on-prem (giả định)
3. Nguyên tắc thiết kế và cách tiếp cận
4. AWS Service Catalog
5. Kiến trúc AWS đề xuất
6. Dự toán chi phí (Basic vs Full-fledged)
7. Lộ trình triển khai
8. Rủi ro chính và biện pháp giảm thiểu
9. Success Picture (Definition of Done)
10. Tham chiếu

## 1) Tóm Tắt Điều Hành

- Mục tiêu: xây dựng mô hình **hybrid cloud thử nghiệm** giữa hạ tầng on-prem hiện có và AWS, làm bước đệm cho lộ trình AWS Cloud Adoption toàn diện.
- Cách tiếp cận: một kiến trúc thống nhất, chia hai mức đầu tư — **Basic** (tối giản Network/Security/Governance, đầu tư vào Application để có hệ thống chạy thật) và **Full-fledged** (success picture đầy đủ các dịch vụ trọng yếu ở mọi lớp).
- Kết nối on-prem <-> AWS: **Site-to-Site VPN** ở giai đoạn Basic; nâng cấp lên **Direct Connect** ở Full-fledged khi cần băng thông ổn định hơn.
- Ngân sách tham khảo Basic: **~4,000 USD/tháng** (ước tính thực tế thấp hơn, còn dư địa cho contingency/support).

## 2) Hiện Trạng On-Prem (Giả Định)

| Hạng mục | Giả định |
| :--- | :--- |
| Tổng số server | ~30 server (vật lý/VM) |
| Kubernetes | 1 cụm K8s, ước lượng 8-12 node (mix control-plane + worker) |
| Non-Kubernetes | ~18-22 server chạy service truyền thống, batch job, DB, legacy app |
| Người dùng | ~10,000 user đăng ký |
| DAU (Daily Active User) | ước lượng 1,000-1,500 (10-15% tổng user) |
| Traffic đỉnh (peak) | ước lượng 50-80 request/giây, phân bổ không đều theo khung giờ |
| Dữ liệu | vài chục đến vài trăm GB, tăng dần |
| Ngôn ngữ/công nghệ | Java, Node.js, Golang, Python — kiến trúc microservice hỗn hợp |
| Số lượng microservice | ~20 service |
| Region AWS dự kiến | `ap-southeast-1` (Singapore) |
| Kết nối hybrid | Site-to-Site VPN |
| Phạm vi hybrid thử nghiệm | Chọn một tập con service chạy trên AWS EKS; **DB core (system of record)** giữ nguyên on-prem; **DB riêng của từng microservice** dùng RDS trên AWS (xem mục 4.5) |

> Số liệu trên là giả định lập kế hoạch, cần đối chiếu số liệu thật khi triển khai chính thức. Chưa có yêu cầu compliance/data residency đặc biệt tại thời điểm này — cần rà soát Nghị định 13/2023 khi mở rộng phạm vi dữ liệu ở Full-fledged.

## 3) Nguyên Tắc Thiết Kế Và Cách Tiếp Cận

- **Một kiến trúc, hai mức đầu tư**: Basic và Full-fledged dùng chung một khung kiến trúc 4 lớp, khác nhau ở mức độ HA/automation/số dịch vụ managed — giúp nâng cấp dần thay vì làm lại.
- **Application-first cho Basic**: các lớp Network/Security/Governance chỉ ở mức đủ an toàn tối thiểu; ngân sách ưu tiên cho compute/application để có hệ thống chạy thật, đo lường được.
- **Well-Architected Framework** làm khung tham chiếu xuyên suốt (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability).
- **Loose coupling qua VPN**: service trên AWS gọi ngược on-prem qua kết nối riêng tư, không expose trực tiếp ra Internet cho lưu lượng nội bộ.
- **Không lock-in sớm**: ưu tiên container hóa (EKS) và IaC (Terraform/CloudFormation) để giữ khả năng di chuyển ngược lại on-prem nếu cần.

## 4) AWS Service Catalog

Ký hiệu: **●** = dùng trong Basic, **◐** = dùng một phần/đơn giản hóa, **○** = chỉ dùng ở Full-fledged.

### 4.1 Lớp Infra & Network

| Dịch vụ | Ý nghĩa / Mô tả | Basic | Full-fledged | Ghi chú / khuyến nghị |
| :--- | :--- | :---: | :---: | :--- |
| Amazon VPC | Mạng riêng ảo cách ly, nền tảng cho toàn bộ hạ tầng network trên AWS | ● | ● | Nền tảng bắt buộc |
| Internet Gateway | Cổng kết nối VPC ra Internet, bắt buộc để expose ứng dụng công khai | ● | ● | Gắn cho ALB internet-facing phục vụ người dùng cuối |
| Site-to-Site VPN | Kênh mã hóa qua Internet kết nối on-prem với VPC | ● | ◐ (backup path) | Basic: kết nối chính. Full: giữ làm kênh dự phòng cho Direct Connect |
| AWS Direct Connect | Kết nối mạng riêng, chuyên dụng từ data center lên AWS, băng thông ổn định | ○ | ● | AWS khuyến nghị cho production traffic ổn định, latency thấp |
| NAT Gateway | Cho phép resource trong subnet private ra Internet (outbound) một chiều | ● (1-2 AZ) | ● (Multi-AZ) | Basic dùng 1-2 để cân bằng chi phí/HA |
| Transit Gateway | Hub trung tâm kết nối nhiều VPC/mạng on-prem qua một điểm | ○ | ● | Cần khi có nhiều VPC/account (Full-fledged multi-account) |
| Elastic Load Balancing (ALB/NLB) | Phân phối traffic đến nhiều target, chịu lỗi và scale ngang; ALB là cổng expose ứng dụng ra Internet | ● | ● | ALB cho HTTP(S) internet-facing, NLB nếu cần TCP/latency thấp |
| Amazon Route 53 | DNS quản lý domain, định tuyến public/hybrid và health check | ● | ● | DNS public cho tên miền expose ra Internet |
| AWS Global Accelerator | Định tuyến traffic người dùng đến điểm gần nhất qua mạng lõi AWS | ○ | ○ (tùy chọn) | Chỉ cần khi multi-region/latency toàn cầu là ưu tiên |

### 4.2 Lớp Security

| Dịch vụ | Ý nghĩa / Mô tả | Basic | Full-fledged | Ghi chú / khuyến nghị |
| :--- | :--- | :---: | :---: | :--- |
| AWS IAM (role, policy least-privilege) | Quản lý danh tính và phân quyền truy cập tài nguyên AWS | ● | ● | Bắt buộc, nền tảng AuthZ |
| AWS KMS | Tạo và quản lý khóa mã hóa dữ liệu | ● | ● | Basic: key mặc định; Full: CMK riêng theo domain/service |
| AWS Certificate Manager | Cấp và quản lý chứng chỉ TLS/SSL miễn phí | ● | ● | TLS cho ALB/CloudFront internet-facing |
| AWS Secrets Manager | Lưu trữ và luân chuyển bí mật (mật khẩu, API key) an toàn | ● | ● | Thay thế hardcode secret trong config |
| Amazon GuardDuty | Phát hiện mối đe dọa/hành vi bất thường bằng machine learning | ● | ● | Chi phí thấp, nên bật ngay từ Basic (AWS khuyến nghị baseline) |
| AWS Security Hub | Tổng hợp và ưu tiên hóa cảnh báo bảo mật từ nhiều dịch vụ | ○ | ● | Tổng hợp finding từ GuardDuty/Config/Inspector |
| AWS WAF | Chặn tấn công tầng ứng dụng web (SQLi, XSS, bot) theo OWASP Top 10 | ◐ (ruleset cơ bản cho ALB internet-facing) | ● | Basic bắt buộc cân nhắc vì ALB expose trực tiếp ra Internet; Full-fledged dùng managed rule group đầy đủ |
| AWS Network Firewall | Kiểm soát lưu lượng mạng theo rule tập trung ở tầng VPC | ○ | ● | Kiểm soát lưu lượng VPC-to-VPC/Internet mức sâu hơn |
| AWS Shield (Standard/Advanced) | Bảo vệ chống tấn công DDoS | Standard (free, tự động cho ALB) | Standard, cân nhắc Advanced | Shield Advanced chỉ cần khi rủi ro DDoS cao |
| Amazon Inspector | Tự động quét lỗ hổng bảo mật trên EC2/container image | ○ | ● | Quét lỗ hổng image/EC2 tự động |
| Amazon Macie | Phát hiện dữ liệu nhạy cảm (PII) trong S3 | ○ | ○ (tùy chọn) | Chỉ cần khi có dữ liệu nhạy cảm trong S3 |

### 4.3 Lớp Platform & Governance

| Dịch vụ | Ý nghĩa / Mô tả | Basic | Full-fledged | Ghi chú / khuyến nghị |
| :--- | :--- | :---: | :---: | :--- |
| AWS Organizations / Control Tower | Quản lý nhiều tài khoản AWS theo chuẩn landing zone tập trung | ○ | ● | Multi-account landing zone — nền tảng governance cấp doanh nghiệp |
| AWS Service Catalog | Chuẩn hóa danh mục sản phẩm hạ tầng cho self-service provisioning | ○ | ● | Chuẩn hóa self-service provisioning theo golden path |
| AWS Config | Ghi nhận và đánh giá compliance cấu hình tài nguyên theo thời gian | ◐ (vài rule cơ bản) | ● (rule đầy đủ + conformance pack) | Compliance-as-code |
| AWS CloudTrail | Ghi log mọi lệnh gọi API để audit và điều tra sự cố | ● | ● (org trail) | Audit log bắt buộc mọi mức |
| Amazon CloudWatch (Logs/Metrics/Alarms) | Thu thập log/metric, dựng dashboard và cảnh báo | ● | ● | Baseline observability |
| Amazon Managed Prometheus/Grafana (AMP/AMG) | Prometheus/Grafana được AWS vận hành, không cần tự quản lý hạ tầng | ○ | ● | Khớp stack Prometheus/Grafana hiện có on-prem, khuyến nghị cộng đồng |
| AWS Backup | Tự động hóa chính sách sao lưu/khôi phục tập trung | ◐ (RDS/EFS cơ bản) | ● (cross-region) | Chính sách backup/restore tập trung |
| AWS Budgets / Cost Explorer | Theo dõi, cảnh báo và phân tích chi phí sử dụng | ● | ● | Kiểm soát chi phí ngay từ Basic |
| AWS Systems Manager | Quản lý vá lỗi, truy cập từ xa an toàn không cần SSH/bastion | ● | ● | Patch, Session Manager (thay SSH/bastion) |
| Savings Plans for Compute | Cam kết mức sử dụng để đổi lấy giá compute thấp hơn | ◐ (đánh giá sau pilot) | ● | Cam kết 1 năm no-upfront cho EC2/Fargate sau khi tải thực tế ổn định, giảm ~20-30% chi phí compute |
| AWS Support Plan | Gói hỗ trợ kỹ thuật từ AWS theo SLA cam kết | Developer/Business | Business/Enterprise | Basic dùng Business tối thiểu để có case bảo mật ưu tiên; Full-fledged nâng theo SLA cần thiết |
| Amazon QuickSight | Dựng dashboard phân tích dữ liệu kinh doanh (BI) | ○ | ○ (tùy chọn) | Chỉ cần khi có nhu cầu BI/dashboard kinh doanh riêng ngoài CloudWatch |

### 4.4 Lớp Application

| Dịch vụ | Ý nghĩa / Mô tả | Basic | Full-fledged | Ghi chú / khuyến nghị |
| :--- | :--- | :---: | :---: | :--- |
| Amazon EKS | Kubernetes được AWS quản lý, giảm gánh nặng vận hành control plane | ● | ● | Khớp kinh nghiệm K8s on-prem hiện có, dễ vận hành song song |
| Amazon ECR | Kho lưu trữ container image riêng tư, tích hợp quét lỗ hổng | ● | ● | Container registry, tích hợp scan image |
| Amazon EC2 (worker node) | Máy chủ ảo, đơn vị compute nền tảng cho worker node EKS | ● | ● | Cân nhắc Graviton (m6g/m7g) để tối ưu chi phí |
| AWS Fargate | Chạy container serverless, không cần quản lý node | ◐ (tùy chọn) | ◐ (workload phù hợp) | Giảm vận hành node cho service ít traffic/burst |
| Amazon RDS | Cơ sở dữ liệu quan hệ được quản lý (backup, patch, failover tự động) | ● (dùng cho DB riêng từng microservice, xem 4.5) | ● (Multi-AZ, tách nhóm theo domain) | DB core vẫn ở on-prem; RDS chỉ phục vụ dữ liệu riêng của microservice trên AWS |
| Amazon ElastiCache | Cache in-memory tăng tốc truy vấn, giảm tải cho RDS | ○ | ● | Cache/session tier khi mở rộng |
| Amazon S3 | Lưu trữ object bền vững, chi phí thấp | ● | ● | Static asset, backup, log archive |
| Amazon EFS | Hệ thống file dùng chung, mount đồng thời nhiều instance/pod | ◐ | ● | Shared storage cho workload cần ReadWriteMany |
| Application Load Balancer + Ingress (ALB Controller/NGINX) | Định tuyến HTTP(S) vào cluster EKS; là cổng chính expose ứng dụng ra Internet | ● | ● | Cấu hình internet-facing, kết hợp Internet Gateway + WAF (xem 4.1/4.2) |
| Amazon API Gateway | Cổng vào tập trung cho REST/WebSocket API, tích hợp auth/throttling | ◐ (tùy chọn, cho API expose ra đối tác) | ● | Quản lý API tập trung khi số microservice public API tăng |
| Amazon MSK (Managed Kafka) | Nền tảng Kafka quản lý cho streaming dữ liệu thời gian thực | ○ | ● | Event streaming giữa các microservice khi kiến trúc event-driven trưởng thành hơn |
| AWS Transfer Family | Truyền file SFTP/FTPS an toàn, tích hợp thẳng với S3 | ○ | ◐ (tùy chọn) | Chỉ cần khi có tích hợp SFTP/FTPS với đối tác |
| Amazon SES | Gửi email giao dịch/thông báo số lượng lớn | ◐ (tùy chọn, chi phí thấp) | ● | Gửi email giao dịch/thông báo hệ thống |
| Amazon CloudFront | CDN phân phối nội dung tĩnh/động gần người dùng, kèm Shield tự động | ○ | ○ (tùy chọn) | Khi cần CDN + bảo vệ biên cho ứng dụng expose ra Internet |

### 4.5 Chiến Lược Database Cho Microservice (RDS)

- Giả định Hệ thống X có **~20 microservice**. **DB core** (dữ liệu lõi, system of record dùng chung) tiếp tục nằm on-prem, không di chuyển.
- Các microservice khi lên AWS áp dụng nguyên tắc **database-per-service**, nhưng để tối ưu chi phí ở quy mô thử nghiệm, nhóm nhiều DB logic (schema/database riêng) trên cùng một RDS instance theo domain/mức độ quan trọng, thay vì tạo 20 instance riêng lẻ.

| Nhóm RDS | Domain / mức độ quan trọng | Số microservice | Basic (Single-AZ) | Full-fledged (Multi-AZ) |
| :--- | :--- | :---: | :--- | :--- |
| Group A | Core business - giao dịch (critical) | 4 | db.t3.large | db.r5.large |
| Group B | Nghiệp vụ chính (core) | 6 | db.t3.large | db.r5.large |
| Group C | Hỗ trợ (supporting) | 6 | db.t3.medium | db.t3.large |
| Group D | Phụ trợ/ít traffic (auxiliary) | 4 | db.t3.medium | db.t3.large |
| **Tổng** | | **20** | **4 RDS instance** | **4 RDS cluster Multi-AZ** |

- Mỗi instance dùng PostgreSQL/MySQL theo stack hiện có của từng service, tách biệt bằng schema/database riêng; credential quản lý qua Secrets Manager, kết nối qua IAM DB Auth khi phù hợp.
- Full-fledged: nhóm A/B nâng cấp Multi-AZ + instance lớn hơn do chịu tải giao dịch cao hơn; nhóm C/D vẫn Multi-AZ nhưng instance nhỏ hơn.
- Khi traffic thực tế của một service vượt ngưỡng dùng chung, tách instance riêng cho service đó trước — tránh over-provision ngay từ đầu.

## 5) Kiến Trúc AWS Đề Xuất

### 5.1 Kiến trúc tổng thể hybrid (Basic)

```mermaid
---
config:
  layout: dagre
---
flowchart LR
  Internet(["Internet / End Users"])

  subgraph OnPrem ["On-Premise (hiện hữu)"]
    direction TB
    OP_K8s[Kubernetes Cluster\n~8-12 node]
    OP_NonK8s[Non-K8s Servers\n~18-22 server]
    OP_DB[(Database chính\nsystem of record)]
    OP_K8s --> OP_DB
    OP_NonK8s --> OP_DB
  end

  VPN{{Site-to-Site VPN\n2 tunnels}}

  subgraph AWS_Basic ["AWS ap-southeast-1 (Basic)"]
    direction TB
    subgraph Net ["Infra & Network"]
      IGW[Internet Gateway]
      VGW[Virtual Private Gateway]
      NAT[NAT Gateway]
      ALB[ALB - internet-facing]
    end
    subgraph Sec ["Security (tối giản)"]
      IAM[IAM Roles]
      KMS[KMS Default Key]
      GD[GuardDuty]
      WAF[AWS WAF - ruleset cơ bản]
    end
    subgraph Plat ["Platform & Governance (tối giản)"]
      CW[CloudWatch]
      CT[CloudTrail]
      Budgets[Budgets]
    end
    subgraph App ["Application"]
      EKS[EKS Cluster\n4-6 worker node]
      ECR[ECR]
      RDS[(RDS - 4 instance\nDB riêng microservice)]
      S3[(S3 - assets/backup)]
    end
    Internet --> IGW --> ALB
    WAF -.->|Bảo vệ| ALB
    ALB --> EKS
    EKS --> ECR
    EKS --> RDS
    EKS --> S3
    NAT --> EKS
  end

  OP_K8s <-->|Kênh riêng tư| VPN
  VPN <--> VGW
  VGW -.->|Route riêng tư| EKS
  EKS -.->|Truy vấn vào DB core qua VPN| OP_DB

  classDef onprem fill:#2c3e50,stroke:#1a252f,color:#fff;
  classDef internet fill:#3498db,stroke:#2471a3,color:#fff;
  classDef netlayer fill:#16a085,stroke:#0e6655,color:#fff;
  classDef seclayer fill:#e74c3c,stroke:#a93226,color:#fff;
  classDef platlayer fill:#f39c12,stroke:#b9770e,color:#fff;
  classDef applayer fill:#9b59b6,stroke:#7d3c98,color:#fff;
  class OP_K8s,OP_NonK8s,OP_DB onprem;
  class Internet internet;
  class IGW,VGW,NAT,ALB netlayer;
  class IAM,KMS,GD,WAF seclayer;
  class CW,CT,Budgets platlayer;
  class EKS,ECR,RDS,S3 applayer;
```

### 5.2 Kiến trúc tổng thể hybrid (Full-fledged — Success Picture)

```mermaid
%%{ init: { "layout": "elk" } }%%
flowchart LR
  Internet(["Internet / End Users"])

  subgraph OnPrem ["On-Premise"]
    direction TB
    OP_K8s[Kubernetes Cluster]
    OP_NonK8s[Non-K8s Servers]
    OP_DB[(Database chính)]
  end

  DX{{AWS Direct Connect\n+ VPN backup}}

  subgraph LZ ["AWS Landing Zone (Control Tower / Organizations)"]
    direction TB
    subgraph NetF ["Infra & Network"]
      IGWf[Internet Gateway]
      CDN[CloudFront - tùy chọn]
      TGW[Transit Gateway]
      NATm[NAT Gateway Multi-AZ]
      ALBm[ALB / NLB - internet-facing]
      R53[Route 53 - public + hybrid]
    end
    subgraph SecF ["Security"]
      IAMf[IAM + SCP]
      KMSf[KMS - CMK theo domain]
      GDf[GuardDuty]
      SHf[Security Hub]
      WAF[AWS WAF]
      NFW[Network Firewall]
      Insp[Inspector]
    end
    subgraph PlatF ["Platform & Governance"]
      Config[AWS Config + Conformance Pack]
      SC[Service Catalog]
      AMPG[Managed Prometheus/Grafana]
      Backup[AWS Backup - cross-region]
    end
    subgraph AppF ["Application (multi-env)"]
      EKSf[EKS Cluster - prod/stage\nautoscaling]
      RDSf[(RDS Multi-AZ - 4 cluster\nDB riêng microservice)]
      ECf[(ElastiCache)]
      S3f[(S3 + lifecycle)]
      EFSf[(EFS Multi-AZ)]
      MSKf[MSK - event streaming]
      APIGWf[API Gateway]
    end
    Internet --> IGWf --> NFW --> CDN --> WAF --> ALBm --> AppF
    R53 --> CDN
    TGW --> NetF
    NetF --> AppF
    AppF --> RDSf
    AppF --> ECf
    AppF --> MSKf
    APIGWf --> AppF
  end

  subgraph DR ["DR Region (pilot light)"]
    RDSdr[(RDS Replica)]
    S3dr[(S3 Replication)]
  end

  OP_K8s <--> DX
  DX <--> TGW
  RDSf -.->|Replication| RDSdr
  S3f -.->|Cross-region replication| S3dr

  classDef onprem fill:#2c3e50,stroke:#1a252f,color:#fff;
  classDef dr fill:#7f8c8d,stroke:#666,color:#fff;
  classDef internet fill:#3498db,stroke:#2471a3,color:#fff;
  classDef netlayer fill:#16a085,stroke:#0e6655,color:#fff;
  classDef seclayer fill:#e74c3c,stroke:#a93226,color:#fff;
  classDef platlayer fill:#f39c12,stroke:#b9770e,color:#fff;
  classDef applayer fill:#9b59b6,stroke:#7d3c98,color:#fff;
  class OP_K8s,OP_NonK8s,OP_DB onprem;
  class Internet internet;
  class IGWf,CDN,TGW,NATm,ALBm,R53 netlayer;
  class IAMf,KMSf,GDf,SHf,WAF,NFW,Insp seclayer;
  class Config,SC,AMPG,Backup platlayer;
  class EKSf,RDSf,ECf,S3f,EFSf,MSKf,APIGWf applayer;
  class RDSdr,S3dr dr;
```

### 5.3 Ghi chú kiến trúc theo lớp

- **Màu sắc nhất quán theo lớp** (áp dụng cho cả 2 sơ đồ Basic và Full-fledged): Infra & Network (xanh lá đậm), Security (đỏ), Platform & Governance (cam), Application (tím), On-Premise (xám than), Internet (xanh dương), DR (xám nhạt) — giúp đối chiếu trực quan cùng một lớp giữa hai kịch bản.
- **Đường đi traffic từ Internet**: `Internet → Internet Gateway → Network Firewall (kiểm tra lưu lượng tầng mạng L3/L4) → CloudFront (tùy chọn) → WAF (lọc tầng ứng dụng L7, OWASP Top 10) → ALB → Application`. Network Firewall kiểm soát trước ở biên VPC, WAF lọc sâu hơn ở tầng ứng dụng ngay trước ALB — đúng nguyên tắc defense-in-depth nhiều lớp.
- **Kết nối on-prem qua Transit Gateway (Full-fledged)**: Direct Connect/VPN backup gắn trực tiếp vào **Transit Gateway** (qua Direct Connect Gateway attachment) thay vì Virtual Private Gateway riêng lẻ — cho phép một điểm kết nối on-prem dùng chung cho nhiều VPC/account trong Landing Zone, đúng vai trò hub của Transit Gateway.
- **Internet exposure**: song song với kênh VPN/Direct Connect nối on-prem, ứng dụng còn được expose ra Internet qua **Internet Gateway + ALB internet-facing**, có **AWS WAF** (ruleset cơ bản ngay từ Basic) và **Shield Standard** bảo vệ mặc định. Full-fledged bổ sung **Network Firewall** ở biên VPC và **CloudFront** (tùy chọn) làm lớp edge/CDN phía trước ALB.
- **Infra & Network**: Basic dùng 1 VPC đơn giản, VPN 2 tunnel, NAT 1-2 AZ, cộng thêm Internet Gateway cho lối vào công khai. Full-fledged chuyển hẳn sang Direct Connect qua Transit Gateway (giữ VPN làm backup), phục vụ nhiều VPC/account.
- **Security**: Basic bật các dịch vụ chi phí thấp nhưng hiệu quả cao (IAM, KMS, GuardDuty, WAF ruleset cơ bản vì đã expose Internet). Full-fledged bổ sung Network Firewall, Security Hub, Inspector để đạt baseline production.
- **Platform & Governance**: Basic dùng single-account, CloudWatch/CloudTrail cơ bản. Full-fledged chuyển sang multi-account (Control Tower), Config conformance pack, Managed Prometheus/Grafana để khớp stack quan sát on-prem hiện có.
- **Application**: Lớp được đầu tư nhiều nhất ở Basic — EKS làm nền, giữ nguyên mô hình container hóa đã quen thuộc. Full-fledged mở rộng RDS Multi-AZ, ElastiCache, multi-environment, DR pilot light.

## 6) Dự Toán Chi Phí

> Lưu ý: các con số dưới đây là **ước tính ở mức lập kế hoạch** (planning-level), dựa trên giả định ở mục 2, giá on-demand khu vực `ap-southeast-1`. Cần xác nhận lại bằng AWS Pricing Calculator/Cost Explorer và sizing thực tế trước khi phê duyệt ngân sách chính thức. Reserved Instance/Savings Plan có thể giảm thêm 20-40% cho phần compute.

### 6.1 Kịch bản Basic (ngân sách tham khảo: 4,000 USD/tháng)

| Lớp | Hạng mục | Ước tính (USD/tháng) |
| :--- | :--- | ---: |
| Infra & Network | NAT Gateway (2x, HA) | 116 |
| Infra & Network | Site-to-Site VPN + data transfer | 76 |
| Infra & Network | Route 53 + data transfer khác | 30 |
| **Subtotal Network** | | **~222** |
| Security | GuardDuty | 25 |
| Security | Secrets Manager + KMS | 10 |
| Security | AWS WAF (ruleset cơ bản cho ALB internet-facing) | 26 |
| **Subtotal Security** | | **~61** |
| Platform & Governance | CloudWatch Logs/Metrics | 35 |
| Platform & Governance | AWS Config (rule cơ bản) | 20 |
| Platform & Governance | AWS Backup + ECR | 18 |
| **Subtotal Governance** | | **~73** |
| Application | EKS Control Plane | 73 |
| Application | EC2 worker node (6 x m5.xlarge) | 906 |
| Application | ALB (1-2, internet-facing) | 60 |
| Application | RDS - 4 instance Single-AZ cho 20 microservice DB (xem 4.5) | 396 |
| Application | ElastiCache (cache.t3.medium) | 50 |
| Application | S3 + EFS | 20 |
| **Subtotal Application** | | **~1,505** |
| **Tổng chi phí AWS (indicative)** | | **~1,861** |
| AWS Business Support (~10%, tối thiểu 100) | | 186 |
| **Tổng cộng** | | **~2,047** |
| Dư địa so với ngân sách 4,000 | | **~1,953 (buffer/contingency/scale-up)** |

### 6.2 Kịch bản Full-fledged (Success Picture)

| Lớp | Hạng mục | Ước tính (USD/tháng) |
| :--- | :--- | ---: |
| Infra & Network | Direct Connect (hosted 1Gbps) | 220 |
| Infra & Network | Transit Gateway + attachment | 108 |
| Infra & Network | NAT Gateway Multi-AZ | 116 |
| Infra & Network | VPN backup path | 56 |
| Infra & Network | Data transfer (~3TB) | 270 |
| Infra & Network | Route 53 | 10 |
| **Subtotal Network** | | **~780** |
| Security | GuardDuty + Security Hub | 80 |
| Security | AWS WAF | 30 |
| Security | AWS Network Firewall | 400 |
| Security | KMS (CMK theo domain) + Secrets Manager | 27 |
| Security | Inspector + Macie (tùy chọn) | 50 |
| **Subtotal Security** | | **~587** |
| Platform & Governance | Config (org-wide) + CloudTrail | 80 |
| Platform & Governance | Managed Prometheus/Grafana | 125 |
| Platform & Governance | AWS Backup (cross-region) | 50 |
| **Subtotal Governance** | | **~255** |
| Application | EKS Control Plane (prod + stage) | 146 |
| Application | EC2 worker node (12 x m5.xlarge, mix RI/Savings Plan khuyến nghị) | 1,812 |
| Application | RDS Multi-AZ - 4 cluster cho 20 microservice DB (xem 4.5) | 1,340 |
| Application | ElastiCache Multi-AZ | 274 |
| Application | ALB (multi-env) | 90 |
| Application | S3 + EFS Multi-AZ | 65 |
| Application | DR region (pilot light) | 200 |
| Application | Observability data volume | 150 |
| Application | Amazon MSK (3-broker, event streaming) | 600 |
| Application | API Gateway | 20 |
| Application | Amazon SES | 10 |
| **Subtotal Application** | | **~4,707** |
| **Tổng chi phí AWS (indicative)** | | **~6,329** |
| AWS Business Support (~10%) | | 633 |
| **Tổng cộng** | | **~6,962** |

### 6.3 So sánh và lộ trình nâng cấp chi phí

```mermaid
flowchart LR
  Basic["Basic\n~2,050 USD/tháng\nVPN + single account\nApplication-first"] -->|mở rộng dần theo tải thực tế và ROI| Full["Full-fledged\n~6,960 USD/tháng\nDirect Connect + multi-account\nFull security & HA"]
```

- Chênh lệch chủ yếu đến từ: Direct Connect, Network Firewall, RDS Multi-AZ (20 microservice DB), MSK, số lượng worker node, và DR region.
- Khuyến nghị: chạy Basic 2-3 tháng để đo tải thực tế (traffic, CPU/memory, chi phí data transfer) trước khi quyết định thời điểm và mức độ nâng cấp sang Full-fledged, tránh đầu tư dư thừa.

### 6.4 Cơ Sở Tính Toán Và Độ Tin Cậy Số Liệu

- **Cơ sở tính toán**: đơn giá on-demand tham khảo cho khu vực `ap-southeast-1`, theo instance family phổ biến (m5/m6g cho EC2, db.t3/db.r5 cho RDS), **chưa áp dụng** Reserved Instance/Savings Plan/Spot — đây là lý do Savings Plans được liệt kê ở mục 4.3 như một bước tối ưu sau khi tải ổn định.
- **Độ tin cậy**: con không có quyền truy cập trực tiếp AWS Price List API hay AWS Pricing Calculator trong phiên làm việc này, nên toàn bộ con số là **ước tính thủ công dựa trên đơn giá công khai điển hình của AWS**, không phải trích xuất real-time. Mức tin cậy phù hợp cho **lập kế hoạch ngân sách sơ bộ (±20-30%)**, chưa phải báo giá chính thức.
- Sai số lớn nhất thường đến từ: data transfer thực tế (phụ thuộc traffic đo được), số lượng NAT/ALB cần dùng, instance type chọn sau load test, và việc có mua Reserved/Savings Plan hay không.
- **Có cần tạo link AWS Pricing Calculator không?** Có, nên tạo — nhưng con không thể tự sinh sẵn một link "Share estimate" hợp lệ vì công cụ đó yêu cầu thao tác trực tiếp trên `https://calculator.aws/` (thêm từng dịch vụ, chọn vùng, lưu estimate) và chỉ xuất ra link chia sẻ sau khi cấu hình xong trên giao diện thật; con không có khả năng vận hành trình duyệt để thao tác việc đó trong phiên này. Đề xuất: đội hạ tầng tự dựng estimate trên AWS Pricing Calculator theo đúng danh sách dịch vụ + instance type trong tài liệu này (mục 4 và 6.1/6.2), sau đó lưu link "Share estimate" vào mục 10 (Tham chiếu) để thay thế bảng ước tính thủ công làm số liệu chính thức.

## 7) Lộ Trình Triển Khai

```mermaid
%%{ init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#1a1a1a', 'primaryBorderColor': '#2c3e50', 'lineColor': '#2c3e50', 'tertiaryColor': '#f4f4f4', 'cScale0': '#2c3e50', 'cScaleLabel0': '#ffffff', 'cScale1': '#1f6f8b', 'cScaleLabel1': '#ffffff', 'cScale2': '#8e44ad', 'cScaleLabel2': '#ffffff', 'cScale3': '#b9770e', 'cScaleLabel3': '#ffffff' } } }%%
timeline
  title Roadmap: Hybrid Cloud Pilot -> Success Picture
  0-1 tháng : Chuẩn bị nền tảng
             : Landing zone đơn giản, VPC, IAM, VPN
             : Xác định service pilot trong Hệ thống X
  1-3 tháng : Basic Pilot
             : Triển khai EKS, di chuyển 3-5 service
             : Kết nối ngược DB on-prem qua VPN, đo tải thực tế
  3-6 tháng : Đánh giá và mở rộng
             : Bật thêm Security Hub, WAF, Config đầy đủ
             : Cân nhắc Direct Connect nếu băng thông VPN không đủ
  6-12 tháng : Full-fledged Adoption
              : Multi-account landing zone (Control Tower)
              : RDS Multi-AZ, DR pilot light, Managed Prometheus/Grafana
```

## 8) Rủi Ro Chính Và Biện Pháp Giảm Thiểu

| Rủi ro | Tác động | Biện pháp giảm thiểu |
| :--- | :--- | :--- |
| Băng thông VPN không đủ khi service AWS gọi ngược DB on-prem | Tăng latency, timeout | Giám sát băng thông từ đầu Basic; có ngưỡng chuyển sang Direct Connect |
| Chi phí data transfer vượt dự kiến | Vượt ngân sách | Bật AWS Budgets alert theo tuần; theo dõi Cost Explorer theo service |
| Thiếu Security Hub/WAF ở Basic | Bề mặt tấn công lớn hơn | Vẫn bật GuardDuty + IAM least-privilege từ đầu; giới hạn public exposure của ALB |
| Chọn sai service pilot (quá phụ thuộc DB on-prem) | Không đo được lợi ích thật của hybrid | Ưu tiên chọn service ít trạng thái, latency-tolerant cho pilot |
| Thiếu kỹ năng vận hành multi-cloud | Chậm tiến độ, sự cố vận hành | Tận dụng kinh nghiệm K8s/observability on-prem sẵn có (Prometheus/Grafana/EFK), map 1-1 sang AWS tương đương (AMP/AMG) |
| Chưa rà soát compliance dữ liệu cá nhân | Rủi ro pháp lý khi lên Full-fledged | Rà soát Nghị định 13/2023 và quy định ngành trước khi mở rộng phạm vi dữ liệu |

## 9) Success Picture (Definition Of Done)

Mô hình hybrid cloud được coi là đạt Full-fledged khi:

1. Kết nối on-prem <-> AWS ổn định qua Direct Connect (VPN là backup).
2. Multi-account landing zone (Control Tower) vận hành với governance/tagging/cost allocation rõ ràng.
3. Toàn bộ service pilot và mở rộng chạy trên EKS với autoscaling, RDS Multi-AZ cho dữ liệu production.
4. Bộ bảo mật đầy đủ: GuardDuty, Security Hub, WAF, Network Firewall, Inspector đang hoạt động và có quy trình xử lý finding.
5. Observability hợp nhất on-prem/AWS qua Managed Prometheus/Grafana, cùng dashboard với stack hiện có.
6. Có DR pilot light ở region phụ, RTO/RPO được định nghĩa và kiểm thử ít nhất 1 lần.
7. Chi phí vận hành nằm trong ngân sách đã phê duyệt, có báo cáo Cost Explorer định kỳ hàng tháng.

## 10) Tham Chiếu

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS Hybrid Cloud Architectures](https://aws.amazon.com/hybrid/)
- [AWS Direct Connect](https://aws.amazon.com/directconnect/)
- [AWS Site-to-Site VPN](https://aws.amazon.com/vpn/site-to-site-vpn/)
- [AWS Control Tower](https://aws.amazon.com/controltower/)
- [Amazon EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân](https://vanban.chinhphu.vn/)