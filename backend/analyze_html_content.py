import os
from bs4 import BeautifulSoup
import re

def analyze_html_file(filepath):
    """Analyze an HTML file to see what content we actually have"""
    print(f"\n=== ANALYZING: {os.path.basename(filepath)} ===")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    # Remove navigation elements
    for elem in soup.find_all(['nav', 'header', 'footer', 'aside']):
        elem.decompose()
    
    # Look for article content
    article_content = soup.find('article')
    if article_content:
        print(f"✅ Found <article> tag with {len(article_content.get_text())} characters")
        content = article_content.get_text().strip()
        print(f"Preview: {content[:200]}...")
        
        # Look for research sections within article
        sections = article_content.find_all(['div', 'section'], class_=re.compile(r'sec|section', re.I))
        print(f"Found {len(sections)} sections in article")
        
        for i, section in enumerate(sections[:3]):
            title = section.get('data-title') or section.get('title') or 'No title'
            text = section.get_text().strip()
            print(f"  Section {i+1}: {title} - {len(text)} chars")
            if len(text) > 50:
                print(f"    Preview: {text[:100]}...")
    else:
        print("❌ No <article> tag found")
    
    # Look for abstract
    abstract_selectors = [
        'div.abstract',
        'div[data-title="Abstract"]',
        'div[data-title="ABSTRACT"]',
        'section.abstract'
    ]
    
    abstract_found = False
    for selector in abstract_selectors:
        elements = soup.select(selector)
        if elements:
            for elem in elements:
                text = elem.get_text().strip()
                if len(text) > 50:
                    print(f"✅ Found abstract with {len(text)} characters")
                    print(f"Preview: {text[:200]}...")
                    abstract_found = True
                    break
        if abstract_found:
            break
    
    if not abstract_found:
        print("❌ No abstract found")
    
    # Look for main content areas
    content_areas = soup.find_all(['div', 'section'], class_=re.compile(r'content|main|body', re.I))
    print(f"Found {len(content_areas)} content areas")
    
    for i, area in enumerate(content_areas[:3]):
        text = area.get_text().strip()
        if len(text) > 100:
            print(f"  Content area {i+1}: {len(text)} chars")
            print(f"    Preview: {text[:150]}...")
    
    # Check if this looks like a real research paper
    full_text = soup.get_text()
    research_indicators = [
        'abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion',
        'p-value', 'statistical', 'significant', 'hypothesis', 'experiment'
    ]
    
    found_indicators = [indicator for indicator in research_indicators if indicator in full_text.lower()]
    print(f"Research indicators found: {found_indicators}")
    
    return len(found_indicators) > 3

# Analyze a few HTML files
html_dir = "data/pmc_articles"
html_files = [f for f in os.listdir(html_dir) if f.endswith('.html')][:5]

print("=== ANALYZING HTML FILES FOR RESEARCH CONTENT ===")
research_papers = 0

for html_file in html_files:
    filepath = os.path.join(html_dir, html_file)
    if os.path.exists(filepath):
        is_research = analyze_html_file(filepath)
        if is_research:
            research_papers += 1

print(f"\n=== SUMMARY ===")
print(f"Analyzed {len(html_files)} HTML files")
print(f"Files with research content: {research_papers}")
print(f"Files with navigation only: {len(html_files) - research_papers}")
