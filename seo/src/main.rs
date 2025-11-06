use clap::Parser;
use std::collections::HashSet;
use console::{style, Emoji};
use crawler::crawl_and_collect;
use generatereport::{generate_pdf_report, SeoReport};
use sitemap;
use robots;

/// SEO Crawler CLI
#[derive(Parser)]
#[command(name = "seo-crawler")]
#[command(about = "Crawls a website and generates an SEO report", long_about = None)]
struct Cli {
    /// Starting URL to crawl
    url: String,

    /// Output PDF file name
    #[arg(short, long, default_value = "seo_report.pdf")]
    output: String,

    /// Maximum number of pages to crawl
    #[arg(short, long, default_value_t = 5)]
    limit: usize,
}

fn main() {
    env_logger::init();
    let args = Cli::parse();

    println!(
        "{} {} Starting SEO crawl for {}",
        LOOKING_GLASS,
        style("INFO").cyan().bold(),
        style(&args.url).underlined()
    );

    robots::check_robots_txt(&args.url);
    sitemap::check_sitemap(&args.url);

    let mut visited = HashSet::new();
    let mut reports = Vec::new();

    let bar = ProgressBar::new(args.limit as u64);
    bar.set_style(
        ProgressStyle::with_template("[{elapsed_precise}] {bar:40.cyan/blue} {pos}/{len} {msg}")
            .unwrap(),
    );

    crawl_and_collect(&args.url, &mut visited, &mut reports, args.limit, &bar);

    bar.finish_with_message("Crawl complete!");

    println!(
        "{} {} Generating PDF report: {}",
        CHECK,
        style("DONE").green().bold(),
        style(&args.output).yellow()
    );

    generate_pdf_report(&reports, &args.output);

    println!(
        "{} {} Report saved to {}",
        CHECK,
        style("SUCCESS").green().bold(),
        style(&args.output).underlined()
    );
}
