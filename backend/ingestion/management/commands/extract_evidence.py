import re
from django.core.management.base import BaseCommand
from ingestion.models import Study, Section, EvidenceSentence


class Command(BaseCommand):
    help = 'Extract evidence sentences from study sections'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of studies to process'
        )
        parser.add_argument(
            '--study-id',
            type=int,
            default=None,
            help='Process specific study ID only'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        study_id = options['study_id']
        
        # Get studies to process
        if study_id:
            studies = Study.objects.filter(id=study_id)
        else:
            studies = Study.objects.all()
            if limit:
                studies = studies[:limit]
        
        self.stdout.write(f"Processing {studies.count()} studies...")
        
        processed = 0
        evidence_created = 0
        
        for study in studies:
            processed += 1
            self.stdout.write(f"Processing {processed}/{studies.count()}: {study.title[:50]}...")
            
            # Process each section
            for section in study.sections.all():
                if section.section_type in ['results', 'discussion', 'conclusion']:
                    sentences = self.extract_sentences(section.content)
                    
                    for i, sentence in enumerate(sentences):
                        if len(sentence.strip()) > 20:  # Only keep substantial sentences
                            evidence, created = EvidenceSentence.objects.get_or_create(
                                study=study,
                                section=section,
                                sentence_text=sentence.strip(),
                                sentence_index=i,
                                defaults={
                                    'char_start': 0,  # Placeholder
                                    'char_end': len(sentence.strip())
                                }
                            )
                            
                            if created:
                                evidence_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {processed} studies processed, {evidence_created} evidence sentences created"
            )
        )
    
    def extract_sentences(self, text):
        """Extract sentences from text"""
        if not text or len(text.strip()) < 10:
            return []
        
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        
        # Clean up sentences
        cleaned_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20 and not sentence.startswith(('Figure', 'Table', 'http')):
                cleaned_sentences.append(sentence)
        
        return cleaned_sentences
