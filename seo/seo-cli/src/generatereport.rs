use genpdf::{elements, style, Document, Element};

pub struct SeoReport {
    pub url: String,
    pub title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical: Option<String>,
    pub missing_alt_count: usize,
    pub has_robots: bool,
    pub has_sitemap: bool,
    pub messages: Vec<String>, // 🆕 Add this
}

pub fn generate_pdf_report(reports: &[SeoReport], filename: &str) {
    let font = genpdf::fonts::Builtin::Helvetica;
    let font_family = genpdf::fonts::from_files(
        "./fonts",                // folder containing .ttf files
        "LiberationSans",         // prefix of font file name
        None                      // fallback font
      ).expect("❌ Failed to load font from ./fonts");

    let mut doc = genpdf::Document::new(font_family);

    doc.set_title("SEO Report");

    let mut decorator = genpdf::SimplePageDecorator::new();
    decorator.set_margins(10);
    doc.set_page_decorator(decorator);

    let mut layout = elements::LinearLayout::vertical();

    for report in reports {
      layout.push(elements::Paragraph::new(format!("SEO Report for {}", report.url)).styled(style::Style::new().bold()));

      for msg in &report.messages {
          layout.push(elements::Paragraph::new(msg));
      }

      layout.push(elements::Paragraph::new(format!("robots.txt found: {}", report.has_robots)));
      layout.push(elements::Paragraph::new(format!("sitemap.xml found: {}", report.has_sitemap)));
      layout.push(elements::Break::new(1));
    }

    doc.push(layout);
    doc.render_to_file(filename).expect("Failed to write PDF");
}
