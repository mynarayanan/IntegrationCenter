import csv

import pytest

from worker.connectors import ConnectorError, discover_csv


def test_csv_discovery_reads_headers_and_counts_rows(tmp_path):
    source = tmp_path / "sample.csv"
    with source.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["account", "amount"])
        writer.writeheader()
        writer.writerow({"account": "Revenue", "amount": "120"})
        writer.writerow({"account": "Cost", "amount": "45"})

    result = discover_csv({"filePath": "sample.csv"}, str(tmp_path))
    assert result[0]["object_name"] == "sample.csv"
    assert result[0]["estimated_row_count"] == 2
    assert result[0]["schema_definition"] == [
        {"name": "account", "dataType": "string"},
        {"name": "amount", "dataType": "integer"},
    ]


def test_csv_rejects_path_traversal(tmp_path):
    with pytest.raises(ConnectorError, match="outside"):
        discover_csv({"filePath": "../outside.csv"}, str(tmp_path))


def test_csv_requires_file_path(tmp_path):
    with pytest.raises(ConnectorError, match="filePath"):
        discover_csv({}, str(tmp_path))
