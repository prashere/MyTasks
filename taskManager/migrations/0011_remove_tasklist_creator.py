# Generated by Django 4.2.3 on 2023-09-27 16:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taskManager', '0010_invitation_is_accepted'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tasklist',
            name='creator',
        ),
    ]