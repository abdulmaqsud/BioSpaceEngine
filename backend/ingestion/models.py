from django.db import models
import json


class Study(models.Model):
    """Main study/publication model"""
    title = models.TextField()
    authors = models.TextField(blank=True)
    year = models.IntegerField(null=True, blank=True)
    journal = models.CharField(max_length=500, blank=True)
    pmcid = models.CharField(max_length=50, unique=True)
    pmc_url = models.URLField()
    abstract = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', 'title']
        verbose_name_plural = 'Studies'
    
    def __str__(self):
        return f"{self.title[:100]}... ({self.pmcid})"


class Section(models.Model):
    """Document sections (Abstract, Methods, Results, etc.)"""
    SECTION_TYPES = [
        ('abstract', 'Abstract'),
        ('introduction', 'Introduction'),
        ('methods', 'Methods'),
        ('results', 'Results'),
        ('discussion', 'Discussion'),
        ('conclusions', 'Conclusions'),
        ('other', 'Other'),
    ]
    
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['study', 'order']
        unique_together = ['study', 'section_type', 'order']
    
    def __str__(self):
        return f"{self.study.title[:50]} - {self.section_type}"


class EvidenceSentence(models.Model):
    """Individual sentences from Results sections for evidence extraction"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='evidence_sentences')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='sentences', null=True, blank=True)
    sentence_text = models.TextField()
    sentence_index = models.IntegerField()  # Position within section
    char_start = models.IntegerField()
    char_end = models.IntegerField()
    embedding_vector = models.TextField(null=True, blank=True)  # Store embedding as JSON string
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['study', 'section', 'sentence_index']
        unique_together = ['study', 'section', 'sentence_index']
    
    def __str__(self):
        return f"{self.sentence_text[:100]}..."


class Entity(models.Model):
    """Normalized entities (organisms, tissues, stressors, etc.)"""
    ENTITY_TYPES = [
        ('organism', 'Organism'),
        ('tissue', 'Tissue/System'),
        ('stressor', 'Stressor'),
        ('platform', 'Platform/Mission'),
        ('assay', 'Assay/Method'),
        ('outcome', 'Outcome'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    canonical_id = models.CharField(max_length=100, blank=True)  # e.g., MeSH ID
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['entity_type', 'name']
        unique_together = ['name', 'entity_type']
    
    def __str__(self):
        return f"{self.name} ({self.entity_type})"


class Triple(models.Model):
    """Knowledge graph triples: (subject) -[relation]-> (object)"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='triples')
    subject_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='subject_triples')
    relation = models.CharField(max_length=100)  # e.g., 'affects', 'measured_by', 'occurs_in'
    object_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='object_triples')
    evidence_sentence = models.ForeignKey(EvidenceSentence, on_delete=models.CASCADE, null=True, blank=True)
    qualifiers = models.TextField(default='{}', blank=True)  # Additional context as JSON string
    confidence = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['study', 'subject_entity', 'relation', 'object_entity']
    
    def __str__(self):
        return f"{self.subject_entity.name} -[{self.relation}]-> {self.object_entity.name}"


class SearchIndex(models.Model):
    """FAISS index metadata and search configuration"""
    index_name = models.CharField(max_length=100, unique=True)
    index_path = models.CharField(max_length=500)  # Path to FAISS index file
    metadata_path = models.CharField(max_length=500)  # Path to metadata JSON
    embedding_model = models.CharField(max_length=100, default='all-MiniLM-L6-v2')
    dimension = models.IntegerField(default=384)
    total_vectors = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.index_name} ({self.total_vectors} vectors)"