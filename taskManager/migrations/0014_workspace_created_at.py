# Generated by Django 4.2.3 on 2023-09-28 14:49

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('taskManager', '0013_alter_notification_receiver'),
    ]

    operations = [
        migrations.AddField(
            model_name='workspace',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]