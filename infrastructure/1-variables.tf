# Cloudfront, S3, Route53 and Certificates will be created in the us-east-1 region
variable "global_region" {
  type        = string
  description = "AWS Global Region"
  default     = "us-east-1"
}

variable "prefix" {
  type        = string
  description = "Prefix to be added to the AWS resources tags"
  default     = "chatapp-client"
}

variable "project" {
  type        = string
  description = "Prefix to be added to the AWS local tags"
  default     = "chatapp-client"
}

variable "main_client_app_domain" {
  type        = string
  description = "Main client app domain"
  default     = "chatappserver.space"
}

variable "dev_client_app_domain" {
  type        = string
  description = "Dev client app domain"
  default     = "dev.chatappserver.space"
}

variable "staging_client_app_domain" {
  type        = string
  description = "Staging client app domain"
  default     = "staging.chatappserver.space"
}

variable "prod_client_app_domain" {
  type        = string
  description = "Production client app domain"
  default     = "chatappserver.space"
}

variable "custom_error_response" {
  type = list(object({
    error_caching_min_ttl = number
    error_code            = number
    response_code         = number
    response_page_path    = string
  }))
  description = "List of one or more custom error response element maps. For SPA routing, 403/404 should return index.html with 200 status code."
  default = [
    {
      error_caching_min_ttl = 10
      error_code            = 400
      response_code         = 400
      response_page_path    = "/index.html"
    },
    {
      error_caching_min_ttl = 10
      error_code            = 403
      response_code         = 200 # Return 200 for SPA routing - allows React Router to handle the route
      response_page_path    = "/index.html"
    },
    {
      error_caching_min_ttl = 10
      error_code            = 404
      response_code         = 200 # Return 200 for SPA routing - allows React Router to handle the route
      response_page_path    = "/index.html"
    }
  ]
}

