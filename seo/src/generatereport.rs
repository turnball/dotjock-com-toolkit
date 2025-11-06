use genpdf::{elements, style, Document};
pub struct SeoReport {
    pub url: String,
    pub title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical: Option<String>,
    pub missing_alt_count: usize,
    pub has_robots: bool,
    pub has_sitemap: bool,
}

pub fn generate_pdf_report(reports: &[SeoReport], filename: &str) {
    let mut doc = Document::new(genpdf::fonts::from_files("./fonts", "LiberationSans", None).unwrap());
    doc.set_title("SEO Report");

    let mut decorator = genpdf::SimplePageDecorator::new();
    decorator.set_margins(10);
    doc.set_page_decorator(decorator);

    let mut layout = elements::LinearLayout::vertical();
    layout.push(elements::Paragraph::new(format!("SEO Report for {}", report.url)).styled(style::Style::new().bold()));

    layout.push(elements::Paragraph::new(format!("Title: {}", report.title.clone().unwrap_or("Missing".into()))));
    layout.push(elements::Paragraph::new(format!("Meta Description: {}", report.meta_description.clone().unwrap_or("Missing".into()))));
    layout.push(elements::Paragraph::new(format!("Canonical Tag: {}", report.canonical.clone().unwrap_or("Missing".into()))));
    layout.push(elements::Paragraph::new(format!("Images missing alt text: {}", report.missing_alt_count)));
    layout.push(elements::Paragraph::new(format!("robots.txt found: {}", report.has_robots)));
    layout.push(elements::Paragraph::new(format!("sitemap.xml found: {}", report.has_sitemap)));

    doc.push(layout);
    doc.render_to_file(filename).expect("Failed to write PDF");
}
