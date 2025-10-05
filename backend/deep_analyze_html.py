import os
from bs4 import BeautifulSoup
import re

def deep_analyze_html(filepath):
    """Deep analysis of HTML file to find actual research content"""
    print(f"\n=== DEEP ANALYSIS: {os.path.basename(filepath)} ===")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    # Find all divs with class containing 'sec' (PMC sections)
    sections = soup.find_all('div', class_=re.compile(r'sec', re.I))
    print(f"Found {len(sections)} sections with 'sec' class")
    
    research_content = []
    
    for i, section in enumerate(sections):
        title = section.get('data-title') or section.get('title') or 'No title'
        text = section.get_text().strip()
        
        # Check if this looks like research content
        if len(text) > 200:
            # Look for research indicators
            research_indicators = [
                'abstract', 'introduction', 'method', 'result', 'discussion', 'conclusion',
                'p-value', 'statistical', 'significant', 'hypothesis', 'experiment',
                'data', 'analysis', 'study', 'research', 'finding', 'observed',
                'measured', 'calculated', 'determined', 'showed', 'demonstrated'
            ]
            
            text_lower = text.lower()
            found_indicators = [indicator for indicator in research_indicators if indicator in text_lower]
            
            if len(found_indicators) > 2:  # Has research content
                research_content.append({
                    'title': title,
                    'text': text,
                    'indicators': found_indicators
                })
                print(f"  ✅ Section {i+1}: {title} - {len(text)} chars")
                print(f"    Indicators: {found_indicators}")
                print(f"    Preview: {text[:200]}...")
            else:
                print(f"  ❌ Section {i+1}: {title} - {len(text)} chars (not research)")
                print(f"    Preview: {text[:100]}...")
    
    print(f"\nResearch sections found: {len(research_content)}")
    return research_content

# Analyze a few HTML files
html_dir = "data/pmc_articles"
html_files = [f for f in os.listdir(html_dir) if f.endswith('.html')][:3]

print("=== DEEP ANALYSIS OF HTML FILES ===")
total_research_sections = 0

for html_file in html_files:
    filepath = os.path.join(html_dir, html_file)
    if os.path.exists(filepath):
        research_sections = deep_analyze_html(filepath)
        total_research_sections += len(research_sections)

print(f"\n=== SUMMARY ===")
print(f"Total research sections found: {total_research_sections}")
print(f"Average per file: {total_research_sections / len(html_files):.1f}")
