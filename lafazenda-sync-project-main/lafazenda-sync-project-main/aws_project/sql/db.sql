create table primary_company_queue
(
    cod_cliente  varchar(250)          not null,
    is_processed boolean default false not null,
    body         json                  null,
    error        json                  null
);

