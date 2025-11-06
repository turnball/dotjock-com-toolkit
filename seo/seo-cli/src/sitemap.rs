use reqwest::blocking::get;
use url::Url;
use regex::Regex;

pub fn has_sitemap_xml(base_url: &str) -> bool {
    if let Ok(url) = Url::parse(base_url) {
        let sitemap_url = format!("{}://{}/sitemap.xml", url.scheme(), url.host_str().unwrap());
        if let Ok(resp) = get(&sitemap_url) {
            return resp.status().is_success();
        }
    }
    false
}

/// Extracts all <loc> URLs from a sitemap.xml string
pub fn extract_urls_from_sitemap(xml: &str) -> Vec<String> {
    let mut urls = Vec::new();
    let re = Regex::new(r"<loc>(.*?)</loc>").unwrap();
    for cap in re.captures_iter(xml) {
        urls.push(cap[1].to_string());
    }
    urls
}

pub  fn check_sitemap(base_url: &str) {
    if let Ok(url) = Url::parse(base_url) {
        let sitemap_url = format!("{}://{}/sitemap.xml", url.scheme(), url.host_str().unwrap());
        match get(&sitemap_url) {
            Ok(resp) if resp.status().is_success() => println!("✅ sitemap.xml found at {}", sitemap_url),
            _ => println!("❌ sitemap.xml not found"),
        }
    }
}
