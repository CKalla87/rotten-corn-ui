# Get your already created hosted zone
data "aws_route53_zone" "main" {
  name         = var.main_client_app_domain
  private_zone = false
}

resource "aws_route53_record" "client_app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.app_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.chatapp_cloudfront_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.chatapp_cloudfront_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

