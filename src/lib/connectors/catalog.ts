export type ConnectorStatus = "Available" | "Planned";
export type ConnectorPriority = "P0" | "P1" | "P2";

export type Connector = {
  id: string;
  name: string;
  category: string;
  priority: ConnectorPriority;
  status: ConnectorStatus;
  description: string;
  integrationMethod: string;
};

export const connectorCategories = [
  "File-based",
  "API & Managed File Transfer",
  "Data Warehouse",
  "EPM & Planning"
] as const;

export const connectorCatalog: Connector[] = [
  {
    id: "excel-csv",
    name: "Excel / CSV",
    category: "File-based",
    priority: "P0",
    status: "Available",
    description: "Upload structured finance templates and flat-file extracts.",
    integrationMethod: "File upload; scheduled pickup in a later release"
  },
  {
    id: "rest-sftp",
    name: "REST API / SFTP",
    category: "API & Managed File Transfer",
    priority: "P0",
    status: "Available",
    description: "Generic API and secure file-transfer integration foundation.",
    integrationMethod: "REST/JSON; SFTP"
  },
  {
    id: "snowflake",
    name: "Snowflake",
    category: "Data Warehouse",
    priority: "P1",
    status: "Planned",
    description: "Read governed tables and views from Snowflake.",
    integrationMethod: "Python connector; SQL"
  },
  {
    id: "oracle-cloud-epm",
    name: "Oracle Cloud EPM",
    category: "EPM & Planning",
    priority: "P1",
    status: "Planned",
    description: "Extract financial, planning and dimensional data from Cloud EPM.",
    integrationMethod: "REST APIs; EPM Automate where appropriate"
  },
  {
    id: "anaplan",
    name: "Anaplan",
    category: "EPM & Planning",
    priority: "P1",
    status: "Planned",
    description: "Extract governed model views and exports from Anaplan.",
    integrationMethod: "Anaplan Integration API"
  },
  {
    id: "board",
    name: "Board",
    category: "EPM & Planning",
    priority: "P2",
    status: "Planned",
    description: "Connect to Board planning and analytics data sources.",
    integrationMethod: "Version- and deployment-dependent APIs/data interfaces"
  },
  {
    id: "ibm-tm1",
    name: "IBM Planning Analytics / TM1",
    category: "EPM & Planning",
    priority: "P2",
    status: "Planned",
    description: "Extract governed cube views, dimensions and metadata.",
    integrationMethod: "TM1 REST API"
  }
];

export function getConnectorById(id: string) {
  return connectorCatalog.find((connector) => connector.id === id);
}
