import json
import os
from typing import Optional

import boto3
import pymysql
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from pydantic import BaseModel

QUEUE_URL = os.getenv(
    "SQS_QUEUE_URL",
    "https://sqs.us-east-2.amazonaws.com/XXXXXXXXXXXX/lafazenda-sap-hubspot-sync",
)

DB_SAP_CREDENTIALS = {
    "host": os.getenv("DB_HOST_SAP", "localhost"),
    "user": os.getenv("DB_USER_SAP", "user_placeholder"),
    "password": os.getenv("DB_PASSWORD_SAP", "password_placeholder"),
    "database": os.getenv("DB_NAME_SAP", "db_placeholder"),
    "port": 3306,
}


class CompanyPrimary(BaseModel):
    COD_CLIENTE: str
    NOMBRE: Optional[str]
    CANAL_VENTA: Optional[str]
    CONDICION_PAGO: Optional[str]
    CREACION_BP: Optional[str]
    CREACION_DM: Optional[str]
    DESC_CANAL: Optional[str]
    DESC_FRECUENCIA: Optional[str]
    DESC_TIPOLOGIA: Optional[str]
    DEST_POBLACION: Optional[str]
    FRECUENCIA: Optional[str]
    GRUPO_VENDEDORES: Optional[str]
    IDENTIFICACION: Optional[str]
    LISTA_PRECIOS: Optional[str]
    OFICINA_VENTAS: Optional[str]
    ORG_VENTAS: Optional[str]
    POBLACION: Optional[str]
    TELEOPERADOR: Optional[str]
    TIPOLOGIA: Optional[str]


def send_message_to_sqs(message_body={}):
    # Crear un cliente de SQS
    sqs = boto3.client("sqs", region_name="us-east-2")

    try:
        # Enviar el mensaje a la cola SQS
        response = sqs.send_message(
            QueueUrl=QUEUE_URL, MessageBody=json.dumps(message_body), DelaySeconds=6
        )
        print(f"Message sent to SQS with ID: {response['MessageId']}")
        return response
    except (NoCredentialsError, PartialCredentialsError) as e:
        print(f"Error: {e}")
        return None


def database_connection():
    # Conectar a la base de datos MySQL
    return pymysql.connect(**DB_SAP_CREDENTIALS)


def query_database():
    # Conectar a la base de datos MySQL
    connection = database_connection()

    query = """
    SELECT
        COD_CLIENTE,NOMBRE,CANAL_VENTA,CONDICION_PAGO,CREACION_BP,CREACION_DM,DESC_CANAL,DESC_FRECUENCIA,DESC_TIPOLOGIA,DEST_POBLACION,FRECUENCIA,GRUPO_VENDEDORES,IDENTIFICACION,LISTA_PRECIOS,OFICINA_VENTAS,ORG_VENTAS,POBLACION,TELEOPERADOR,TIPOLOGIA
    FROM SAP_HUBSPOT_BPS
    GROUP BY
        COD_CLIENTE
    LIMIT 3;
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            result = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            return [CompanyPrimary(**dict(zip(columns, row))) for row in result]
    finally:
        connection.close()


def check_sqs_empty():
    # Crear un cliente de SQS
    sqs = boto3.client("sqs")

    try:
        # Obtener los atributos de la cola SQS
        response = sqs.get_queue_attributes(
            QueueUrl=QUEUE_URL, AttributeNames=["ApproximateNumberOfMessages"]
        )
        # Obtener el número aproximado de mensajes en la cola
        num_messages = int(response["Attributes"]["ApproximateNumberOfMessages"])
        return num_messages == 0
    except Exception as e:
        print(f"Error checking SQS queue: {e}")
        return False


def lambda_handler(event, context):
    if not check_sqs_empty():
        print("SQS queue is not empty, skipping...")
        return

    results = query_database()

    for message in results:
        message_attributes = message.model_dump()
        send_message_to_sqs(message_attributes)


if __name__ == "__main__":
    lambda_handler(None, None)
