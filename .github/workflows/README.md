# GitHub Actions CI/CD Pipeline

This repository uses GitHub Actions for continuous integration and deployment.

## Required Secrets

The following secrets need to be configured in your GitHub repository settings (Settings → Secrets and variables → Actions):

1. **AWS_ACCESS_KEY_ID**: AWS access key for S3 and CloudFront operations
2. **AWS_SECRET_ACCESS_KEY**: AWS secret key for S3 and CloudFront operations
3. **SLACK_WEBHOOK_URL** (optional): Slack webhook URL for deployment notifications

## Workflow Overview

The pipeline runs on pushes and pull requests to `develop`, `staging`, and `main` branches.

### Jobs

1. **install-dependencies**: Installs npm dependencies and caches them
2. **linting**: Runs ESLint to check code quality
3. **code-formatter-check**: Checks code formatting (if format:check script exists)
4. **unit-test**: Runs Jest unit tests with coverage
5. **build-app**: Builds the React application
6. **terraform-validate**: Validates Terraform configuration
7. **terraform-plan-and-apply**: Plans and applies Terraform infrastructure changes
8. **upload-build-to-s3**: Uploads build artifacts to S3
9. **aws-cloudfront-distribution**: Invalidates CloudFront distribution cache
10. **notify-via-slack**: Sends Slack notification about deployment status

### Job Dependencies

```
install-dependencies
    ├── linting
    ├── code-formatter-check
    │   └── unit-test
    │       └── build-app
    │           └── upload-build-to-s3
    │               └── aws-cloudfront-distribution
    │                   └── notify-via-slack
terraform-validate
    └── terraform-plan-and-apply
        └── upload-build-to-s3
```

## Environment Variables

- `AWS_REGION`: us-east-1
- `NODE_VERSION`: 16.17.0

## S3 Buckets

The workflow deploys to different S3 buckets based on the branch:
- `develop` → `s3://chatapp-client-develop-app-602951639614`
- `staging` → `s3://chatapp-client-staging-app-602951639614`
- `main` → `s3://chatapp-client-main-app-602951639614`

## Environment Files

Environment files are synced from S3 before building:
- `develop` → `s3://chattyapp-env-files/frontend/develop`
- `staging` → `s3://chattyapp-env-files/frontend/staging`
- `main` → `s3://chattyapp-env-files/frontend/production`


