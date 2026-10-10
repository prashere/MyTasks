from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("taskManager", "0014_workspace_created_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="is_completed",
            field=models.BooleanField(default=False),
        ),
    ]
