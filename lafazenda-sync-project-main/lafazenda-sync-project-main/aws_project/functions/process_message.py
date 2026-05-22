import json
import os
from datetime import datetime
from typing import Optional

import boto3
import pymysql
import requests
from pydantic import BaseModel

QUEUE_URL = os.getenv(
    "SQS_QUEUE_URL",
    "https://sqs.us-east-2.amazonaws.com/XXXXXXXXXXXX/lafazenda-sap-hubspot-sync",
)

HUBSPOT_TOKEN = os.getenv(
    "HUBSPOT_TOKEN", "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
)

HUBSPOT_URL_API = "https://api.hubapi.com/crm/v3"

DB_CREDENTIALS = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "user_placeholder"),
    "password": os.getenv("DB_PASSWORD", "password_placeholder"),
    "database": os.getenv("DB_NAME", "db_placeholder"),
    "port": 33061,
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


class BodyCompanyPrimary(BaseModel):
    cod_cliente: str
    name: Optional[str]
    canal_venta: Optional[str]
    condicion_pago: Optional[str]
    creacion_bp: Optional[str]
    creacion_dm: Optional[str]
    desc_canal: Optional[str]
    desc_frecuencia: Optional[str]
    desc_tipologia: Optional[str]
    dest_poblacion: Optional[str]
    frecuencia: Optional[str]
    grupo_vendedores: Optional[str]
    identificacion: Optional[str]
    lista_precios: Optional[str]
    oficina_ventas: Optional[str]
    org_ventas: Optional[str]
    poblacion: Optional[str]
    teleoperador: Optional[str]
    tipologia: Optional[str]


def convert_to_timestamp(date_str: Optional[str]) -> Optional[int]:
    if date_str:
        dt = datetime.strptime(date_str, "%Y%m%d")
        return dt.strftime("%Y-%m-%d")
    return None


def convert_to_new_model(original: CompanyPrimary) -> BodyCompanyPrimary:
    return BodyCompanyPrimary(
        cod_cliente=original.COD_CLIENTE,
        name=original.NOMBRE,
        canal_venta=original.CANAL_VENTA,
        condicion_pago=original.CONDICION_PAGO,
        creacion_bp=convert_to_timestamp(original.CREACION_BP),
        creacion_dm=convert_to_timestamp(original.CREACION_DM),
        desc_canal=original.DESC_CANAL,
        desc_frecuencia=original.DESC_FRECUENCIA,
        desc_tipologia=original.DESC_TIPOLOGIA,
        dest_poblacion=original.DEST_POBLACION,
        frecuencia=original.FRECUENCIA,
        grupo_vendedores=original.GRUPO_VENDEDORES,
        identificacion=original.IDENTIFICACION,
        lista_precios=original.LISTA_PRECIOS,
        oficina_ventas=original.OFICINA_VENTAS,
        org_ventas=original.ORG_VENTAS,
        poblacion=original.POBLACION,
        teleoperador=original.TELEOPERADOR,
        tipologia=original.TIPOLOGIA,
    )


def delete_message_from_sqs(receipt_handle):
    # Crear un cliente de SQS
    sqs = boto3.client("sqs", region_name="us-east-2")

    try:
        # Eliminar el mensaje de la cola SQS
        response = sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
        print(f"Message deleted from SQS with response: {response}")
        return response
    except Exception as e:
        print(f"Error deleting message from SQS: {e}")
        return None


def database_connection():
    # Conectar a la base de datos MySQL
    return pymysql.connect(**DB_CREDENTIALS)


def upsert_company(
    company: CompanyPrimary,
    is_processed: bool,
    body: dict,
    error: Optional[dict] = None,
):
    connection = database_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar si el registro ya existe
            select_query = (
                "SELECT COUNT(*) FROM primary_company_queue WHERE cod_cliente = %s"
            )
            cursor.execute(select_query, (company.COD_CLIENTE,))
            result = cursor.fetchone()
            exists = result[0] > 0

            if exists:
                # Actualizar el registro existente
                update_query = """
                UPDATE primary_company_queue
                SET is_processed = %s, body = %s, error = %s
                WHERE cod_cliente = %s
                """
                cursor.execute(
                    update_query,
                    (
                        is_processed,
                        json.dumps(body),
                        json.dumps(error),
                        company.COD_CLIENTE,
                    ),
                )
            else:
                # Insertar un nuevo registro
                insert_query = """
                INSERT INTO primary_company_queue (cod_cliente, is_processed, body, error)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(
                    insert_query,
                    (
                        company.COD_CLIENTE,
                        is_processed,
                        json.dumps(body),
                        json.dumps(error),
                    ),
                )

            # Confirmar los cambios
            connection.commit()
    finally:
        connection.close()


def create_session_request():
    session = requests.Session()
    session.headers.update(
        {"Authorization": f"Bearer {HUBSPOT_TOKEN}", "Content-Type": "application/json"}
    )
    return session


def handle_http_error(http_err, company):
    try:
        error_body = http_err.response.json()
    except ValueError:
        error_body = {"error": http_err.response.text}
    upsert_company(company, False, company.model_dump(), error_body)
    print(f"HTTP error occurred: {http_err.response.status_code} - {error_body}")


def handle_connection_error(conn_err, company):
    error_body = {"error": f"Connection error occurred: {conn_err}"}
    upsert_company(company, False, company.model_dump(), error_body)
    print(error_body["error"])


def handle_timeout_error(timeout_err, company):
    error_body = {"error": f"Timeout error occurred: {timeout_err}"}
    upsert_company(company, False, company.model_dump(), error_body)
    print(error_body["error"])


def handle_request_error(req_err, company):
    error_body = {"error": f"An error occurred: {req_err}"}
    upsert_company(company, False, company.model_dump(), error_body)
    print(error_body["error"])


def search_companies(cod_cliente, company: CompanyPrimary):
    session = create_session_request()
    url = f"{HUBSPOT_URL_API}/objects/companies/search"
    search_payload = {
        "properties": ["cod_cliente"],
        "filterGroups": [
            {
                "filters": [
                    {
                        "propertyName": "cod_cliente",
                        "value": cod_cliente,
                        "operator": "EQ",
                    }
                ]
            }
        ],
    }
    try:
        response = session.post(url, data=json.dumps(search_payload))
        response.raise_for_status()  # Esto lanzará una excepción para códigos de estado HTTP 4xx/5xx
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        handle_http_error(http_err, company)
    except requests.exceptions.ConnectionError as conn_err:
        handle_connection_error(conn_err, company)
    except requests.exceptions.Timeout as timeout_err:
        handle_timeout_error(timeout_err, company)
    except requests.exceptions.RequestException as req_err:
        handle_request_error(req_err, company)
    return None


def create_company(company: CompanyPrimary):
    session = create_session_request()
    url = f"{HUBSPOT_URL_API}/objects/companies"
    try:
        serialize_company = convert_to_new_model(company)
    except Exception as err:
        upsert_company(company, False, company.model_dump(), {"error": str(err)})
        raise err

    payload = {"properties": serialize_company.model_dump()}
    try:
        response = session.post(url, data=json.dumps(payload))
        response.raise_for_status()  # Esto lanzará una excepción para códigos de estado HTTP 4xx/5xx
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        handle_http_error(http_err, company)
    except requests.exceptions.ConnectionError as conn_err:
        handle_connection_error(conn_err, company)
    except requests.exceptions.Timeout as timeout_err:
        handle_timeout_error(timeout_err, company)
    except requests.exceptions.RequestException as req_err:
        handle_request_error(req_err, company)
    return None


def update_company(company_id: str, company: CompanyPrimary):
    session = create_session_request()
    url = f"{HUBSPOT_URL_API}/objects/companies/{company_id}"

    try:
        serialize_company = convert_to_new_model(company)
    except Exception as err:
        upsert_company(company, False, company.model_dump(), {"error": str(err)})
        raise err

    payload = {"properties": serialize_company.model_dump()}
    try:
        response = session.patch(url, data=json.dumps(payload))
        response.raise_for_status()  # Esto lanzará una excepción para códigos de estado HTTP 4xx/5xx
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        handle_http_error(http_err, company)
    except requests.exceptions.ConnectionError as conn_err:
        handle_connection_error(conn_err, company)
    except requests.exceptions.Timeout as timeout_err:
        handle_timeout_error(timeout_err, company)
    except requests.exceptions.RequestException as req_err:
        handle_request_error(req_err, company)
    return None


def lambda_handler(event, context):
    try:
        body = CompanyPrimary(**event["Records"][0]["body"])
    except Exception as e:
        print("Error:", e)
        raise e

    response = search_companies(body.COD_CLIENTE, body)

    if response.get("total", 0) == 0:
        response = create_company(body)
        upsert_company(body, True, response)
    else:
        response = update_company(response.get("results")[0].get("id"), body)
        upsert_company(body, True, response)

    # Eliminar el mensaje de la cola SQS
    receipt_handle = event["Records"][0]["receiptHandle"]
    delete_message_from_sqs(receipt_handle)

    return {"statusCode": 200, "body": json.dumps("Hello from Lambda!")}


if __name__ == "__main__":
    event = {
        "Records": [
            {
                "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
                "receiptHandle": "MessageReceiptHandle",
                "body": {
                    "COD_CLIENTE": "0100000000",
                    "NOMBRE": "YADID JARRO",
                    "CANAL_VENTA": "",
                    "CONDICION_PAGO": "D007",
                    "CREACION_BP": "20230427",
                    "CREACION_DM": "20230427",
                    "DESC_CANAL": "",
                    "DESC_FRECUENCIA": "",
                    "DESC_TIPOLOGIA": "",
                    "DEST_POBLACION": "Puerto Gaitan",
                    "FRECUENCIA": "",
                    "GRUPO_VENDEDORES": "P21",
                    "IDENTIFICACION": "1124818498",
                    "LISTA_PRECIOS": "BH",
                    "OFICINA_VENTAS": "P009",
                    "ORG_VENTAS": "1100",
                    "POBLACION": "Puerto Gaitan",
                    "TELEOPERADOR": "",
                    "TIPOLOGIA": "",
                },
                "attributes": {
                    "ApproximateReceiveCount": "1",
                    "SentTimestamp": "1523232000000",
                    "SenderId": "123456789012",
                    "ApproximateFirstReceiveTimestamp": "1523232000001",
                },
                "messageAttributes": {},
                "md5OfBody": "{{{md5_of_body}}}",
                "eventSource": "aws:sqs",
                "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
                "awsRegion": "us-east-1",
            }
        ]
    }
    response = lambda_handler(event, None)
    print(response)
