import requests
from bs4 import BeautifulSoup
import re

def check_pmc_content(pmcid):
    """Check what content we can get from PMC"""
    url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
    
    print(f"=== CHECKING PMC CONTENT FOR {pmcid} ===")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for article content
            article = soup.find('article')
            if article:
                print(f"✅ Found <article> tag with {len(article.get_text())} characters")
                
                # Look for abstract
                abstract_selectors = [
                    'div.abstract',
                    'div[data-title="Abstract"]',
                    'section.abstract'
                ]
                
                abstract_found = False
                for selector in abstract_selectors:
                    elements = soup.select(selector)
                    if elements:
                        for elem in elements:
                            text = elem.get_text().strip()
                            if len(text) > 100:
                                print(f"✅ Found abstract: {len(text)} chars")
                                print(f"Preview: {text[:200]}...")
                                abstract_found = True
                                break
                    if abstract_found:
                        break
                
                if not abstract_found:
                    print("❌ No abstract found")
                
                # Look for main content sections
                sections = article.find_all(['div', 'section'], class_=re.compile(r'sec|section', re.I))
                print(f"Found {len(sections)} sections")
                
                research_sections = 0
                for i, section in enumerate(sections[:5]):
                    title = section.get('data-title') or section.get('title') or 'No title'
                    text = section.get_text().strip()
                    if len(text) > 200 and not any(nav in text.lower() for nav in ['search', 'menu', 'navigation']):
                        research_sections += 1
                        print(f"  Section {i+1}: {title} - {len(text)} chars")
                        print(f"    Preview: {text[:150]}...")
                
                print(f"Research sections found: {research_sections}")
                
                # Check for research indicators
                full_text = article.get_text()
                research_indicators = [
                    'abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion',
                    'p-value', 'statistical', 'significant', 'hypothesis', 'experiment'
                ]
                
                found_indicators = [indicator for indicator in research_indicators if indicator in full_text.lower()]
                print(f"Research indicators: {found_indicators}")
                
                return len(found_indicators) > 3
            else:
                print("❌ No article tag found")
                return False
        else:
            print(f"❌ Failed to fetch content: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

# Test a few PMC IDs
pmcids = ['PMC11831363', 'PMC10020673', 'PMC10025027']

for pmcid in pmcids:
    has_research = check_pmc_content(pmcid)
    print(f"Has research content: {has_research}")
    print("-" * 50)
