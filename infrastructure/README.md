# Infrastructure Setup Guide

This guide explains how to set up the hosting infrastructure for the Rotten Corn UI application using Terraform.

## Overview

The infrastructure supports three environments:
- **develop** - Development environment (`dev.chatappserver.space`)
- **staging** - Staging environment (`staging.chatappserver.space`)
- **main** - Production environment (`chatappserver.space`)

Each environment includes:
- S3 bucket for hosting static files
- CloudFront distribution for CDN
- Route53 DNS records
- ACM SSL certificates
- Origin Access Identity (OAI) for secure S3 access

## Prerequisites

Before setting up the infrastructure, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** installed (version ~> 1.2.0)
4. **Route53 Hosted Zone** already created for your domain (`chatappserver.space`)
5. **S3 Bucket** for Terraform state (`rotten-corn-terraform-state-602951639614`) in `us-east-1` region
6. **Environment files** in S3:
   - `s3://chattyapp-env-files/frontend/develop/.env`
   - `s3://chattyapp-env-files/frontend/staging/.env`
   - `s3://chattyapp-env-files/frontend/production/.env`

## AWS Resources Required

### 1. Terraform State Bucket
The S3 bucket for storing Terraform state must exist before running Terraform:
```bash
aws s3 mb s3://rotten-corn-terraform-state-602951639614 --region us-east-1
aws s3api put-bucket-versioning \
  --bucket rotten-corn-terraform-state-602951639614 \
  --versioning-configuration Status=Enabled \
  --region us-east-1
```

### 2. Route53 Hosted Zone
Ensure you have a hosted zone for your domain:
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='chatappserver.space.']"
```

If it doesn't exist, create it:
```bash
aws route53 create-hosted-zone --name chatappserver.space --caller-reference $(date +%s)
```

## Setup Instructions

### Step 1: Initialize Terraform

Navigate to the infrastructure directory:
```bash
cd infrastructure
```

Initialize Terraform (this will set up the S3 backend):
```bash
terraform init
```

### Step 2: Create Workspaces

Terraform uses workspaces to manage different environments. Create workspaces for each environment:

```bash
# Development environment
terraform workspace new develop

# Staging environment
terraform workspace new staging

# Production environment
terraform workspace new main
```

### Step 3: Configure Domain Variables (Optional)

If your domains differ from the defaults, you can override them:

- `dev_client_app_domain` (default: `dev.chatappserver.space`)
- `staging_client_app_domain` (default: `staging.chatappserver.space`)
- `prod_client_app_domain` (default: `chatappserver.space`)

Create a `terraform.tfvars` file or use environment variables:
```hcl
dev_client_app_domain     = "dev.chatappserver.space"
staging_client_app_domain  = "staging.chatappserver.space"
prod_client_app_domain     = "chatappserver.space"
```

### Step 4: Deploy Each Environment

#### Deploy Development Environment

```bash
# Select the develop workspace
terraform workspace select develop

# Review the plan
terraform plan

# Apply the changes
terraform apply
```

**Note:** The first time you apply, ACM certificate validation may take 10-30 minutes. Terraform will wait for validation to complete.

#### Deploy Staging Environment

```bash
# Select the staging workspace
terraform workspace select staging

# Review the plan
terraform plan

# Apply the changes
terraform apply
```

#### Deploy Production Environment

```bash
# Select the main workspace
terraform workspace select main

# Review the plan (IMPORTANT: Review carefully for production!)
terraform plan

# Apply the changes
terraform apply
```

### Step 5: Verify Deployment

After deployment, verify each environment:

1. **Check S3 Buckets:**
   ```bash
   aws s3 ls | grep chatapp-client
   ```

2. **Check CloudFront Distributions:**
   ```bash
   aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,Aliases.Items[0],Status]"
   ```

3. **Check Route53 Records:**
   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id <YOUR_ZONE_ID> --query "ResourceRecordSets[?Type=='A']"
   ```

4. **Get CloudFront Distribution IDs:**
   ```bash
   terraform workspace select develop
   terraform output cloudfront_distribution_id
   
   terraform workspace select staging
   terraform output cloudfront_distribution_id
   
   terraform workspace select main
   terraform output cloudfront_distribution_id
   ```

## CI/CD Integration

The infrastructure is designed to work with your CI/CD pipeline:

- **GitHub Actions** (`.github/workflows/ci.yml`) - Automatically creates/selects workspaces based on branch name

When you push to:
- `develop` branch → deploys to develop workspace
- `staging` branch → deploys to staging workspace
- `main` branch → deploys to main workspace

## Important Notes

### Certificate Validation
- ACM certificates are created in `us-east-1` (required for CloudFront)
- DNS validation records are automatically created in Route53
- Certificate validation typically takes 10-30 minutes
- Terraform will wait for validation before completing

### CloudFront Distribution
- Distributions take 15-20 minutes to deploy
- After deployment, you may need to wait for DNS propagation
- Use CloudFront invalidation to clear cache: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

### S3 Bucket Naming
- Buckets are named: `{prefix}-{workspace}-app`
- Example: `chatapp-client-develop-app`
- Buckets are private and only accessible via CloudFront OAI

### State Management
- Terraform state is stored in S3: `s3://rotten-corn-terraform-state-602951639614/{workspace}/chatapp.tfstate`
- Each environment has its own state file
- State is encrypted and versioned

## Troubleshooting

### Certificate Validation Fails
- Ensure Route53 hosted zone exists and is accessible
- Check DNS validation records are created correctly
- Wait for DNS propagation (can take up to 48 hours, usually much faster)

### CloudFront Distribution Not Accessible
- Verify certificate is validated: `aws acm list-certificates --region us-east-1`
- Check CloudFront distribution status: `aws cloudfront get-distribution --id <ID>`
- Ensure Route53 alias records point to CloudFront

### Terraform State Lock
If Terraform state is locked:
```bash
aws dynamodb list-tables --region us-east-1
# If you see a lock table, you may need to delete the lock entry
```

### Workspace Issues
List all workspaces:
```bash
terraform workspace list
```

Show current workspace:
```bash
terraform workspace show
```

## Cleanup

To destroy an environment:

```bash
# Select the workspace
terraform workspace select <workspace-name>

# Destroy resources
terraform destroy
```

**Warning:** This will delete all resources including S3 buckets, CloudFront distributions, and DNS records. Make sure you have backups if needed.

## Cost Considerations

Approximate monthly costs per environment:
- S3 storage: ~$0.023 per GB
- CloudFront: ~$0.085 per GB (first 10TB)
- Route53: ~$0.50 per hosted zone + $0.40 per million queries
- ACM: Free

Total estimated cost per environment: $5-20/month (depending on traffic)

## Support

For issues or questions:
1. Check Terraform logs: `terraform plan` and `terraform apply` output
2. Review AWS CloudWatch logs
3. Check AWS service health dashboard
