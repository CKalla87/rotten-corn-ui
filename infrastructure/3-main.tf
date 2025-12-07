terraform {
  backend "s3" {
    bucket               = "rotten-corn-terraform-state-602951639614"
    key                  = "chatapp.tfstate"
    region               = "us-east-1"
    encrypt              = true
    workspace_key_prefix = "workspaces"
  }
}

locals {
  prefix = "${var.prefix}-${terraform.workspace}"
  common_tags = {
    Environment = terraform.workspace
    Project     = var.project
    ManagedBy   = "Terraform"
    Owner       = "Uzochukwu Eddie Odozi"
  }

  # Select domain based on workspace
  app_domain = terraform.workspace == "develop" ? var.dev_client_app_domain : (
    terraform.workspace == "staging" ? var.staging_client_app_domain : var.prod_client_app_domain
  )
}


