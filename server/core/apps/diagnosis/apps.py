from django.apps import AppConfig


class DiagnosisConfig(AppConfig):
 
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.diagnosis'


    def ready(self):
        import apps.diagnosis.signals
