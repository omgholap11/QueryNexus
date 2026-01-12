from kafka import KafkaAdminClient

admin_client = KafkaAdminClient(
    client_id = "vms-topic-admin",    
    bootstrap_servers = ["localhost:9092"]   ## sam as the brokers 
)