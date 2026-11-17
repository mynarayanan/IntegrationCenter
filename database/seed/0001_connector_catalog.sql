insert into public.connector_catalog
(id,name,category,priority,lifecycle_status,description,integration_method)
values
('excel-csv','Excel / CSV','File-based','P0','available','Upload structured finance templates and flat-file extracts.','File upload; scheduled pickup in a later release'),
('rest-sftp','REST API / SFTP','API & Managed File Transfer','P0','available','Generic API and secure file-transfer integration foundation.','REST/JSON; SFTP'),
('snowflake','Snowflake','Data Warehouse','P1','planned','Read governed tables and views from Snowflake.','Python connector; SQL'),
('oracle-cloud-epm','Oracle Cloud EPM','EPM & Planning','P1','planned','Extract financial, planning and dimensional data from Cloud EPM.','REST APIs; EPM Automate where appropriate'),
('anaplan','Anaplan','EPM & Planning','P1','planned','Extract governed model views and exports from Anaplan.','Anaplan Integration API'),
('board','Board','EPM & Planning','P2','planned','Connect to Board planning and analytics data sources.','Version- and deployment-dependent APIs/data interfaces'),
('ibm-tm1','IBM Planning Analytics / TM1','EPM & Planning','P2','planned','Extract governed cube views, dimensions and metadata.','TM1 REST API')
on conflict (id) do update set
 name=excluded.name, category=excluded.category, priority=excluded.priority,
 lifecycle_status=excluded.lifecycle_status, description=excluded.description,
 integration_method=excluded.integration_method;
