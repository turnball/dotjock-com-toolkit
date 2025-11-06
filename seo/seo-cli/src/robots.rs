use reqwest::blocking::get;
use url::Url;

pub fn has_robots_txt(base_url: &str) -> bool {
    if let Ok(url) = Url::parse(base_url) {
        let robots_url = format!("{}://{}/robots.txt", url.scheme(), url.host_str().unwrap());
        if let Ok(resp) = get(&robots_url) {
            return resp.status().is_success();
        }
    }
    false
}

pub fn check_robots_txt(base_url: &str) {
    if let Ok(url) = Url::parse(base_url) {
        let robots_url = format!("{}://{}/robots.txt", url.scheme(), url.host_str().unwrap());
        match get(&robots_url) {
            Ok(resp) if resp.status().is_success() => println!("✅ robots.txt found at {}", robots_url),
            _ => println!("❌ robots.txt not found"),
        }
    }
}