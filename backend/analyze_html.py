from bs4 import BeautifulSoup
import re

# Read the HTML file
with open('data/pmc_articles/PMC11831363.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

print("=== HTML STRUCTURE ANALYSIS ===")

# Look for article content
article = soup.find('div', class_='article')
print(f"Article div found: {article is not None}")

if article:
    print(f"Article content length: {len(article.get_text())}")
    print(f"First 200 chars: {article.get_text()[:200]}")

# Look for other content containers
content_selectors = [
    'div.article',
    'div.content',
    'div.main',
    'article',
    'div[class*="content"]',
    'div[class*="article"]',
    'div[class*="main"]'
]

print("\n=== CONTENT CONTAINERS ===")
for selector in content_selectors:
    elements = soup.select(selector)
    print(f"{selector}: {len(elements)} found")
    if elements:
        for i, elem in enumerate(elements[:3]):  # Show first 3
            text = elem.get_text().strip()
            print(f"  {i+1}. Length: {len(text)}, Preview: {text[:100]}...")

# Look for sections
print("\n=== SECTIONS ===")
sections = soup.find_all(['div', 'section'], class_=re.compile(r'sec|section', re.I))
print(f"Found {len(sections)} sections")
for i, section in enumerate(sections[:5]):  # Show first 5
    title = section.get('data-title') or section.get('title') or 'No title'
    text = section.get_text().strip()
    print(f"  {i+1}. Title: {title}, Length: {len(text)}, Preview: {text[:100]}...")

# Look for abstract
print("\n=== ABSTRACT ===")
abstract_selectors = [
    'div.abstract',
    'div[data-title="Abstract"]',
    'div[data-title="ABSTRACT"]',
    'section.abstract'
]

for selector in abstract_selectors:
    elements = soup.select(selector)
    print(f"{selector}: {len(elements)} found")
    if elements:
        for elem in elements:
            text = elem.get_text().strip()
            print(f"  Length: {len(text)}, Preview: {text[:200]}...")
