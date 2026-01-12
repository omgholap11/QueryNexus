# VeloMarketSense 🚀

A real-time financial news analysis pipeline that streams market data, processes it using AI, and stores it for retrieval.

## Short Description
This project fetches stock market news updates, streams them through an Apache Kafka pipeline, and processes them using a Worker node. It is designed to handle high-frequency data ingestion and ensure strict ordering of financial events for accurate analysis.

## Technologies Used
* **Language:** Python 3.10+
* **Streaming:** Apache Kafka (KRaft Mode - No Zookeeper)
* **Containerization:** Docker & Docker Compose
* **Database:** Pinecone (Vector DB) [Planned]
* **AI:** OpenAI / LangChain [Planned]