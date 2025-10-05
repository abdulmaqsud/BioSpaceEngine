from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ingestion", "0002_alter_evidencesentence_section"),
    ]

    operations = [
        migrations.AddField(
            model_name="study",
            name="summary",
            field=models.TextField(blank=True),
        ),
        migrations.CreateModel(
            name="EntityOccurrence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start_char", models.IntegerField(blank=True, null=True)),
                ("end_char", models.IntegerField(blank=True, null=True)),
                ("source", models.CharField(default="nlp", max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "entity",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="occurrences", to="ingestion.entity"),
                ),
                (
                    "evidence_sentence",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="entity_occurrences",
                        to="ingestion.evidencesentence",
                    ),
                ),
                (
                    "section",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="entity_occurrences",
                        to="ingestion.section",
                    ),
                ),
                (
                    "study",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="entity_occurrences", to="ingestion.study"),
                ),
            ],
            options={
                "ordering": ["study", "entity", "start_char"],
            },
        ),
        migrations.AddIndex(
            model_name="entityoccurrence",
            index=models.Index(fields=["study", "entity"], name="ingestion_e_study__65b331_idx"),
        ),
        migrations.AddIndex(
            model_name="entityoccurrence",
            index=models.Index(fields=["entity", "section"], name="ingestion_e_entity_f4a04b_idx"),
        ),
    ]
