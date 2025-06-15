# Accorto Table Order System - AWS Infrastructure
# Terraform configuration for full-stack deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "db_password" {
  description = "Database password"
  type        = string
  default     = "AccortoTest123!"
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "accorto"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group for RDS
resource "aws_security_group" "rds_sg" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # セキュリティ無視（テスト用）
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-db"

  # Engine
  engine         = "postgres"
  engine_version = "15.8"

  # Instance
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"
  storage_encrypted = true

  # Database
  db_name  = var.project_name
  username = "postgres"
  password = var.db_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = true

  # Backup
  backup_retention_period = 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Options
  multi_az                = false
  deletion_protection     = false
  skip_final_snapshot     = true
  apply_immediately       = true

  tags = {
    Name = "${var.project_name}-db"
  }
}

# S3 Buckets for Frontend Apps
resource "aws_s3_bucket" "frontend_apps" {
  for_each = toset(["table", "admin", "kitchen", "staff"])
  
  bucket = "${var.project_name}-${each.key}-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-${each.key}"
    App  = each.key
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Public Access Configuration
resource "aws_s3_bucket_public_access_block" "frontend_apps" {
  for_each = aws_s3_bucket.frontend_apps

  bucket = each.value.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy for Public Read
resource "aws_s3_bucket_policy" "frontend_apps" {
  for_each = aws_s3_bucket.frontend_apps

  bucket = each.value.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${each.value.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend_apps]
}

# S3 Bucket Website Configuration
resource "aws_s3_bucket_website_configuration" "frontend_apps" {
  for_each = aws_s3_bucket.frontend_apps

  bucket = each.value.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_apps" {
  for_each = aws_s3_bucket.frontend_apps

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend_apps[each.key].website_endpoint
    origin_id   = "S3-${each.value.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${each.value.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-${each.key}-cdn"
    App  = each.key
  }
}

# Outputs
output "database_url" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${aws_db_instance.postgres.username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_buckets" {
  description = "S3 bucket names"
  value = {
    for k, v in aws_s3_bucket.frontend_apps : k => v.id
  }
}

output "s3_website_urls" {
  description = "S3 website URLs"
  value = {
    for k, v in aws_s3_bucket_website_configuration.frontend_apps : k => "http://${v.website_endpoint}"
  }
}

output "cloudfront_urls" {
  description = "CloudFront distribution URLs"
  value = {
    for k, v in aws_cloudfront_distribution.frontend_apps : k => "https://${v.domain_name}"
  }
}

output "next_steps" {
  description = "Next steps to complete deployment"
  value = <<EOF

🎉 Infrastructure created successfully!

📋 Next steps:
1. Create App Runner service with this DATABASE_URL:
   ${aws_db_instance.postgres.endpoint}

2. Deploy frontend apps:
   ./deploy-frontend-to-s3.sh

3. Update frontend environment variables with App Runner URL

4. Access your applications:
   - Table:   https://${aws_cloudfront_distribution.frontend_apps["table"].domain_name}
   - Admin:   https://${aws_cloudfront_distribution.frontend_apps["admin"].domain_name}
   - Kitchen: https://${aws_cloudfront_distribution.frontend_apps["kitchen"].domain_name}
   - Staff:   https://${aws_cloudfront_distribution.frontend_apps["staff"].domain_name}

EOF
}