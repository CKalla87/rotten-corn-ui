# Infrastructure Setup Checklist

Use this checklist before pushing your changes to ensure all environments are properly configured.

## Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] AWS CLI installed and configured with credentials
- [ ] Terraform installed (version ~> 1.2.0)
- [ ] AWS account has necessary permissions (S3, CloudFront, Route53, ACM, IAM)
- [ ] Route53 hosted zone exists for `chatappserver.space`
- [ ] S3 bucket `rotten-corn-terraform-state-602951639614` exists in `us-east-1` region
- [ ] Environment files exist in S3:
  - [ ] `s3://chattyapp-env-files/frontend/develop/.env`
  - [ ] `s3://chattyapp-env-files/frontend/staging/.env`
  - [ ] `s3://chattyapp-env-files/frontend/production/.env`

### ✅ Terraform Setup
- [ ] Navigate to infrastructure directory: `cd infrastructure`
- [ ] Initialize Terraform: `terraform init`
- [ ] Create workspaces:
  - [ ] `terraform workspace new develop`
  - [ ] `terraform workspace new staging`
  - [ ] `terraform workspace new main`

### ✅ Deploy Environments

#### Development
- [ ] `terraform workspace select develop`
- [ ] `terraform plan` (review changes)
- [ ] `terraform apply` (wait for certificate validation ~10-30 min)
- [ ] Verify: `terraform output cloudfront_distribution_id`

#### Staging
- [ ] `terraform workspace select staging`
- [ ] `terraform plan` (review changes)
- [ ] `terraform apply` (wait for certificate validation ~10-30 min)
- [ ] Verify: `terraform output cloudfront_distribution_id`

#### Production
- [ ] `terraform workspace select main`
- [ ] `terraform plan` (review carefully!)
- [ ] `terraform apply` (wait for certificate validation ~10-30 min)
- [ ] Verify: `terraform output cloudfront_distribution_id`

### ✅ Post-Deployment Verification
- [ ] All three S3 buckets created (check AWS console)
- [ ] All three CloudFront distributions deployed (check AWS console)
- [ ] DNS records created in Route53 (check AWS console)
- [ ] Certificates validated (check ACM in us-east-1)
- [ ] Test access to each domain:
  - [ ] `dev.chatappserver.space`
  - [ ] `staging.chatappserver.space`
  - [ ] `chatappserver.space`

### ✅ CI/CD Ready
- [ ] All workspaces exist and are accessible
- [ ] Terraform state files exist in S3 for each workspace
- [ ] CI/CD secrets configured (AWS credentials, Slack webhook if used)
- [ ] Ready to push to `develop`, `staging`, and `main` branches

## Quick Commands Reference

```bash
# Initialize
cd infrastructure
terraform init

# List workspaces
terraform workspace list

# Select workspace
terraform workspace select <workspace-name>

# Plan changes
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output

# Destroy (use with caution!)
terraform destroy
```

## Estimated Time

- Initial setup: 30-45 minutes
- Certificate validation: 10-30 minutes per environment
- CloudFront deployment: 15-20 minutes per environment
- **Total: ~2-3 hours for all three environments**

## Need Help?

See `README.md` for detailed instructions and troubleshooting.
