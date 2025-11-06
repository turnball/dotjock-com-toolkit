use reqwest::blocking::get;
use select::document::Document;
use select::predicate::{Name, Attr};
use url::Url;
use std::collections::HashSet;
use indicatif::ProgressBar;
use console::{style, Emoji};
use crate::robots::has_robots_txt;
use crate::sitemap::has_sitemap_xml;

use crate::generatereport::SeoReport;

static LINK: Emoji<'_, '_> = Emoji("🔗", "");
static CHECK: Emoji<'_, '_> = Emoji("✅", "");
static WARN: Emoji<'_, '_> = Emoji("⚠️", "");
static FAIL: Emoji<'_, '_> = Emoji("❌", "");

pub fn crawl_and_collect(
    url: &str,
    visited: &mut HashSet<String>,
    reports: &mut Vec<SeoReport>,
    limit: usize,
    bar: &ProgressBar,
) {
    if visited.len() >= limit || visited.contains(url) {
        return;
    }
    visited.insert(url.to_string());
    bar.inc(1);

    println!(
        "{} Crawling {}",
        LINK,
        style(url).blue().underlined()
    );

    let body = match get(url) {
        Ok(resp) => match resp.text() {
            Ok(text) => text,
            Err(_) => {
                println!("{} Failed to read response from {}", FAIL, url);
                return;
            }
        },
        Err(_) => {
            println!("{} Failed to fetch {}", FAIL, url);
            return;
        }
    };

    let document = Document::from(body.as_str());

    // SEO checks
    let title = document.find(Name("title")).next().map(|n| n.text());
    let meta_description = document
        .find(Attr("name", "description"))
        .next()
        .and_then(|n| n.attr("content"))
        .map(|s| s.to_string());

    let canonical = document
        .find(Attr("rel", "canonical"))
        .next()
        .and_then(|n| n.attr("href"))
        .map(|s| s.to_string());

    let img_tags = document.find(Name("img")).collect::<Vec<_>>();
    let missing_alt_count = img_tags.iter().filter(|img| img.attr("alt").is_none()).count();
    let mut messages = Vec::new();

    if let Some(t) = &title {
        messages.push(format!("✅ Title found: {}", t));
    } else {
        messages.push("⚠️ Missing <title> tag".into());
    }

    if let Some(d) = &meta_description {
        if d.is_empty() {
            messages.push("⚠️ Empty meta description".into());
        } else {
            messages.push("✅ Meta description found".into());
        }
    } else {
        messages.push("⚠️ Missing meta description".into());
    }

    if let Some(c) = &canonical {
        messages.push(format!("✅ Canonical tag: {}", c));
    } else {
        messages.push("⚠️ Missing canonical tag".into());
    }

    messages.push(format!("✅ Images missing alt text: {}", missing_alt_count));

    // Log findings
    match &title {
        Some(t) => println!("{} Title found: {}", CHECK, style(t).green()),
        None => println!("{} Missing <title> tag", WARN),
    }

    match &meta_description {
        Some(d) if !d.is_empty() => println!("{} Meta description found", CHECK),
        _ => println!("{} Missing or empty meta description", WARN),
    }

    match &canonical {
        Some(c) => println!("{} Canonical tag: {}", CHECK, style(c).cyan()),
        None => println!("{} Missing canonical tag", WARN),
    }

    println!(
        "{} Images missing alt text: {}",
        if missing_alt_count == 0 { CHECK } else { WARN },
        missing_alt_count
    );
    let has_robots = has_robots_txt(url);
    let has_sitemap = has_sitemap_xml(url);
    // Create report
    let report = SeoReport {
        url: url.to_string(),
        title,
        meta_description,
        canonical,
        missing_alt_count,
        has_robots,
        has_sitemap,
        messages,
    };

    reports.push(report);

    // Crawl internal links
    for node in document.find(Name("a")) {
        if let Some(href) = node.attr("href") {
            if let Ok(link) = Url::parse(url).unwrap().join(href) {
                let link_str = link.to_string();
                if link_str.contains(Url::parse(url).unwrap().host_str().unwrap()) {
                    crawl_and_collect(&link_str, visited, reports, limit, bar);
                }
            }
        }
    }
}
